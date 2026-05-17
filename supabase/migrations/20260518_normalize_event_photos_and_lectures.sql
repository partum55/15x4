BEGIN;

ALTER TABLE public."Event"
  ADD COLUMN IF NOT EXISTS "eventPhotosUrl" TEXT;

ALTER TABLE public."Lecture"
  ADD COLUMN IF NOT EXISTS "presentationUrl" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'event_photos_url_http'
      AND conrelid = 'public."Event"'::regclass
  ) THEN
    ALTER TABLE public."Event"
      ADD CONSTRAINT event_photos_url_http
      CHECK ("eventPhotosUrl" IS NULL OR "eventPhotosUrl" ~* '^https?://');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lecture_presentation_url_http'
      AND conrelid = 'public."Lecture"'::regclass
  ) THEN
    ALTER TABLE public."Lecture"
      ADD CONSTRAINT lecture_presentation_url_http
      CHECK ("presentationUrl" IS NULL OR "presentationUrl" ~* '^https?://');
  END IF;
END;
$$;

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public."Lecture"'::regclass
      AND pg_get_constraintdef(oid) ILIKE '%categoryColor%'
  LOOP
    EXECUTE format('ALTER TABLE public."Lecture" DROP CONSTRAINT IF EXISTS %I', constraint_record.conname);
  END LOOP;
END;
$$;

ALTER TABLE public."Lecture"
  DROP COLUMN IF EXISTS duration,
  DROP COLUMN IF EXISTS "socialLinks",
  DROP COLUMN IF EXISTS "eventCity",
  DROP COLUMN IF EXISTS "eventDate",
  DROP COLUMN IF EXISTS "eventPhotosUrl",
  DROP COLUMN IF EXISTS "categoryColor";

CREATE OR REPLACE FUNCTION public.create_event_with_lectures(
  p_event JSONB,
  p_lectures JSONB DEFAULT '[]'::JSONB
)
RETURNS SETOF public."Event"
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_event public."Event"%ROWTYPE;
  v_lecture JSONB;
BEGIN
  INSERT INTO public."Event" (
    "titleUk",
    "titleEn",
    "descriptionUk",
    "descriptionEn",
    city,
    "cityUk",
    "cityEn",
    date,
    "locationUk",
    "locationEn",
    time,
    image,
    "registrationUrl",
    "eventPhotosUrl",
    "isPublic",
    "userId"
  )
  VALUES (
    p_event->>'titleUk',
    COALESCE(p_event->>'titleEn', ''),
    COALESCE(p_event->>'descriptionUk', ''),
    COALESCE(p_event->>'descriptionEn', ''),
    (p_event->>'city')::public.city_id,
    p_event->>'cityUk',
    COALESCE(p_event->>'cityEn', ''),
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

  FOR v_lecture IN SELECT value FROM jsonb_array_elements(COALESCE(p_lectures, '[]'::JSONB)) AS item(value)
  LOOP
    INSERT INTO public."Lecture" (
      "eventId",
      "userId",
      slot,
      "titleUk",
      "titleEn",
      "authorUk",
      "authorEn",
      category,
      "summaryUk",
      "summaryEn",
      image,
      "videoUrl",
      "presentationUrl",
      "authorBioUk",
      "authorBioEn",
      sources,
      "isPublic"
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
  p_event JSONB,
  p_lectures JSONB DEFAULT '[]'::JSONB
)
RETURNS SETOF public."Event"
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_event public."Event"%ROWTYPE;
  v_lecture JSONB;
BEGIN
  UPDATE public."Event"
  SET
    "titleUk" = p_event->>'titleUk',
    "titleEn" = COALESCE(p_event->>'titleEn', ''),
    "descriptionUk" = COALESCE(p_event->>'descriptionUk', ''),
    "descriptionEn" = COALESCE(p_event->>'descriptionEn', ''),
    city = (p_event->>'city')::public.city_id,
    "cityUk" = p_event->>'cityUk',
    "cityEn" = COALESCE(p_event->>'cityEn', ''),
    date = (p_event->>'date')::DATE,
    "locationUk" = p_event->>'locationUk',
    "locationEn" = COALESCE(p_event->>'locationEn', ''),
    time = (p_event->>'time')::TIME,
    image = p_event->>'image',
    "registrationUrl" = NULLIF(p_event->>'registrationUrl', ''),
    "eventPhotosUrl" = NULLIF(p_event->>'eventPhotosUrl', '')
  WHERE id = p_event_id
  RETURNING * INTO v_event;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  DELETE FROM public."Lecture"
  WHERE "eventId" = p_event_id;

  FOR v_lecture IN SELECT value FROM jsonb_array_elements(COALESCE(p_lectures, '[]'::JSONB)) AS item(value)
  LOOP
    INSERT INTO public."Lecture" (
      "eventId",
      "userId",
      slot,
      "titleUk",
      "titleEn",
      "authorUk",
      "authorEn",
      category,
      "summaryUk",
      "summaryEn",
      image,
      "videoUrl",
      "presentationUrl",
      "authorBioUk",
      "authorBioEn",
      sources,
      "isPublic"
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_create_profile_public ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.set_profiles_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.set_updated_at_profiles() CASCADE;

REVOKE ALL ON FUNCTION public.create_event_with_lectures(JSONB, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_event_with_lectures(UUID, JSONB, JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_event_with_lectures(JSONB, JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_event_with_lectures(UUID, JSONB, JSONB) TO authenticated, service_role;

COMMIT;
