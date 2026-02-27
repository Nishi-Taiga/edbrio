-- Add missing RLS policy for shifts table
-- Teachers can manage their own shifts
DROP POLICY IF EXISTS "shifts_teacher_manage" ON public.shifts;
CREATE POLICY "shifts_teacher_manage" ON public.shifts
  FOR ALL USING (auth.uid() = teacher_id);
