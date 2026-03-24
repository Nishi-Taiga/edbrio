import { NextRequest, NextResponse } from 'next/server'
import { preRegisterLimiter } from '@/lib/rate-limit'
import { preRegisterSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail, buildPreRegistrationConfirmationEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = preRegisterLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json(
        { error: '送信回数の上限に達しました。しばらくお待ちください。' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const result = preRegisterSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '有効なメールアドレスを入力してください。' }, { status: 400 })
    }
    const { email } = result.data

    const supabase = createAdminClient()

    // Insert with ON CONFLICT DO NOTHING — returns empty array if duplicate
    const { data, error } = await supabase
      .from('pre_registrations')
      .insert({ email })
      .select('token')
      .single()

    if (error && error.code !== '23505') {
      // 23505 = unique_violation (duplicate email)
      console.error('Pre-registration insert error:', error.message)
      return NextResponse.json(
        { error: '登録に失敗しました。しばらくしてからお試しください。' },
        { status: 500 }
      )
    }

    // Send confirmation email only for new registrations
    if (data?.token) {
      try {
        const { subject, html } = buildPreRegistrationConfirmationEmail({ token: data.token })
        await sendEmail(email, subject, html)
      } catch (emailError) {
        console.error('Pre-registration confirmation email error:', emailError)
        // Don't fail the registration if email fails
      }
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Pre-registration error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: '登録に失敗しました。しばらくしてからお試しください。' },
      { status: 500 }
    )
  }
}
