BEGIN;

DELETE FROM public."Event"
WHERE city::TEXT IN ('samara', 'tula');

UPDATE public.profiles
SET city = NULL
WHERE city::TEXT IN ('samara', 'tula');

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
DROP FUNCTION IF EXISTS private.handle_new_profile_for_auth_user() CASCADE;

ALTER TABLE public.profiles
  ALTER COLUMN city TYPE TEXT USING city::TEXT;

ALTER TABLE public."Event"
  ALTER COLUMN city TYPE TEXT USING city::TEXT;

DROP TYPE public.city_id;

CREATE TYPE public.city_id AS ENUM (
  'kharkiv',
  'kyiv',
  'lviv',
  'chernivtsi',
  'chisinau',
  'odesa',
  'khmelnytskyi',
  'dnipro',
  'munich',
  'sievierodonetsk',
  'tartu',
  'ternopil',
  'ivano-frankivsk',
  'kolomyia'
);

ALTER TABLE public.profiles
  ALTER COLUMN city TYPE public.city_id USING city::public.city_id;

ALTER TABLE public."Event"
  ALTER COLUMN city TYPE public.city_id USING city::public.city_id;

CREATE OR REPLACE FUNCTION private.handle_new_profile_for_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, city, role)
  VALUES (
    NEW.id,
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1), 'User')), ''),
    CASE
      WHEN NEW.raw_user_meta_data->>'city' IN (
        'kharkiv', 'kyiv', 'lviv', 'chernivtsi', 'chisinau', 'odesa',
        'khmelnytskyi', 'dnipro', 'munich', 'sievierodonetsk', 'tartu',
        'ternopil', 'ivano-frankivsk', 'kolomyia'
      )
      THEN (NEW.raw_user_meta_data->>'city')::public.city_id
      ELSE NULL
    END,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_profile_for_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.handle_new_profile_for_auth_user() FROM anon;
REVOKE ALL ON FUNCTION private.handle_new_profile_for_auth_user() FROM authenticated;
GRANT EXECUTE ON FUNCTION private.handle_new_profile_for_auth_user() TO postgres, supabase_auth_admin;

CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_profile_for_auth_user();

COMMIT;
