import { createAdminClient } from '@/lib/supabase/admin'

// ── Dashboard Stats ──

interface DashboardStats {
  totalUsers: number
  activeTeachers: number
  monthRevenue: number
  monthBookings: number
  prevMonthUsers: number
  prevMonthTeachers: number
  prevMonthRevenue: number
  prevMonthBookings: number
  proTeachers: number
  activeTickets: number
  pendingBookings: number
  publishedReports: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = monthStart

  const [
    { count: totalUsers },
    { count: activeTeachers },
    { data: monthPayments },
    { count: monthBookings },
    { count: prevMonthUsers },
    { count: prevMonthTeachers },
    { data: prevMonthPayments },
    { count: prevMonthBookings },
    { count: proTeachers },
    { count: activeTickets },
    { count: pendingBookings },
    { count: publishedReports },
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('teachers').select('*', { count: 'exact', head: true }),
    supabase.from('payments').select('amount_cents').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', monthStart),
    supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd),
    supabase.from('teachers').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd),
    supabase.from('payments').select('amount_cents').eq('status', 'completed').gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd),
    supabase.from('teachers').select('*', { count: 'exact', head: true }).eq('plan', 'pro'),
    supabase.from('tickets').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('visibility', 'published'),
  ])

  const sumCents = (rows: { amount_cents: number }[] | null) =>
    (rows || []).reduce((s, r) => s + (r.amount_cents || 0), 0)

  return {
    totalUsers: totalUsers ?? 0,
    activeTeachers: activeTeachers ?? 0,
    monthRevenue: sumCents(monthPayments),
    monthBookings: monthBookings ?? 0,
    prevMonthUsers: prevMonthUsers ?? 0,
    prevMonthTeachers: prevMonthTeachers ?? 0,
    prevMonthRevenue: sumCents(prevMonthPayments),
    prevMonthBookings: prevMonthBookings ?? 0,
    proTeachers: proTeachers ?? 0,
    activeTickets: activeTickets ?? 0,
    pendingBookings: pendingBookings ?? 0,
    publishedReports: publishedReports ?? 0,
  }
}

// ── Monthly Revenue ──

export interface MonthlyRevenue {
  month: string
  total: number
}

export async function getMonthlyRevenue(months = 6): Promise<MonthlyRevenue[]> {
  const supabase = createAdminClient()
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - months + 1, 1)

  const { data: payments } = await supabase
    .from('payments')
    .select('amount_cents, created_at')
    .eq('status', 'completed')
    .gte('created_at', start.toISOString())

  const buckets = new Map<string, number>()
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - months + 1 + i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, 0)
  }

  for (const p of payments || []) {
    const d = new Date(p.created_at)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    if (buckets.has(key)) {
      buckets.set(key, buckets.get(key)! + (p.amount_cents || 0))
    }
  }

  return Array.from(buckets.entries()).map(([month, total]) => ({ month, total }))
}

// ── Audit Logs ──

export async function getRecentAuditLogs(limit = 10) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return data || []
}

// ── Users ──

interface GetUsersParams {
  role?: string
  plan?: string
  search?: string
  page?: number
  perPage?: number
}

export async function getUsers({ role, plan, search, page = 1, perPage = 20 }: GetUsersParams = {}) {
  const supabase = createAdminClient()
  const offset = (page - 1) * perPage

  let query = supabase
    .from('users')
    .select('*, teachers(*), guardians(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (role && role !== 'all') {
    query = query.eq('role', role)
  }
  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, count } = await query

  let filtered = data || []
  if (plan && plan !== 'all') {
    filtered = filtered.filter((u: any) => u.teachers?.[0]?.plan === plan || (!u.teachers?.[0] && plan === 'free'))
  }

  return { users: filtered, total: count ?? 0 }
}

// ── User Detail ──

