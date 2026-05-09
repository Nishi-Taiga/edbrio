-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  target_role TEXT, -- null = all, 'teacher', 'guardian'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track which users have read which announcements
CREATE TABLE public.announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, announcement_id)
);

-- RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

-- Service role (admin API) can manage announcements
CREATE POLICY "Service role can manage announcements" ON public.announcements
  FOR ALL USING (auth.role() = 'service_role');

-- Authenticated users can read announcements
CREATE POLICY "Authenticated users can read announcements" ON public.announcements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can manage their own reads
CREATE POLICY "Users can manage own reads" ON public.announcement_reads
  FOR ALL USING (user_id = auth.uid());

-- Indexes
CREATE INDEX idx_announcements_created ON public.announcements(created_at DESC);
CREATE INDEX idx_announcement_reads_user ON public.announcement_reads(user_id, announcement_id);
