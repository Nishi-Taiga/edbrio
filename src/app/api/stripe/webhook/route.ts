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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    try {
      await handleCheckoutCompleted(session)
    } catch (err) {
      console.error('Error handling checkout.session.completed:', err)
      // Return 200 to prevent Stripe from retrying — log for manual investigation
      return NextResponse.json({ received: true, error: 'Processing failed' })
    }
  }

  return NextResponse.json({ received: true })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const ticketId = session.metadata?.ticketId
  if (!ticketId) {
    console.warn('checkout.session.completed without ticketId in metadata')
    return
  }

  const supabase = createAdminClient()

  // Look up the ticket to get teacher_id and details
  const { data: ticket, error: ticketErr } = await supabase
    .from('tickets')
    .select('id, teacher_id, minutes, bundle_qty, valid_days, price_cents')
    .eq('id', ticketId)
    .single()

  if (ticketErr || !ticket) {
    console.error('Ticket not found:', ticketId, ticketErr)
    return
  }

  // Find the payer — use customer_email from Stripe session
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

  // Determine the student_id (guardian → their student, student → themselves)
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

  // Create payment record
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

  // Create ticket balance if we have a student
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
