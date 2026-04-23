BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

CREATE OR REPLACE FUNCTION private.handle_new_profile_for_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'name',
      NEW.raw_user_meta_data ->> 'full_name',
      split_part(NEW.email, '@', 1),
      'User'
    ),
    'user'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    name = CASE
      WHEN public.profiles.name IS NULL OR btrim(public.profiles.name) = '' THEN EXCLUDED.name
      ELSE public.profiles.name
    END,
    role = CASE
      WHEN public.profiles.role IS NULL OR btrim(public.profiles.role) = '' THEN EXCLUDED.role
      ELSE public.profiles.role
    END,
    updated_at = CASE
      WHEN public.profiles.name IS NULL
        OR btrim(public.profiles.name) = ''
        OR public.profiles.role IS NULL
        OR btrim(public.profiles.role) = ''
      THEN now()
      ELSE public.profiles.updated_at
    END;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION private.handle_new_profile_for_auth_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.handle_new_profile_for_auth_user() FROM anon;
REVOKE ALL ON FUNCTION private.handle_new_profile_for_auth_user() FROM authenticated;
GRANT USAGE ON SCHEMA private TO postgres, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION private.handle_new_profile_for_auth_user() TO postgres, supabase_auth_admin;

INSERT INTO public.profiles (id, name, role)
SELECT
  u.id,
  COALESCE(
    u.raw_user_meta_data ->> 'name',
    u.raw_user_meta_data ->> 'full_name',
    split_part(u.email, '@', 1),
    'User'
  ) AS name,
  'user' AS role
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION private.handle_new_profile_for_auth_user();

COMMIT;
