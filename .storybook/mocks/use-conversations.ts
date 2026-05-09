import type { Conversation } from "@/lib/types/database";

const mockConversations: Conversation[] = [
  {
    id: "conv-001",
    teacher_id: "teacher-001",
    guardian_id: "guardian-001",
    student_profile_id: "profile-001",
    last_message_at: new Date().toISOString(),
    created_at: "2026-01-01T00:00:00Z",
  },
];

export function useConversations() {
  return {
    conversations: mockConversations,
    loading: false,
    error: null,
    refresh: async () => {},
  };
}
