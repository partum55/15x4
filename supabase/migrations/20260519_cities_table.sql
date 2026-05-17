BEGIN;

-- ── 1. Cities lookup table ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.cities (
  id       TEXT PRIMARY KEY,
  "nameUk" TEXT NOT NULL,
  "nameEn" TEXT NOT NULL DEFAULT ''
);

INSERT INTO public.cities (id, "nameUk", "nameEn") VALUES
  ('kharkiv',         'Харків',           'Kharkiv'),
  ('kyiv',            'Київ',             'Kyiv'),
  ('lviv',            'Львів',            'Lviv'),
  ('chernivtsi',      'Чернівці',         'Chernivtsi'),
  ('chisinau',        'Кишинів',          'Chisinau'),
  ('odesa',           'Одеса',            'Odesa'),
  ('khmelnytskyi',    'Хмельницький',     'Khmelnytskyi'),
  ('dnipro',          'Дніпро',           'Dnipro'),
  ('munich',          'Мюнхен',           'Munich'),
  ('sievierodonetsk', 'Сєвєродонецьк',    'Sievierodonetsk'),
  ('tartu',           'Тарту',            'Tartu'),
  ('ternopil',        'Тернопіль',        'Ternopil'),
  ('ivano-frankivsk', 'Івано-Франківськ', 'Ivano-Frankivsk'),
  ('kolomyia',        'Коломия',          'Kolomyia')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;

CREATE POLICY cities_select_public ON public.cities
  FOR SELECT USING (true);

GRANT SELECT ON public.cities TO anon, authenticated;

-- ── 2. Event table: drop cityUk/cityEn, convert city to TEXT FK ──────────────

ALTER TABLE public."Event"
  ALTER COLUMN city TYPE TEXT USING city::TEXT;

ALTER TABLE public."Event"
  ADD CONSTRAINT event_city_fk FOREIGN KEY (city) REFERENCES public.cities(id);

ALTER TABLE public."Event"
  DROP COLUMN IF EXISTS "cityUk",
  DROP COLUMN IF EXISTS "cityEn";

-- ── 3. profiles table: convert city to TEXT FK ───────────────────────────────

ALTER TABLE public.profiles
  ALTER COLUMN city TYPE TEXT USING city::TEXT;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_city_fk FOREIGN KEY (city) REFERENCES public.cities(id) ON DELETE SET NULL;

-- ── 4. Drop ENUM ──────────────────────────────────────────────────────────────

DROP TYPE IF EXISTS public.city_id;

-- ── 5. Update trigger: validate against cities table instead of ENUM ──────────

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
    NULLIF(TRIM(COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'full_name',
      split_part(NEW.email, '@', 1),
      'User'
    )), ''),
    CASE
      WHEN EXISTS (SELECT 1 FROM public.cities WHERE id = NEW.raw_user_meta_data->>'city')
      THEN NEW.raw_user_meta_data->>'city'
      ELSE NULL
    END,
    'user'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- ── 6. Redefine RPCs without cityUk/cityEn ────────────────────────────────────

CREATE OR REPLACE FUNCTION public.create_event_with_lectures(
  p_event   JSONB,
  p_lectures JSONB DEFAULT '[]'::JSONB
)
RETURNS SETOF public."Event"
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_event   public."Event"%ROWTYPE;
  v_lecture JSONB;
