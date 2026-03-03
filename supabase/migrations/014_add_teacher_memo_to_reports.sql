-- Add teacher_memo column to reports table
ALTER TABLE reports ADD COLUMN IF NOT EXISTS teacher_memo TEXT;
