-- ============================================================
-- 007: カリキュラム単元管理 & スキル評価統合
-- ============================================================

-- Curriculum Units (カリキュラム単元)
CREATE TABLE IF NOT EXISTS public.curriculum_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  unit_name TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  status TEXT DEFAULT 'not_started',
  started_at DATE,
  completed_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_curriculum_units_profile ON public.curriculum_units(profile_id);

ALTER TABLE public.curriculum_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "curriculum_units_teacher_only" ON public.curriculum_units;
CREATE POLICY "curriculum_units_teacher_only" ON public.curriculum_units
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles
      WHERE id = profile_id AND teacher_id = auth.uid()
    )
  );

-- Skill Assessments (スキル評価 — つまずき・得意を統合)
CREATE TABLE IF NOT EXISTS public.skill_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  rating INTEGER DEFAULT 3 CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  last_assessed_at DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_skill_assessments_profile ON public.skill_assessments(profile_id);

ALTER TABLE public.skill_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "skill_assessments_teacher_only" ON public.skill_assessments;
CREATE POLICY "skill_assessments_teacher_only" ON public.skill_assessments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles
      WHERE id = profile_id AND teacher_id = auth.uid()
    )
  );
