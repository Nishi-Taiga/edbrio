-- ============================================================
-- 008: 保護者招待フロー
-- ============================================================

-- invites テーブル拡張
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS student_profile_id UUID REFERENCES public.student_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_invites_token ON public.invites(token);
CREATE INDEX IF NOT EXISTS idx_invites_email ON public.invites(email);

-- student_profiles に guardian_id 追加（students テーブルの auth.users 制約を回避）
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS guardian_id UUID REFERENCES public.guardians(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_student_profiles_guardian ON public.student_profiles(guardian_id);

-- RLS: invites - 講師が自分の招待を管理可能
DROP POLICY IF EXISTS "invites_teacher_manage" ON public.invites;
CREATE POLICY "invites_teacher_manage" ON public.invites
  FOR ALL USING (auth.uid() = teacher_id);

-- RLS: student_profiles - 既存ポリシーを再作成し、guardian の SELECT を追加
DROP POLICY IF EXISTS "student_profiles_teacher_only" ON public.student_profiles;
CREATE POLICY "student_profiles_teacher_full" ON public.student_profiles
  FOR ALL USING (auth.uid() = teacher_id);

DROP POLICY IF EXISTS "student_profiles_guardian_read" ON public.student_profiles;
CREATE POLICY "student_profiles_guardian_read" ON public.student_profiles
  FOR SELECT USING (auth.uid() = guardian_id);

-- RLS: reports - Path 3 に student_profiles.guardian_id 経由のアクセスを追加
DROP POLICY IF EXISTS "reports_visibility" ON public.reports;
CREATE POLICY "reports_visibility" ON public.reports
  FOR ALL USING (
    -- Path 1: 直接作成した講師
    auth.uid() = teacher_id
    OR
    -- Path 2: booking経由（レガシー）
    (
      booking_id IS NOT NULL AND (
        auth.uid() IN (SELECT teacher_id FROM public.bookings WHERE id = booking_id)
        OR auth.uid() IN (SELECT student_id FROM public.bookings WHERE id = booking_id)
        OR auth.uid() IN (
          SELECT s.guardian_id
          FROM public.bookings b
          JOIN public.students s ON b.student_id = s.id
          WHERE b.id = booking_id
        )
      )
    )
    OR
    -- Path 3: profile_id経由（booking不要レポート対応）
    (
      profile_id IS NOT NULL AND (
        auth.uid() IN (
          SELECT sp.teacher_id FROM public.student_profiles sp WHERE sp.id = profile_id
        )
        OR auth.uid() IN (
          SELECT s.guardian_id
          FROM public.student_profiles sp
          JOIN public.students s ON sp.student_id = s.id
          WHERE sp.id = profile_id
        )
        OR auth.uid() IN (
          SELECT sp.guardian_id FROM public.student_profiles sp WHERE sp.id = profile_id
        )
      )
    )
  );
