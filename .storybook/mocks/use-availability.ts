import type { Availability } from "@/lib/types/database";

const now = new Date();

function makeTime(base: Date, hour: number): string {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const mockAvailability: Availability[] = [
  {
    id: "avail-001",
    teacher_id: "teacher-001",
    slot_start: makeTime(now, 9),
    slot_end: makeTime(now, 10),
    is_bookable: true,
    created_at: "2026-03-01T00:00:00Z",
  },
  {
    id: "avail-002",
    teacher_id: "teacher-001",
    slot_start: makeTime(now, 14),
    slot_end: makeTime(now, 15),
    is_bookable: true,
    created_at: "2026-03-01T00:00:00Z",
  },
];

export function useAvailability() {
  return {
    availability: mockAvailability,
    loading: false,
    error: null,
    refresh: async () => {},
  };
}
