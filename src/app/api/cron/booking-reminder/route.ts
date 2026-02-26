import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildBookingReminderEmail } from '@/lib/email'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

/**
 * Cron job endpoint: sends booking reminders for lessons happening in 24 hours.
 * Designed to be called by Vercel Cron Jobs once per hour.
 *
 * Vercel Proプランにアップグレード後、vercel.json に以下を追加:
 * {
 *   "crons": [{
 *     "path": "/api/cron/booking-reminder",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 * または外部Cronサービス（cron-job.org等）からGETリクエストで呼び出し可能。
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createClient()

    // Find bookings starting in 23-25 hours (1-hour window to avoid duplicates)
    const now = new Date()
    const from = new Date(now.getTime() + 23 * 60 * 60 * 1000)
    const to = new Date(now.getTime() + 25 * 60 * 60 * 1000)

    const { data: bookings, error: bErr } = await supabase
      .from('bookings')
      .select('id, start_time, end_time, teacher_id, student_id, status')
      .in('status', ['pending', 'confirmed'])
      .gte('start_time', from.toISOString())
      .lt('start_time', to.toISOString())

    if (bErr) throw bErr
    if (!bookings || bookings.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No upcoming bookings' })
    }

    let sentCount = 0

    for (const booking of bookings) {
      try {
        // Fetch teacher
        const { data: teacher } = await supabase
          .from('users')
          .select('email, display_name')
          .eq('id', booking.teacher_id)
          .single()

        // Fetch student profile + guardian
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('name, guardian_id')
          .eq('student_id', booking.student_id)
          .limit(1)
          .single()

        const teacherName = teacher?.display_name || '講師'
        const studentName = profile?.name || '生徒'
        const dateStr = format(new Date(booking.start_time), 'yyyy年M月d日(E)', { locale: ja })
        const startStr = format(new Date(booking.start_time), 'HH:mm', { locale: ja })
        const endStr = format(new Date(booking.end_time), 'HH:mm', { locale: ja })

        // Send to teacher
        if (teacher?.email) {
          const email = buildBookingReminderEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'teacher',
          })
          await sendEmail(teacher.email, email.subject, email.html)
          sentCount++
        }

        // Send to guardian
        if (profile?.guardian_id) {
          const { data: guardian } = await supabase
            .from('users')
            .select('email')
            .eq('id', profile.guardian_id)
            .single()

          if (guardian?.email) {
            const email = buildBookingReminderEmail({
              teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
              recipientRole: 'guardian',
            })
            await sendEmail(guardian.email, email.subject, email.html)
            sentCount++
          }
        }
      } catch (e) {
        // Log but continue processing other bookings
        console.error(`Reminder failed for booking ${booking.id}:`, e)
      }
    }

    return NextResponse.json({ sent: sentCount, bookings: bookings.length })
  } catch (error: unknown) {
    console.error('Booking reminder cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
