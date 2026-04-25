BEGIN;

-- Event table RLS
ALTER TABLE "Event" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "events_public_select"
ON "Event" FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

CREATE POLICY "events_owner_select_own"
ON "Event" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

CREATE POLICY "events_owner_insert"
ON "Event" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "events_owner_update"
ON "Event" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "events_owner_delete"
ON "Event" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

-- Lecture table RLS
ALTER TABLE "Lecture" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lectures_public_select"
ON "Lecture" FOR SELECT
TO anon, authenticated
USING ("isPublic" = true);

CREATE POLICY "lectures_owner_select_own"
ON "Lecture" FOR SELECT
TO authenticated
USING (auth.uid() = "userId");

CREATE POLICY "lectures_owner_insert"
ON "Lecture" FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "lectures_owner_update"
ON "Lecture" FOR UPDATE
TO authenticated
USING (auth.uid() = "userId")
WITH CHECK (auth.uid() = "userId");

CREATE POLICY "lectures_owner_delete"
ON "Lecture" FOR DELETE
TO authenticated
USING (auth.uid() = "userId");

-- Admin operations use supabaseAdmin (service role) which bypasses RLS by design.

COMMIT;
