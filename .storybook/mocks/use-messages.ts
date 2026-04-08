import type { Message } from "@/lib/types/database";

const mockMessages: Message[] = [
  {
    id: "msg-001",
    conversation_id: "conv-001",
    sender_id: "guardian-001",
    content: "来週の月曜日のレッスンですが、16時からに変更可能でしょうか？",
    is_read: true,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "msg-002",
    conversation_id: "conv-001",
    sender_id: "teacher-001",
    content: "はい、16時からで大丈夫です。変更しておきますね。",
    is_read: true,
    created_at: new Date(Date.now() - 1800000).toISOString(),
  },
];

export function useMessages() {
  return {
    messages: mockMessages,
    loading: false,
    error: null,
    sendMessage: async () => {},
    refresh: async () => {},
  };
}
