import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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
  const sig = req.headers.get('stripe-signature')
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  let event: Stripe.Event

  try {
    const body = await req.text()
    event = getStripe().webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription') {
          await handleSubscriptionCheckoutCompleted(session)
        } else {
          await handleCheckoutCompleted(session)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }
    }
  } catch (err) {
    console.error(`Error handling ${event.type}:`, err)
    // Return 200 to prevent Stripe from retrying — log for manual investigation
    return NextResponse.json({ received: true, error: 'Processing failed' })
  }

  return NextResponse.json({ received: true })
}

// ── Subscription handlers ──

async function handleSubscriptionCheckoutCompleted(session: Stripe.Checkout.Session) {
  const teacherId = session.metadata?.teacherId
  if (!teacherId) {
    console.warn('Subscription checkout without teacherId in metadata')
    return
  }

  const subscriptionId = session.subscription as string
  const customerId = session.customer as string

  const supabase = createAdminClient()
  const { error } = await supabase
    .from('teachers')
    .update({
      plan: 'pro',
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teacherId)

  if (error) {
    console.error('Failed to activate Pro plan:', error)
    throw error
  }

  console.log(`Pro plan activated: teacher=${teacherId}, subscription=${subscriptionId}`)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const supabase = createAdminClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id, plan')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!teacher) {
    console.warn('No teacher found for customer:', customerId)
    return
  }

  const isActive = ['active', 'trialing'].includes(subscription.status)
  const newPlan = isActive ? 'pro' : 'free'

  if (teacher.plan !== newPlan) {
    const { error } = await supabase
      .from('teachers')
      .update({
        plan: newPlan,
        stripe_subscription_id: isActive ? subscription.id : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teacher.id)

    if (error) {
      console.error('Failed to update plan:', error)
      throw error
    }

    console.log(`Plan updated: teacher=${teacher.id}, plan=${newPlan}`)
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const supabase = createAdminClient()

  const { data: teacher } = await supabase
    .from('teachers')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (!teacher) {
    console.warn('No teacher found for customer:', customerId)
    return
  }

  const { error } = await supabase
    .from('teachers')
    .update({
      plan: 'free',
      stripe_subscription_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', teacher.id)

  if (error) {
    console.error('Failed to downgrade plan:', error)
    throw error
  }

  console.log(`Plan downgraded to free: teacher=${teacher.id}`)
}

// ── Ticket payment handler (existing) ──

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const ticketId = session.metadata?.ticketId
  if (!ticketId) {
    console.warn('checkout.session.completed without ticketId in metadata')
    return
  }

  const supabase = createAdminClient()

  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('id, teacher_id, minutes, bundle_qty, valid_days, price_cents')
    .eq('id', ticketId)
    .single()

  if (ticketErr || !ticket) {
    console.error('Ticket not found:', ticketId, ticketErr)
    return
  }

  const customerEmail = session.customer_email || session.customer_details?.email
  if (!customerEmail) {
    console.error('No customer email in checkout session:', session.id)
    return
  }

  const { data: payer } = await supabase
    .from('users')
    .select('id, role')
    .eq('email', customerEmail)
    .single()

  if (!payer) {
    console.error('Payer not found for email:', customerEmail)
    return
  }

  let studentId: string | null = null
  if (payer.role === 'guardian') {
    const { data: student } = await supabase
      .from('students')
      .select('id')
      .eq('guardian_id', payer.id)
      .limit(1)
      .single()
    studentId = student?.id || null
  } else if (payer.role === 'student') {
    studentId = payer.id
  }

  const { data: payment, error: payErr } = await supabase
    .from('payments')
    .insert({
      teacher_id: ticket.teacher_id,
      payer_id: payer.id,
      amount_cents: session.amount_total || ticket.price_cents,
      processor: 'stripe',
      processor_payment_id: session.payment_intent as string,
      status: 'completed',
    })
    .select('id')
    .single()

  if (payErr) {
    console.error('Failed to create payment:', payErr)
    return
  }

  if (studentId) {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + ticket.valid_days)

    const { error: balErr } = await supabase
      .from('ticket_balances')
      .insert({
        student_id: studentId,
        ticket_id: ticket.id,
        remaining_minutes: ticket.minutes * ticket.bundle_qty,
        expires_at: expiresAt.toISOString(),
        payment_id: payment.id,
      })

    if (balErr) {
      console.error('Failed to create ticket balance:', balErr)
    }
  }

  console.log(`Payment completed: session=${session.id}, ticket=${ticketId}, payment=${payment.id}`)
}
