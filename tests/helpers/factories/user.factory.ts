import type { User, Teacher, Guardian, Student } from '@/lib/types/database'

let counter = 0

function nextId(): string {
  counter++
  return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`
}

export function buildUser(overrides?: Partial<User>): User {
  const id = nextId()
  return {
    id,
    role: 'teacher',
    email: `user-${id.slice(-4)}@example.com`,
    name: 'テストユーザー',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function buildTeacher(overrides?: Partial<Teacher>): Teacher {
  const id = overrides?.id ?? nextId()
  return {
    id,
    subjects: ['数学'],
    grades: ['中学1年'],
    public_profile: {},
    plan: 'free',
    is_onboarding_complete: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function buildGuardian(overrides?: Partial<Guardian>): Guardian {
  const id = overrides?.id ?? nextId()
  return {
    id,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

export function buildStudent(overrides?: Partial<Student>): Student {
  const id = overrides?.id ?? nextId()
  return {
    id,
    grade: '中学1年',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}
