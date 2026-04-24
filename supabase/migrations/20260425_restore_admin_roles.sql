-- One-time fix: the 20260423 migration created the profiles table fresh
-- and inserted all existing auth users with role='user', resetting admin roles.
-- This migration restores known admin accounts.

UPDATE public.profiles
SET role = 'admin', updated_at = now()
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'partumyt@gmail.com'
)
AND role = 'user';
