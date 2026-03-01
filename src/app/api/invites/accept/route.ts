import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }

    const admin = createAdminClient()

    // Validate token
    const { data: invite } = await admin
      .from('invites')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (!invite) {
      return NextResponse.json({ error: 'Invalid or used invite' }, { status: 404 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    // Verify user is a guardian
    const { data: dbUser } = await admin
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (dbUser?.role !== 'guardian') {
      return NextResponse.json({ error: 'Only guardian accounts can accept invites' }, { status: 403 })
    }

    // Get the student profile
    const { data: profile } = await admin
      .from('student_profiles')
      .select('id, name, teacher_id, student_id')
      .eq('id', invite.student_profile_id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 })
    }

    // Link guardian to student profile
    await admin
      .from('student_profiles')
      .update({ guardian_id: session.user.id })
      .eq('id', profile.id)

    // If there's a linked student record, also set guardian_id there
    if (profile.student_id) {
      await admin
        .from('students')
        .update({ guardian_id: session.user.id })
        .eq('id', profile.student_id)

      // Ensure teacher-student relationship exists
      await admin
        .from('teacher_students')
        .upsert(
          { teacher_id: profile.teacher_id, student_id: profile.student_id },
          { onConflict: 'teacher_id,student_id' }
        )
    }

    // Mark invite as used
    await admin
      .from('invites')
      .update({ used: true, accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, teacherId: profile.teacher_id })
  } catch (error: unknown) {
    console.error('Invite accept error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
