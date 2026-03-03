-- Rename teacher_plan enum value: 'pro' → 'standard'
-- PostgreSQL doesn't support ALTER TYPE ... RENAME VALUE directly in older versions,
-- so we use the safe approach: rename old, add new, update data, drop old.

-- Step 1: Rename 'pro' to 'pro_old' (temporary)
ALTER TYPE teacher_plan RENAME VALUE 'pro' TO 'pro_old';

-- Step 2: Add 'standard' as new value
ALTER TYPE teacher_plan ADD VALUE 'standard';

-- Step 3: Update all rows using 'pro_old' to 'standard'
UPDATE public.teachers SET plan = 'standard' WHERE plan = 'pro_old';

-- Note: Dropping the old enum value ('pro_old') is not supported in PostgreSQL.
-- The unused value will remain in the enum but will not be used by any data.
-- This is a known PostgreSQL limitation and does not affect functionality.
