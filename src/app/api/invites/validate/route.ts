import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ valid: false, reason: 'missing_token' })
    }

    const admin = createAdminClient()

    const { data: invite } = await admin
      .from('invites')
      .select('id, email, used, expires_at, teacher_id, student_profile_id')
      .eq('token', token)
      .single()

    if (!invite) {
      return NextResponse.json({ valid: false, reason: 'not_found' })
    }

    if (invite.used) {
      return NextResponse.json({ valid: false, reason: 'used' })
    }

    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, reason: 'expired' })
    }

    // Fetch display info
    const [{ data: teacher }, { data: profile }] = await Promise.all([
      admin.from('users').select('name').eq('id', invite.teacher_id).single(),
      admin.from('student_profiles').select('name').eq('id', invite.student_profile_id).single(),
    ])

    return NextResponse.json({
      valid: true,
      teacherName: teacher?.name,
      studentName: profile?.name,
      email: invite.email,
    })
  } catch (error: unknown) {
    console.error('Invite validate error:', error)
    return NextResponse.json({ valid: false, reason: 'error' })
  }
}
