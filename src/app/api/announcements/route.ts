import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single()

    const role = userData?.role || ''

    // Fetch recent announcements (last 30 days, matching user role)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: announcements, error } = await supabase
      .from('announcements')
      .select('id, title, content, target_role, created_at')
      .or(`target_role.is.null,target_role.eq.${role}`)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch read status
    const { data: reads } = await supabase
      .from('announcement_reads')
      .select('announcement_id')
      .eq('user_id', session.user.id)

    const readIds = new Set((reads || []).map(r => r.announcement_id))

    const items = (announcements || []).map(a => ({
      ...a,
      is_read: readIds.has(a.id),
    }))

    return NextResponse.json({ announcements: items })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
