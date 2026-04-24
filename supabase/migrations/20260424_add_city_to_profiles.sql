BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '';

GRANT UPDATE(city) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION private.handle_new_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, city, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    COALESCE(NEW.raw_user_meta_data ->> 'city', ''),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = CASE
      WHEN public.profiles.name IS NULL OR btrim(public.profiles.name) = '' THEN EXCLUDED.name
      ELSE public.profiles.name
    END,
    city = CASE
      WHEN public.profiles.city IS NULL OR btrim(public.profiles.city) = '' THEN EXCLUDED.city
      ELSE public.profiles.city
    END,
    role = CASE
      WHEN public.profiles.role IS NULL OR btrim(public.profiles.role) = '' THEN EXCLUDED.role
      ELSE public.profiles.role
    END,
    updated_at = CASE
      WHEN public.profiles.name IS NULL
        OR btrim(public.profiles.name) = ''
        OR public.profiles.city IS NULL
        OR btrim(public.profiles.city) = ''
        OR public.profiles.role IS NULL
        OR btrim(public.profiles.role) = ''
      THEN now()
      ELSE public.profiles.updated_at
    END;

  RETURN NEW;
END;
$$;

COMMIT;
