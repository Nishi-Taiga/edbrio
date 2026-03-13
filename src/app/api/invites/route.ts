import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildGuardianInviteEmail } from '@/lib/email'
import { emailLimiter } from '@/lib/rate-limit'
import { inviteCreateSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
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
    const parsed = inviteCreateSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '入力内容に不備があります' }, { status: 400 })
    }
    const { email, method } = parsed.data

    // Check for existing active invite (email method only)
    if (method === 'email') {
      const { data: existing } = await supabase
        .from('invites')
        .select('id')
        .eq('email', email)
        .eq('teacher_id', user.id)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ error: 'Invite already sent' }, { status: 409 })
      }
    }

    // Generate token and set expiration
    const token = crypto.randomUUID()
    const expiresAt = method === 'qr'
      ? new Date(Date.now() + 30 * 60 * 1000)            // 30 minutes for QR
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)   // 7 days for email

    const { error: insertErr } = await supabase.from('invites').insert({
      teacher_id: user.id,
      email: method === 'email' ? email : null,
      student_profile_id: null,
      token,
      role: 'guardian',
      method,
      expires_at: expiresAt.toISOString(),
    })

    if (insertErr) {
      console.error('Invite insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Send email only for email method
    if (method === 'email') {
      const { data: teacher } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edbrio.com'
      const inviteUrl = `${appUrl}/invite/${token}`

      const emailContent = buildGuardianInviteEmail({
        teacherName: teacher?.name || '講師',
        inviteUrl,
      })

      await sendEmail(email!, emailContent.subject, emailContent.html)
    }

    return NextResponse.json({ success: true, token })
  } catch (error: unknown) {
    console.error('Invite create error:', error)
    return NextResponse.json(
      { error: '招待の作成に失敗しました' },
      { status: 500 }
    )
  }
}
