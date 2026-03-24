import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, parseResponse } from '#test/mocks/next-request'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

// Mock rate limiter
const { mockCheck } = vi.hoisted(() => ({
  mockCheck: vi.fn().mockReturnValue({ success: true, remaining: 4 }),
}))
vi.mock('@/lib/rate-limit', () => ({
  checkoutLimiter: { check: (...args: unknown[]) => mockCheck(...args) },
}))

// Mock Stripe — must be a constructor function for `new Stripe()`
const { mockSessionsCreate } = vi.hoisted(() => ({
  mockSessionsCreate: vi.fn().mockResolvedValue({
    id: 'cs_test_123',
    url: 'https://checkout.stripe.com/test',
  }),
}))

vi.mock('stripe', () => {
  function MockStripe() {
    return {
      checkout: {
        sessions: {
          create: mockSessionsCreate,
        },
      },
    }
  }
  return { default: MockStripe }
})

import { POST } from '@/app/api/checkout/session/route'

describe('POST /api/checkout/session', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_SECRET_KEY = 'sk_test_123'
    process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'
    mockCheck.mockReturnValue({ success: true, remaining: 4 })
  })

  it('creates checkout session for valid input', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/checkout/session',
      body: {
        ticketId: VALID_UUID,
        priceId: 'price_test_123',
      },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(200)
    expect(body.sessionId).toBe('cs_test_123')
    expect(mockSessionsCreate).toHaveBeenCalledOnce()
  })

  it('returns 400 for invalid input', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/checkout/session',
      body: {
        ticketId: 'bad',
        priceId: '',
      },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(400)
    expect(mockSessionsCreate).not.toHaveBeenCalled()
  })

  it('returns 429 when rate limited', async () => {
    mockCheck.mockReturnValue({ success: false, remaining: 0 })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/checkout/session',
      body: {
        ticketId: VALID_UUID,
        priceId: 'price_test_123',
      },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)

    expect(status).toBe(429)
  })

  it('passes ticketId in metadata', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/checkout/session',
      body: {
        ticketId: VALID_UUID,
        priceId: 'price_test_123',
      },
    })

    await POST(req)

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: { ticketId: VALID_UUID },
      })
    )
  })

  it('returns 500 when Stripe throws', async () => {
    mockSessionsCreate.mockRejectedValueOnce(new Error('Stripe error'))

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/checkout/session',
      body: {
        ticketId: VALID_UUID,
        priceId: 'price_test_123',
      },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)

    expect(status).toBe(500)
    expect(body.error).toBeTruthy()
  })
})
