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

    const { email, studentProfileId } = await req.json()

    if (!email || !studentProfileId) {
      return NextResponse.json({ error: 'email and studentProfileId are required' }, { status: 400 })
    }

    // Verify teacher owns the student profile
    const { data: profile, error: profileErr } = await supabase
      .from('student_profiles')
      .select('id, name, teacher_id')
      .eq('id', studentProfileId)
      .eq('teacher_id', session.user.id)
      .single()

    if (profileErr || !profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Check for existing active invite for same email + profile
    const { data: existing } = await supabase
      .from('invites')
      .select('id')
      .eq('email', email)
      .eq('student_profile_id', studentProfileId)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Invite already sent' }, { status: 409 })
    }

    // Generate token and insert
    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

    const { error: insertErr } = await supabase.from('invites').insert({
      teacher_id: session.user.id,
      email,
      student_profile_id: studentProfileId,
      token,
      role: 'guardian',
      expires_at: expiresAt.toISOString(),
    })

    if (insertErr) {
      console.error('Invite insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 })
    }

    // Get teacher name for email
    const { data: teacher } = await supabase
      .from('users')
      .select('name')
      .eq('id', session.user.id)
      .single()

    // Send invitation email
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://edbrio.com'
    const inviteUrl = `${appUrl}/invite/${token}`

    const emailContent = buildGuardianInviteEmail({
      teacherName: teacher?.name || '講師',
      studentName: profile.name,
      inviteUrl,
    })

    await sendEmail(email, emailContent.subject, emailContent.html)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Invite create error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
