-- Retire student_profiles.subjects.
-- Subjects are now derived from curriculum_materials.subject. The column was
-- becoming a stale snapshot of initial setup that did not track subsequent
-- curriculum edits.
ALTER TABLE public.student_profiles DROP COLUMN IF EXISTS subjects;
