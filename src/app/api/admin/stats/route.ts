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
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const supabase = createAdminClient()

    // Current month start (UTC)
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

    // 24 hours ago
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()

    // 7 days from now
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()

    // Run all queries in parallel
    const [
      totalUsersRes,
      usersRes,
      teachersRes,
      proTeachersRes,
      monthRevenueRes,
      monthAiReportsRes,
      monthBookingsRes,
      failedPaymentsRes,
      expiringTicketsRes,
      incompleteOnboardingRes,
    ] = await Promise.all([
      // totalUsers
      supabase.from('users').select('*', { count: 'exact', head: true }),

      // usersByRole — fetch all users to group in JS
      supabase.from('users').select('role'),

      // teachersByPlan — fetch all teachers to group in JS
      supabase.from('teachers').select('plan'),

      // proTeachers count for MRR
      supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('plan', 'pro'),

      // monthRevenue
      supabase
        .from('payments')
        .select('amount_cents')
        .eq('status', 'completed')
        .gte('created_at', monthStart),

      // monthAiReports
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .not('ai_summary', 'is', null)
        .gte('created_at', monthStart),

      // monthBookings
      supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', monthStart),

      // failedPayments24h
      supabase
        .from('payments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', twentyFourHoursAgo),

      // expiringTickets7d
      supabase
        .from('ticket_balances')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', now.toISOString())
        .lte('expires_at', sevenDaysFromNow)
        .gt('remaining_minutes', 0),

      // incompleteOnboarding
      supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true })
        .eq('is_onboarding_complete', false),
    ])

    // Compute usersByRole
    const usersByRole: Record<string, number> = { teacher: 0, guardian: 0, student: 0 }
    if (usersRes.data) {
      for (const user of usersRes.data) {
        const role = user.role as string
        if (role in usersByRole) {
          usersByRole[role]++
        }
      }
    }

    // Compute teachersByPlan
    const teachersByPlan: Record<string, number> = { free: 0, pro: 0 }
    if (teachersRes.data) {
      for (const teacher of teachersRes.data) {
        const plan = teacher.plan as string
        if (plan in teachersByPlan) {
          teachersByPlan[plan]++
        }
      }
    }

    // Compute MRR (pro teachers * 1480 yen)
    const proCount = proTeachersRes.count ?? 0
    const mrr = proCount * 1480

    // Compute monthRevenue (sum of amount_cents)
    let monthRevenue = 0
    if (monthRevenueRes.data) {
      for (const payment of monthRevenueRes.data) {
        monthRevenue += payment.amount_cents ?? 0
      }
    }

    return NextResponse.json({
      totalUsers: totalUsersRes.count ?? 0,
      usersByRole,
      teachersByPlan,
      mrr,
      monthRevenue,
      monthAiReports: monthAiReportsRes.count ?? 0,
      monthBookings: monthBookingsRes.count ?? 0,
      failedPayments24h: failedPaymentsRes.count ?? 0,
      expiringTickets7d: expiringTicketsRes.count ?? 0,
      incompleteOnboarding: incompleteOnboardingRes.count ?? 0,
    })
  } catch (error: unknown) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch admin stats' },
      { status: 500 }
    )
  }
}
