-- Exam schedules and test scores

-- Exam schedules (試験スケジュール)
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  exam_name TEXT NOT NULL,
  exam_category TEXT NOT NULL DEFAULT 'school_exam',
  method TEXT,
  exam_date DATE NOT NULL,
  preference_order INTEGER,
  border_score NUMERIC,
  border_score_type TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for exam_schedules
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage exam schedules"
  ON public.exam_schedules FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = exam_schedules.profile_id
        AND sp.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their exam schedules"
  ON public.exam_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      JOIN public.students s ON s.id = sp.student_id
      WHERE sp.id = exam_schedules.profile_id
        AND s.id = auth.uid()
    )
  );

CREATE POLICY "Guardians can view their student exam schedules"
  ON public.exam_schedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      JOIN public.students s ON s.id = sp.student_id
      JOIN public.guardians g ON g.id = s.guardian_id
      WHERE sp.id = exam_schedules.profile_id
        AND g.id = auth.uid()
    )
  );

-- Test scores (テストスコア)
CREATE TABLE IF NOT EXISTS public.test_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  test_name TEXT NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'school_exam',
  score NUMERIC NOT NULL,
  max_score NUMERIC NOT NULL,
  percentile NUMERIC,
  test_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for test_scores
ALTER TABLE public.test_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage test scores"
  ON public.test_scores FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = test_scores.profile_id
        AND sp.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their test scores"
  ON public.test_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      JOIN public.students s ON s.id = sp.student_id
      WHERE sp.id = test_scores.profile_id
        AND s.id = auth.uid()
    )
  );

CREATE POLICY "Guardians can view their student test scores"
  ON public.test_scores FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      JOIN public.students s ON s.id = sp.student_id
      JOIN public.guardians g ON g.id = s.guardian_id
      WHERE sp.id = test_scores.profile_id
        AND g.id = auth.uid()
    )
  );
