-- ============================================================
-- 012: チャット機能（先生 ↔ 保護者）
-- ============================================================

-- ── conversations テーブル ──
CREATE TABLE public.conversations (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id  UUID        NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  guardian_id UUID        NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  student_profile_id UUID NOT NULL REFERENCES public.student_profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, guardian_id, student_profile_id)
);

-- ── messages テーブル ──
CREATE TABLE public.messages (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content         TEXT,
  image_url       TEXT,
  is_read         BOOLEAN     DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── インデックス ──
CREATE INDEX idx_conversations_teacher  ON public.conversations(teacher_id);
CREATE INDEX idx_conversations_guardian  ON public.conversations(guardian_id);
CREATE INDEX idx_messages_conversation   ON public.messages(conversation_id, created_at);
CREATE INDEX idx_messages_unread         ON public.messages(conversation_id, is_read) WHERE NOT is_read;

-- ── RLS: conversations ──
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_select"
  ON public.conversations FOR SELECT
  USING (auth.uid() = teacher_id OR auth.uid() = guardian_id);

CREATE POLICY "conversations_insert"
  ON public.conversations FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

-- ── RLS: messages ──
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select"
  ON public.messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE teacher_id = auth.uid() OR guardian_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert"
  ON public.messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND conversation_id IN (
      SELECT id FROM public.conversations
      WHERE teacher_id = auth.uid() OR guardian_id = auth.uid()
    )
  );

CREATE POLICY "messages_update"
  ON public.messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE teacher_id = auth.uid() OR guardian_id = auth.uid()
    )
  )
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.conversations
      WHERE teacher_id = auth.uid() OR guardian_id = auth.uid()
    )
  );

-- ── トリガー: last_message_at 自動更新 ──
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_conversation_last_message();

-- ── Supabase Realtime ──
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- ── Storage: chat-images バケット ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false,
  5242880,  -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Storage RLS: 会話参加者のみアップロード可能
CREATE POLICY "chat_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM public.conversations
      WHERE teacher_id = auth.uid() OR guardian_id = auth.uid()
    )
  );

-- Storage RLS: 会話参加者のみ閲覧可能
CREATE POLICY "chat_images_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-images'
    AND (storage.foldername(name))[1]::uuid IN (
      SELECT id FROM public.conversations
      WHERE teacher_id = auth.uid() OR guardian_id = auth.uid()
    )
  );
