
-- 1. Restrict profiles SELECT
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Employers can view applicant profiles"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.applications a
    JOIN public.jobs j ON j.id = a.job_id
    WHERE a.student_id = profiles.id
      AND j.employer_id = auth.uid()
  )
);

-- 2. Prevent role changes via trigger
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'Changing role is not allowed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_profile_role_change ON public.profiles;
CREATE TRIGGER prevent_profile_role_change
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();

-- 3. Tighten applications INSERT to require student role
DROP POLICY IF EXISTS "Students can create applications" ON public.applications;

CREATE POLICY "Students can create applications"
ON public.applications FOR INSERT
WITH CHECK (
  auth.uid() = student_id
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'student'
  )
);
