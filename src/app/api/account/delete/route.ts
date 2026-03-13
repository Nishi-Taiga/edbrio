import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-01-27.acacia' as any,
  })
}

export async function DELETE() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
    const admin = createAdminClient()

    // Get user role and teacher info
    const { data: dbUser, error: userError } = await admin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (userError || !dbUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Pre-cleanup: booking_reports references auth.users without CASCADE
    await admin.from('booking_reports').update({ resolved_by: null }).eq('resolved_by', userId)
    await admin.from('booking_reports').delete().eq('reporter_id', userId)

    // For teachers: also delete booking_reports that reference their bookings
    // (booking_reports.booking_id references bookings(id) without CASCADE)
    if (dbUser.role === 'teacher') {
      const { data: bookings } = await admin
        .from('bookings')
        .select('id')
        .eq('teacher_id', userId)
      if (bookings?.length) {
        await admin
          .from('booking_reports')
          .delete()
          .in('booking_id', bookings.map(b => b.id))
      }
    }

    // For teachers: cancel Stripe subscription if active
    if (dbUser.role === 'teacher') {
      const { data: teacher } = await admin
        .from('teachers')
        .select('stripe_subscription_id')
        .eq('id', userId)
        .single()

      if (teacher?.stripe_subscription_id) {
        try {
          const stripe = getStripe()
          await stripe.subscriptions.cancel(teacher.stripe_subscription_id)
        } catch (err) {
          console.error('Stripe subscription cancel error (continuing):', err)
        }
      }
    }

    // Clean up avatar storage (non-fatal)
    try {
      const { data: avatarFiles } = await admin.storage.from('avatars').list(userId)
      if (avatarFiles?.length) {
        await admin.storage.from('avatars').remove(
          avatarFiles.map(f => `${userId}/${f.name}`)
        )
      }
    } catch {
      // Non-fatal
    }

    // Clean up chat images (non-fatal)
    try {
      const col = dbUser.role === 'teacher' ? 'teacher_id' : 'guardian_id'
      const { data: convos } = await admin
        .from('conversations')
        .select('id')
        .eq(col, userId)
      if (convos?.length) {
        for (const conv of convos) {
          const { data: chatFiles } = await admin.storage
            .from('chat-images')
            .list(conv.id)
          if (chatFiles?.length) {
            await admin.storage.from('chat-images').remove(
              chatFiles.map(f => `${conv.id}/${f.name}`)
            )
          }
        }
      }
    } catch {
      // Non-fatal
    }

    // Delete from Supabase Auth → cascades to all related tables
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Auth user deletion error:', deleteError)
      return NextResponse.json(
        { error: 'アカウント削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Account deletion error:', error)
    return NextResponse.json(
      { error: 'アカウント削除に失敗しました' },
      { status: 500 }
    )
  }
}
