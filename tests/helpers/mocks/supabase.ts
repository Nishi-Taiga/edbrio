import { vi } from 'vitest'

type MockResponse = { data: unknown; error: unknown }
type TableConfig = Record<string, MockResponse>

/**
 * Creates a chainable Supabase client mock.
 *
 * Usage:
 *   const client = createMockSupabaseClient({
 *     users: { data: [{ id: '1', name: 'Test' }], error: null },
 *   })
 */
export function createMockSupabaseClient(tables: TableConfig = {}) {
  const defaultResponse: MockResponse = { data: null, error: null }

  function createQueryBuilder(tableName: string) {
    const response = tables[tableName] ?? defaultResponse

    const builder: Record<string, unknown> = {}
    const chainMethods = [
      'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in', 'contains',
      'order', 'limit', 'range', 'filter', 'not',
      'textSearch', 'match', 'or', 'and',
    ]

    for (const method of chainMethods) {
      builder[method] = vi.fn().mockReturnValue(builder)
    }

    // Terminal methods return the response
    builder.single = vi.fn().mockResolvedValue(response)
    builder.maybeSingle = vi.fn().mockResolvedValue(response)
    builder.then = vi.fn((resolve: (value: MockResponse) => void) => resolve(response))
    // Make builder thenable so `await supabase.from('x').select()` works
    Object.defineProperty(builder, 'then', {
      value: (resolve: (value: MockResponse) => void) => Promise.resolve(response).then(resolve),
      writable: true,
      configurable: true,
    })

    return builder
  }

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: null },
      error: null,
    }),
    getSession: vi.fn().mockResolvedValue({
      data: { session: null },
      error: null,
    }),
    signInWithPassword: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signUp: vi.fn().mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    resetPasswordForEmail: vi.fn().mockResolvedValue({ data: {}, error: null }),
    updateUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  }

  return {
    from: vi.fn((tableName: string) => createQueryBuilder(tableName)),
    auth: mockAuth,
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  }
}

/**
 * Sets up vi.mock for @/lib/supabase/server with a pre-configured client.
 */
export function mockSupabaseServer(tables: TableConfig = {}) {
  const client = createMockSupabaseClient(tables)
  vi.mock('@/lib/supabase/server', () => ({
    createClient: vi.fn().mockResolvedValue(client),
  }))
  return client
}
