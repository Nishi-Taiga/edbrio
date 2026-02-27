-- テスト用アカウント作成用SQLスクリプト
-- 注意: これらのクエリは、Supabase Auth で実際にサインアップした後に実行してください

-- 1. 講師テストアカウント用のデータ
-- メール: teacher@test.com でサインアップ後、以下を実行

-- 講師プロフィール作成
INSERT INTO public.teachers (id, subjects, grades, public_profile, is_onboarding_complete)
VALUES (
  'TEACHER_USER_ID_HERE', -- サインアップ後に実際のUUIDに置換
  ARRAY['数学', '物理'],
  ARRAY['高1', '高2', '高3'],
  jsonb_build_object(
    'introduction', '数学の楽しさを伝える指導を心がけています。基礎から応用まで、生徒さんのペースに合わせた丁寧な指導を行います。',
    'experience', '5年',
    'education', '東京大学理学部数学科卒業',
    'certification', '数学検定1級、高校数学教員免許'
  ),
  true
);

-- テスト用チケット作成
INSERT INTO public.tickets (teacher_id, name, minutes, bundle_qty, price_cents, valid_days, is_active)
VALUES 
  ('TEACHER_USER_ID_HERE', '数学 単発授業', 60, 1, 500000, 30, true),
  ('TEACHER_USER_ID_HERE', '数学 5回パック', 60, 5, 2250000, 90, true),
  ('TEACHER_USER_ID_HERE', '物理 単発授業', 60, 1, 520000, 30, true);

-- テスト用空き時間スロット作成
INSERT INTO public.availability (teacher_id, slot_start, slot_end, source, is_bookable)
VALUES 
  ('TEACHER_USER_ID_HERE', '2024-09-12 14:00:00+09', '2024-09-12 15:00:00+09', 'manual', true),
  ('TEACHER_USER_ID_HERE', '2024-09-12 16:00:00+09', '2024-09-12 17:00:00+09', 'manual', true),
  ('TEACHER_USER_ID_HERE', '2024-09-13 10:00:00+09', '2024-09-13 11:00:00+09', 'manual', true),
  ('TEACHER_USER_ID_HERE', '2024-09-14 15:00:00+09', '2024-09-14 16:30:00+09', 'manual', true);

-- 2. 保護者テストアカウント用のデータ
-- メール: guardian@test.com でサインアップ後、以下を実行

-- 保護者プロフィール作成
INSERT INTO public.guardians (id, phone)
VALUES (
  'GUARDIAN_USER_ID_HERE', -- サインアップ後に実際のUUIDに置換
  '090-1234-5678'
);

-- テスト用生徒作成
INSERT INTO public.students (id, guardian_id, grade, notes)
VALUES (
  uuid_generate_v4(),
  'GUARDIAN_USER_ID_HERE',
  '高校2年',
  '数学が苦手で、基礎から学び直したいです。'
);

-- 講師と生徒の関係作成（実際の予約後に自動作成されますが、テスト用に手動作成）
INSERT INTO public.teacher_students (teacher_id, student_id, status)
VALUES (
  'TEACHER_USER_ID_HERE',
  (SELECT id FROM public.students WHERE guardian_id = 'GUARDIAN_USER_ID_HERE' LIMIT 1),
  'active'
);

-- テスト用チケット残高作成（実際の購入後に自動作成されますが、テスト用に手動作成）
INSERT INTO public.ticket_balances (
  student_id, 
  ticket_id, 
  remaining_minutes, 
  purchased_at, 
  expires_at
)
VALUES (
  (SELECT id FROM public.students WHERE guardian_id = 'GUARDIAN_USER_ID_HERE' LIMIT 1),
  (SELECT id FROM public.tickets WHERE teacher_id = 'TEACHER_USER_ID_HERE' AND name = '数学 5回パック' LIMIT 1),
  240, -- 4時間分残り
  NOW(),
  NOW() + INTERVAL '90 days'
);

-- テスト用過去の予約・レポート作成
INSERT INTO public.bookings (
  teacher_id,
  student_id,
  start_time,
  end_time,
  status,
  notes
)
VALUES (
  'TEACHER_USER_ID_HERE',
  (SELECT id FROM public.students WHERE guardian_id = 'GUARDIAN_USER_ID_HERE' LIMIT 1),
  '2024-09-10 14:00:00+09',
  '2024-09-10 15:00:00+09',
  'done',
  '二次関数の学習'
);

-- テスト用レポート作成
INSERT INTO public.reports (
  booking_id,
  content_raw,
  content_public,
  visibility,
  published_at
)
VALUES (
  (SELECT id FROM public.bookings WHERE teacher_id = 'TEACHER_USER_ID_HERE' AND status = 'done' LIMIT 1),
  '今日は二次関数の応用問題を中心に学習しました。グラフの性質について理解が深まったようです。次回は判別式について学習予定です。',
  '二次関数の応用問題に取り組み、グラフの性質について学習しました。理解度も高く、順調に進んでいます。',
  'public',
  NOW()
);

-- 実行手順:
-- 1. teacher@test.com でサインアップ
-- 2. guardian@test.com でサインアップ
-- 3. 上記SQLの 'TEACHER_USER_ID_HERE' と 'GUARDIAN_USER_ID_HERE' を実際のUUIDに置換
-- 4. Supabase Studio で実行