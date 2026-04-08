import type { TestScore } from "@/lib/types/database";

const mockTestScores: TestScore[] = [
  {
    id: "score-001",
    profile_id: "profile-001",
    subject: "数学",
    test_name: "3学期期末テスト",
    test_type: "school_exam",
    score: 78,
    max_score: 100,
    test_date: "2026-03-10",
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
  },
  {
    id: "score-002",
    profile_id: "profile-001",
    subject: "英語",
    test_name: "3学期期末テスト",
    test_type: "school_exam",
    score: 85,
    max_score: 100,
    test_date: "2026-03-10",
    created_at: "2026-03-10T00:00:00Z",
    updated_at: "2026-03-10T00:00:00Z",
  },
];

export function useTestScores() {
  return {
    testScores: mockTestScores,
    loading: false,
    error: null,
    createTestScore: async () => {},
    updateTestScore: async () => {},
    deleteTestScore: async () => {},
    refresh: async () => {},
  };
}
