-- Supabase Auth トリガー関数
-- 新規ユーザー登録時に users テーブルにデータを自動挿入

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- auth.users に新規ユーザーが作成された時に実行
  INSERT INTO public.users (id, role, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')::user_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  -- ロールに応じて専用テーブルにもデータを挿入
  IF (NEW.raw_user_meta_data->>'role') = 'teacher' THEN
    -- 講師テーブルに基本データを挿入
    INSERT INTO public.teachers (id, handle, subjects, grades, public_profile)
    VALUES (
      NEW.id,
      -- メールアドレスから一意のハンドルを生成
      LOWER(REPLACE(split_part(NEW.email, '@', 1), '.', '-')) || '-' || EXTRACT(epoch FROM NOW())::int,
      ARRAY[]::text[], -- 空の科目配列
      ARRAY[]::text[], -- 空の学年配列
      '{}'::jsonb      -- 空のプロフィール
    );
  ELSIF (NEW.raw_user_meta_data->>'role') = 'guardian' THEN
    -- 保護者テーブルに基本データを挿入
    INSERT INTO public.guardians (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- トリガー作成
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 既存のテストユーザーのためのマニュアル実行用クエリ
-- 必要に応じて実行してください

-- 講師テストアカウントの作成 (teacher@test.com)
-- INSERT INTO public.users (id, role, email, name)
-- SELECT id, 'teacher'::user_role, email, 'テスト講師'
-- FROM auth.users 
-- WHERE email = 'teacher@test.com' 
-- AND id NOT IN (SELECT id FROM public.users);

-- INSERT INTO public.teachers (id, handle, subjects, grades, public_profile, is_onboarding_complete)
-- SELECT u.id, 'test-teacher', ARRAY['数学', '物理'], ARRAY['高1', '高2', '高3'], 
--        jsonb_build_object(
--          'introduction', '数学の楽しさを伝える指導を心がけています。',
--          'experience', '5年',
--          'education', '東京大学理学部数学科卒業',
--          'certification', '数学検定1級'
--        ), true
-- FROM auth.users u
-- WHERE u.email = 'teacher@test.com'
-- AND u.id NOT IN (SELECT id FROM public.teachers);

-- 保護者テストアカウントの作成 (guardian@test.com)
-- INSERT INTO public.users (id, role, email, name)
-- SELECT id, 'guardian'::user_role, email, 'テスト保護者'
-- FROM auth.users 
-- WHERE email = 'guardian@test.com' 
-- AND id NOT IN (SELECT id FROM public.users);

-- INSERT INTO public.guardians (id, phone)
-- SELECT u.id, '090-1234-5678'
-- FROM auth.users u
-- WHERE u.email = 'guardian@test.com'
-- AND u.id NOT IN (SELECT id FROM public.guardians);