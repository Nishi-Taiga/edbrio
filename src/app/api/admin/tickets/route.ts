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

    const type = searchParams.get('type') || 'products'
    const expiringSoon = searchParams.get('expiring_soon') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))
    const offset = (page - 1) * limit

    if (type === 'products') {
      const [countRes, dataRes] = await Promise.all([
        supabase.from('tickets').select('*', { count: 'exact', head: true }),
        supabase
          .from('tickets')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1),
      ])

      const tickets = dataRes.data ?? []

      // Resolve teacher names
      const teacherIds = [...new Set(tickets.map((t) => t.teacher_id).filter(Boolean))]
      const teacherNameMap = new Map<string, string>()
      if (teacherIds.length > 0) {
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', teacherIds)
        if (users) {
          for (const u of users) {
            teacherNameMap.set(u.id, u.name)
          }
        }
      }

      const enrichedTickets = tickets.map((t) => ({
        ...t,
        teacher_name: teacherNameMap.get(t.teacher_id) || null,
      }))

      return NextResponse.json({
        tickets: enrichedTickets,
        total: countRes.count ?? 0,
        page,
        limit,
      })
    }

    // type === 'balances'
    const now = new Date()
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    let countQuery = supabase.from('ticket_balances').select('*', { count: 'exact', head: true })
    let dataQuery = supabase
      .from('ticket_balances')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (expiringSoon) {
      countQuery = countQuery
        .lte('expires_at', sevenDaysFromNow)
        .gt('remaining_minutes', 0)
      dataQuery = dataQuery
        .lte('expires_at', sevenDaysFromNow)
        .gt('remaining_minutes', 0)
    }

    const [countRes, dataRes] = await Promise.all([countQuery, dataQuery])

    const balances = dataRes.data ?? []

    // Resolve student names and ticket names
    const studentIds = [...new Set(balances.map((b) => b.student_id).filter(Boolean))]
    const ticketIds = [...new Set(balances.map((b) => b.ticket_id).filter(Boolean))]

    const [studentNamesRes, ticketNamesRes] = await Promise.all([
      studentIds.length > 0
        ? supabase.from('users').select('id, name').in('id', studentIds)
        : { data: [] },
      ticketIds.length > 0
        ? supabase.from('tickets').select('id, name').in('id', ticketIds)
        : { data: [] },
    ])

    const studentNameMap = new Map<string, string>()
    if (studentNamesRes.data) {
      for (const u of studentNamesRes.data) {
        studentNameMap.set(u.id, u.name)
      }
    }

    const ticketNameMap = new Map<string, string>()
    if (ticketNamesRes.data) {
      for (const t of ticketNamesRes.data) {
        ticketNameMap.set(t.id, t.name)
      }
    }

    const enrichedBalances = balances.map((b) => ({
      ...b,
      student_name: studentNameMap.get(b.student_id) || null,
      ticket_name: ticketNameMap.get(b.ticket_id) || null,
    }))

    return NextResponse.json({
      balances: enrichedBalances,
      total: countRes.count ?? 0,
      page,
      limit,
    })
  } catch (error: unknown) {
    console.error('Admin tickets GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ticket data' },
      { status: 500 }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = adminLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = createAdminClient()
    const body = await req.json()

    const { balanceId, remaining_minutes, expires_at } = body as {
      balanceId: string
      remaining_minutes?: number
      expires_at?: string
    }

    if (!balanceId) {
      return NextResponse.json({ error: 'balanceId is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = {}
    if (remaining_minutes !== undefined) updates.remaining_minutes = remaining_minutes
    if (expires_at !== undefined) updates.expires_at = expires_at

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update. Provide remaining_minutes or expires_at.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('ticket_balances')
      .update(updates)
      .eq('id', balanceId)
      .select()
      .single()

    if (error) {
      console.error('Admin ticket balance update error:', error)
      return NextResponse.json(
        { error: 'Failed to update ticket balance' },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error: unknown) {
    console.error('Admin tickets PATCH error:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket balance' },
      { status: 500 }
    )
  }
}
