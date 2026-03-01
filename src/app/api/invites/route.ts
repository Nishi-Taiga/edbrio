import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail, buildGuardianInviteEmail } from '@/lib/email'
import { emailLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { success: rateLimitOk } = emailLimiter.check(session.user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const { email, method = 'email' } = await req.json()

    if (method !== 'email' && method !== 'qr') {
      return NextResponse.json({ error: 'Invalid method' }, { status: 400 })
    }

    if (method === 'email' && !email) {
      return NextResponse.json({ error: 'email is required for email invites' }, { status: 400 })
    }

    // Check for existing active invite (email method only)
    if (method === 'email') {
      const { data: existing } = await supabase
        .from('invites')
        .select('id')
        .eq('email', email)
        .eq('teacher_id', session.user.id)
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
      teacher_id: session.user.id,
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
        .eq('id', session.user.id)
        .single()

      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edbrio.com'
      const inviteUrl = `${appUrl}/invite/${token}`

      const emailContent = buildGuardianInviteEmail({
        teacherName: teacher?.name || '講師',
        inviteUrl,
      })

      await sendEmail(email, emailContent.subject, emailContent.html)
    }

    return NextResponse.json({ success: true, token })
  } catch (error: unknown) {
    console.error('Invite create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
