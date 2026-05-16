BEGIN;

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
      "categoryColor",
      "summaryUk",
      "summaryEn",
      image,
      "videoUrl",
      "authorBioUk",
      "authorBioEn",
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
      v_lecture->>'categoryColor',
      v_lecture->>'summaryUk',
      COALESCE(v_lecture->>'summaryEn', ''),
      v_lecture->>'image',
      NULLIF(v_lecture->>'videoUrl', ''),
      NULLIF(v_lecture->>'authorBioUk', ''),
      NULLIF(v_lecture->>'authorBioEn', ''),
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
    "registrationUrl" = NULLIF(p_event->>'registrationUrl', '')
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
      "categoryColor",
      "summaryUk",
      "summaryEn",
      image,
      "videoUrl",
      "authorBioUk",
      "authorBioEn",
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
      v_lecture->>'categoryColor',
      v_lecture->>'summaryUk',
      COALESCE(v_lecture->>'summaryEn', ''),
      v_lecture->>'image',
      NULLIF(v_lecture->>'videoUrl', ''),
      NULLIF(v_lecture->>'authorBioUk', ''),
      NULLIF(v_lecture->>'authorBioEn', ''),
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
