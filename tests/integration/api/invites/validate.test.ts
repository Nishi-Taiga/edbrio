import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createMockRequest, parseResponse } from '#test/mocks/next-request'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'

// Mock admin client with configurable responses
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: () => ({ from: mockFrom }),
}))

import { GET } from '@/app/api/invites/validate/route'

function setupMockChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  }
  return chain
}

describe('GET /api/invites/validate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns valid=false for missing token', async () => {
    const req = createMockRequest({
      url: 'http://localhost:3000/api/invites/validate',
    })

    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.valid).toBe(false)
    expect(body.reason).toBe('missing_token')
  })

  it('returns valid=false for non-UUID token', async () => {
    const req = createMockRequest({
      url: `http://localhost:3000/api/invites/validate?token=not-a-uuid`,
    })

    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.valid).toBe(false)
    expect(body.reason).toBe('missing_token')
  })

  it('returns valid=false when invite not found', async () => {
    const inviteChain = setupMockChain(null)
    mockFrom.mockReturnValue(inviteChain)

    const req = createMockRequest({
      url: `http://localhost:3000/api/invites/validate?token=${VALID_UUID}`,
    })

    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.valid).toBe(false)
    expect(body.reason).toBe('not_found')
  })

  it('returns valid=false when invite is used', async () => {
    const inviteChain = setupMockChain({
      id: '1',
      email: 'test@example.com',
      used: true,
      expires_at: '2099-01-01T00:00:00Z',
      teacher_id: 'teacher1',
      method: 'email',
    })
    mockFrom.mockReturnValue(inviteChain)

    const req = createMockRequest({
      url: `http://localhost:3000/api/invites/validate?token=${VALID_UUID}`,
    })

    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.valid).toBe(false)
    expect(body.reason).toBe('used')
  })

  it('returns valid=false when invite is expired', async () => {
    const inviteChain = setupMockChain({
      id: '1',
      email: 'test@example.com',
      used: false,
      expires_at: '2020-01-01T00:00:00Z', // past date
      teacher_id: 'teacher1',
      method: 'email',
    })
    mockFrom.mockReturnValue(inviteChain)

    const req = createMockRequest({
      url: `http://localhost:3000/api/invites/validate?token=${VALID_UUID}`,
    })

    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.valid).toBe(false)
    expect(body.reason).toBe('expired')
  })

  it('returns valid=true with teacher name for valid invite', async () => {
    let callCount = 0
    mockFrom.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        // First call: invites table
        return setupMockChain({
          id: '1',
          email: 'guardian@example.com',
          used: false,
          expires_at: '2099-01-01T00:00:00Z',
          teacher_id: 'teacher1',
          method: 'email',
        })
      }
      // Second call: users table (teacher)
      return setupMockChain({ name: '山田先生' })
    })

    const req = createMockRequest({
      url: `http://localhost:3000/api/invites/validate?token=${VALID_UUID}`,
    })

    const res = await GET(req)
    const { body } = await parseResponse(res)

    expect(body.valid).toBe(true)
    expect(body.teacherName).toBe('山田先生')
    expect(body.email).toBe('guardian@example.com')
    expect(body.method).toBe('email')
  })
})
