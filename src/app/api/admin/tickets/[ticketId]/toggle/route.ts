import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'
import { writeAuditLog } from '@/lib/admin/queries'
import { verifyAdminRequest } from '@/lib/admin/auth'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  const { success } = adminLimiter.check(ip)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const authResult = await verifyAdminRequest()
  if (!authResult.ok) return authResult.response

  const { ticketId } = await params
  const body = await request.json()
  const { is_active } = body

  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('tickets')
    .update({ is_active })
    .eq('id', ticketId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await writeAuditLog({
    actor_id: authResult.adminId,
    action: is_active ? 'ticket.activate' : 'ticket.deactivate',
    target_table: 'tickets',
    target_id: ticketId,
  })

  return NextResponse.json({ success: true })
}
