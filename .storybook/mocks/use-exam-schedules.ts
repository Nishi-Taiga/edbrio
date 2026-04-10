import type { ExamSchedule } from "@/lib/types/database";

const mockExamSchedules: ExamSchedule[] = [
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
