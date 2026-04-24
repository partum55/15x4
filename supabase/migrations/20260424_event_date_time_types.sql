BEGIN;

ALTER TABLE "Event"
  ALTER COLUMN "date" TYPE date
  USING CASE
    WHEN "date" ~ '^\d{4}-\d{2}-\d{2}$' THEN "date"::date
    WHEN "date" ~ '^\d{1,2}/\d{1,2}/\d{4}$' THEN to_date("date", 'DD/MM/YYYY')
    WHEN "date" ~ '^\d{1,2}/\d{1,2}/\d{2}$' THEN to_date("date", 'DD/MM/YY')
    WHEN "date" ~ '^\d{1,2}/\d{1,2}$' THEN make_date(EXTRACT(YEAR FROM now())::int, split_part("date", '/', 2)::int, split_part("date", '/', 1)::int)
    ELSE "date"::date
  END,
  ALTER COLUMN "time" TYPE time
  USING CASE
    WHEN "time" ~ '^\d{1,2}:\d{2}(:\d{2})?$' THEN "time"::time
    ELSE "time"::time
  END;

CREATE INDEX IF NOT EXISTS "event_date_time_idx" ON "Event"("date", "time");

COMMIT;
