BEGIN;

ALTER TABLE "Event"
  ALTER COLUMN "date" TYPE date
  USING CASE
    WHEN "date"::text ~ '^\d{4}-\d{2}-\d{2}$' THEN ("date"::text)::date
    WHEN "date"::text ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN to_date("date"::text, 'DD/MM/YYYY')
    WHEN "date"::text ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN to_date("date"::text, 'DD/MM/YY')
    WHEN "date"::text ~ '^\d{1,2}/\d{1,2}$' THEN make_date(EXTRACT(YEAR FROM now())::int, split_part("date"::text, '/', 2)::int, split_part("date"::text, '/', 1)::int)
    ELSE ("date"::text)::date
  END,
  ALTER COLUMN "time" TYPE time
  USING CASE
    WHEN "time"::text ~ '^\d{1,2}:\d{2}(:\d{2})?$' THEN ("time"::text)::time
    ELSE ("time"::text)::time
  END;

CREATE INDEX IF NOT EXISTS "event_date_time_idx" ON "Event"("date", "time");

COMMIT;
