-- Share links for public curriculum viewing
CREATE TABLE public.curriculum_share_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.student_profiles(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_curriculum_share_links_token ON public.curriculum_share_links(token);
CREATE INDEX idx_curriculum_share_links_profile ON public.curriculum_share_links(profile_id);

ALTER TABLE public.curriculum_share_links ENABLE ROW LEVEL SECURITY;

-- Teachers/school users can manage share links for their own profiles
CREATE POLICY "share_links_owner_manage" ON public.curriculum_share_links
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.id = profile_id AND sp.teacher_id = auth.uid()
    )
  );
