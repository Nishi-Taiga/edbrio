-- Rename teacher_plan enum value: 'pro' → 'standard'
-- Idempotent: safe to run even if 'standard' already exists.

-- Step 1: Add 'standard' if it doesn't already exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'standard'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'teacher_plan')
  ) THEN
    ALTER TYPE teacher_plan ADD VALUE 'standard';
  END IF;
END $$;

-- Step 2: Update any remaining 'pro' rows to 'standard'
UPDATE public.teachers SET plan = 'standard' WHERE plan = 'pro';
