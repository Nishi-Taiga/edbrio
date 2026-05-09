import { NextResponse } from 'next/server'
import { verifyAdminRequest } from '@/lib/admin/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { adminLimiter } from '@/lib/rate-limit'
import { sendEmail, buildLaunchNotificationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST() {
  const auth = await verifyAdminRequest()
  if (!auth.ok) return auth.response

  const { success: rateLimitOk } = adminLimiter.check(auth.adminId)
  if (!rateLimitOk) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const supabase = createAdminClient()

    const { data: registrations, error } = await supabase
      .from('pre_registrations')
      .select('id, email')
      .not('confirmed_at', 'is', null)
      .is('converted_at', null)

    if (error) {
      console.error('Failed to fetch pre-registrations:', error.message)
      return NextResponse.json({ error: 'データ取得に失敗しました。' }, { status: 500 })
    }

    if (!registrations || registrations.length === 0) {
      return NextResponse.json({ sent: 0, message: '送信対象がありません。' })
    }

    const { subject, html } = buildLaunchNotificationEmail()

    let sentCount = 0
    const errors: string[] = []

    for (const reg of registrations) {
      try {
        await sendEmail(reg.email, subject, html)
        sentCount++
      } catch (emailError) {
        const msg = emailError instanceof Error ? emailError.message : String(emailError)
        console.error(`Failed to send to ${reg.email}:`, msg)
        errors.push(reg.email)
      }
    }

    return NextResponse.json({
      sent: sentCount,
      failed: errors.length,
      total: registrations.length,
    })
  } catch (error: unknown) {
    console.error('Launch notification error:', error instanceof Error ? error.message : error)
    return NextResponse.json({ error: '送信に失敗しました。' }, { status: 500 })
  }
}
