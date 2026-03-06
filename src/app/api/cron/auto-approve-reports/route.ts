import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * Cron job: 期限切れの問題報告を自動承認し、チケットを返却する。
 * 1時間ごとに実行を想定。
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminSupabase = createAdminClient()
    const now = new Date().toISOString()

    // Find pending reports past their deadline
    const { data: reports, error: rErr } = await adminSupabase
      .from('booking_reports')
      .select('id, booking_id')
      .eq('status', 'pending')
      .lt('deadline', now)

    if (rErr) throw rErr
    if (!reports || reports.length === 0) {
      return NextResponse.json({ processed: 0, message: 'No expired reports' })
    }

    let processed = 0

    for (const report of reports) {
      try {
        // Fetch booking details for ticket restoration
        const { data: booking } = await adminSupabase
          .from('bookings')
          .select('ticket_balance_id, start_time, end_time')
          .eq('id', report.booking_id)
          .single()

        // Update report to auto_approved
        await adminSupabase
          .from('booking_reports')
          .update({
            status: 'auto_approved',
            resolved_at: now,
            updated_at: now,
          })
          .eq('id', report.id)

        // Restore ticket balance
        if (booking?.ticket_balance_id) {
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

        processed++
      } catch (e) {
        console.error(`Auto-approve failed for report ${report.id}:`, e)
      }
    }

    return NextResponse.json({ processed, total: reports.length })
  } catch (error) {
    console.error('Auto-approve cron error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
