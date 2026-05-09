let counter = 0

function nextId(): string {
  counter++
  return `10000000-0000-4000-8000-${String(counter).padStart(12, '0')}`
}

export interface MockTicket {
  id: string
  teacher_id: string
  name: string
  minutes: number
  bundle_qty: number
  valid_days: number
  price_cents: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MockTicketBalance {
  id: string
  student_id: string
  ticket_id: string
  remaining_minutes: number
  expires_at: string
  created_at: string
}

export function buildTicket(overrides?: Partial<MockTicket>): MockTicket {
  const id = overrides?.id ?? nextId()
  return {
    id,
    teacher_id: '00000000-0000-4000-8000-000000000001',
    name: '数学60分チケット',
    minutes: 60,
    bundle_qty: 4,
    valid_days: 30,
    price_cents: 500000,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function buildTicketBalance(overrides?: Partial<MockTicketBalance>): MockTicketBalance {
  const id = overrides?.id ?? nextId()
  return {
    id,
    student_id: '00000000-0000-4000-8000-000000000010',
    ticket_id: '10000000-0000-4000-8000-000000000001',
    remaining_minutes: 240,
    expires_at: '2026-02-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
