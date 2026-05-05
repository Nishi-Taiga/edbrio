-- Add is_main_subject flag to test_scores for flexible main/sub subject filtering
ALTER TABLE public.test_scores
  ADD COLUMN IF NOT EXISTS is_main_subject BOOLEAN NOT NULL DEFAULT true;
