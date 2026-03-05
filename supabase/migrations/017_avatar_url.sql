-- ============================================================
-- 017: アバター画像機能
-- ============================================================

-- ── avatar_url カラムを users テーブルに追加 ──
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- ── Storage: avatars バケット ──
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152,  -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage RLS: 認証ユーザーは自分のフォルダにのみアップロード可能
CREATE POLICY "avatars_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: 認証ユーザーは自分のファイルを更新可能
CREATE POLICY "avatars_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: 認証ユーザーは自分のファイルを削除可能
CREATE POLICY "avatars_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage RLS: 公開バケットなので SELECT は誰でも可能
CREATE POLICY "avatars_select"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
