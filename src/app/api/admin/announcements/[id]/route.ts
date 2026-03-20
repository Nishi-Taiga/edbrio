import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'
import { verifyAdminRequest } from '@/lib/admin/auth'
import { writeAuditLog } from '@/lib/admin/queries'

export const dynamic = 'force-dynamic'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success } = adminLimiter.check(ip)
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const authResult = await verifyAdminRequest()
    if (!authResult.ok) return authResult.response

    const { id } = await params
    const supabase = createAdminClient()

    // Delete reads first
    await supabase
      .from('announcement_reads')
      .delete()
      .eq('announcement_id', id)

    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await writeAuditLog({
      actor_id: authResult.adminId,
      action: 'admin.announcement.delete',
      target_table: 'announcements',
      target_id: id,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
