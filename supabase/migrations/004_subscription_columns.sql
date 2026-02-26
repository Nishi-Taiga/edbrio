-- Add subscription-related columns to teachers table
ALTER TABLE public.teachers
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Index for webhook lookups (find teacher by customer ID)
CREATE INDEX IF NOT EXISTS idx_teachers_stripe_customer_id
  ON public.teachers(stripe_customer_id);
