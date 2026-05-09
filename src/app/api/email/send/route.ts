import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildBookingConfirmationEmail, buildBookingCancellationEmail, buildReportPublishedEmail, buildNewChatMessageEmail, isNotificationEnabled } from '@/lib/email'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'
import { emailLimiter } from '@/lib/rate-limit'
import { emailSendSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = emailLimiter.check(user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = emailSendSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '入力内容に不備があります' }, { status: 400 })
    }
    const { type, data } = parsed.data

    switch (type) {
      case 'booking_confirmation': {
        const { bookingId } = data

        // Fetch booking with related data
        const { data: booking, error: bErr } = await supabase
          .from('bookings')
          .select('id, start_time, end_time, teacher_id, student_id')
          .eq('id', bookingId)
          .single()
        if (bErr || !booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Fetch teacher info + notification preferences
        const { data: teacher } = await supabase
          .from('users')
          .select('email, display_name, notification_preferences')
          .eq('id', booking.teacher_id)
          .single()

        // Fetch student profile to get student name and guardian
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('name, guardian_id')
          .eq('student_id', booking.student_id)
          .limit(1)
          .single()

        // Fetch guardian email + notification preferences
        let guardianEmail: string | null = null
        let guardianPrefs: Record<string, boolean> | null = null
        if (profile?.guardian_id) {
          const { data: guardian } = await supabase
            .from('users')
            .select('email, notification_preferences')
            .eq('id', profile.guardian_id)
            .single()
          guardianEmail = guardian?.email || null
          guardianPrefs = guardian?.notification_preferences || null
        }

        const teacherName = teacher?.display_name || '講師'
        const studentName = profile?.name || '生徒'
        const dateStr = format(new Date(booking.start_time), 'yyyy年M月d日(E)', { locale: ja })
        const startStr = format(new Date(booking.start_time), 'HH:mm', { locale: ja })
        const endStr = format(new Date(booking.end_time), 'HH:mm', { locale: ja })

        const sent: string[] = []

        // Send to teacher
        if (teacher?.email && isNotificationEnabled(teacher.notification_preferences, 'booking_confirmation')) {
          const email = buildBookingConfirmationEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'teacher',
          })
          await sendEmail(teacher.email, email.subject, email.html)
          sent.push('teacher')
        }

        // Send to guardian
        if (guardianEmail && isNotificationEnabled(guardianPrefs, 'booking_confirmation')) {
          const email = buildBookingConfirmationEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'guardian',
          })
          await sendEmail(guardianEmail, email.subject, email.html)
          sent.push('guardian')
        }

        return NextResponse.json({ success: true, sent })
      }

      case 'booking_cancellation': {
        const { bookingId } = data

        // Fetch booking with related data
        const { data: booking, error: bErr } = await supabase
          .from('bookings')
          .select('id, start_time, end_time, teacher_id, student_id')
          .eq('id', bookingId)
          .single()
        if (bErr || !booking) {
          return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
        }

        // Fetch teacher info + notification preferences
        const { data: teacher } = await supabase
          .from('users')
          .select('email, display_name, notification_preferences')
          .eq('id', booking.teacher_id)
          .single()

        // Fetch student profile to get student name and guardian
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('name, guardian_id')
          .eq('student_id', booking.student_id)
          .limit(1)
          .single()

        // Fetch guardian email + notification preferences
        let guardianEmail: string | null = null
        let guardianPrefs: Record<string, boolean> | null = null
        if (profile?.guardian_id) {
          const { data: guardian } = await supabase
            .from('users')
            .select('email, notification_preferences')
            .eq('id', profile.guardian_id)
            .single()
          guardianEmail = guardian?.email || null
          guardianPrefs = guardian?.notification_preferences || null
        }

        const teacherName = teacher?.display_name || '講師'
        const studentName = profile?.name || '生徒'
        const dateStr = format(new Date(booking.start_time), 'yyyy年M月d日(E)', { locale: ja })
        const startStr = format(new Date(booking.start_time), 'HH:mm', { locale: ja })
        const endStr = format(new Date(booking.end_time), 'HH:mm', { locale: ja })

        const sent: string[] = []

        // Send to teacher
        if (teacher?.email && isNotificationEnabled(teacher.notification_preferences, 'booking_cancellation')) {
          const email = buildBookingCancellationEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'teacher',
          })
          await sendEmail(teacher.email, email.subject, email.html)
          sent.push('teacher')
        }

        // Send to guardian
        if (guardianEmail && isNotificationEnabled(guardianPrefs, 'booking_cancellation')) {
          const email = buildBookingCancellationEmail({
            teacherName, studentName, date: dateStr, startTime: startStr, endTime: endStr,
            recipientRole: 'guardian',
          })
          await sendEmail(guardianEmail, email.subject, email.html)
          sent.push('guardian')
        }

        return NextResponse.json({ success: true, sent })
      }

      case 'report_published': {
        const { reportId } = data

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
          .select('email, notification_preferences')
          .eq('id', profile.guardian_id)
          .single()

        if (!guardian?.email) {
          return NextResponse.json({ success: true, sent: [], note: 'No guardian email' })
        }

        // Check notification preference
        if (!isNotificationEnabled(guardian.notification_preferences, 'report_published')) {
          return NextResponse.json({ success: true, sent: [], note: 'Notification disabled' })
        }

        const email = buildReportPublishedEmail({
          teacherName: teacher?.display_name || '講師',
          studentName: profile.name,
          subject: report.subject || undefined,
        })

        await sendEmail(guardian.email, email.subject, email.html)
        return NextResponse.json({ success: true, sent: ['guardian'] })
      }

      case 'new_chat_message': {
        const { conversationId } = data

        // Fetch conversation
        const { data: conv, error: convErr } = await supabase
          .from('conversations')
          .select('id, teacher_id, guardian_id, student_profile_id')
          .eq('id', conversationId)
          .single()
        if (convErr || !conv) {
          return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
        }

        // Determine recipient (the other party)
        const senderId = user.id
        const recipientId = senderId === conv.teacher_id ? conv.guardian_id : conv.teacher_id

        // Check if recipient already has unread messages (throttle)
        const { count: existingUnread } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conversationId)
          .eq('is_read', false)
          .neq('sender_id', recipientId)

        // Only send email if this is the first unread (avoid spam)
        if ((existingUnread || 0) > 1) {
          return NextResponse.json({ success: true, sent: [], note: 'Throttled: existing unread messages' })
        }

        // Fetch sender name
        const { data: sender } = await supabase
          .from('users')
          .select('name')
          .eq('id', senderId)
          .single()

        // Fetch recipient email + notification preferences
        const { data: recipient } = await supabase
          .from('users')
          .select('email, notification_preferences')
          .eq('id', recipientId)
          .single()

        // Fetch student profile name
        const { data: profile } = await supabase
          .from('student_profiles')
          .select('name')
          .eq('id', conv.student_profile_id)
          .single()

        if (!recipient?.email) {
          return NextResponse.json({ success: true, sent: [], note: 'No recipient email' })
        }

        // Check notification preference
        if (!isNotificationEnabled(recipient.notification_preferences, 'new_chat_message')) {
          return NextResponse.json({ success: true, sent: [], note: 'Notification disabled' })
        }

        // Get latest message content for preview
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('content, image_url')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        const preview = latestMsg?.content || (latestMsg?.image_url ? '画像が送信されました' : '')

        const email = buildNewChatMessageEmail({
          senderName: sender?.name || '送信者',
          studentName: profile?.name || '生徒',
          messagePreview: preview,
        })

        await sendEmail(recipient.email, email.subject, email.html)
        return NextResponse.json({ success: true, sent: ['recipient'] })
      }

      default:
        return NextResponse.json({ error: `Unknown email type: ${type}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { error: 'メール送信に失敗しました' },
      { status: 500 }
    )
  }
}
