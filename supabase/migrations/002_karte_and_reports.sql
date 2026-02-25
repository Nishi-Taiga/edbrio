-- ============================================================
-- 002: 指導カルテ & AI報告書生成
-- ============================================================

-- Student Profiles (講師が所有する生徒プロフィール)
CREATE TABLE IF NOT EXISTS public.student_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  grade TEXT,
  school TEXT,
  birth_date DATE,
  subjects TEXT[] DEFAULT '{}',
  personality_notes TEXT,
  enrollment_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Goals (学習目標)
CREATE TABLE IF NOT EXISTS public.student_goals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  target_date DATE,
  status TEXT DEFAULT 'active',
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Weak Points (つまずきポイント)
CREATE TABLE IF NOT EXISTS public.student_weak_points (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  severity TEXT DEFAULT 'medium',
  notes TEXT,
  status TEXT DEFAULT 'active',
  identified_at DATE DEFAULT CURRENT_DATE,
  resolved_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student Strengths (得意分野)
CREATE TABLE IF NOT EXISTS public.student_strengths (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend reports table
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.student_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS subject TEXT,
  ADD COLUMN IF NOT EXISTS homework TEXT,
  ADD COLUMN IF NOT EXISTS next_plan TEXT,
  ADD COLUMN IF NOT EXISTS student_mood TEXT,
  ADD COLUMN IF NOT EXISTS comprehension_level INTEGER CHECK (comprehension_level >= 1 AND comprehension_level <= 5);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_student_profiles_teacher ON public.student_profiles(teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_profile ON public.student_goals(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_weak_points_profile ON public.student_weak_points(profile_id);
CREATE INDEX IF NOT EXISTS idx_student_strengths_profile ON public.student_strengths(profile_id);
CREATE INDEX IF NOT EXISTS idx_reports_profile ON public.reports(profile_id);
CREATE INDEX IF NOT EXISTS idx_reports_teacher ON public.reports(teacher_id);

-- RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_weak_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_strengths ENABLE ROW LEVEL SECURITY;

-- student_profiles: 講師本人のみ
DROP POLICY IF EXISTS "student_profiles_teacher_only" ON public.student_profiles;
CREATE POLICY "student_profiles_teacher_only" ON public.student_profiles
  FOR ALL USING (auth.uid() = teacher_id);

-- student_goals: profile経由で講師本人のみ
DROP POLICY IF EXISTS "student_goals_teacher_only" ON public.student_goals;
CREATE POLICY "student_goals_teacher_only" ON public.student_goals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles
      WHERE id = profile_id AND teacher_id = auth.uid()
    )
  );

-- student_weak_points: profile経由で講師本人のみ
DROP POLICY IF EXISTS "student_weak_points_teacher_only" ON public.student_weak_points;
CREATE POLICY "student_weak_points_teacher_only" ON public.student_weak_points
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles
      WHERE id = profile_id AND teacher_id = auth.uid()
    )
  );

-- student_strengths: profile経由で講師本人のみ
DROP POLICY IF EXISTS "student_strengths_teacher_only" ON public.student_strengths;
CREATE POLICY "student_strengths_teacher_only" ON public.student_strengths
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles
      WHERE id = profile_id AND teacher_id = auth.uid()
    )
  );
