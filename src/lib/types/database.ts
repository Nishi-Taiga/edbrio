export interface AreaSelection {
  prefecture: string
  municipality: string
}

/** @deprecated Use AreaSelection instead. Kept for backward compatibility with legacy data. */
export interface StationSelection {
  name: string
  line: string
  prefecture: string
}

export type UserRole = 'teacher' | 'guardian' | 'student'
export type TeacherPlan = 'free' | 'standard'
export type BookingStatus = 'pending' | 'confirmed' | 'canceled' | 'done'
export type BookingReportReason = 'late' | 'absent' | 'other'
export type BookingReportStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type GoalStatus = 'active' | 'achieved' | 'paused'
export type WeakPointSeverity = 'low' | 'medium' | 'high'
export type WeakPointStatus = 'active' | 'improving' | 'resolved'
export type StudentMood = 'good' | 'neutral' | 'tired' | 'unmotivated'

export interface NotificationPreferences {
  booking_confirmation?: boolean
  booking_cancellation?: boolean
  report_published?: boolean
  new_chat_message?: boolean
  booking_reminder?: boolean
  ticket_purchase?: boolean
  calendar_week_start?: 0 | 1 // 0 = Sunday, 1 = Monday
}

export interface User {
  id: string
  role: UserRole
  email: string
  name: string
  display_name?: string
  avatar_url?: string
  notification_preferences?: NotificationPreferences
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  subjects: string[]
  grades: string[]
  public_profile: Record<string, any>
  plan: TeacherPlan
  stripe_account_id?: string
  stripe_customer_id?: string
  stripe_subscription_id?: string
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
  email?: string
  student_profile_id?: string
  method?: 'email' | 'qr'
  expires_at: string
  used: boolean
  accepted_at?: string
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
  tokens_used?: number
  teacher_memo?: string
  created_at: string
  updated_at: string
}

export interface BookingReport {
  id: string
  booking_id: string
  reporter_id: string
  reason: BookingReportReason
  description?: string
  status: BookingReportStatus
  deadline: string
  resolved_at?: string
  resolved_by?: string
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

// --- Curriculum (生徒カリキュラム) ---

export interface StudentProfile {
  id: string
  teacher_id: string
  student_id?: string
  guardian_id?: string
  name: string
  grade?: string
  school?: string
  birth_date?: string
  subjects: string[]
  personality_notes?: string
  enrollment_date?: string
  status: string
  curriculum_year?: string
  curriculum_title?: string
  subject_colors?: Record<string, string>
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

// --- チャット (先生 ↔ 保護者) ---

export interface Conversation {
  id: string
  teacher_id: string
  guardian_id: string
  student_profile_id: string
  last_message_at: string
  created_at: string
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content?: string
  image_url?: string
  is_read: boolean
  created_at: string
}

// --- カリキュラム単元 & スキル評価 ---

export type UnitStatus = 'not_started' | 'in_progress' | 'completed'
export type PhaseStatus = 'not_started' | 'in_progress' | 'completed'
export type TestType = 'school_exam' | 'mock_exam' | 'quiz' | 'entrance_exam' | 'other'
export type ExamCategory = 'recommendation' | 'common_test' | 'general' | 'certification' | 'school_exam'

/** @deprecated Use CurriculumMaterial + CurriculumPhase instead */
export interface CurriculumUnit {
  id: string
  profile_id: string
  subject: string
  unit_name: string
  description?: string
  order_index: number
  status: UnitStatus
  started_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

// --- カリキュラム刷新 (教材→フェーズ 2層構造) ---

export interface CurriculumMaterial {
  id: string
  profile_id: string
  subject: string
  material_name: string
  study_pace?: string
  color?: string
  order_index: number
  notes?: string
  curriculum_year?: string
  created_at: string
  updated_at: string
}

export interface CurriculumPhase {
  id: string
  material_id: string
  phase_name: string
  total_hours?: number
  start_date?: string
  end_date?: string
  is_date_manual: boolean
  status: PhaseStatus
  order_index: number
  goal_id?: string
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface PhaseTask {
  id: string
  phase_id: string
  task_name: string
  is_completed: boolean
  order_index: number
  created_at: string
}

export interface ExamSchedule {
  id: string
  profile_id: string
  exam_name: string
  exam_category: string
  method?: string
  exam_date: string
  preference_order?: number
  border_score?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface LessonLog {
  id: string
  profile_id: string
  booking_id?: string
  report_id?: string
  lesson_date: string
  subject: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface LessonLogPhase {
  id: string
  lesson_log_id: string
  phase_id: string
  progress_notes?: string
  created_at: string
}

export interface TestScore {
  id: string
  profile_id: string
  subject: string
  test_name: string
  test_type: TestType
  score: number
  max_score: number
  percentile?: number
  test_date: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface SkillAssessment {
  id: string
  profile_id: string
  subject: string
  topic: string
  rating: number
  notes?: string
  last_assessed_at: string
  created_at: string
  updated_at: string
}
