import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockGetUser } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
  }),
}))

import { verifyAdminRequest } from '@/lib/admin/auth'

describe('verifyAdminRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 401 when no user session exists', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: new Error('No session') })

    const result = await verifyAdminRequest()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toBe('Unauthorized')
    }
  })

  it('returns 403 when ADMIN_ALLOWED_EMAILS is empty', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'admin@example.com' } },
      error: null,
    })
    process.env.ADMIN_ALLOWED_EMAILS = ''

    const result = await verifyAdminRequest()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toBe('Admin access not configured')
    }
  })

  it('returns 403 when user email is not in whitelist', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'notadmin@example.com' } },
      error: null,
    })
    process.env.ADMIN_ALLOWED_EMAILS = 'admin@example.com,other@example.com'

    const result = await verifyAdminRequest()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toBe('Forbidden')
    }
  })

  it('returns ok when user email is in whitelist', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'admin@example.com' } },
      error: null,
    })
    process.env.ADMIN_ALLOWED_EMAILS = 'admin@example.com,other@example.com'

    const result = await verifyAdminRequest()
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.adminId).toBe('user1')
      expect(result.adminEmail).toBe('admin@example.com')
    }
  })

  it('handles case-insensitive email matching', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'Admin@Example.COM' } },
      error: null,
    })
    process.env.ADMIN_ALLOWED_EMAILS = 'admin@example.com'

    const result = await verifyAdminRequest()
    expect(result.ok).toBe(true)
  })

  it('handles whitespace in ADMIN_ALLOWED_EMAILS', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user1', email: 'admin@example.com' } },
      error: null,
    })
    process.env.ADMIN_ALLOWED_EMAILS = ' admin@example.com , other@example.com '

    const result = await verifyAdminRequest()
    expect(result.ok).toBe(true)
  })
})
