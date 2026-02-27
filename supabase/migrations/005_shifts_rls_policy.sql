-- Add missing RLS policy for shifts table
-- Without this policy, RLS blocks all access (403 Forbidden)
DROP POLICY IF EXISTS "shifts_teacher_manage" ON public.shifts;
CREATE POLICY "shifts_teacher_manage" ON public.shifts
  FOR ALL USING (auth.uid() = teacher_id);
