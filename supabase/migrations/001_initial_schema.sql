-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Create custom types
CREATE TYPE user_role AS ENUM ('teacher', 'guardian', 'student');
CREATE TYPE teacher_plan AS ENUM ('free', 'pro');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'canceled', 'done');
CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');

-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  role user_role NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teachers table
CREATE TABLE public.teachers (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  handle TEXT UNIQUE NOT NULL,
  subjects TEXT[] DEFAULT '{}',
  grades TEXT[] DEFAULT '{}',
  public_profile JSONB DEFAULT '{}',
  plan teacher_plan DEFAULT 'free',
  stripe_account_id TEXT,
  is_onboarding_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Guardians table
CREATE TABLE public.guardians (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE public.students (
  id UUID REFERENCES public.users(id) ON DELETE CASCADE PRIMARY KEY,
  guardian_id UUID REFERENCES public.guardians(id) ON DELETE CASCADE,
  grade TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher-Student relationships
CREATE TABLE public.teacher_students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(teacher_id, student_id)
);

-- Invite system
CREATE TABLE public.invites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  role user_role NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teacher shifts
CREATE TABLE public.shifts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  rrule TEXT, -- RFC 5545 recurrence rule
  location TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Available time slots
CREATE TABLE public.availability (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  slot_start TIMESTAMP WITH TIME ZONE NOT NULL,
  slot_end TIMESTAMP WITH TIME ZONE NOT NULL,
  source TEXT, -- 'shift' or 'manual'
  is_bookable BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket types
CREATE TABLE public.tickets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  minutes INTEGER NOT NULL,
  bundle_qty INTEGER DEFAULT 1,
  price_cents INTEGER NOT NULL,
  valid_days INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  stripe_price_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payment records
CREATE TABLE public.payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  payer_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount_cents INTEGER NOT NULL,
  processor TEXT DEFAULT 'stripe',
  processor_payment_id TEXT,
  status payment_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket balances
CREATE TABLE public.ticket_balances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE CASCADE NOT NULL,
  remaining_minutes INTEGER NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  payment_id UUID REFERENCES public.payments(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE public.bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status booking_status DEFAULT 'pending',
  ticket_balance_id UUID REFERENCES public.ticket_balances(id) ON DELETE SET NULL,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Prevent double booking with exclusion constraint
  EXCLUDE USING gist (teacher_id WITH =, tstzrange(start_time, end_time) WITH &&)
);

-- Reports
CREATE TABLE public.reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE NOT NULL,
  content_raw TEXT,
  content_public TEXT,
  ai_summary TEXT,
  visibility TEXT DEFAULT 'private',
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  meta JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_teachers_handle ON public.teachers(handle);
CREATE INDEX idx_availability_teacher_time ON public.availability(teacher_id, slot_start);
CREATE INDEX idx_bookings_teacher_time ON public.bookings(teacher_id, start_time);
CREATE INDEX idx_ticket_balances_student ON public.ticket_balances(student_id);
CREATE INDEX idx_payments_teacher ON public.payments(teacher_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users: Users can read/write their own data
CREATE POLICY "users_own_data" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Teachers: Teachers can read/write their own data, public profile is readable by all
CREATE POLICY "teachers_own_data" ON public.teachers
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "teachers_public_profile" ON public.teachers
  FOR SELECT USING (TRUE);

-- Guardians: Can read/write their own data
CREATE POLICY "guardians_own_data" ON public.guardians
  FOR ALL USING (auth.uid() = id);

-- Students: Can read/write their own data or if they're managed by a guardian
CREATE POLICY "students_own_data" ON public.students
  FOR ALL USING (
    auth.uid() = id OR 
    auth.uid() = guardian_id
  );

-- Teacher-Students: Visible to both teacher and student/guardian
CREATE POLICY "teacher_students_visibility" ON public.teacher_students
  FOR ALL USING (
    auth.uid() = teacher_id OR 
    auth.uid() = student_id OR
    auth.uid() IN (
      SELECT guardian_id FROM public.students WHERE id = student_id
    )
  );

-- Availability: Teachers can manage their own, public when published
CREATE POLICY "availability_teacher_manage" ON public.availability
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "availability_public_view" ON public.availability
  FOR SELECT USING (is_bookable = true);

-- Bookings: Visible to teacher and student/guardian
CREATE POLICY "bookings_visibility" ON public.bookings
  FOR ALL USING (
    auth.uid() = teacher_id OR 
    auth.uid() = student_id OR
    auth.uid() IN (
      SELECT guardian_id FROM public.students WHERE id = student_id
    )
  );

-- Tickets: Teachers can manage their own, visible to all for purchase
CREATE POLICY "tickets_teacher_manage" ON public.tickets
  FOR ALL USING (auth.uid() = teacher_id);

CREATE POLICY "tickets_public_view" ON public.tickets
  FOR SELECT USING (is_active = true);

-- Ticket Balances: Visible to student/guardian and their teachers
CREATE POLICY "ticket_balances_visibility" ON public.ticket_balances
  FOR ALL USING (
    auth.uid() = student_id OR
    auth.uid() IN (
      SELECT guardian_id FROM public.students WHERE id = student_id
    ) OR
    auth.uid() IN (
      SELECT teacher_id FROM public.teacher_students WHERE student_id = ticket_balances.student_id
    )
  );

-- Reports: Visible to teacher and student/guardian
CREATE POLICY "reports_visibility" ON public.reports
  FOR ALL USING (
    auth.uid() IN (
      SELECT teacher_id FROM public.bookings WHERE id = booking_id
    ) OR
    auth.uid() IN (
      SELECT student_id FROM public.bookings WHERE id = booking_id
    ) OR
    auth.uid() IN (
      SELECT s.guardian_id 
      FROM public.bookings b
      JOIN public.students s ON b.student_id = s.id
      WHERE b.id = booking_id
    )
  );

-- Audit logs: Only readable by system (service role)
CREATE POLICY "audit_logs_system_only" ON public.audit_logs
  FOR SELECT USING (auth.role() = 'service_role');

-- Trigger to sync auth.users with public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_name TEXT;
  v_role user_role;
BEGIN
  v_name := COALESCE(new.raw_user_meta_data->>'name', '');
  v_role := (COALESCE(new.raw_user_meta_data->>'role', 'teacher'))::user_role;

  -- Insert into public.users
  INSERT INTO public.users (id, email, name, role)
  VALUES (new.id, new.email, v_name, v_role);

  -- Role-specific record creation
  IF v_role = 'teacher' THEN
    INSERT INTO public.teachers (id, handle)
    VALUES (new.id, 'user-' || lower(substring(replace(new.id::text, '-', ''), 1, 10)));
  ELSIF v_role = 'guardian' THEN
    INSERT INTO public.guardians (id)
    VALUES (new.id);
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();