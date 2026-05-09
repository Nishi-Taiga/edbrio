import type { BookingStatus } from '@/lib/types/database'

let counter = 0

function nextId(): string {
  counter++
  return `20000000-0000-4000-8000-${String(counter).padStart(12, '0')}`
}

export interface MockBooking {
  id: string
  teacher_id: string
  student_id: string
  start_time: string
  end_time: string
  status: BookingStatus
  notes?: string
  created_at: string
  updated_at: string
}

export function buildBooking(overrides?: Partial<MockBooking>): MockBooking {
  const id = overrides?.id ?? nextId()
  return {
    id,
    teacher_id: '00000000-0000-4000-8000-000000000001',
    student_id: '00000000-0000-4000-8000-000000000010',
    start_time: '2026-01-15T10:00:00Z',
    end_time: '2026-01-15T11:00:00Z',
    status: 'confirmed',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
