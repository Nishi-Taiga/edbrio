import type { Shift } from "@/lib/types/database";

const now = new Date();
const tomorrow = new Date(now);
tomorrow.setDate(tomorrow.getDate() + 1);

function makeTime(base: Date, hour: number): string {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const mockShifts: Shift[] = [
  {
    id: "shift-001",
    teacher_id: "teacher-001",
    start_time: makeTime(now, 9),
    end_time: makeTime(now, 17),
    is_published: true,
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "shift-002",
    teacher_id: "teacher-001",
    start_time: makeTime(tomorrow, 10),
    end_time: makeTime(tomorrow, 18),
    is_published: true,
    created_at: "2026-03-01T00:00:00Z",
  },
];

export function useShifts() {
  return {
    shifts: mockShifts,
    loading: false,
    error: null,
    createShift: async () => {},
    updateShift: async () => {},
    deleteShift: async () => {},
    refresh: async () => {},
  };
}
