-- Add department column to exam_schedules for specifying faculty/department or course
ALTER TABLE public.exam_schedules
  ADD COLUMN IF NOT EXISTS department TEXT;
