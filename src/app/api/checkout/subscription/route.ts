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
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: '認証が必要です。' }, { status: 401 })
    }

    const { success: rateLimitOk } = subscriptionLimiter.check(user.id)
    if (!rateLimitOk) {
      return NextResponse.json({ error: 'リクエストが多すぎます。' }, { status: 429 })
    }

    const priceId = process.env.STRIPE_STANDARD_PRICE_ID
    if (!priceId) {
      console.error('STRIPE_STANDARD_PRICE_ID is not set')
      return NextResponse.json({ error: 'サーバー設定エラー' }, { status: 500 })
    }

    const stripe = getStripe()

    const { data: teacher, error: tErr } = await supabase
      .from('teachers')
      .select('id, plan, stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single()

    if (tErr || !teacher) {
      return NextResponse.json({ error: '講師情報が見つかりません。' }, { status: 404 })
    }

    if (teacher.plan === 'standard' && teacher.stripe_subscription_id) {
      return NextResponse.json({ error: '既にStandardプランです。' }, { status: 400 })
    }

    // Create or reuse Stripe Customer
    const adminSupabase = createAdminClient()
    let customerId = teacher.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { teacherId: user.id },
      })
      customerId = customer.id

      await adminSupabase
        .from('teachers')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Check for pre-registration (extended trial: 60 days vs default 30)
    const { data: preReg } = await adminSupabase
      .from('pre_registrations')
      .select('id, confirmed_at')
      .eq('email', user.email!)
      .not('confirmed_at', 'is', null)
      .single()

    const trialDays = preReg ? 60 : 30

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      subscription_data: {
        trial_period_days: trialDays,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile?subscription=canceled`,
      metadata: { teacherId: user.id },
    })

    // Mark pre-registration as converted
    if (preReg) {
      await adminSupabase
        .from('pre_registrations')
        .update({ converted_at: new Date().toISOString() })
        .eq('id', preReg.id)
    }

    return NextResponse.json({ sessionId: checkoutSession.id })
  } catch (error: unknown) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: 'サブスクリプション作成に失敗しました。' },
      { status: 500 }
    )
  }
}
