-- Add onboarded flag to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarded boolean NOT NULL DEFAULT false;

-- Replace prevent_role_change trigger to allow role change ONLY during onboarding
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role AND OLD.onboarded = true THEN
    RAISE EXCEPTION 'Changing role is not allowed after onboarding';
  END IF;
  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on profiles
DROP TRIGGER IF EXISTS prevent_role_change_trigger ON public.profiles;
CREATE TRIGGER prevent_role_change_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_change();