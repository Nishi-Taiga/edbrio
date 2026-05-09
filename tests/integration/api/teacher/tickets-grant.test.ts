import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, parseResponse } from '#test/mocks/next-request'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const TEACHER_ID = '00000000-0000-4000-8000-000000000001'
const TICKET_ID = '10000000-0000-4000-8000-000000000001'
const PROFILE_ID = '30000000-0000-4000-8000-000000000001'

// Hoisted mocks
const { mockGetUser, mockFrom, mockAdminFrom, mockCheck, mockSendEmail } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
  mockAdminFrom: vi.fn(),
  mockCheck: vi.fn().mockReturnValue({ success: true, remaining: 19 }),
  mockSendEmail: vi.fn().mockResolvedValue({ id: 'email_123' }),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockAdminFrom }),
}))

vi.mock('@/lib/rate-limit', () => ({
  ticketGrantLimiter: { check: (...args: unknown[]) => mockCheck(...args) },
}))

vi.mock('@/lib/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  buildTicketGrantEmail: vi.fn().mockReturnValue({
    subject: 'チケット付与テスト',
    html: '<p>テスト</p>',
  }),
  isNotificationEnabled: vi.fn().mockReturnValue(true),
}))

import { POST } from '@/app/api/teacher/tickets/grant/route'

// Helper to create chainable mock
function chain(data: unknown, error: unknown = null) {
  const obj = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
  }
  return obj
}

describe('POST /api/teacher/tickets/grant', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: TEACHER_ID } },
      error: null,
    })
    mockCheck.mockReturnValue({ success: true, remaining: 19 })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: { ticketId: TICKET_ID, studentProfileId: PROFILE_ID },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(401)
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 429 when rate limited', async () => {
    mockCheck.mockReturnValue({ success: false, remaining: 0 })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: { ticketId: TICKET_ID, studentProfileId: PROFILE_ID },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(429)
  })

  it('returns 400 for invalid input', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: { ticketId: 'not-uuid', studentProfileId: '' },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(400)
  })

  it('returns 404 when ticket not found', async () => {
    mockFrom.mockReturnValue(chain(null, { message: 'not found' }))

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: { ticketId: VALID_UUID, studentProfileId: VALID_UUID },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(404)
    expect(body.error).toContain('チケット')
  })

  it('returns 404 when student profile not found', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // tickets query - found
        return chain({
          id: TICKET_ID,
          teacher_id: TEACHER_ID,
          name: '数学チケット',
          minutes: 60,
          bundle_qty: 4,
          valid_days: 30,
        })
      }
      // student_profiles query - not found
      return chain(null, { message: 'not found' })
    })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: { ticketId: VALID_UUID, studentProfileId: VALID_UUID },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(404)
    expect(body.error).toContain('生徒')
  })

  it('grants ticket successfully and returns balanceId', async () => {
    let fromCallCount = 0
    mockFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return chain({
          id: TICKET_ID,
          teacher_id: TEACHER_ID,
          name: '数学60分チケット',
          minutes: 60,
          bundle_qty: 4,
          valid_days: 30,
        })
      }
      return chain({
        id: PROFILE_ID,
        student_id: 'student-1',
        guardian_id: 'guardian-1',
        name: '田中太郎',
      })
    })

    let adminCallCount = 0
    mockAdminFrom.mockImplementation(() => {
      adminCallCount++
      const c = chain(null)
      if (adminCallCount === 1) {
        // ticket_balances insert
        c.single = vi.fn().mockResolvedValue({ data: { id: 'balance-1' }, error: null })
      }
      return c
    })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: {
        ticketId: VALID_UUID,
        studentProfileId: VALID_UUID,
        sendNotification: false,
      },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.balanceId).toBe('balance-1')
  })

  it('uses custom minutes and valid days when provided', async () => {
    let fromCallCount = 0
    mockFrom.mockImplementation(() => {
      fromCallCount++
      if (fromCallCount === 1) {
        return chain({
          id: TICKET_ID,
          teacher_id: TEACHER_ID,
          name: 'テスト',
          minutes: 60,
          bundle_qty: 4,
          valid_days: 30,
        })
      }
      return chain({
        id: PROFILE_ID,
        student_id: 'student-1',
        guardian_id: null,
        name: 'テスト生徒',
      })
    })

    let adminCallCount = 0
    mockAdminFrom.mockImplementation(() => {
      adminCallCount++
      const c = chain(null)
      if (adminCallCount === 1) {
        c.single = vi.fn().mockResolvedValue({ data: { id: 'balance-2' }, error: null })
      }
      return c
    })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/teacher/tickets/grant',
      body: {
        ticketId: VALID_UUID,
        studentProfileId: VALID_UUID,
        customMinutes: 120,
        customValidDays: 60,
        sendNotification: false,
      },
    })

    const res = await POST(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })
})
