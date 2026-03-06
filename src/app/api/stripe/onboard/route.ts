import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
        // 1. Check env vars
        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json({ error: 'STRIPE_SECRET_KEY is not configured' }, { status: 500 })
        }
        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, { status: 500 })
        }

        const stripe = getStripe()

        // 2. Auth check
        const supabase = await createClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // 3. Fetch teacher
        const { data: teacher, error: tErr } = await supabase
            .from('teachers')
            .select('stripe_account_id')
            .eq('id', session.user.id)
            .single()

        if (tErr) {
            return NextResponse.json({ error: `Teacher fetch failed: ${tErr.message}` }, { status: 500 })
        }

        let stripeAccountId = teacher.stripe_account_id

        if (!stripeAccountId) {
            // 4. Create Stripe Express account
            const account = await stripe.accounts.create({
                type: 'express',
                metadata: {
                    userId: session.user.id,
                },
            })
            stripeAccountId = account.id

            // 5. Save to DB (use admin client to bypass RLS)
            const adminSupabase = createAdminClient()
            const { error: uErr } = await adminSupabase
                .from('teachers')
                .update({ stripe_account_id: stripeAccountId })
                .eq('id', session.user.id)

            if (uErr) {
                return NextResponse.json({ error: `DB update failed: ${uErr.message}` }, { status: 500 })
            }
        }

        // 6. Create account link
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`

        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: `${baseUrl}/teacher/profile?stripe=refresh`,
            return_url: `${baseUrl}/teacher/profile?stripe=success`,
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
