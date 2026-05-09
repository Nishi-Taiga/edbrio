import { describe, it, expect } from 'vitest'
import {
  contactSchema,
  loginSchema,
  generateReportSchema,
  emailSendSchema,
  inviteCreateSchema,
  inviteValidateSchema,
  inviteAcceptSchema,
  checkoutSessionSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  adminUsersQuerySchema,
  ticketGrantSchema,
  adminUserUpdateSchema,
} from '@/lib/validations'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('contactSchema', () => {
  it('accepts valid input', () => {
    const result = contactSchema.safeParse({
      name: 'テスト太郎',
      email: 'test@example.com',
      message: 'テストメッセージ',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = contactSchema.safeParse({
      name: '',
      email: 'test@example.com',
      message: 'テスト',
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid email', () => {
    const result = contactSchema.safeParse({
      name: 'テスト',
      email: 'not-an-email',
      message: 'テスト',
    })
    expect(result.success).toBe(false)
  })

  it('rejects message exceeding 5000 chars', () => {
    const result = contactSchema.safeParse({
      name: 'テスト',
      email: 'test@example.com',
      message: 'a'.repeat(5001),
    })
    expect(result.success).toBe(false)
  })

  it('rejects name exceeding 100 chars', () => {
    const result = contactSchema.safeParse({
      name: 'a'.repeat(101),
      email: 'test@example.com',
      message: 'テスト',
    })
    expect(result.success).toBe(false)
  })
})

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: 'password123',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'user@example.com',
      password: '',
    })
    expect(result.success).toBe(false)
  })

  it('rejects missing email', () => {
    const result = loginSchema.safeParse({ password: 'pass' })
    expect(result.success).toBe(false)
  })
})

