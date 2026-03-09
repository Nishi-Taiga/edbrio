-- =============================================================
-- 019: Supabase Linter セキュリティ警告の修正
-- =============================================================
-- 修正対象:
--   1. function_search_path_mutable: handle_new_user
--   2. function_search_path_mutable: update_conversation_last_message
--   3. extension_in_public: btree_gist → extensions スキーマへ移動
-- =============================================================

-- ---------------------------------------------------------
-- 1. handle_new_user: search_path を固定
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')::public.user_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  IF (NEW.raw_user_meta_data->>'role') = 'teacher' THEN
    INSERT INTO public.teachers (id, subjects, grades, public_profile)
    VALUES (
      NEW.id,
      ARRAY[]::text[],
      ARRAY[]::text[],
      '{}'::jsonb
    );
  ELSIF (NEW.raw_user_meta_data->>'role') = 'guardian' THEN
    INSERT INTO public.guardians (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- ---------------------------------------------------------
-- 2. update_conversation_last_message: search_path を固定
-- ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

-- ---------------------------------------------------------
-- 3. btree_gist を extensions スキーマに移動
--    依存する制約を一旦削除→拡張移動→制約再作成
-- ---------------------------------------------------------
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_teacher_id_tstzrange_excl;

CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS btree_gist;
CREATE EXTENSION btree_gist SCHEMA extensions;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_teacher_id_tstzrange_excl
  EXCLUDE USING gist (teacher_id WITH =, tstzrange(start_time, end_time) WITH &&);
