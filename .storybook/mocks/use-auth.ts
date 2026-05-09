/**
 * Mock useAuth hook for Storybook.
 * Returns a static logged-in user based on the configured role.
 */
import { mockTeacherUser, mockGuardianUser } from "./fixtures";

// Global config - can be changed per-story via setMockRole()
let currentRole: "teacher" | "guardian" = "teacher";

export function setMockRole(role: "teacher" | "guardian") {
  currentRole = role;
}

export function useAuth() {
  const dbUser = currentRole === "teacher" ? mockTeacherUser : mockGuardianUser;

  return {
    user: {
      id: dbUser.id,
      email: dbUser.email,
    } as import("@supabase/supabase-js").User,
    dbUser,
    loading: false,
    signOut: async () => {},
    refreshDbUser: async () => {},
    isTeacher: currentRole === "teacher",
    isGuardian: currentRole === "guardian",
    isStudent: false,
  };
}
