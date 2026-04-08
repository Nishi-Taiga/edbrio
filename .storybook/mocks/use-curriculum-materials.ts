import type { CurriculumMaterial, CurriculumPhase } from "@/lib/types/database";

const mockMaterials: CurriculumMaterial[] = [
  {
    id: "mat-001",
    profile_id: "profile-001",
    subject: "数学",
    material_name: "新中学問題集 数学2年",
    study_pace: "週2回",
    color: "#3B82F6",
    order_index: 0,
    curriculum_year: "2026",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "mat-002",
    profile_id: "profile-001",
    subject: "英語",
    material_name: "NEW HORIZON 2",
    color: "#10B981",
    order_index: 1,
    curriculum_year: "2026",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
];

const mockPhases: CurriculumPhase[] = [
  {
    id: "phase-001",
    material_id: "mat-001",
    phase_name: "第1章 式の計算",
    total_hours: 8,
    start_date: "2026-04-01",
    end_date: "2026-05-15",
    is_date_manual: false,
    status: "in_progress",
    order_index: 0,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "phase-002",
    material_id: "mat-001",
    phase_name: "第2章 連立方程式",
    total_hours: 10,
    start_date: "2026-05-16",
    end_date: "2026-07-01",
    is_date_manual: false,
    status: "not_started",
    order_index: 1,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-01T00:00:00Z",
  },
  {
    id: "phase-003",
    material_id: "mat-002",
    phase_name: "Unit 1 - My Spring Vacation",
    total_hours: 6,
    start_date: "2026-04-01",
    end_date: "2026-04-30",
    is_date_manual: false,
    status: "completed",
    order_index: 0,
    completed_at: "2026-04-25T00:00:00Z",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-04-25T00:00:00Z",
  },
];

export function useCurriculumMaterials() {
  return {
    materials: mockMaterials,
    phases: mockPhases,
    loading: false,
    error: null,
    createMaterial: async () => {},
    updateMaterial: async () => {},
    deleteMaterial: async () => {},
    createPhase: async () => {},
    updatePhase: async () => {},
    deletePhase: async () => {},
    reorderMaterials: async () => {},
    reorderPhases: async () => {},
    refresh: async () => {},
  };
}
