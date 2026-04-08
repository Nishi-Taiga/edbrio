import type {
  User,
  Booking,
  Report,
  TicketBalance,
  BookingReport,
} from "@/lib/types/database";

// ── Users ──

export const mockTeacherUser: User = {
  id: "teacher-001",
  role: "teacher",
  email: "tanaka@example.com",
  name: "田中 花子",
  display_name: "田中先生",
  avatar_url: undefined,
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

export const mockGuardianUser: User = {
  id: "guardian-001",
  role: "guardian",
  email: "suzuki@example.com",
  name: "鈴木 太郎",
  created_at: "2025-06-01T00:00:00Z",
  updated_at: "2026-04-01T00:00:00Z",
};

// ── Bookings ──

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);
const dayAfter = new Date(now);
dayAfter.setDate(dayAfter.getDate() + 2);
const yesterday = new Date(now);
yesterday.setDate(yesterday.getDate() - 1);
const lastWeek = new Date(now);
lastWeek.setDate(lastWeek.getDate() - 7);

function makeTime(base: Date, hour: number, minute = 0): string {
  const d = new Date(base);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const mockBookings: Booking[] = [
  {
    id: "booking-001",
    teacher_id: "teacher-001",
    student_id: "student-001",
    start_time: makeTime(now, 15),
    end_time: makeTime(now, 16),
    status: "confirmed",
    ticket_balance_id: "tb-001",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "booking-002",
    teacher_id: "teacher-001",
    student_id: "student-002",
    start_time: makeTime(tomorrow, 10),
    end_time: makeTime(tomorrow, 11),
    status: "pending",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "booking-003",
    teacher_id: "teacher-001",
    student_id: "student-001",
    start_time: makeTime(dayAfter, 14),
    end_time: makeTime(dayAfter, 15),
    status: "confirmed",
    ticket_balance_id: "tb-001",
    created_at: "2026-04-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "booking-004",
    teacher_id: "teacher-001",
    student_id: "student-003",
    start_time: makeTime(yesterday, 16),
    end_time: makeTime(yesterday, 17),
    status: "done",
    ticket_balance_id: "tb-002",
    created_at: "2026-03-30T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "booking-005",
    teacher_id: "teacher-001",
    student_id: "student-002",
    start_time: makeTime(lastWeek, 10),
    end_time: makeTime(lastWeek, 11),
    status: "done",
    ticket_balance_id: "tb-003",
    created_at: "2026-03-25T00:00:00Z",
    updated_at: "2026-03-25T00:00:00Z",
  },
];

// ── Reports ──

export const mockReports: Report[] = [
  {
    id: "report-001",
    booking_id: "booking-004",
    teacher_id: "teacher-001",
    profile_id: "profile-003",
    subject: "数学",
    content_raw:
      "二次方程式の基礎を学習。概ね理解できているが、応用問題で少しつまずく場面あり。",
    content_public:
      "今日は二次方程式の基礎を学びました。基本的な解法はしっかり理解できています。次回は応用問題にチャレンジします。",
    ai_summary: "二次方程式の基礎理解良好。応用は次回。",
    visibility: "public",
    published_at: yesterday.toISOString(),
    student_mood: "good",
    comprehension_level: 4,
    created_at: yesterday.toISOString(),
    updated_at: yesterday.toISOString(),
  },
  {
    id: "report-002",
    booking_id: "booking-005",
    teacher_id: "teacher-001",
    profile_id: "profile-002",
    subject: "英語",
    content_raw:
      "関係代名詞の使い方を復習。前回よりスムーズに解けるようになった。",
    content_public:
      "関係代名詞の復習をしました。前回と比べてとてもスムーズに解けるようになっています。着実に力がついています。",
    visibility: "public",
    published_at: lastWeek.toISOString(),
    student_mood: "good",
    comprehension_level: 5,
    created_at: lastWeek.toISOString(),
    updated_at: lastWeek.toISOString(),
  },
  {
    id: "report-003",
    booking_id: null,
    teacher_id: "teacher-001",
    profile_id: "profile-001",
    subject: "国語",
    content_raw: "古文の助動詞。まだ暗記が不十分。",
    visibility: "draft",
    student_mood: "tired",
    comprehension_level: 2,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  },
];

// ── Ticket Balances ──

const expiresDate = new Date(now);
expiresDate.setMonth(expiresDate.getMonth() + 2);

export const mockTicketBalances: TicketBalance[] = [
  {
    id: "tb-001",
    student_id: "student-001",
    ticket_id: "ticket-001",
    remaining_minutes: 300,
    purchased_at: "2026-03-01T00:00:00Z",
    expires_at: expiresDate.toISOString(),
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "tb-002",
    student_id: "student-003",
    ticket_id: "ticket-001",
    remaining_minutes: 120,
    purchased_at: "2026-03-15T00:00:00Z",
    expires_at: expiresDate.toISOString(),
    created_at: "2026-03-15T00:00:00Z",
  },
];

// ── Booking Reports ──

export const mockBookingReports: BookingReport[] = [];

// ── Student Names Map ──

export const mockStudentNames: Record<string, string> = {
  "student-001": "佐藤 一郎",
  "student-002": "山田 美咲",
  "student-003": "高橋 健太",
};

export const mockStudentSubjects: Record<string, string> = {
  "student-001": "数学",
  "student-002": "英語",
  "student-003": "国語",
};

export const mockProfileNames: Record<string, string> = {
  "profile-001": "佐藤 一郎",
  "profile-002": "山田 美咲",
  "profile-003": "高橋 健太",
};

export const mockTeacherNames: Record<string, string> = {
  "teacher-001": "田中 花子",
};
