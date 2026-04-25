BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public."Lecture" CASCADE;
DROP TABLE IF EXISTS public."Event" CASCADE;
DROP TABLE IF EXISTS public.rate_limit_store CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.increment_rate_limit(TEXT, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS private.handle_new_profile_for_auth_user() CASCADE;

DROP TYPE IF EXISTS public.profile_role CASCADE;
DROP TYPE IF EXISTS public.city_id CASCADE;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;
REVOKE ALL ON SCHEMA private FROM anon;
REVOKE ALL ON SCHEMA private FROM authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'profile_role') THEN
    CREATE TYPE public.profile_role AS ENUM ('user', 'lector', 'admin');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'city_id') THEN
    CREATE TYPE public.city_id AS ENUM (
      'kharkiv',
      'kyiv',
      'lviv',
      'chernivtsi',
      'chisinau',
      'odesa',
      'samara',
      'khmelnytskyi',
      'dnipro',
      'munich',
      'tula',
      'sievierodonetsk',
      'tartu',
      'ternopil',
      'ivano-frankivsk',
      'kolomyia'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  city public.city_id,
  role public.profile_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS city public.city_id,
  ADD COLUMN IF NOT EXISTS role public.profile_role NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public."Event" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "titleUk" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL DEFAULT '',
  "descriptionUk" TEXT NOT NULL DEFAULT '',
  "descriptionEn" TEXT NOT NULL DEFAULT '',
  city public.city_id NOT NULL,
  "cityUk" TEXT NOT NULL,
  "cityEn" TEXT NOT NULL DEFAULT '',
  date DATE NOT NULL,
  "locationUk" TEXT NOT NULL,
  "locationEn" TEXT NOT NULL DEFAULT '',
  time TIME NOT NULL,
  image TEXT NOT NULL,
  "registrationUrl" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT event_image_http CHECK (image ~* '^https?://'),
  CONSTRAINT event_registration_url_http CHECK ("registrationUrl" IS NULL OR "registrationUrl" ~* '^https?://')
);

CREATE TABLE IF NOT EXISTS public."Lecture" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" UUID NOT NULL REFERENCES public."Event"(id) ON DELETE CASCADE,
  slot INTEGER NOT NULL CHECK (slot BETWEEN 1 AND 4),
  category TEXT NOT NULL CHECK (category IN ('tech', 'nature', 'artes', 'wild-card')),
  "categoryColor" TEXT NOT NULL CHECK (
    (category = 'tech' AND "categoryColor" = 'blue') OR
    (category = 'nature' AND "categoryColor" = 'green') OR
    (category = 'artes' AND "categoryColor" = 'red') OR
    (category = 'wild-card' AND "categoryColor" = 'orange')
  ),
  "authorUk" TEXT NOT NULL,
  "authorEn" TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL,
  "titleUk" TEXT NOT NULL,
  "titleEn" TEXT NOT NULL DEFAULT '',
  "summaryUk" TEXT NOT NULL,
  "summaryEn" TEXT NOT NULL DEFAULT '',
  duration TEXT,
  "videoUrl" TEXT,
  "authorBioUk" TEXT,
  "authorBioEn" TEXT,
  sources TEXT,
  "socialLinks" TEXT,
  "eventCity" TEXT,
  "eventDate" TEXT,
  "eventPhotosUrl" TEXT,
  "isPublic" BOOLEAN NOT NULL DEFAULT FALSE,
  "userId" UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT lecture_image_http CHECK (image ~* '^https?://'),
  CONSTRAINT lecture_video_url_http CHECK ("videoUrl" IS NULL OR "videoUrl" ~* '^https?://'),
  CONSTRAINT lecture_event_photos_url_http CHECK ("eventPhotosUrl" IS NULL OR "eventPhotosUrl" ~* '^https?://'),
  CONSTRAINT lecture_unique_event_slot UNIQUE ("eventId", slot)
);