export async function getUserDetail(userId: string) {
  const supabase = createAdminClient()

  const [
    { data: user },
    { data: teacher },
    { data: guardian },
    { data: bookings },
    { data: payments },
    { data: reports },
  ] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).single(),
    supabase.from('teachers').select('*').eq('id', userId).maybeSingle(),
    supabase.from('guardians').select('*').eq('id', userId).maybeSingle(),
    supabase.from('bookings').select('*').or(`teacher_id.eq.${userId},student_id.eq.${userId}`).order('created_at', { ascending: false }).limit(10),
    supabase.from('payments').select('*').or(`teacher_id.eq.${userId},payer_id.eq.${userId}`).order('created_at', { ascending: false }).limit(10),
    supabase.from('reports').select('*').eq('teacher_id', userId).order('created_at', { ascending: false }).limit(10),
  ])

  return { user, teacher, guardian, bookings: bookings || [], payments: payments || [], reports: reports || [] }
}

// ── Payments ──

interface GetPaymentsParams {
  status?: string
  search?: string
  page?: number
  perPage?: number
}

export async function getPayments({ status, search, page = 1, perPage = 20 }: GetPaymentsParams = {}) {
  const supabase = createAdminClient()
  const offset = (page - 1) * perPage

  let query = supabase
    .from('payments')
    .select('*, teacher:users!payments_teacher_id_fkey(name, email), payer:users!payments_payer_id_fkey(name, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, count } = await query
  return { payments: data || [], total: count ?? 0 }
}

// ── Revenue Stats ──

export async function getRevenueStats() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()

  const [
    { data: thisMonth },
    { data: lastMonth },
    { count: pendingCount },
    { count: refundedCount },
  ] = await Promise.all([
    supabase.from('payments').select('amount_cents').eq('status', 'completed').gte('created_at', monthStart),
    supabase.from('payments').select('amount_cents').eq('status', 'completed').gte('created_at', prevMonthStart).lt('created_at', monthStart),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'refunded'),
  ])

  const sum = (rows: { amount_cents: number }[] | null) =>
    (rows || []).reduce((s, r) => s + (r.amount_cents || 0), 0)

  return {
    thisMonthRevenue: sum(thisMonth),
    lastMonthRevenue: sum(lastMonth),
    pendingCount: pendingCount ?? 0,
    refundedCount: refundedCount ?? 0,
  }
}

// ── Reports ──

interface GetReportsParams {
  visibility?: string
  search?: string
  page?: number
  perPage?: number
}

export async function getReportsForAdmin({ visibility, search, page = 1, perPage = 20 }: GetReportsParams = {}) {
  const supabase = createAdminClient()
  const offset = (page - 1) * perPage

  let query = supabase
    .from('reports')
    .select('*, teacher:users!reports_teacher_id_fkey(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + perPage - 1)

  if (visibility && visibility !== 'all') {
    query = query.eq('visibility', visibility)
  }
  if (search) {
    query = query.or(`subject.ilike.%${search}%,content_public.ilike.%${search}%`)
  }

  const { data, count } = await query
  return { reports: data || [], total: count ?? 0 }
}

export async function getReportStats() {
  const supabase = createAdminClient()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: totalReports },
    { count: publishedThisMonth },
    { data: comprehensionData },
  ] = await Promise.all([
    supabase.from('reports').select('*', { count: 'exact', head: true }),
    supabase.from('reports').select('*', { count: 'exact', head: true }).eq('visibility', 'published').gte('created_at', monthStart),
    supabase.from('reports').select('comprehension_level').not('comprehension_level', 'is', null),
  ])

  const levels = (comprehensionData || []).map((r: any) => r.comprehension_level).filter(Boolean)
  const avgComprehension = levels.length > 0 ? levels.reduce((a: number, b: number) => a + b, 0) / levels.length : 0

  return {
    totalReports: totalReports ?? 0,
    publishedThisMonth: publishedThisMonth ?? 0,
    avgComprehension: Math.round(avgComprehension * 10) / 10,
  }
}

// ── Audit Log Write ──

export async function writeAuditLog(params: {
  action: string
  target_table: string
  target_id?: string
  meta?: Record<string, any>
}) {
  const supabase = createAdminClient()
  await supabase.from('audit_logs').insert({
    actor_id: null,
    action: params.action,
    target_table: params.target_table,
    target_id: params.target_id,
    meta: params.meta || {},
  })
}
