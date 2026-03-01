import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = adminLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait.' },
        { status: 429 }
      )
    }

    const { searchParams } = new URL(req.url)
    const role = searchParams.get('role') || 'all'
    const plan = searchParams.get('plan') || 'all'
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const sort = searchParams.get('sort') || 'newest'

    const supabase = createAdminClient()

    // If plan filter is active, pre-fetch teacher IDs with that plan
    let planFilteredTeacherIds: string[] | null = null
    if (plan !== 'all') {
      const { data: filteredTeachers, error: planErr } = await supabase
        .from('teachers')
        .select('id')
        .eq('plan', plan)

      if (planErr) {
        console.error('Failed to query teachers by plan:', planErr)
        return NextResponse.json({ error: 'Failed to filter by plan.' }, { status: 500 })
      }

      planFilteredTeacherIds = (filteredTeachers || []).map((t) => t.id)

      // If no teachers match the plan filter, return empty result early
      if (planFilteredTeacherIds.length === 0) {
        return NextResponse.json({ users: [], total: 0, page, limit })
      }
    }

    // Build the users query
    let query = supabase
      .from('users')
      .select('id, name, email, role, created_at, is_suspended', { count: 'exact' })

    // Apply role filter
    if (role !== 'all') {
      query = query.eq('role', role)
    }

    // Apply plan filter — restrict to teacher IDs that match the plan
    if (planFilteredTeacherIds) {
      query = query.in('id', planFilteredTeacherIds)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply sort
    query = query.order('created_at', { ascending: sort === 'oldest' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: users, error: usersErr, count } = await query

    if (usersErr) {
      console.error('Failed to query users:', usersErr)
      return NextResponse.json({ error: 'Failed to fetch users.' }, { status: 500 })
    }

    const total = count || 0
    const userList = users || []

    // Batch-query teachers table to get plan info for teacher users
    const teacherIds = userList
      .filter((u) => u.role === 'teacher')
      .map((u) => u.id)

    let teacherPlanMap: Record<string, string> = {}
    if (teacherIds.length > 0) {
      const { data: teachers, error: teachersErr } = await supabase
        .from('teachers')
        .select('id, plan')
        .in('id', teacherIds)

      if (teachersErr) {
        console.error('Failed to query teacher plans:', teachersErr)
        // Non-fatal: continue without plan info
      } else if (teachers) {
        teacherPlanMap = Object.fromEntries(teachers.map((t) => [t.id, t.plan]))
      }
    }

    // Build response with plan info attached to teacher users
    const result = userList.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      created_at: u.created_at,
      is_suspended: u.is_suspended ?? false,
      ...(u.role === 'teacher' && teacherPlanMap[u.id]
        ? { plan: teacherPlanMap[u.id] }
        : {}),
    }))

    return NextResponse.json({ users: result, total, page, limit })
  } catch (error: unknown) {
    console.error('Admin users list error:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