CREATE TABLE IF NOT EXISTS public.rate_limit_store (
  key TEXT PRIMARY KEY,
  count INTEGER NOT NULL DEFAULT 0,
  reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS profiles_role_idx ON public.profiles(role);
CREATE INDEX IF NOT EXISTS profiles_city_idx ON public.profiles(city);
CREATE INDEX IF NOT EXISTS event_city_idx ON public."Event" (city);
CREATE INDEX IF NOT EXISTS event_public_created_idx ON public."Event" ("isPublic", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS event_user_created_idx ON public."Event" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS event_date_time_idx ON public."Event" (date, time);
CREATE INDEX IF NOT EXISTS lecture_public_created_idx ON public."Lecture" ("isPublic", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS lecture_user_created_idx ON public."Lecture" ("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS lecture_event_slot_idx ON public."Lecture" ("eventId", slot);
CREATE INDEX IF NOT EXISTS lecture_category_idx ON public."Lecture" (category);
CREATE INDEX IF NOT EXISTS rate_limit_store_reset_at_idx ON public.rate_limit_store(reset_at);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' THEN
    NEW.updated_at = NOW();
  ELSE
    NEW."updatedAt" = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS event_set_updated_at ON public."Event";
CREATE TRIGGER event_set_updated_at
BEFORE UPDATE ON public."Event"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS lecture_set_updated_at ON public."Lecture";
CREATE TRIGGER lecture_set_updated_at
BEFORE UPDATE ON public."Lecture"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

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
        'kharkiv', 'kyiv', 'lviv', 'chernivtsi', 'chisinau', 'odesa', 'samara',
        'khmelnytskyi', 'dnipro', 'munich', 'tula', 'sievierodonetsk', 'tartu',
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
GRANT USAGE ON SCHEMA private TO postgres, supabase_auth_admin;
GRANT EXECUTE ON FUNCTION private.handle_new_profile_for_auth_user() TO postgres, supabase_auth_admin;

DROP TRIGGER IF EXISTS on_auth_user_created_create_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_create_profile
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION private.handle_new_profile_for_auth_user();

INSERT INTO public.profiles (id, name, city, role, created_at)
SELECT
  users.id,
  NULLIF(TRIM(COALESCE(users.raw_user_meta_data->>'name', users.raw_user_meta_data->>'full_name', split_part(users.email, '@', 1), 'User')), ''),
  CASE
    WHEN users.raw_user_meta_data->>'city' IN (
      'kharkiv', 'kyiv', 'lviv', 'chernivtsi', 'chisinau', 'odesa', 'samara',
      'khmelnytskyi', 'dnipro', 'munich', 'tula', 'sievierodonetsk', 'tartu',
      'ternopil', 'ivano-frankivsk', 'kolomyia'
    )
    THEN (users.raw_user_meta_data->>'city')::public.city_id
    ELSE NULL
  END,
  'user',
  users.created_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

UPDATE public.profiles
SET role = 'admin', updated_at = NOW()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'partumyt@gmail.com'
)
AND role = 'user';

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key TEXT,
  p_window_seconds INTEGER,
  p_limit INTEGER
)
RETURNS TABLE(success BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_reset_at TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  DELETE FROM public.rate_limit_store
  WHERE key = p_key AND rate_limit_store.reset_at < v_now;

  INSERT INTO public.rate_limit_store (key, count, reset_at)
  VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
    SET count = public.rate_limit_store.count + 1
  RETURNING public.rate_limit_store.count, public.rate_limit_store.reset_at
  INTO v_count, v_reset_at;

  RETURN QUERY SELECT (v_count <= p_limit), v_count, v_reset_at;
END;
$$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Event" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."Lecture" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_store ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

DROP POLICY IF EXISTS profiles_update_own_name_city ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own_name ON public.profiles;
CREATE POLICY profiles_update_own_name_city
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS events_public_select ON public."Event";
CREATE POLICY events_public_select
ON public."Event" FOR SELECT
TO anon, authenticated
USING ("isPublic" = TRUE);

DROP POLICY IF EXISTS events_owner_select_own ON public."Event";
CREATE POLICY events_owner_select_own
ON public."Event" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

DROP POLICY IF EXISTS events_owner_insert ON public."Event";
CREATE POLICY events_owner_insert
ON public."Event" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS events_owner_update ON public."Event";
CREATE POLICY events_owner_update
ON public."Event" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS events_owner_delete ON public."Event";
CREATE POLICY events_owner_delete
ON public."Event" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

DROP POLICY IF EXISTS lectures_public_select ON public."Lecture";
CREATE POLICY lectures_public_select
ON public."Lecture" FOR SELECT
TO anon, authenticated
USING ("isPublic" = TRUE);

DROP POLICY IF EXISTS lectures_owner_select_own ON public."Lecture";
CREATE POLICY lectures_owner_select_own
ON public."Lecture" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

DROP POLICY IF EXISTS lectures_owner_insert ON public."Lecture";
CREATE POLICY lectures_owner_insert
ON public."Lecture" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS lectures_owner_update ON public."Lecture";
CREATE POLICY lectures_owner_update
ON public."Lecture" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

DROP POLICY IF EXISTS lectures_owner_delete ON public."Lecture";
CREATE POLICY lectures_owner_delete
ON public."Lecture" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

DROP POLICY IF EXISTS rate_limit_store_no_client_access ON public.rate_limit_store;
DROP POLICY IF EXISTS rate_limit_service_role_only ON public.rate_limit_store;
CREATE POLICY rate_limit_store_no_client_access
ON public.rate_limit_store
USING (FALSE)
WITH CHECK (FALSE);

REVOKE ALL ON public.profiles FROM anon, authenticated;
REVOKE ALL ON public."Event" FROM anon, authenticated;
REVOKE ALL ON public."Lecture" FROM anon, authenticated;
REVOKE ALL ON public.rate_limit_store FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.increment_rate_limit(TEXT, INTEGER, INTEGER) FROM PUBLIC;

GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE(name, city) ON public.profiles TO authenticated;

GRANT SELECT ON public."Event" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public."Event" TO authenticated;

GRANT SELECT ON public."Lecture" TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public."Lecture" TO authenticated;

GRANT EXECUTE ON FUNCTION public.increment_rate_limit(TEXT, INTEGER, INTEGER) TO service_role;

COMMIT;
