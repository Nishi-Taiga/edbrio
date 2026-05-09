import { vi } from 'vitest'

// Mock next/headers (used by Supabase server client)
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
  }),
  headers: () => new Headers(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/ja',
  useSearchParams: () => new URLSearchParams(),
}))
