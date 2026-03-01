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

    const type = searchParams.get('type') || 'list'
    const status = searchParams.get('status') || 'all'
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get('limit') || '20', 10)))

    if (type === 'summary') {
      const now = new Date()
      const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString()

      const [
        totalRevenueRes,
        monthRevenueRes,
        feesDataRes,
        proTeachersRes,
        subscriptionsRes,
      ] = await Promise.all([
        // Total revenue from completed payments
        supabase
          .from('payments')
          .select('amount_cents')
          .eq('status', 'completed'),

        // Month revenue from completed payments
        supabase
          .from('payments')
          .select('amount_cents')
          .eq('status', 'completed')
          .gte('created_at', monthStart),

        // Payments with teacher plan info for fee estimation
        supabase
          .from('payments')
          .select('amount_cents, teacher_id')
          .eq('status', 'completed'),

        // Pro teacher count for MRR
        supabase
          .from('teachers')
          .select('*', { count: 'exact', head: true })
          .eq('plan', 'pro'),

        // Pro subscriptions with user details
        supabase
          .from('teachers')
          .select('user_id, stripe_subscription_id, created_at')
          .eq('plan', 'pro'),
      ])

      const totalRevenue = (totalRevenueRes.data ?? []).reduce(
        (sum, p) => sum + (p.amount_cents ?? 0),
        0
      )

      const monthRevenue = (monthRevenueRes.data ?? []).reduce(
        (sum, p) => sum + (p.amount_cents ?? 0),
        0
      )

      // Calculate estimated fees based on teacher plan
      let estimatedFees = 0
      if (feesDataRes.data && feesDataRes.data.length > 0) {
        const teacherIds = [...new Set(feesDataRes.data.map((p) => p.teacher_id).filter(Boolean))]
        const { data: teachers } = await supabase
          .from('teachers')
          .select('user_id, plan')
          .in('user_id', teacherIds)

        const teacherPlanMap = new Map<string, string>()
        if (teachers) {
          for (const t of teachers) {
            teacherPlanMap.set(t.user_id, t.plan)
          }
        }

        for (const payment of feesDataRes.data) {
          const plan = teacherPlanMap.get(payment.teacher_id) || 'free'
          const feeRate = plan === 'pro' ? 0.014 : 0.07
          estimatedFees += (payment.amount_cents ?? 0) * feeRate
        }
      }

      const mrr = (proTeachersRes.count ?? 0) * 1480

      // Resolve subscription user names
      let subscriptions: Array<{
        user_id: string
        name: string
        stripe_subscription_id: string
        created_at: string
      }> = []
      if (subscriptionsRes.data && subscriptionsRes.data.length > 0) {
        const userIds = subscriptionsRes.data.map((s) => s.user_id)
        const { data: users } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds)

        const userNameMap = new Map<string, string>()
        if (users) {
          for (const u of users) {
            userNameMap.set(u.id, u.name)
          }
        }

        subscriptions = subscriptionsRes.data.map((s) => ({
          user_id: s.user_id,
          name: userNameMap.get(s.user_id) || 'Unknown',
          stripe_subscription_id: s.stripe_subscription_id,
          created_at: s.created_at,
        }))
      }

      return NextResponse.json({
        totalRevenue,
        monthRevenue,
        estimatedFees: Math.round(estimatedFees),
        mrr,
        subscriptions,
      })
    }

    // type === 'list'
    const offset = (page - 1) * limit

    let countQuery = supabase.from('payments').select('*', { count: 'exact', head: true })
    let dataQuery = supabase.from('payments').select('*').order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    if (status !== 'all') {
      countQuery = countQuery.eq('status', status)
      dataQuery = dataQuery.eq('status', status)
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

    // Resolve teacher and payer names
    const payments = dataRes.data ?? []
    const userIds = [
      ...new Set([
        ...payments.map((p) => p.teacher_id).filter(Boolean),
        ...payments.map((p) => p.payer_id).filter(Boolean),
      ]),
    ]

    const userNameMap = new Map<string, string>()
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, name')
        .in('id', userIds)
      if (users) {
        for (const u of users) {
          userNameMap.set(u.id, u.name)
        }
      }
    }

    const enrichedPayments = payments.map((p) => ({
      ...p,
      teacher_name: userNameMap.get(p.teacher_id) || null,
      payer_name: userNameMap.get(p.payer_id) || null,
    }))

    return NextResponse.json({
      payments: enrichedPayments,
      total: countRes.count ?? 0,
      page,
      limit,
    })
  } catch (error: unknown) {
    console.error('Admin payments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    )
  }
}
