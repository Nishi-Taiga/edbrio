-- Update handle_new_user trigger to provision school users
-- School users need a teachers row because student_profiles.teacher_id
-- references teachers(id).
-- Note: role column is varchar, not enum, so no ALTER TYPE needed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, role, email, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'guardian'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );

  IF (NEW.raw_user_meta_data->>'role') IN ('teacher', 'school') THEN
    INSERT INTO public.teachers (id, handle, subjects, grades, public_profile)
    VALUES (
      NEW.id,
      CASE WHEN (NEW.raw_user_meta_data->>'role') = 'school'
           THEN 'school-' || substr(NEW.id::text, 1, 8)
           ELSE 'teacher-' || substr(NEW.id::text, 1, 8)
      END,
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
