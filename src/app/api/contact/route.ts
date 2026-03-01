import { NextRequest, NextResponse } from 'next/server'
import { contactLimiter } from '@/lib/rate-limit'
import { contactSchema } from '@/lib/validations'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { success: rateLimitOk } = contactLimiter.check(ip)
    if (!rateLimitOk) {
      return NextResponse.json({ error: '送信回数の上限に達しました。しばらくお待ちください。' }, { status: 429 })
    }

    const body = await req.json()
    const result = contactSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: '入力内容に不備があります' }, { status: 400 })
    }
    const { name, email, message } = result.data

    // Log the inquiry (always works regardless of email config)
    console.log('[Contact]', { name, email, message: message.substring(0, 100) })

    // Send email notification via Resend
    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not configured')
      return NextResponse.json({ error: 'メール送信の設定がされていません。' }, { status: 500 })
    }

    const { sendEmail } = await import('@/lib/email')
    const adminEmail = process.env.CONTACT_EMAIL || 'info@edbrio.com'

    const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;font-family:sans-serif;">
<h2 style="color:#7c3aed;">EdBrio お問い合わせ</h2>
<table style="border-collapse:collapse;width:100%;max-width:600px;">
<tr><td style="padding:8px;font-weight:bold;color:#6b7280;width:100px;">お名前</td><td style="padding:8px;">${escapeHtml(name)}</td></tr>
<tr><td style="padding:8px;font-weight:bold;color:#6b7280;">メール</td><td style="padding:8px;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
<tr><td style="padding:8px;font-weight:bold;color:#6b7280;vertical-align:top;">内容</td><td style="padding:8px;white-space:pre-wrap;">${escapeHtml(message)}</td></tr>
</table>
</body>
</html>`

    // Sanitize name in email subject to prevent header injection
    const safeName = name.replace(/[\r\n]/g, '')
    await sendEmail(adminEmail, `【EdBrio】お問い合わせ: ${safeName}`, html)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Contact form error:', error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: '送信に失敗しました。しばらくしてからお試しください。' },
      { status: 500 }
    )
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
