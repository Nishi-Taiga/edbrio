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
    const stripe = getStripe()
    try {
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: teacher, error: tErr } = await supabase
            .from('teachers')
            .select('stripe_account_id')
            .eq('id', session.user.id)
            .single()

        if (tErr) throw tErr

        let stripeAccountId = teacher.stripe_account_id

        if (!stripeAccountId) {
            // Create a new Express account
            const account = await stripe.accounts.create({
                type: 'express',
                metadata: {
                    userId: session.user.id,
                },
            })
            stripeAccountId = account.id

            // Save to DB
            const { error: uErr } = await supabase
                .from('teachers')
                .update({ stripe_account_id: stripeAccountId })
                .eq('id', session.user.id)

            if (uErr) throw uErr
        }

        // Create an account link
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile?stripe=refresh`,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/teacher/profile?stripe=success`,
            type: 'account_onboarding',
        })

        return NextResponse.json({ url: accountLink.url })
    } catch (error: any) {
        console.error('Stripe onboarding error:', error)
        return NextResponse.json(
            { error: error.message || 'Internal server error' },
            { status: 500 }
        )
    }
}
