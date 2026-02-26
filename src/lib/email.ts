import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM_ADDRESS = process.env.RESEND_FROM || 'EdBrio <info@edbrio.com>'

// ── Generic send ──

export async function sendEmail(to: string, subject: string, html: string) {
  const { data, error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
  })
  if (error) throw new Error(`Email send failed: ${error.message}`)
  return data
}

// ── HTML layout wrapper ──

function wrapInLayout(body: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ff;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(124,58,237,0.08);">
<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#7c3aed,#6d28d9);padding:32px 40px;">
<span style="font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">EdBrio</span>
</td></tr>
<!-- Body -->
<tr><td style="padding:32px 40px;">
${body}
</td></tr>
<!-- Footer -->
<tr><td style="padding:24px 40px;border-top:1px solid #e9e5f0;text-align:center;">
<p style="margin:0;font-size:12px;color:#9ca3af;">
&copy; 2026 EdBrio. All rights reserved.<br>
<a href="https://edbrio.com" style="color:#7c3aed;text-decoration:none;">edbrio.com</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`
}

// ── Templates ──

export function buildBookingConfirmationEmail(params: {
  teacherName: string
  studentName: string
  date: string
  startTime: string
  endTime: string
  recipientRole: 'teacher' | 'guardian'
}): { subject: string; html: string } {
  const { teacherName, studentName, date, startTime, endTime, recipientRole } = params

  const greeting = recipientRole === 'teacher'
    ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;">新しい予約が入りました。</p>`
    : `<p style="margin:0 0 16px;font-size:15px;color:#374151;">予約が確定しました。</p>`

  const body = `
${greeting}
<table width="100%" cellpadding="12" cellspacing="0" style="background:#f5f0ff;border-radius:12px;margin:16px 0;">
<tr>
  <td style="font-size:13px;color:#6b7280;width:100px;">生徒名</td>
  <td style="font-size:15px;color:#1f2937;font-weight:600;">${studentName}</td>
</tr>
<tr>
  <td style="font-size:13px;color:#6b7280;">講師</td>
  <td style="font-size:15px;color:#1f2937;font-weight:600;">${teacherName}</td>
</tr>
<tr>
  <td style="font-size:13px;color:#6b7280;">日時</td>
  <td style="font-size:15px;color:#1f2937;font-weight:600;">${date} ${startTime} - ${endTime}</td>
</tr>
</table>
<p style="margin:24px 0 0;text-align:center;">
  <a href="https://edbrio.com/login" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">ダッシュボードを開く</a>
</p>`

  return {
    subject: `【EdBrio】予約確認: ${studentName} - ${date} ${startTime}`,
    html: wrapInLayout(body),
  }
}

export function buildReportPublishedEmail(params: {
  teacherName: string
  studentName: string
  subject?: string
}): { subject: string; html: string } {
  const { teacherName, studentName, subject: subjectName } = params

  const body = `
<p style="margin:0 0 16px;font-size:15px;color:#374151;">
  ${teacherName}先生から、${studentName}さんの授業レポートが公開されました。
</p>
${subjectName ? `<p style="margin:0 0 16px;font-size:14px;color:#6b7280;">教科: ${subjectName}</p>` : ''}
<p style="margin:24px 0 0;text-align:center;">
  <a href="https://edbrio.com/login" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">レポートを確認する</a>
</p>`

  return {
    subject: `【EdBrio】${studentName}さんの授業レポートが公開されました`,
    html: wrapInLayout(body),
  }
}

export function buildBookingReminderEmail(params: {
  teacherName: string
  studentName: string
  date: string
  startTime: string
  endTime: string
  recipientRole: 'teacher' | 'guardian'
}): { subject: string; html: string } {
  const { teacherName, studentName, date, startTime, endTime, recipientRole } = params

  const greeting = recipientRole === 'teacher'
    ? `<p style="margin:0 0 16px;font-size:15px;color:#374151;">明日の授業予定のリマインダーです。</p>`
    : `<p style="margin:0 0 16px;font-size:15px;color:#374151;">明日の授業予定をお知らせいたします。</p>`

  const body = `
${greeting}
<table width="100%" cellpadding="12" cellspacing="0" style="background:#f5f0ff;border-radius:12px;margin:16px 0;">
<tr>
  <td style="font-size:13px;color:#6b7280;width:100px;">生徒名</td>
  <td style="font-size:15px;color:#1f2937;font-weight:600;">${studentName}</td>
</tr>
<tr>
  <td style="font-size:13px;color:#6b7280;">講師</td>
  <td style="font-size:15px;color:#1f2937;font-weight:600;">${teacherName}</td>
</tr>
<tr>
  <td style="font-size:13px;color:#6b7280;">日時</td>
  <td style="font-size:15px;color:#1f2937;font-weight:600;">${date} ${startTime} - ${endTime}</td>
</tr>
</table>
<p style="margin:24px 0 0;text-align:center;">
  <a href="https://edbrio.com/login" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:12px 32px;border-radius:12px;text-decoration:none;font-weight:700;font-size:14px;">ダッシュボードを開く</a>
</p>`

  return {
    subject: `【EdBrio】明日の授業リマインダー: ${studentName} - ${date} ${startTime}`,
    html: wrapInLayout(body),
  }
}
