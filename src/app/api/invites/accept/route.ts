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

    // Mark invite as used
    await admin
      .from('invites')
      .update({ used: true, accepted_at: new Date().toISOString() })
      .eq('id', invite.id)

    return NextResponse.json({ success: true, teacherId: invite.teacher_id })
  } catch (error: unknown) {
    console.error('Invite accept error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
