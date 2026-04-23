BEGIN;

create extension if not exists pgcrypto;

DROP TABLE IF EXISTS "EventLecture";
DROP TABLE IF EXISTS "Lecture";
DROP TABLE IF EXISTS "Event";

CREATE TABLE "Event" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "titleUk" text NOT NULL,
  "titleEn" text NOT NULL DEFAULT '',
  "descriptionUk" text NOT NULL DEFAULT '',
  "descriptionEn" text NOT NULL DEFAULT '',
  "cityUk" text NOT NULL,
  "cityEn" text NOT NULL DEFAULT '',
  "locationUk" text NOT NULL,
  "locationEn" text NOT NULL DEFAULT '',
  "date" text NOT NULL,
  "time" text NOT NULL,
  "image" text NOT NULL,
  "registrationUrl" text,
  "isPublic" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE "Lecture" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "eventId" uuid NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
  "userId" uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "slot" smallint NOT NULL CHECK ("slot" BETWEEN 1 AND 4),
  "category" text NOT NULL,
  "categoryColor" text NOT NULL,
  "authorUk" text NOT NULL,
  "authorEn" text NOT NULL DEFAULT '',
  "image" text NOT NULL,
  "titleUk" text NOT NULL,
  "titleEn" text NOT NULL DEFAULT '',
  "summaryUk" text NOT NULL,
  "summaryEn" text NOT NULL DEFAULT '',
  "duration" text,
  "videoUrl" text,
  "authorBioUk" text,
  "authorBioEn" text,
  "eventCity" text,
  "eventDate" text,
  "eventPhotosUrl" text,
  "sources" jsonb,
  "socialLinks" jsonb,
  "isPublic" boolean NOT NULL DEFAULT false,
  "createdAt" timestamptz NOT NULL DEFAULT now(),
  "updatedAt" timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT "lecture_category_color_pair_check"
    CHECK (("category", "categoryColor") IN (
      ('tech', 'blue'),
      ('nature', 'green'),
      ('artes', 'red'),
      ('wild-card', 'orange')
    )),
  CONSTRAINT "lecture_event_slot_unique" UNIQUE ("eventId", "slot")
);

CREATE INDEX "lecture_event_idx" ON "Lecture"("eventId");
CREATE INDEX "event_user_idx" ON "Event"("userId");
CREATE INDEX "lecture_user_idx" ON "Lecture"("userId");

COMMIT;
