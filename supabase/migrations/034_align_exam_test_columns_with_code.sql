-- Align exam_schedules / test_scores with application code.
-- The new exam form added `department` and the chart filter expects
-- `is_main_subject`, but neither column existed in production. Adding them
-- restores parity between the schema and the code that was merged after
-- #20 / #22.
ALTER TABLE public.exam_schedules
  ADD COLUMN IF NOT EXISTS department TEXT;

ALTER TABLE public.test_scores
  ADD COLUMN IF NOT EXISTS is_main_subject BOOLEAN NOT NULL DEFAULT TRUE;
