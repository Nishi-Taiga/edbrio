-- EdBrio Database Setup Script
-- Run this entire script in Supabase Studio SQL Editor

-- 1. Create user role enum
CREATE TYPE user_role AS ENUM ('teacher', 'guardian', 'student');
CREATE TYPE teacher_plan AS ENUM ('free', 'pro');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'canceled', 'done');

-- 2. Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'guardian',
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create teachers table
CREATE TABLE public.teachers (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    handle TEXT UNIQUE NOT NULL,
    subjects TEXT[] DEFAULT '{}',
    grades TEXT[] DEFAULT '{}',
    plan teacher_plan DEFAULT 'free',
    public_profile JSONB DEFAULT '{}',
    is_onboarding_complete BOOLEAN DEFAULT false,
    stripe_account_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create guardians table
CREATE TABLE public.guardians (
    id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
    phone TEXT,
    stripe_customer_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    grade TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create tickets table
CREATE TABLE public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    minutes INTEGER NOT NULL,
    bundle_qty INTEGER NOT NULL DEFAULT 1,
    price_cents INTEGER NOT NULL,
    valid_days INTEGER NOT NULL DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Create availability table
CREATE TABLE public.availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    slot_start TIMESTAMPTZ NOT NULL,
    slot_end TIMESTAMPTZ NOT NULL,
    source TEXT DEFAULT 'manual',
    is_bookable BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Create bookings table
CREATE TABLE public.bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status booking_status DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Create ticket_balances table
CREATE TABLE public.ticket_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    remaining_minutes INTEGER NOT NULL DEFAULT 0,
    purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Create reports table
CREATE TABLE public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    content_raw TEXT NOT NULL,
    content_public TEXT NOT NULL,
    visibility TEXT DEFAULT 'public',
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Create teacher_students table
CREATE TABLE public.teacher_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, student_id)
);

-- 12. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;

-- 13. Create RLS policies
-- Users policies
CREATE POLICY "Users can read their own data" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Teachers policies
CREATE POLICY "Anyone can read public teacher profiles" ON public.teachers FOR SELECT USING (true);
CREATE POLICY "Teachers can update their own profiles" ON public.teachers FOR UPDATE USING (auth.uid() = id);

-- Guardians policies
CREATE POLICY "Guardians can read their own data" ON public.guardians FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Guardians can update their own data" ON public.guardians FOR UPDATE USING (auth.uid() = id);

-- Students policies
CREATE POLICY "Guardians can read their students" ON public.students FOR SELECT USING (guardian_id = auth.uid());
CREATE POLICY "Teachers can read their students" ON public.students FOR SELECT USING (id IN (SELECT student_id FROM public.teacher_students WHERE teacher_id = auth.uid()));

-- Tickets policies
CREATE POLICY "Anyone can read active tickets" ON public.tickets FOR SELECT USING (is_active = true);
CREATE POLICY "Teachers can manage their tickets" ON public.tickets FOR ALL USING (teacher_id = auth.uid());

-- Availability policies
CREATE POLICY "Anyone can read bookable availability" ON public.availability FOR SELECT USING (is_bookable = true);
CREATE POLICY "Teachers can manage their availability" ON public.availability FOR ALL USING (teacher_id = auth.uid());

-- Bookings policies
CREATE POLICY "Teachers can see their bookings" ON public.bookings FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Guardians can see their students' bookings" ON public.bookings FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE guardian_id = auth.uid()));

-- Ticket balances policies
CREATE POLICY "Guardians can see their students' balances" ON public.ticket_balances FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE guardian_id = auth.uid()));
CREATE POLICY "Teachers can see their students' balances" ON public.ticket_balances FOR SELECT USING (student_id IN (SELECT student_id FROM public.teacher_students WHERE teacher_id = auth.uid()));

-- Reports policies
CREATE POLICY "Anyone can read public reports" ON public.reports FOR SELECT USING (visibility = 'public');
CREATE POLICY "Teachers can manage reports for their bookings" ON public.reports FOR ALL USING (booking_id IN (SELECT id FROM public.bookings WHERE teacher_id = auth.uid()));

-- Teacher students policies
CREATE POLICY "Teachers can see their student relationships" ON public.teacher_students FOR SELECT USING (teacher_id = auth.uid());
CREATE POLICY "Guardians can see their students' teacher relationships" ON public.teacher_students FOR SELECT USING (student_id IN (SELECT id FROM public.students WHERE guardian_id = auth.uid()));

-- 14. Create user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')::user_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  IF (NEW.raw_user_meta_data->>'role') = 'teacher' THEN
    INSERT INTO public.teachers (id, handle, subjects, grades, public_profile)
    VALUES (
      NEW.id,
      LOWER(REPLACE(split_part(NEW.email, '@', 1), '.', '-')) || '-' || EXTRACT(epoch FROM NOW())::int,
      ARRAY[]::text[],
      ARRAY[]::text[],
      '{}'::jsonb
    );
  ELSIF (NEW.raw_user_meta_data->>'role') = 'guardian' THEN
    INSERT INTO public.guardians (id)
    VALUES (NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 15. Insert test data (optional - for immediate testing)
-- This creates test accounts that you can log in with
-- Note: You still need to create the actual auth users through signup

-- Test teacher data (will be linked when teacher@test.com signs up)
INSERT INTO public.users (id, role, email, name) VALUES 
('00000000-0000-0000-0000-000000000001', 'teacher', 'teacher@test.com', 'テスト講師')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.teachers (id, handle, subjects, grades, public_profile, is_onboarding_complete) VALUES 
('00000000-0000-0000-0000-000000000001', 'test-teacher', ARRAY['数学', '物理'], ARRAY['高1', '高2', '高3'], 
 jsonb_build_object(
   'introduction', '数学の楽しさを伝える指導を心がけています。',
   'experience', '5年',
   'education', '東京大学理学部数学科卒業',
   'certification', '数学検定1級'
 ), true)
ON CONFLICT (id) DO NOTHING;

-- Test tickets
INSERT INTO public.tickets (teacher_id, name, minutes, bundle_qty, price_cents, valid_days, is_active) VALUES 
('00000000-0000-0000-0000-000000000001', '数学 単発授業', 60, 1, 500000, 30, true),
('00000000-0000-0000-0000-000000000001', '数学 5回パック', 60, 5, 2250000, 90, true),
('00000000-0000-0000-0000-000000000001', '物理 単発授業', 60, 1, 520000, 30, true)
ON CONFLICT DO NOTHING;

-- Test availability slots
INSERT INTO public.availability (teacher_id, slot_start, slot_end, source, is_bookable) VALUES 
('00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '1 day' + INTERVAL '2 hours', NOW() + INTERVAL '1 day' + INTERVAL '3 hours', 'manual', true),
('00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '1 day' + INTERVAL '4 hours', NOW() + INTERVAL '1 day' + INTERVAL '5 hours', 'manual', true),
('00000000-0000-0000-0000-000000000001', NOW() + INTERVAL '2 days' + INTERVAL '2 hours', NOW() + INTERVAL '2 days' + INTERVAL '3 hours', 'manual', true)
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Database setup completed successfully! You can now sign up with teacher@test.com and guardian@test.com' as status;