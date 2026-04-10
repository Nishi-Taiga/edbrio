/**
 * Mock Supabase client for Storybook.
 * Intercepts common query patterns and returns fixture data.
 */
import { mockStudentNames, mockProfileNames, mockReports } from "./fixtures";

type QueryResult = { data: unknown; error: null; count?: number };

// Build student_profiles rows from our name map
const studentProfileRows = Object.entries(mockStudentNames).map(
  ([student_id, name]) => ({
    student_id,
    id:
      student_id === "student-001"
        ? "profile-001"
        : student_id === "student-002"
          ? "profile-002"
          : "profile-003",
    name,
    subjects: [
      student_id === "student-001"
        ? "数学"
        : student_id === "student-002"
          ? "英語"
          : "国語",
    ],
  }),
);

const profileRows = Object.entries(mockProfileNames).map(([id, name]) => ({
  id,
  name,
}));

// Full student profile for single() queries
const fullStudentProfile = {
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
};

const teacherRow = {
  subjects: ["数学", "英語", "国語"],
  grades: ["中学1年", "中学2年", "中学3年"],
  public_profile: { display_name: "田中先生" },
  plan: "standard",
  is_onboarding_complete: true,
};

const userRows = [
  { id: "teacher-001", name: "田中 花子" },
  { id: "guardian-001", name: "鈴木 太郎" },
];

function createMockQueryBuilder(table: string): unknown {
  let _selectFields = "*";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const builder: any = {
    select: (fields?: string, opts?: { count?: string; head?: boolean }) => {
      _selectFields = fields || "*";
      if (opts?.head) {
        // count-only queries
        return {
          eq: () => Promise.resolve({ data: null, error: null, count: 2 }),
          in: () => Promise.resolve({ data: null, error: null, count: 2 }),
        };
      }
      return builder;
    },
    eq: () => builder,
    neq: () => builder,
    in: () => builder,
    is: () => builder,
    gte: () => builder,
    lte: () => builder,
    order: () => builder,
    limit: () => builder,
    single: () => {
      if (table === "teachers") {
        return Promise.resolve({ data: teacherRow, error: null });
      }
      if (table === "student_profiles") {
        return Promise.resolve({ data: fullStudentProfile, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    maybeSingle: () => {
      if (table === "teachers") {
        return Promise.resolve({ data: teacherRow, error: null });
      }
      if (table === "student_profiles") {
        return Promise.resolve({ data: fullStudentProfile, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    },
    then: (resolve: (result: QueryResult) => void) => {
      let data: unknown[] = [];

      if (table === "student_profiles") {
        data = _selectFields.includes("student_id")
          ? studentProfileRows
          : profileRows;
      } else if (table === "users") {
        data = userRows;
      } else if (table === "reports") {
        data = mockReports;
      } else if (table === "bookings") {
        data = [{ id: "booking-004" }, { id: "booking-005" }];
      } else if (table === "ticket_balances") {
        data = [
          {
            id: "tb-001",
            tickets: { price_cents: 5000, bundle_qty: 1 },
          },
        ];
      } else if (table === "shifts") {
        data = [{ id: "shift-001" }];
      } else if (table === "invites") {
        data = [{ id: "invite-001" }];
      }

      resolve({ data, error: null });
    },
  };

  return builder;
}

const mockAuth = {
  getSession: () =>
    Promise.resolve({
      data: {
        session: {
          user: { id: "teacher-001", email: "tanaka@example.com" },
        },
      },
      error: null,
    }),
  onAuthStateChange: () => ({
    data: { subscription: { unsubscribe: () => {} } },
  }),
  signOut: () => Promise.resolve({ error: null }),
};

export function createClient() {
  return {
    auth: mockAuth,
    from: (table: string) => createMockQueryBuilder(table),
  } as unknown as ReturnType<
    typeof import("@/lib/supabase/client").createClient
  >;
}
