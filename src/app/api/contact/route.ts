import { NextRequest, NextResponse } from 'next/server'
import { contactLimiter } from '@/lib/rate-limit'

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
    const { name, email, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'すべての項目を入力してください' }, { status: 400 })
    }

    if (typeof name !== 'string' || name.length > 100) {
      return NextResponse.json({ error: 'お名前が不正です' }, { status: 400 })
    }
    if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: 'メールアドレスが不正です' }, { status: 400 })
    }
    if (typeof message !== 'string' || message.length > 5000) {
      return NextResponse.json({ error: 'お問い合わせ内容が長すぎます' }, { status: 400 })
    }

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

    await sendEmail(adminEmail, `【EdBrio】お問い合わせ: ${name}`, html)

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Contact form error:', msg)
    return NextResponse.json(
      { error: `送信に失敗しました: ${msg}` },
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
