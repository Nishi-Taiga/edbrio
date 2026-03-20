-- 025: Add CHECK constraint to ensure ticket.minutes is always positive
-- Prevents zero-division when calculating remaining session counts on the frontend
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_minutes_positive'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_minutes_positive CHECK (minutes > 0);
  END IF;
END $$;
