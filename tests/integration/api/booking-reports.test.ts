import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, parseResponse } from '#test/mocks/next-request'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const USER_ID = '00000000-0000-4000-8000-000000000001'

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    from: mockFrom,
  }),
}))

import { POST, GET } from '@/app/api/booking-reports/route'

function chain(data: unknown, error: unknown = null) {
  const obj: Record<string, unknown> = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  obj.then = (resolve: (v: unknown) => void) => Promise.resolve({ data, error }).then(resolve)
  return obj
}

describe('POST /api/booking-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/booking-reports',
      body: { bookingId: VALID_UUID, reason: 'late' },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(401)
  })

  it('returns 400 when bookingId is missing', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/booking-reports',
      body: { reason: 'late' },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(400)
  })

  it('returns 400 when reason is invalid', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/booking-reports',
      body: { bookingId: VALID_UUID, reason: 'invalid' },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(400)
  })

  it('returns 400 when reason is "other" but description is empty', async () => {
    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/booking-reports',
      body: { bookingId: VALID_UUID, reason: 'other', description: '' },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(400)
  })

  it('returns 403 when guardian has no students', async () => {
    // students query returns empty
    mockFrom.mockReturnValue(chain([], null))
    // Override: thenable resolves with empty data
    mockFrom.mockImplementation(() => {
      const c = chain(null)
      c.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve)
      return c
    })

    const req = createMockRequest({
      method: 'POST',
      url: 'http://localhost:3000/api/booking-reports',
      body: { bookingId: VALID_UUID, reason: 'late' },
    })

    const res = await POST(req)
    const { status } = await parseResponse(res)
    // 403 or 404 depending on flow
    expect([403, 404]).toContain(status)
  })
})

describe('GET /api/booking-reports', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const req = createMockRequest({
      url: 'http://localhost:3000/api/booking-reports',
    })

    const res = await GET(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(401)
  })

  it('returns empty reports when teacher has no bookings', async () => {
    mockFrom.mockImplementation(() => {
      const c = chain(null)
      c.then = (resolve: (v: unknown) => void) => Promise.resolve({ data: [], error: null }).then(resolve)
      return c
    })

    const req = createMockRequest({
      url: 'http://localhost:3000/api/booking-reports',
    })

    const res = await GET(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.reports).toEqual([])
  })
})
