import { describe, it, expect } from 'vitest'
import {
  buildBookingConfirmationEmail,
  buildBookingCancellationEmail,
  buildReportPublishedEmail,
  buildGuardianInviteEmail,
  buildNewChatMessageEmail,
  buildTicketPurchaseEmail,
  buildTicketGrantEmail,
  buildBookingReminderEmail,
  isNotificationEnabled,
} from '@/lib/email'

describe('buildBookingConfirmationEmail', () => {
  const params = {
    teacherName: '山田先生',
    studentName: '田中太郎',
    date: '2026-01-15',
    startTime: '10:00',
    endTime: '11:00',
    recipientRole: 'teacher' as const,
  }

  it('returns subject containing student name and date', () => {
    const { subject } = buildBookingConfirmationEmail(params)
    expect(subject).toContain('田中太郎')
    expect(subject).toContain('2026-01-15')
    expect(subject).toContain('【EdBrio】')
  })

  it('returns HTML with all booking details', () => {
    const { html } = buildBookingConfirmationEmail(params)
    expect(html).toContain('田中太郎')
    expect(html).toContain('山田先生')
    expect(html).toContain('10:00 - 11:00')
  })

  it('uses different greeting for teacher vs guardian', () => {
    const teacherEmail = buildBookingConfirmationEmail(params)
    const guardianEmail = buildBookingConfirmationEmail({
      ...params,
      recipientRole: 'guardian',
    })
    expect(teacherEmail.html).toContain('新しい予約が入りました')
    expect(guardianEmail.html).toContain('予約が確定しました')
  })

  it('wraps content in HTML layout', () => {
    const { html } = buildBookingConfirmationEmail(params)
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('EdBrio')
    expect(html).toContain('edbrio.com')
  })
})

describe('buildBookingCancellationEmail', () => {
  const params = {
    teacherName: '山田先生',
    studentName: '田中太郎',
    date: '2026-01-15',
    startTime: '10:00',
    endTime: '11:00',
    recipientRole: 'guardian' as const,
  }

  it('returns subject with cancellation info', () => {
    const { subject } = buildBookingCancellationEmail(params)
    expect(subject).toContain('キャンセル')
    expect(subject).toContain('田中太郎')
  })

  it('uses different greeting for teacher vs guardian', () => {
    const guardianEmail = buildBookingCancellationEmail(params)
    const teacherEmail = buildBookingCancellationEmail({
      ...params,
      recipientRole: 'teacher',
    })
    expect(guardianEmail.html).toContain('予約をキャンセルしました')
    expect(teacherEmail.html).toContain('予約がキャンセルされました')
  })
})

describe('buildReportPublishedEmail', () => {
  it('includes teacher and student names', () => {
    const { subject, html } = buildReportPublishedEmail({
      teacherName: '山田先生',
      studentName: '田中太郎',
    })
    expect(subject).toContain('田中太郎')
    expect(html).toContain('山田先生')
    expect(html).toContain('レポートが公開されました')
  })

  it('includes subject when provided', () => {
    const { html } = buildReportPublishedEmail({
      teacherName: '山田先生',
      studentName: '田中太郎',
      subject: '数学',
    })
    expect(html).toContain('数学')
  })

  it('omits subject section when not provided', () => {
    const { html } = buildReportPublishedEmail({
      teacherName: '山田先生',
      studentName: '田中太郎',
    })
    expect(html).not.toContain('教科:')
  })
})

describe('buildGuardianInviteEmail', () => {
  it('includes teacher name and invite URL', () => {
    const { subject, html } = buildGuardianInviteEmail({
      teacherName: '山田先生',
      inviteUrl: 'https://edbrio.com/invite/abc123',
    })
    expect(subject).toContain('山田先生')
    expect(html).toContain('https://edbrio.com/invite/abc123')
    expect(html).toContain('7日間有効')
  })
})

describe('buildNewChatMessageEmail', () => {
  it('includes sender, student, and message preview', () => {
    const { subject, html } = buildNewChatMessageEmail({
      senderName: '山田先生',
      studentName: '田中太郎',
      messagePreview: 'こんにちは、次の授業について',
    })
    expect(subject).toContain('山田先生')
    expect(subject).toContain('田中太郎')
    expect(html).toContain('こんにちは、次の授業について')
  })

  it('truncates message preview longer than 100 chars', () => {
    const longMessage = 'あ'.repeat(150)
    const { html } = buildNewChatMessageEmail({
      senderName: 'テスト',
      studentName: 'テスト',
      messagePreview: longMessage,
    })
    expect(html).toContain('…')
    expect(html).not.toContain(longMessage)
  })
})

describe('buildTicketPurchaseEmail', () => {
  it('includes ticket details and formatted price', () => {
    const { subject, html } = buildTicketPurchaseEmail({
      ticketName: '数学60分チケット',
      totalMinutes: 240,
      priceCents: 500000,
      expiresAt: '2026-02-01',
    })
    expect(subject).toContain('数学60分チケット')
    expect(html).toContain('240分')
    expect(html).toContain('500,000')
    expect(html).toContain('2026-02-01')
  })
})

describe('buildTicketGrantEmail', () => {
  it('includes student name and ticket info', () => {
    const { subject, html } = buildTicketGrantEmail({
      ticketName: '数学60分チケット',
      studentName: '田中太郎',
      totalMinutes: 240,
      expiresAt: '2026-02-01',
    })
    expect(subject).toContain('田中太郎')
    expect(subject).toContain('数学60分チケット')
    expect(html).toContain('240分')
  })
})

describe('buildBookingReminderEmail', () => {
  const params = {
    teacherName: '山田先生',
    studentName: '田中太郎',
    date: '2026-01-15',
    startTime: '10:00',
    endTime: '11:00',
    recipientRole: 'teacher' as const,
  }

  it('returns reminder subject', () => {
    const { subject } = buildBookingReminderEmail(params)
    expect(subject).toContain('リマインダー')
    expect(subject).toContain('田中太郎')
  })

  it('uses different greeting for teacher vs guardian', () => {
    const teacherEmail = buildBookingReminderEmail(params)
    const guardianEmail = buildBookingReminderEmail({
      ...params,
      recipientRole: 'guardian',
    })
    expect(teacherEmail.html).toContain('明日の授業予定のリマインダーです')
    expect(guardianEmail.html).toContain('明日の授業予定をお知らせいたします')
  })
})

describe('isNotificationEnabled', () => {
  it('returns true when preferences is null', () => {
    expect(isNotificationEnabled(null, 'booking_confirmation')).toBe(true)
  })

  it('returns true when preferences is undefined', () => {
    expect(isNotificationEnabled(undefined, 'booking_confirmation')).toBe(true)
  })

  it('returns true when type is not in preferences', () => {
    expect(isNotificationEnabled({}, 'booking_confirmation')).toBe(true)
  })

  it('returns true when type is explicitly true', () => {
    expect(isNotificationEnabled({ booking_confirmation: true }, 'booking_confirmation')).toBe(true)
  })

  it('returns false when type is explicitly false', () => {
    expect(isNotificationEnabled({ booking_confirmation: false }, 'booking_confirmation')).toBe(false)
  })
})
