import type { ExamSchedule } from "@/lib/types/database";

const mockExamSchedules: ExamSchedule[] = [
  // 定期テスト（school_exam）
  {
    id: "exam-001",
    profile_id: "profile-001",
    exam_name: "1学期中間テスト",
    exam_category: "school_exam",
    exam_date: "2026-05-20",
    notes: "数学・英語",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exam-002",
    profile_id: "profile-001",
    exam_name: "1学期期末テスト",
    exam_category: "school_exam",
    exam_date: "2026-07-05",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exam-003",
    profile_id: "profile-001",
    exam_name: "2学期中間テスト",
    exam_category: "school_exam",
    exam_date: "2026-10-15",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exam-004",
    profile_id: "profile-001",
    exam_name: "2学期期末テスト",
    exam_category: "school_exam",
    exam_date: "2026-12-10",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  // 入試（recommendation / general）
  {
    id: "exam-010",
    profile_id: "profile-001",
    exam_name: "○○高校",
    exam_category: "recommendation",
    method: "推薦",
    exam_date: "2027-01-20",
    preference_order: 1,
    border_score: 58,
    border_score_type: "deviation",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exam-011",
    profile_id: "profile-001",
    exam_name: "△△高校",
    exam_category: "general",
    method: "一般",
    exam_date: "2027-02-15",
    preference_order: 2,
    border_score: 55,
    border_score_type: "deviation",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "exam-012",
    profile_id: "profile-001",
    exam_name: "□□高校",
    exam_category: "general",
    method: "一般",
    exam_date: "2027-03-05",
    preference_order: 3,
    border_score: 50,
    border_score_type: "deviation",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
  },
];

export function useExamSchedules() {
  return {
    exams: mockExamSchedules,
    loading: false,
    error: null,
    addExam: async () => {},
    updateExam: async () => {},
    deleteExam: async () => {},
    refresh: async () => {},
  };
}
