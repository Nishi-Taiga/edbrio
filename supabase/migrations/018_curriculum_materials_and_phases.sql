-- Curriculum materials and phases (2-layer structure)

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phase_status') THEN
    CREATE TYPE phase_status AS ENUM ('not_started', 'in_progress', 'completed');
  END IF;
END $$;

-- Curriculum materials (per subject)
CREATE TABLE IF NOT EXISTS public.curriculum_materials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  material_name TEXT NOT NULL,
  study_pace TEXT,
  color TEXT,
  order_index INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Curriculum phases (stages within a material)
CREATE TABLE IF NOT EXISTS public.curriculum_phases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.curriculum_materials(id) ON DELETE CASCADE NOT NULL,
  phase_name TEXT NOT NULL,
  total_hours NUMERIC,
  start_date DATE,
  end_date DATE,
  is_date_manual BOOLEAN DEFAULT FALSE,
  status phase_status DEFAULT 'not_started',
  order_index INTEGER DEFAULT 0,
  goal_id UUID,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for curriculum_materials
ALTER TABLE public.curriculum_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their curriculum materials"
  ON public.curriculum_materials FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = curriculum_materials.profile_id
        AND sp.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their curriculum materials"
  ON public.curriculum_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      JOIN public.students s ON s.id = sp.student_id
      WHERE sp.id = curriculum_materials.profile_id
        AND s.id = auth.uid()
    )
  );

CREATE POLICY "Guardians can view their student curriculum materials"
  ON public.curriculum_materials FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      JOIN public.students s ON s.id = sp.student_id
      JOIN public.guardians g ON g.id = s.guardian_id
      WHERE sp.id = curriculum_materials.profile_id
        AND g.id = auth.uid()
    )
  );

-- RLS for curriculum_phases
ALTER TABLE public.curriculum_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage their curriculum phases"
  ON public.curriculum_phases FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum_materials cm
      JOIN public.student_profiles sp ON sp.id = cm.profile_id
      WHERE cm.id = curriculum_phases.material_id
        AND sp.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their curriculum phases"
  ON public.curriculum_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum_materials cm
      JOIN public.student_profiles sp ON sp.id = cm.profile_id
      JOIN public.students s ON s.id = sp.student_id
      WHERE cm.id = curriculum_phases.material_id
        AND s.id = auth.uid()
    )
  );

CREATE POLICY "Guardians can view their student curriculum phases"
  ON public.curriculum_phases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum_materials cm
      JOIN public.student_profiles sp ON sp.id = cm.profile_id
      JOIN public.students s ON s.id = sp.student_id
      JOIN public.guardians g ON g.id = s.guardian_id
      WHERE cm.id = curriculum_phases.material_id
        AND g.id = auth.uid()
    )
  );