BEGIN
  INSERT INTO public."Event" (
    "titleUk", "titleEn",
    "descriptionUk", "descriptionEn",
    city, date, "locationUk", "locationEn", time,
    image, "registrationUrl", "eventPhotosUrl",
    "isPublic", "userId"
  )
  VALUES (
    p_event->>'titleUk',
    COALESCE(p_event->>'titleEn', ''),
    COALESCE(p_event->>'descriptionUk', ''),
    COALESCE(p_event->>'descriptionEn', ''),
    p_event->>'city',
    (p_event->>'date')::DATE,
    p_event->>'locationUk',
    COALESCE(p_event->>'locationEn', ''),
    (p_event->>'time')::TIME,
    p_event->>'image',
    NULLIF(p_event->>'registrationUrl', ''),
    NULLIF(p_event->>'eventPhotosUrl', ''),
    FALSE,
    (p_event->>'userId')::UUID
  )
  RETURNING * INTO v_event;

  FOR v_lecture IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_lectures, '[]'::JSONB)) AS item(value)
  LOOP
    INSERT INTO public."Lecture" (
      "eventId", "userId", slot,
      "titleUk", "titleEn", "authorUk", "authorEn",
      category, "summaryUk", "summaryEn",
      image, "videoUrl", "presentationUrl",
      "authorBioUk", "authorBioEn", sources, "isPublic"
    )
    VALUES (
      v_event.id,
      (v_lecture->>'userId')::UUID,
      (v_lecture->>'slot')::INTEGER,
      v_lecture->>'titleUk',
      COALESCE(v_lecture->>'titleEn', ''),
      v_lecture->>'authorUk',
      COALESCE(v_lecture->>'authorEn', ''),
      v_lecture->>'category',
      v_lecture->>'summaryUk',
      COALESCE(v_lecture->>'summaryEn', ''),
      v_lecture->>'image',
      NULLIF(v_lecture->>'videoUrl', ''),
      NULLIF(v_lecture->>'presentationUrl', ''),
      NULLIF(v_lecture->>'authorBioUk', ''),
      NULLIF(v_lecture->>'authorBioEn', ''),
      CASE
        WHEN jsonb_typeof(v_lecture->'sources') = 'array' THEN (v_lecture->'sources')::TEXT
        ELSE NULL
      END,
      FALSE
    );
  END LOOP;

  RETURN NEXT v_event;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_event_with_lectures(
  p_event_id UUID,
  p_event    JSONB,
  p_lectures JSONB DEFAULT '[]'::JSONB
)
RETURNS SETOF public."Event"
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_event   public."Event"%ROWTYPE;
  v_lecture JSONB;
BEGIN
  UPDATE public."Event"
  SET
    "titleUk"        = p_event->>'titleUk',
    "titleEn"        = COALESCE(p_event->>'titleEn', ''),
    "descriptionUk"  = COALESCE(p_event->>'descriptionUk', ''),
    "descriptionEn"  = COALESCE(p_event->>'descriptionEn', ''),
    city             = p_event->>'city',
    date             = (p_event->>'date')::DATE,
    "locationUk"     = p_event->>'locationUk',
    "locationEn"     = COALESCE(p_event->>'locationEn', ''),
    time             = (p_event->>'time')::TIME,
    image            = p_event->>'image',
    "registrationUrl" = NULLIF(p_event->>'registrationUrl', ''),
    "eventPhotosUrl"  = NULLIF(p_event->>'eventPhotosUrl', '')
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  DELETE FROM public."Lecture" WHERE "eventId" = p_event_id;

  FOR v_lecture IN
    SELECT value FROM jsonb_array_elements(COALESCE(p_lectures, '[]'::JSONB)) AS item(value)
  LOOP
    INSERT INTO public."Lecture" (
      "eventId", "userId", slot,
      "titleUk", "titleEn", "authorUk", "authorEn",
      category, "summaryUk", "summaryEn",
      image, "videoUrl", "presentationUrl",
      "authorBioUk", "authorBioEn", sources, "isPublic"
    )
    VALUES (
      p_event_id,
      (v_lecture->>'userId')::UUID,
      (v_lecture->>'slot')::INTEGER,
      v_lecture->>'titleUk',
      COALESCE(v_lecture->>'titleEn', ''),
      v_lecture->>'authorUk',
      COALESCE(v_lecture->>'authorEn', ''),
      v_lecture->>'category',
      v_lecture->>'summaryUk',
      COALESCE(v_lecture->>'summaryEn', ''),
      v_lecture->>'image',
      NULLIF(v_lecture->>'videoUrl', ''),
      NULLIF(v_lecture->>'presentationUrl', ''),
      NULLIF(v_lecture->>'authorBioUk', ''),
      NULLIF(v_lecture->>'authorBioEn', ''),
      CASE
        WHEN jsonb_typeof(v_lecture->'sources') = 'array' THEN (v_lecture->'sources')::TEXT
        ELSE NULL
      END,
      FALSE
    );
  END LOOP;

  RETURN NEXT v_event;
END;
$$;

REVOKE ALL ON FUNCTION public.create_event_with_lectures(JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_event_with_lectures(UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_event_with_lectures(JSONB, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_event_with_lectures(UUID, JSONB, JSONB) TO authenticated, service_role;

COMMIT;
