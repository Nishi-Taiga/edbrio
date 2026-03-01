import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = adminLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(req.url)

    const action = searchParams.get('action')
    const targetTable = searchParams.get('target_table')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    let countQuery = supabase.from('audit_logs').select('*', { count: 'exact', head: true })
    let dataQuery = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (action) {
      countQuery = countQuery.eq('action', action)
      dataQuery = dataQuery.eq('action', action)
    }
    if (targetTable) {
      countQuery = countQuery.eq('target_table', targetTable)
      dataQuery = dataQuery.eq('target_table', targetTable)
    }
    if (from) {
      countQuery = countQuery.gte('created_at', from)
      dataQuery = dataQuery.gte('created_at', from)
    }
    if (to) {
      countQuery = countQuery.lte('created_at', to)
      dataQuery = dataQuery.lte('created_at', to)
    }

    const [countRes, dataRes] = await Promise.all([countQuery, dataQuery])

    const logs = dataRes.data ?? []

    // Resolve actor names
    const actorIds = [...new Set(logs.map((l) => l.actor_id).filter(Boolean))]
    const actorNameMap = new Map<string, string>()
    if (actorIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', actorIds)
      if (users) {
        for (const u of users) {
          actorNameMap.set(u.id, u.name)
        }
      }
    }

    const enrichedLogs = logs.map((l) => ({
      ...l,
      actor_name: actorNameMap.get(l.actor_id) || null,
    }))

    return NextResponse.json({
      logs: enrichedLogs,
      total: countRes.count ?? 0,
      page,
      limit,
    })
  } catch (error: unknown) {
    console.error('Admin audit error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    )
  }
}
