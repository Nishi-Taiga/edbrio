export type UserRole = 'teacher' | 'guardian' | 'student'
export type TeacherPlan = 'free' | 'pro'
export type BookingStatus = 'pending' | 'confirmed' | 'canceled' | 'done'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type GoalStatus = 'active' | 'achieved' | 'paused'
export type WeakPointSeverity = 'low' | 'medium' | 'high'
export type WeakPointStatus = 'active' | 'improving' | 'resolved'
export type StudentMood = 'good' | 'neutral' | 'tired' | 'unmotivated'

export interface User {
  id: string
  role: UserRole
  email: string
  name: string
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  handle: string
  subjects: string[]
  grades: string[]
  public_profile: Record<string, any>
  plan: TeacherPlan
  stripe_account_id?: string
  is_onboarding_complete: boolean
  created_at: string
  updated_at: string
}

export interface Guardian {
  id: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  guardian_id?: string
  grade?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface TeacherStudent {
  id: string
  teacher_id: string
  student_id: string
  status: string
  created_at: string
}

export interface Invite {
  id: string
  teacher_id: string
  token: string
  role: UserRole
  expires_at: string
  used: boolean
  created_at: string
}

export interface Shift {
  id: string
  teacher_id: string
  start_time: string
  end_time: string
  rrule?: string
  location?: string
  is_published: boolean
  created_at: string
}

export interface Availability {
  id: string
  teacher_id: string
  slot_start: string
  slot_end: string
  source?: string
  is_bookable: boolean
  created_at: string
}

export interface Ticket {
  id: string
  teacher_id: string
  name: string
  minutes: number
  bundle_qty: number
  price_cents: number
  valid_days: number
  is_active: boolean
  stripe_price_id?: string
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  teacher_id: string
  payer_id: string
  amount_cents: number
  processor: string
  processor_payment_id?: string
  status: PaymentStatus
  created_at: string
  updated_at: string
}

export interface TicketBalance {
  id: string
  student_id: string
  ticket_id: string
  remaining_minutes: number
  purchased_at: string
  expires_at: string
  payment_id?: string
  created_at: string
}

export interface Booking {
  id: string
  teacher_id: string
  student_id: string
  start_time: string
  end_time: string
  status: BookingStatus
  ticket_balance_id?: string
  source?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Report {
  id: string
  booking_id: string | null
  content_raw?: string
  content_public?: string
  ai_summary?: string
  visibility: string
  published_at?: string
  profile_id?: string
  teacher_id?: string
  subject?: string
  homework?: string
  next_plan?: string
  student_mood?: StudentMood
  comprehension_level?: number
  created_at: string
  updated_at: string
}

export interface AuditLog {
  id: string
  actor_id?: string
  action: string
  target_table: string
  target_id?: string
  meta: Record<string, any>
  created_at: string
}

// --- Karte (指導カルテ) ---

export interface StudentProfile {
  id: string
  teacher_id: string
  student_id?: string
  name: string
  grade?: string
  school?: string
  birth_date?: string
  subjects: string[]
  personality_notes?: string
  enrollment_date?: string
  status: string
  created_at: string
  updated_at: string
}

export interface StudentGoal {
  id: string
  profile_id: string
  title: string
  description?: string
  subject?: string
  target_date?: string
  status: GoalStatus
  progress: number
  created_at: string
  updated_at: string
}

export interface StudentWeakPoint {
  id: string
  profile_id: string
  subject: string
  topic: string
  severity: WeakPointSeverity
  notes?: string
  status: WeakPointStatus
  identified_at: string
  resolved_at?: string
  created_at: string
  updated_at: string
}

export interface StudentStrength {
  id: string
  profile_id: string
  subject: string
  topic: string
  notes?: string
  created_at: string
}

export interface HandoverNote {
  id: string
  profile_id: string
  from_teacher_id: string
  to_teacher_id?: string | null
  content: string
  created_at: string
}
