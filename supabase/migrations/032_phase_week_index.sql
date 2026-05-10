-- Add week-index columns to curriculum_phases.
-- Phases now express their schedule as 1-based week indices relative to the
-- academic year (April → next March). start_date / end_date stay populated
-- (derived from week index on write) for backward-compatible reads.

ALTER TABLE public.curriculum_phases
  ADD COLUMN IF NOT EXISTS start_week INTEGER,
  ADD COLUMN IF NOT EXISTS end_week INTEGER;

-- Helper: first Monday on or after April 1 of `year`.
CREATE OR REPLACE FUNCTION public._curriculum_academic_year_start(year INTEGER)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  apr1 DATE := MAKE_DATE(year, 4, 1);
  dow INT := EXTRACT(DOW FROM apr1)::INT; -- 0=Sun, 1=Mon, ..., 6=Sat
  monday_offset INT := CASE
    WHEN dow = 0 THEN 1
    WHEN dow = 1 THEN 0
    ELSE 8 - dow
  END;
BEGIN
  RETURN apr1 + (monday_offset || ' days')::INTERVAL;
END;
$$;

-- Backfill week indices from existing dates.
UPDATE public.curriculum_phases p
SET
  start_week = CASE
    WHEN p.start_date IS NOT NULL THEN
      GREATEST(
        1,
        FLOOR(
          (p.start_date - public._curriculum_academic_year_start(m.curriculum_year::INT))::NUMERIC / 7
        )::INT + 1
      )
    ELSE NULL
  END,
  end_week = CASE
    WHEN p.end_date IS NOT NULL THEN
      GREATEST(
        1,
        FLOOR(
          (p.end_date - public._curriculum_academic_year_start(m.curriculum_year::INT))::NUMERIC / 7
        )::INT + 1
      )
    ELSE NULL
  END
FROM public.curriculum_materials m
WHERE p.material_id = m.id
  AND m.curriculum_year ~ '^\d+$';

CREATE INDEX IF NOT EXISTS idx_curriculum_phases_start_week
  ON public.curriculum_phases(start_week);
CREATE INDEX IF NOT EXISTS idx_curriculum_phases_end_week
  ON public.curriculum_phases(end_week);
