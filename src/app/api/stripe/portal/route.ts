import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

  try {
    const { data: teacher } = await supabase
      .from('teachers')
      .select('stripe_customer_id')
      .eq('id', session.user.id)
      .single()

    if (!teacher?.stripe_customer_id) {
      return NextResponse.json({ error: 'サブスクリプションが見つかりません。' }, { status: 400 })
    }

    const stripe = getStripe()
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: teacher.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile`,
    })

    return NextResponse.json({ url: portalSession.url })
  } catch (error: unknown) {
    console.error('Portal session error:', error)
    return NextResponse.json(
      { error: 'ポータルの作成に失敗しました。' },
      { status: 500 }
    )
  }
}