describe('generateReportSchema', () => {
  it('accepts valid report data', () => {
    const result = generateReportSchema.safeParse({
      contentRaw: 'レポート内容',
      studentName: '田中太郎',
    })
    expect(result.success).toBe(true)
  })

  it('accepts all optional fields', () => {
    const result = generateReportSchema.safeParse({
      contentRaw: 'レポート内容',
      studentName: '田中太郎',
      subject: '数学',
      goals: ['目標1', '目標2'],
      weakPoints: ['弱点1'],
      comprehensionLevel: 3,
      studentMood: 'good',
      maxLength: 500,
    })
    expect(result.success).toBe(true)
  })

  it('rejects comprehensionLevel outside 1-5', () => {
    const result = generateReportSchema.safeParse({
      contentRaw: 'テスト',
      studentName: 'テスト',
      comprehensionLevel: 6,
    })
    expect(result.success).toBe(false)
  })

  it('rejects invalid studentMood', () => {
    const result = generateReportSchema.safeParse({
      contentRaw: 'テスト',
      studentName: 'テスト',
      studentMood: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('rejects contentRaw exceeding 10000 chars', () => {
    const result = generateReportSchema.safeParse({
      contentRaw: 'a'.repeat(10001),
      studentName: 'テスト',
    })
    expect(result.success).toBe(false)
  })

  it('rejects more than 10 goals', () => {
    const result = generateReportSchema.safeParse({
      contentRaw: 'テスト',
      studentName: 'テスト',
      goals: Array.from({ length: 11 }, (_, i) => `goal${i}`),
    })
    expect(result.success).toBe(false)
  })
})

describe('emailSendSchema', () => {
  it('accepts booking_confirmation type', () => {
    const result = emailSendSchema.safeParse({
      type: 'booking_confirmation',
      data: { bookingId: VALID_UUID },
    })
    expect(result.success).toBe(true)
  })

  it('accepts booking_cancellation type', () => {
    const result = emailSendSchema.safeParse({
      type: 'booking_cancellation',
      data: { bookingId: VALID_UUID },
    })
    expect(result.success).toBe(true)
  })

  it('accepts report_published type', () => {
    const result = emailSendSchema.safeParse({
      type: 'report_published',
      data: { reportId: VALID_UUID },
    })
    expect(result.success).toBe(true)
  })

  it('accepts new_chat_message type', () => {
    const result = emailSendSchema.safeParse({
      type: 'new_chat_message',
      data: { conversationId: VALID_UUID },
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown type', () => {
    const result = emailSendSchema.safeParse({
      type: 'unknown_type',
      data: {},
    })
    expect(result.success).toBe(false)
  })

  it('rejects non-UUID bookingId', () => {
    const result = emailSendSchema.safeParse({
      type: 'booking_confirmation',
      data: { bookingId: 'not-a-uuid' },
    })
    expect(result.success).toBe(false)
  })
})

describe('inviteCreateSchema', () => {
  it('accepts email invite with email', () => {
    const result = inviteCreateSchema.safeParse({
      email: 'guardian@example.com',
      method: 'email',
    })
    expect(result.success).toBe(true)
  })

  it('accepts QR invite without email', () => {
    const result = inviteCreateSchema.safeParse({
      method: 'qr',
    })
    expect(result.success).toBe(true)
  })

  it('rejects email invite without email', () => {
    const result = inviteCreateSchema.safeParse({
      method: 'email',
    })
    expect(result.success).toBe(false)
  })

  it('defaults method to email', () => {
    const result = inviteCreateSchema.safeParse({
      email: 'test@example.com',
    })
    expect(result.success).toBe(true)
  })
})

describe('inviteValidateSchema', () => {
  it('accepts valid UUID token', () => {
    expect(inviteValidateSchema.safeParse({ token: VALID_UUID }).success).toBe(true)
  })

  it('rejects non-UUID token', () => {
    expect(inviteValidateSchema.safeParse({ token: 'abc' }).success).toBe(false)
  })
})

describe('inviteAcceptSchema', () => {
  it('accepts valid UUID token', () => {
    expect(inviteAcceptSchema.safeParse({ token: VALID_UUID }).success).toBe(true)
  })

  it('rejects missing token', () => {
    expect(inviteAcceptSchema.safeParse({}).success).toBe(false)
  })
})

describe('checkoutSessionSchema', () => {
  it('accepts valid ticketId and priceId', () => {
    const result = checkoutSessionSchema.safeParse({
      ticketId: VALID_UUID,
      priceId: 'price_123abc',
    })
    expect(result.success).toBe(true)
  })

  it('rejects non-UUID ticketId', () => {
    const result = checkoutSessionSchema.safeParse({
      ticketId: 'bad',
      priceId: 'price_123',
    })
    expect(result.success).toBe(false)
  })

  it('rejects empty priceId', () => {
    const result = checkoutSessionSchema.safeParse({
      ticketId: VALID_UUID,
      priceId: '',
    })
    expect(result.success).toBe(false)
  })
})

describe('forgotPasswordSchema', () => {
  it('accepts valid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'test@example.com' }).success).toBe(true)
  })

  it('rejects invalid email', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'bad' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('accepts password with 8+ chars', () => {
    expect(resetPasswordSchema.safeParse({ password: '12345678' }).success).toBe(true)
  })

  it('rejects password shorter than 8 chars', () => {
    expect(resetPasswordSchema.safeParse({ password: '1234567' }).success).toBe(false)
  })

  it('rejects password longer than 72 chars', () => {
    expect(resetPasswordSchema.safeParse({ password: 'a'.repeat(73) }).success).toBe(false)
  })
})

describe('adminUsersQuerySchema', () => {
  it('applies defaults for empty input', () => {
    const result = adminUsersQuerySchema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.role).toBe('all')
      expect(result.data.plan).toBe('all')
      expect(result.data.search).toBe('')
      expect(result.data.page).toBe(1)
      expect(result.data.limit).toBe(20)
      expect(result.data.sort).toBe('newest')
    }
  })

  it('coerces string page to number', () => {
    const result = adminUsersQuerySchema.safeParse({ page: '3' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(3)
    }
  })

  it('rejects invalid role', () => {
    const result = adminUsersQuerySchema.safeParse({ role: 'admin' })
    expect(result.success).toBe(false)
  })

  it('rejects limit > 100', () => {
    const result = adminUsersQuerySchema.safeParse({ limit: 101 })
    expect(result.success).toBe(false)
  })

  it('rejects page < 1', () => {
    const result = adminUsersQuerySchema.safeParse({ page: 0 })
    expect(result.success).toBe(false)
  })
})

describe('ticketGrantSchema', () => {
  it('accepts valid grant data', () => {
    const result = ticketGrantSchema.safeParse({
      ticketId: VALID_UUID,
      studentProfileId: VALID_UUID,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.sendNotification).toBe(true) // default
    }
  })

  it('accepts optional customMinutes and customValidDays', () => {
    const result = ticketGrantSchema.safeParse({
      ticketId: VALID_UUID,
      studentProfileId: VALID_UUID,
      customMinutes: 120,
      customValidDays: 60,
      sendNotification: false,
    })
    expect(result.success).toBe(true)
  })

  it('rejects customMinutes < 1', () => {
    const result = ticketGrantSchema.safeParse({
      ticketId: VALID_UUID,
      studentProfileId: VALID_UUID,
      customMinutes: 0,
    })
    expect(result.success).toBe(false)
  })

  it('rejects customValidDays > 3650', () => {
    const result = ticketGrantSchema.safeParse({
      ticketId: VALID_UUID,
      studentProfileId: VALID_UUID,
      customValidDays: 3651,
    })
    expect(result.success).toBe(false)
  })
})

describe('adminUserUpdateSchema', () => {
  it('accepts plan update', () => {
    const result = adminUserUpdateSchema.safeParse({ plan: 'standard' })
    expect(result.success).toBe(true)
  })

  it('accepts is_suspended update', () => {
    const result = adminUserUpdateSchema.safeParse({ is_suspended: true })
    expect(result.success).toBe(true)
  })

  it('rejects empty update (no fields)', () => {
    const result = adminUserUpdateSchema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects invalid plan value', () => {
    const result = adminUserUpdateSchema.safeParse({ plan: 'premium' })
    expect(result.success).toBe(false)
  })
})
