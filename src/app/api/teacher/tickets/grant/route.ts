import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, buildTicketGrantEmail, isNotificationEnabled } from '@/lib/email'
import { ticketGrantLimiter } from '@/lib/rate-limit'
import { ticketGrantSchema } from '@/lib/validations'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacherId = user.id

    const { success: rateLimitOk } = ticketGrantLimiter.check(teacherId)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const body = await req.json()
    const parsed = ticketGrantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '入力内容に不備があります' }, { status: 400 })
    }
    const { ticketId, studentProfileId, customMinutes, customValidDays, sendNotification } = parsed.data

    // Verify ticket belongs to this teacher
    const { data: ticket, error: ticketErr } = await supabase
      .from('tickets')
      .select('id, teacher_id, name, minutes, bundle_qty, valid_days')
      .eq('id', ticketId)
      .eq('teacher_id', teacherId)
      .single()

    if (ticketErr || !ticket) {
      return NextResponse.json({ error: 'チケットが見つかりません' }, { status: 404 })
    }

    // Verify student_profile belongs to this teacher and has a linked student_id
    const { data: profile, error: profileErr } = await supabase
      .from('student_profiles')
      .select('id, student_id, guardian_id, name')
      .eq('id', studentProfileId)
      .eq('teacher_id', teacherId)
      .single()

    if (profileErr || !profile || !profile.student_id) {
      return NextResponse.json({ error: '生徒が見つかりません' }, { status: 404 })
    }

    // Calculate balance values
    const totalMinutes = customMinutes ?? (ticket.minutes * ticket.bundle_qty)
    const validDays = customValidDays ?? ticket.valid_days
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + validDays)
    const expiresStr = format(expiresAt, 'yyyy年M月d日', { locale: ja })

    const adminSupabase = createAdminClient()

    // Insert ticket_balance (no payment)
    const { data: balance, error: balErr } = await adminSupabase
      .from('ticket_balances')
      .insert({
        student_id: profile.student_id,
        ticket_id: ticket.id,
        remaining_minutes: totalMinutes,
        expires_at: expiresAt.toISOString(),
        payment_id: null,
      })
      .select('id')
      .single()

    if (balErr) {
      console.error('Failed to create ticket balance:', balErr)
      return NextResponse.json({ error: 'チケット付与に失敗しました' }, { status: 500 })
    }

    // Audit log
    await adminSupabase.from('audit_logs').insert({
      actor_id: teacherId,
      action: 'ticket_grant',
      target_table: 'ticket_balances',
      target_id: balance.id,
      meta: {
        ticket_id: ticket.id,
        ticket_name: ticket.name,
        student_profile_id: profile.id,
        student_name: profile.name,
        total_minutes: totalMinutes,
        valid_days: validDays,
        expires_at: expiresAt.toISOString(),
      },
    })

    // Send chat message to guardian
    if (profile.guardian_id) {
      try {
        // Find or create conversation
        let conversationId: string | null = null

        const { data: conv } = await adminSupabase
          .from('conversations')
          .select('id')
          .eq('teacher_id', teacherId)
          .eq('guardian_id', profile.guardian_id)
          .eq('student_profile_id', profile.id)
          .maybeSingle()

        if (conv) {
          conversationId = conv.id
        } else {
          const { data: newConv } = await adminSupabase
            .from('conversations')
            .insert({
              teacher_id: teacherId,
              guardian_id: profile.guardian_id,
              student_profile_id: profile.id,
            })
            .select('id')
            .single()
          conversationId = newConv?.id || null
        }

        if (conversationId) {
          const chatContent = `${ticket.name}（${totalMinutes}分）を付与しました。有効期限: ${expiresStr}`
          await adminSupabase.from('messages').insert({
            conversation_id: conversationId,
            sender_id: teacherId,
            content: chatContent,
          })
        }
      } catch (chatErr) {
        console.error('Failed to send chat message:', chatErr)
      }
    }

    // Send email notification
    if (sendNotification && profile.guardian_id) {
      try {
        const { data: guardian } = await adminSupabase
          .from('users')
          .select('email, notification_preferences')
          .eq('id', profile.guardian_id)
          .single()

        if (
          guardian?.email &&
          isNotificationEnabled(
            guardian.notification_preferences as Record<string, boolean> | null,
            'ticket_purchase'
          )
        ) {
          const email = buildTicketGrantEmail({
            ticketName: ticket.name,
            studentName: profile.name,
            totalMinutes,
            expiresAt: expiresStr,
          })
          await sendEmail(guardian.email, email.subject, email.html)
        }
      } catch (emailErr) {
        console.error('Failed to send ticket grant email:', emailErr)
      }
    }

    return NextResponse.json({ success: true, balanceId: balance.id })
  } catch (error: unknown) {
    console.error('Ticket grant error:', error)
    return NextResponse.json(
      { error: 'チケット付与に失敗しました' },
      { status: 500 }
    )
  }
}
