-- 010: Invite flow redesign - add method column (email vs QR)
ALTER TABLE public.invites
  ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'email';

-- Add check constraint separately for IF NOT EXISTS compatibility
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invites_method_check'
  ) THEN
    ALTER TABLE public.invites
      ADD CONSTRAINT invites_method_check CHECK (method IN ('email', 'qr'));
  END IF;
END $$;
