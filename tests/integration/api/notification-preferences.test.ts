import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, parseResponse } from '#test/mocks/next-request'

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

import { GET, PUT } from '@/app/api/notification-preferences/route'

function chain(data: unknown, error: unknown = null) {
  return {
    select: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
    then: (resolve: (v: unknown) => void) => Promise.resolve({ data, error }).then(resolve),
  }
}

describe('GET /api/notification-preferences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({
      data: { user: { id: USER_ID } },
      error: null,
    })
  })

  it('returns 401 when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const res = await GET()
    const { status } = await parseResponse(res)
    expect(status).toBe(401)
  })

  it('returns user preferences', async () => {
    mockFrom.mockReturnValue(
      chain({ notification_preferences: { booking_confirmation: true, new_chat_message: false } })
    )

    const res = await GET()
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.preferences.booking_confirmation).toBe(true)
    expect(body.preferences.new_chat_message).toBe(false)
  })

  it('returns empty object when no preferences set', async () => {
    mockFrom.mockReturnValue(chain({ notification_preferences: null }))

    const res = await GET()
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.preferences).toEqual({})
  })
})

describe('PUT /api/notification-preferences', () => {
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
      method: 'PUT',
      url: 'http://localhost:3000/api/notification-preferences',
      body: { booking_confirmation: true },
    })

    const res = await PUT(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(401)
  })

  it('updates preferences successfully', async () => {
    mockFrom.mockReturnValue(chain(null, null))

    const req = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/notification-preferences',
      body: {
        booking_confirmation: true,
        new_chat_message: false,
        calendar_week_start: 1,
      },
    })

    const res = await PUT(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })

  it('returns 400 for invalid preference values', async () => {
    const req = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/notification-preferences',
      body: { calendar_week_start: 5 }, // invalid: must be 0 or 1
    })

    const res = await PUT(req)
    const { status } = await parseResponse(res)
    expect(status).toBe(400)
  })

  it('accepts partial updates', async () => {
    mockFrom.mockReturnValue(chain(null, null))

    const req = createMockRequest({
      method: 'PUT',
      url: 'http://localhost:3000/api/notification-preferences',
      body: { booking_reminder: false },
    })

    const res = await PUT(req)
    const { status, body } = await parseResponse(res)
    expect(status).toBe(200)
    expect(body.success).toBe(true)
  })
})
