-- Pre-registration table for launch waitlist
CREATE TABLE public.pre_registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL UNIQUE,
  token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  confirmed_at timestamptz,
  converted_at timestamptz,
  source text DEFAULT 'landing',
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.pre_registrations ENABLE ROW LEVEL SECURITY;

-- Anonymous users can insert (public form)
CREATE POLICY "anon_insert" ON public.pre_registrations
  FOR INSERT TO anon WITH CHECK (true);

-- Service role has full access (admin reads, updates)
CREATE POLICY "service_all" ON public.pre_registrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX idx_pre_registrations_email ON public.pre_registrations (email);
