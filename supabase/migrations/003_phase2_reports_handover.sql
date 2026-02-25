-- ============================================================
-- 003: Phase 2 - booking不要レポート & 引継ぎメモ
-- ============================================================

-- booking_id NOT NULL制約解除（家庭教師の予約なしレポート対応）
ALTER TABLE public.reports ALTER COLUMN booking_id DROP NOT NULL;

-- student_profilesのstudent_id検索用インデックス追加（保護者アクセスパス）
CREATE INDEX IF NOT EXISTS idx_student_profiles_student ON public.student_profiles(student_id);

-- 引継ぎメモテーブル
CREATE TABLE IF NOT EXISTS public.handover_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  from_teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  to_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_handover_notes_profile ON public.handover_notes(profile_id);

-- RLS: handover_notes（作成者・宛先・プロフィール所有者のみ）
ALTER TABLE public.handover_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "handover_notes_teacher_access" ON public.handover_notes;
CREATE POLICY "handover_notes_teacher_access" ON public.handover_notes
  FOR ALL USING (
    auth.uid() = from_teacher_id
    OR auth.uid() = to_teacher_id
    OR EXISTS (
      SELECT 1 FROM public.student_profiles
      WHERE id = profile_id AND teacher_id = auth.uid()
    )
  );

-- RLS更新: reports
-- 既存のbooking経由アクセスに加えて、profile_id経由の保護者アクセスを追加
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
      )
    )
  );
