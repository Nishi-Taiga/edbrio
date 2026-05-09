import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const preferencesSchema = z.object({
  booking_confirmation: z.boolean().optional(),
  booking_cancellation: z.boolean().optional(),
  report_published: z.boolean().optional(),
  new_chat_message: z.boolean().optional(),
  booking_reminder: z.boolean().optional(),
  ticket_purchase: z.boolean().optional(),
  calendar_week_start: z.union([z.literal(0), z.literal(1)]).optional(),
})

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('users')
      .select('notification_preferences')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ preferences: data?.notification_preferences || {} })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const parsed = preferencesSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: '入力内容に不備があります' }, { status: 400 })
    }

    const { error } = await supabase
      .from('users')
      .update({
        notification_preferences: parsed.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
