import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { checkoutLimiter } from '@/lib/rate-limit'

// Mark this route as dynamic to prevent it from being prerendered at build time
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
  // Rate limit by IP since this route doesn't require auth
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success: rateLimitOk } = checkoutLimiter.check(ip)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const stripe = getStripe()
  try {
    const { ticketId, priceId } = await req.json()

    // In real app, fetch ticket details from Supabase
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/guardian/tickets?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/guardian/tickets?canceled=true`,
      metadata: {
        ticketId,
      },
      // Application fee for platform (実際の実装ではConnected Accountを使用)
      // payment_intent_data: {
      //   application_fee_amount: calculateApplicationFee(amount),
      //   transfer_data: {
      //     destination: teacherStripeAccountId,
      //   },
      // },
    })

    return NextResponse.json({ sessionId: session.id })
  } catch (error: unknown) {
    console.error('Stripe session creation error:', error)
    // Do not expose internal error details to client
    return NextResponse.json(
      { error: '決済セッションの作成に失敗しました。' },
      { status: 500 }
    )
  }
}

// Helper function to calculate platform fee
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function calculateApplicationFee(amount: number, teacherPlan: 'free' | 'pro' = 'free'): number {
  const feePercent = teacherPlan === 'pro' ?
    parseFloat(process.env.EDBRIO_PLATFORM_FEE_PERCENT_PRO!) :
    parseFloat(process.env.EDBRIO_PLATFORM_FEE_PERCENT_FREE!)

  const minFee = parseInt(process.env.EDBRIO_MIN_FEE_JPY!) * 100 // Convert to cents
  const calculatedFee = Math.round(amount * (feePercent / 100))

  return Math.max(calculatedFee, minFee)
}