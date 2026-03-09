import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { announcement_id } = await req.json()
    if (!announcement_id) {
      return NextResponse.json({ error: 'announcement_id required' }, { status: 400 })
    }

    await supabase
      .from('announcement_reads')
      .upsert(
        { user_id: session.user.id, announcement_id },
        { onConflict: 'user_id,announcement_id' }
      )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
