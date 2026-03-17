-- Add preference_order (志望順) and border_score (ボーダー) to exam_schedules
ALTER TABLE exam_schedules
  ADD COLUMN IF NOT EXISTS preference_order integer,
  ADD COLUMN IF NOT EXISTS border_score numeric;

-- Index for quick lookups of first-choice exams
CREATE INDEX IF NOT EXISTS idx_exam_schedules_preference
  ON exam_schedules (profile_id, preference_order)
  WHERE preference_order IS NOT NULL;

COMMENT ON COLUMN exam_schedules.preference_order IS '志望順 (1=第一志望, 2=第二志望, ...)';
COMMENT ON COLUMN exam_schedules.border_score IS 'ボーダーライン（合格最低点/偏差値）';
