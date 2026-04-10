import type { StudentProfile } from "@/lib/types/database";

const mockProfiles: StudentProfile[] = [
  {
    id: "profile-001",
    teacher_id: "teacher-001",
    student_id: "student-001",
    guardian_id: "guardian-001",
    name: "佐藤 一郎",
    grade: "中学2年",
    school: "第一中学校",
    subjects: ["数学", "英語"],
    personality_notes: "真面目で集中力が高い",
    enrollment_date: "2025-09-01",
    status: "active",
    curriculum_year: "2026",
    curriculum_title: "中学2年カリキュラム",
    subject_colors: { 数学: "#3B82F6", 英語: "#10B981" },
    created_at: "2025-09-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "profile-002",
    teacher_id: "teacher-001",
    student_id: "student-002",
    guardian_id: "guardian-002",
    name: "山田 美咲",
    grade: "中学3年",
    school: "第二中学校",
    subjects: ["英語", "国語"],
    status: "active",
    curriculum_year: "2026",
    subject_colors: { 英語: "#10B981", 国語: "#F59E0B" },
    created_at: "2025-10-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "profile-003",
    teacher_id: "teacher-001",
    student_id: "student-003",
    name: "高橋 健太",
    grade: "中学1年",
    subjects: ["国語", "数学"],
    status: "active",
    curriculum_year: "2026",
    subject_colors: { 国語: "#F59E0B", 数学: "#3B82F6" },
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
];

export function useStudentProfiles() {
  return {
    profiles: mockProfiles,
    loading: false,
    error: null,
    refresh: async () => {},
    createProfile: async () => {},
    updateProfile: async () => {},
    deleteProfile: async () => {},
  };
}
