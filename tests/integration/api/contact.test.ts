import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, parseResponse } from '#test/mocks/next-request'

// Mock rate limiter to avoid interference between tests
const mockCheck = vi.fn().mockReturnValue({ success: true, remaining: 2 })
vi.mock('@/lib/rate-limit', () => ({
  contactLimiter: { check: (...args: unknown[]) => mockCheck(...args) },
}))

// Mock email module
const mockSendEmail = vi.fn().mockResolvedValue({ id: 'email_123' })
vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}))

import { POST } from '@/app/api/contact/route'

describe('POST /api/contact', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.RESEND_API_KEY = 'test_key'
    mockCheck.mockReturnValue({ success: true, remaining: 2 })
  })

  it('returns success for valid input', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: {
        name: 'テスト太郎',
        email: 'test@example.com',
        message: 'テストメッセージ',
      },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(mockSendEmail).toHaveBeenCalledOnce()
  })

  it('returns 400 for invalid input', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: {
        name: '',
        email: 'bad',
        message: '',
      },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(400)
    expect(body.error).toBeTruthy()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    mockCheck.mockReturnValue({ success: false, remaining: 0 })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: {
        name: 'テスト',
        email: 'test@example.com',
        message: 'テスト',
      },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(429)
  })

  it('returns 500 when RESEND_API_KEY is not set', async () => {
    delete process.env.RESEND_API_KEY

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: {
        name: 'テスト',
        email: 'test@example.com',
        message: 'テスト',
      },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(500)
  })

  it('sends email to configured admin address', async () => {
    process.env.CONTACT_EMAIL = 'admin@edbrio.com'

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: {
        name: 'テスト',
        email: 'test@example.com',
        message: 'テスト内容',
      },
    })

    await POST(req)

    expect(mockSendEmail).toHaveBeenCalledWith(
      'admin@edbrio.com',
      expect.stringContaining('テスト'),
      expect.any(String)
    )
  })

  it('sanitizes name in subject to prevent header injection', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/contact',
      body: {
        name: 'テスト\r\nBcc: attacker@evil.com',
        email: 'test@example.com',
        message: 'テスト',
      },
    })

    await POST(req)

    const subject = mockSendEmail.mock.calls[0][1]
    expect(subject).not.toContain('\r')
    expect(subject).not.toContain('\n')
  })
})
