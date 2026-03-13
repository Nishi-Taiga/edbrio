import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { inviteAcceptSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = inviteAcceptSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'token is required' }, { status: 400 })
    }
    const { token } = parsed.data

    const admin = createAdminClient()

    // Atomically mark invite as used and return it (prevents TOCTOU race condition)
    const { data: invite, error: inviteError } = await admin
      .from('invites')
      .update({ used: true, accepted_at: new Date().toISOString() })
      .eq('token', token)
      .eq('used', false)
      .select('*')
      .maybeSingle()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid or used invite' }, { status: 404 })
    }

    if (new Date(invite.expires_at) < new Date()) {
      // Revert: invite was expired but we already marked it used
      await admin
        .from('invites')
        .update({ used: false, accepted_at: null })
        .eq('id', invite.id)
      return NextResponse.json({ error: 'Invite expired' }, { status: 410 })
    }

    // Verify user is a guardian
    const { data: dbUser } = await admin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (dbUser?.role !== 'guardian') {
      // Revert: user is not a guardian
      await admin
        .from('invites')
        .update({ used: false, accepted_at: null })
        .eq('id', invite.id)
      return NextResponse.json({ error: 'Only guardian accounts can accept invites' }, { status: 403 })
    }

    return NextResponse.json({ success: true, teacherId: invite.teacher_id })
  } catch (error: unknown) {
    console.error('Invite accept error:', error)
    return NextResponse.json(
      { error: '招待の承認に失敗しました' },
      { status: 500 }
    )
  }
}
