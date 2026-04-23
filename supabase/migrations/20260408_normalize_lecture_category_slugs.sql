BEGIN;

-- Remove rows that still do not match strict category-color pairs.
DELETE FROM "EventLecture"
WHERE (("category", "categoryColor") IN (
  ('tech', 'blue'),
  ('nature', 'green'),
  ('artes', 'red'),
  ('wild-card', 'orange')
)) IS NOT TRUE;

DELETE FROM "Lecture"
WHERE (("category", "categoryColor") IN (
  ('tech', 'blue'),
  ('nature', 'green'),
  ('artes', 'red'),
  ('wild-card', 'orange')
)) IS NOT TRUE;

-- Enforce non-nullability for category fields.
ALTER TABLE "Lecture"
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "categoryColor" SET NOT NULL;

ALTER TABLE "EventLecture"
  ALTER COLUMN "category" SET NOT NULL,
  ALTER COLUMN "categoryColor" SET NOT NULL;

-- Replace category-color check constraints with slug-based constraints.
ALTER TABLE "Lecture"
  DROP CONSTRAINT IF EXISTS "lecture_category_color_pair_check";

ALTER TABLE "EventLecture"
  DROP CONSTRAINT IF EXISTS "eventlecture_category_color_pair_check";

ALTER TABLE "Lecture"
  ADD CONSTRAINT "lecture_category_color_pair_check"
  CHECK (("category", "categoryColor") IN (
    ('tech', 'blue'),
    ('nature', 'green'),
    ('artes', 'red'),
    ('wild-card', 'orange')
  ));

ALTER TABLE "EventLecture"
  ADD CONSTRAINT "eventlecture_category_color_pair_check"
  CHECK (("category", "categoryColor") IN (
    ('tech', 'blue'),
    ('nature', 'green'),
    ('artes', 'red'),
    ('wild-card', 'orange')
  ));

COMMIT;
