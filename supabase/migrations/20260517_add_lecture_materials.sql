BEGIN;

ALTER TABLE public."Lecture"
  ADD COLUMN IF NOT EXISTS "presentationUrl" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'lecture_presentation_url_http'
  ) THEN
    ALTER TABLE public."Lecture"
      ADD CONSTRAINT lecture_presentation_url_http
      CHECK ("presentationUrl" IS NULL OR "presentationUrl" ~* '^https?://');
  END IF;
END;
$$;

COMMIT;
