import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { subscriptionLimiter } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia' as any,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
  }

  const { success: rateLimitOk } = subscriptionLimiter.check(session.user.id)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'リクエストが多すぎます。' }, { status: 429 })
  }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    console.error('STRIPE_PRO_PRICE_ID is not set')
    return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
  }

  try {
    const { data: teacher, error: tErr } = await supabase
      .from('teachers')
      .select('id, plan, stripe_customer_id, stripe_subscription_id')
      .eq('id', session.user.id)
      .single()

    if (tErr || !teacher) {
      return NextResponse.json({ error: '講師情報が見つかりません。' }, { status: 404 })
    }

    if (teacher.plan === 'pro' && teacher.stripe_subscription_id) {
      return NextResponse.json({ error: '既にProプランです。' }, { status: 400 })
    }

    // Create or reuse Stripe Customer
    let customerId = teacher.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: { teacherId: session.user.id },
      })
      customerId = customer.id

      const adminSupabase = createAdminClient()
      await adminSupabase
        .from('teachers')
        .update({ stripe_customer_id: customerId })
        .eq('id', session.user.id)
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile?subscription=canceled`,
      metadata: { teacherId: session.user.id },
    })

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error: unknown) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: 'サブスクリプション作成に失敗しました。' },
      { status: 500 }
    )
  }
}
