-- Phase tasks (checklist items within a curriculum phase)
CREATE TABLE IF NOT EXISTS public.phase_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phase_id UUID REFERENCES public.curriculum_phases(id) ON DELETE CASCADE NOT NULL,
  task_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for phase_tasks
ALTER TABLE public.phase_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can manage phase tasks"
  ON public.phase_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.curriculum_phases cp
      JOIN public.curriculum_materials cm ON cm.id = cp.material_id
      JOIN public.student_profiles sp ON sp.id = cm.profile_id
      WHERE cp.id = phase_tasks.phase_id
        AND sp.teacher_id = auth.uid()
    )
  );

-- Subject color customization on student profiles
ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS subject_colors JSONB DEFAULT '{}';

-- Curriculum year on materials (for year-based filtering)
ALTER TABLE public.curriculum_materials
  ADD COLUMN IF NOT EXISTS curriculum_year TEXT;
