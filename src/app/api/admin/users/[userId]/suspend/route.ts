import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAuditLog } from '@/lib/admin/queries'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params
  const body = await request.json()
  const { action } = body

  if (!action || !['suspend', 'unsuspend'].includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  const supabase = createAdminClient()

  if (action === 'suspend') {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: '876000h', // ~100 years
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: 'none',
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  await writeAuditLog({
    action: action === 'suspend' ? 'user.suspend' : 'user.unsuspend',
    target_table: 'users',
    target_id: userId,
  })

  return NextResponse.json({ success: true })
}
