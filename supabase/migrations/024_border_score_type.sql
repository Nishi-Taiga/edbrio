-- Add border_score_type column to distinguish between deviation value and percentage
ALTER TABLE exam_schedules
  ADD COLUMN IF NOT EXISTS border_score_type text DEFAULT 'deviation'
  CHECK (border_score_type IN ('deviation', 'percentage'));

COMMENT ON COLUMN exam_schedules.border_score_type IS 'ボーダーの種類: deviation=偏差値, percentage=パーセント';
