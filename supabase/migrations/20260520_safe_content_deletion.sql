-- Safe Migration: Protect content from CASCADE deletion and improve data integrity
BEGIN;

-- 1. Modify "Event" table to allow userId to be NULL and change ON DELETE to SET NULL
ALTER TABLE public."Event" 
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE public."Event"
  DROP CONSTRAINT IF EXISTS "Event_userId_fkey",
  ADD CONSTRAINT "Event_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL;

-- 2. Modify "Lecture" table to allow userId to be NULL and change ON DELETE to SET NULL
ALTER TABLE public."Lecture" 
  ALTER COLUMN "userId" DROP NOT NULL;

ALTER TABLE public."Lecture"
  DROP CONSTRAINT IF EXISTS "Lecture_userId_fkey",
  ADD CONSTRAINT "Lecture_userId_fkey" 
    FOREIGN KEY ("userId") 
    REFERENCES auth.users(id) 
    ON DELETE SET NULL;

-- 3. Add a check constraint to prevent publishing an event without lectures
-- Note: This is hard to do with a simple constraint in Postgres without a trigger or materialized view.
-- Instead, we will handle this in the API layer for reliability.

COMMIT;
