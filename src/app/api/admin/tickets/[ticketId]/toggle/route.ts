import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/admin/queries'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
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
    action: is_active ? 'ticket.activate' : 'ticket.deactivate',
    target_table: 'tickets',
    target_id: ticketId,
  })

  return NextResponse.json({ success: true })
}
