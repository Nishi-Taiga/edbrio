import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'
import { verifyAdminRequest } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

/**
 * Generates an array of date strings (YYYY-MM-DD) from startDate to today (inclusive).
 */
function getDateRange(startDate: Date): string[] {
  const dates: string[] = []
  const current = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()))
  const today = new Date()
  const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))

  while (current <= end) {
    dates.push(current.toISOString().slice(0, 10))
    current.setUTCDate(current.getUTCDate() + 1)
  }

  return dates
}

/**
 * Groups records by date, counting occurrences.
 * Returns an array with every date in the range, filling zeros for missing dates.
 */
function groupByDateCount(
  records: { created_at: string }[],
  dateRange: string[]
): { date: string; count: number }[] {
  const countMap = new Map<string, number>()
  for (const date of dateRange) {
    countMap.set(date, 0)
  }

  for (const record of records) {
    const date = record.created_at.slice(0, 10)
    if (countMap.has(date)) {
      countMap.set(date, (countMap.get(date) ?? 0) + 1)
    }
  }

  return dateRange.map((date) => ({ date, count: countMap.get(date) ?? 0 }))
}

/**
 * Groups records by date, summing amount_cents.
 * Returns an array with every date in the range, filling zeros for missing dates.
 */
function groupByDateAmount(
  records: { created_at: string; amount_cents: number }[],
  dateRange: string[]
): { date: string; amount: number }[] {
  const amountMap = new Map<string, number>()
  for (const date of dateRange) {
    amountMap.set(date, 0)
  }

  for (const record of records) {
    const date = record.created_at.slice(0, 10)
    if (amountMap.has(date)) {
      amountMap.set(date, (amountMap.get(date) ?? 0) + (record.amount_cents ?? 0))
    }
  }

  return dateRange.map((date) => ({ date, amount: amountMap.get(date) ?? 0 }))
}

/**
 * Groups records by date, summing tokens_used.
 */
function groupByDateTokens(
  records: { created_at: string; tokens_used: number | null }[],
  dateRange: string[]
): { date: string; tokens: number }[] {
  const tokenMap = new Map<string, number>()
  for (const date of dateRange) {
    tokenMap.set(date, 0)
  }

  for (const record of records) {
    const date = record.created_at.slice(0, 10)
    if (tokenMap.has(date)) {
      tokenMap.set(date, (tokenMap.get(date) ?? 0) + (record.tokens_used ?? 0))
    }
  }

  return dateRange.map((date) => ({ date, tokens: tokenMap.get(date) ?? 0 }))
}

export async function GET(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = adminLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const authResult = await verifyAdminRequest()
    if (!authResult.ok) return authResult.response

    // Parse period parameter
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '7d'

    let days: number
    switch (period) {
      case '30d':
        days = 30
        break
      case '7d':
      default:
        days = 7
        break
    }

    const now = new Date()
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
    const startISO = new Date(
      Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
    ).toISOString()

    const dateRange = getDateRange(startDate)
    const supabase = createAdminClient()

    // Run all queries in parallel
    const [signupsRes, revenueRes, bookingsRes, aiReportsRes] = await Promise.all([
      // signups (include role for per-role breakdown)
      supabase
        .from('users')
        .select('created_at, role')
        .gte('created_at', startISO),

      // revenue (completed payments)
      supabase
        .from('payments')
        .select('created_at, amount_cents')
        .eq('status', 'completed')
        .gte('created_at', startISO),

      // bookings
      supabase
        .from('bookings')
        .select('created_at')
        .gte('created_at', startISO),

      // AI reports (include tokens_used for cost calculation)
      supabase
        .from('reports')
        .select('created_at, tokens_used')
        .not('ai_summary', 'is', null)
        .gte('created_at', startISO),
    ])

    const allSignups = signupsRes.data ?? []

    // Total signups (all roles)
    const signups = groupByDateCount(allSignups, dateRange)

    // Signups by role
    const signupsByRole = {
      teacher: groupByDateCount(allSignups.filter(u => u.role === 'teacher'), dateRange),
      guardian: groupByDateCount(allSignups.filter(u => u.role === 'guardian'), dateRange),
      student: groupByDateCount(allSignups.filter(u => u.role === 'student'), dateRange),
    }

    const revenue = groupByDateAmount(revenueRes.data ?? [], dateRange)
    const bookings = groupByDateCount(bookingsRes.data ?? [], dateRange)
    const aiReports = groupByDateCount(aiReportsRes.data ?? [], dateRange)
    const aiTokens = groupByDateTokens(aiReportsRes.data ?? [], dateRange)

    return NextResponse.json({
      period,
      signups,
      signupsByRole,
      revenue,
      bookings,
      aiReports,
      aiTokens,
    })
  } catch (error: unknown) {
    console.error('Admin trends error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trend data' },
      { status: 500 }
    )
  }
}
