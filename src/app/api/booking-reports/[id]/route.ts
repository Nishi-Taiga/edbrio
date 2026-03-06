import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// PATCH: 講師が報告を承認/拒否
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reportId } = await params
    const supabase = await createClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { action } = body

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Fetch the report and verify it belongs to this teacher's booking
    const { data: report, error: rErr } = await supabase
      .from('booking_reports')
      .select('*, bookings!inner(teacher_id, ticket_balance_id, start_time, end_time)')
      .eq('id', reportId)
      .single()

    if (rErr || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const booking = (report as any).bookings
    if (booking.teacher_id !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (report.status !== 'pending') {
      return NextResponse.json({ error: 'Report already resolved' }, { status: 400 })
    }

    const adminSupabase = createAdminClient()

    if (action === 'approve') {
      // Update report status
      const { error: updateErr } = await adminSupabase
        .from('booking_reports')
        .update({
          status: 'approved',
          resolved_at: new Date().toISOString(),
          resolved_by: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)

      if (updateErr) {
        console.error('Failed to update report:', updateErr)
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
      }

      // Restore ticket balance (same logic as cancel)
      if (booking.ticket_balance_id) {
        const startMs = new Date(booking.start_time).getTime()
        const endMs = new Date(booking.end_time).getTime()
        const durationMinutes = Math.round((endMs - startMs) / (1000 * 60))

        if (durationMinutes > 0) {
          const { data: balance } = await adminSupabase
            .from('ticket_balances')
            .select('remaining_minutes')
            .eq('id', booking.ticket_balance_id)
            .single()

          if (balance) {
            await adminSupabase
              .from('ticket_balances')
              .update({ remaining_minutes: (balance.remaining_minutes || 0) + durationMinutes })
              .eq('id', booking.ticket_balance_id)
          }
        }
      }

      return NextResponse.json({ status: 'approved' })
    } else {
      // Reject
      const { error: updateErr } = await adminSupabase
        .from('booking_reports')
        .update({
          status: 'rejected',
          resolved_at: new Date().toISOString(),
          resolved_by: session.user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', reportId)

      if (updateErr) {
        console.error('Failed to update report:', updateErr)
        return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
      }

      return NextResponse.json({ status: 'rejected' })
    }
  } catch (error) {
    console.error('Report resolve error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
