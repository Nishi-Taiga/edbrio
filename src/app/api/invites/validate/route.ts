import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inviteValidateSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const tokenParam = req.nextUrl.searchParams.get('token')
    const parsed = inviteValidateSchema.safeParse({ token: tokenParam })
    if (!parsed.success) {
      return NextResponse.json({ valid: false, reason: 'missing_token' })
    }
    const { token } = parsed.data

    const admin = createAdminClient()

    const { data: invite } = await admin
      .from('invites')
      .select('id, email, used, expires_at, teacher_id, method')
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

    // Fetch teacher info
    const { data: teacher } = await admin
      .from('users')
      .select('name')
      .eq('id', invite.teacher_id)
      .single()

    return NextResponse.json({
      valid: true,
      teacherName: teacher?.name,
      email: invite.email,
      method: invite.method,
    })
  } catch (error: unknown) {
    console.error('Invite validate error:', error)
    return NextResponse.json({ valid: false, reason: 'error' })
  }
}
