-- Update tai.nishi1998@gmail.com to Standard plan
UPDATE public.teachers
SET plan = 'standard'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'tai.nishi1998@gmail.com'
);

-- Add March 2026 lesson schedule (4-6 per week) for the same teacher
-- Monday & Wednesday: 16:00-17:30 JST (07:00-08:30 UTC)
-- Tuesday & Thursday: 18:00-19:30 JST (09:00-10:30 UTC)
-- Saturday: 10:00-11:30 JST (01:00-02:30 UTC), 13:00-14:30 JST (04:00-05:30 UTC)
-- Total: 6 lessons per week

DO $$
DECLARE
  teacher_uuid UUID;
  d DATE;
  dow INT;
BEGIN
  SELECT id INTO teacher_uuid FROM auth.users WHERE email = 'tai.nishi1998@gmail.com';
  IF teacher_uuid IS NULL THEN
    RAISE NOTICE 'Teacher not found, skipping shift creation';
    RETURN;
  END IF;

  FOR d IN SELECT generate_series('2026-03-01'::date, '2026-03-31'::date, '1 day'::interval)::date
  LOOP
    dow := EXTRACT(ISODOW FROM d); -- 1=Mon, 7=Sun
    -- Monday (1) & Wednesday (3): 16:00-17:30 JST
    IF dow IN (1, 3) THEN
      INSERT INTO public.shifts (teacher_id, start_time, end_time, is_published)
      VALUES (teacher_uuid, d + TIME '07:00' AT TIME ZONE 'UTC', d + TIME '08:30' AT TIME ZONE 'UTC', true);
    END IF;
    -- Tuesday (2) & Thursday (4): 18:00-19:30 JST
    IF dow IN (2, 4) THEN
      INSERT INTO public.shifts (teacher_id, start_time, end_time, is_published)
      VALUES (teacher_uuid, d + TIME '09:00' AT TIME ZONE 'UTC', d + TIME '10:30' AT TIME ZONE 'UTC', true);
    END IF;
    -- Saturday (6): 10:00-11:30 JST and 13:00-14:30 JST
    IF dow = 6 THEN
      INSERT INTO public.shifts (teacher_id, start_time, end_time, is_published)
      VALUES (teacher_uuid, d + TIME '01:00' AT TIME ZONE 'UTC', d + TIME '02:30' AT TIME ZONE 'UTC', true);
      INSERT INTO public.shifts (teacher_id, start_time, end_time, is_published)
      VALUES (teacher_uuid, d + TIME '04:00' AT TIME ZONE 'UTC', d + TIME '05:30' AT TIME ZONE 'UTC', true);
    END IF;
  END LOOP;
END $$;
