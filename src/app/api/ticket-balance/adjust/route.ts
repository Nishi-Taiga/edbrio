import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const adjustSchema = z.object({
  ticketBalanceId: z.string().uuid(),
  deltaMinutes: z.number().int(),
})

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Role check: only teachers can adjust ticket balances
    const { data: dbUser } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!dbUser || dbUser.role !== 'teacher') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const parsed = adjustSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    }
    const { ticketBalanceId, deltaMinutes } = parsed.data

    const admin = createAdminClient()

    // Atomic update using raw SQL to prevent race conditions
    const { error } = await admin.rpc('adjust_ticket_balance', {
      p_ticket_balance_id: ticketBalanceId,
      p_delta_minutes: deltaMinutes,
    })

    if (error) {
      console.error('adjust_ticket_balance RPC error:', error.message)
      return NextResponse.json({ error: 'Failed to adjust balance' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
