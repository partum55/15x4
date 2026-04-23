BEGIN;

UPDATE profiles
SET role = 'user'
WHERE role IS NULL
  OR role NOT IN ('user', 'lector', 'admin');

ALTER TABLE profiles
  ALTER COLUMN role SET DEFAULT 'user',
  ALTER COLUMN role SET NOT NULL;

ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('user', 'lector', 'admin'));

ALTER TABLE profiles
  DROP COLUMN IF EXISTS status;

COMMIT;
