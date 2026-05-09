-- Fix handle_new_user trigger to auto-generate teachers.handle
-- Previously, the trigger did not set the handle column, causing
-- auth.admin.createUser() to fail with "Database error creating new user"
-- because teachers.handle is NOT NULL without a default.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian')::public.user_role,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  IF (NEW.raw_user_meta_data->>'role') = 'teacher' THEN
    INSERT INTO public.teachers (id, handle, subjects, grades, public_profile)
    VALUES (
      NEW.id,
      'teacher-' || substr(NEW.id::text, 1, 8),
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
