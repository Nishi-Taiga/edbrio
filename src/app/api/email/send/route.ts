import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildBookingConfirmationEmail, buildReportPublishedEmail } from '@/lib/email'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { emailLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = emailLimiter.check(session.user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const { type, data } = body

    if (!type) {
      return NextResponse.json({ error: 'type is required' }, { status: 400 })
    }

    switch (type) {
      case 'booking_confirmation': {
        const { bookingId } = data || {}
        if (!bookingId) {
          return NextResponse.json({ error: 'bookingId is required' }, { status: 400 })
        }

        // Fetch booking with related data
        const { data: booking, error: bErr } = await supabase
          .from('bookings')
          .select('id, start_time, end_time, teacher_id, student_id')
          .eq('id', bookingId)
          .single()
        if (bErr || !booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Fetch teacher info
        const { data: teacher } = await supabase
          .from('users')
          .select('email, display_name')
          .eq('id', booking.teacher_id)
          .single()

        // Fetch student profile to get student name and guardian
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('name, guardian_id')
          .eq('student_id', booking.student_id)
          .limit(1)
          .single()

        // Fetch guardian email
        let guardianEmail: string | null = null
        if (profile?.guardian_id) {
          const { data: guardian } = await supabase
            .from('users')
            .select('email')
            .eq('id', profile.guardian_id)
            .single()
          guardianEmail = guardian?.email || null
        }

        const teacherName = teacher?.display_name || '講師'
        const studentName = profile?.name || '生徒'
        const dateStr = format(new Date(booking.start_time), 'yyyy年M月d日(E)', { locale: ja })
        const startStr = format(new Date(booking.start_time), 'HH:mm', { locale: ja })
        const endStr = format(new Date(booking.end_time), 'HH:mm', { locale: ja })

        const sent: string[] = []

        // Send to teacher
        if (teacher?.email) {
          const email = buildBookingConfirmationEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'teacher',
          })
          await sendEmail(teacher.email, email.subject, email.html)
          sent.push('teacher')
        }

        // Send to guardian
        if (guardianEmail) {
          const email = buildBookingConfirmationEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'guardian',
          })
          await sendEmail(guardianEmail, email.subject, email.html)
          sent.push('guardian')
        }

        return NextResponse.json({ success: true, sent })
      }

      case 'report_published': {
        const { reportId } = data || {}
        if (!reportId) {
          return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
        }

        // Fetch report
        const { data: report, error: rErr } = await supabase
          .from('reports')
          .select('id, profile_id, teacher_id, subject')
          .eq('id', reportId)
          .single()
        if (rErr || !report) {
          return NextResponse.json({ error: 'Report not found' }, { status: 404 })
        }

        // Fetch teacher name
        const { data: teacher } = await supabase
          .from('users')
          .select('display_name')
          .eq('id', report.teacher_id)
          .single()

        // Fetch student profile + guardian
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('name, guardian_id')
          .eq('id', report.profile_id)
          .single()

        if (!profile?.guardian_id) {
          return NextResponse.json({ success: true, sent: [], note: 'No guardian found' })
        }

        const { data: guardian } = await supabase
          .from('users')
          .select('email')
          .eq('id', profile.guardian_id)
          .single()

        if (!guardian?.email) {
          return NextResponse.json({ success: true, sent: [], note: 'No guardian email' })
        }

        const email = buildReportPublishedEmail({
          teacherName: teacher?.display_name || '講師',
          studentName: profile.name,
          subject: report.subject || undefined,
        })

        await sendEmail(guardian.email, email.subject, email.html)
        return NextResponse.json({ success: true, sent: ['guardian'] })
      }

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
