BEGIN;

CREATE TABLE IF NOT EXISTS public.rate_limit_store (
  key       TEXT PRIMARY KEY,
  count     INTEGER NOT NULL DEFAULT 0,
  reset_at  TIMESTAMPTZ NOT NULL
);

-- Remove expired rows before inserting to keep the table small
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_key            TEXT,
  p_window_seconds INTEGER,
  p_limit          INTEGER
)
RETURNS TABLE(success BOOLEAN, current_count INTEGER, reset_at TIMESTAMPTZ)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_now      TIMESTAMPTZ := NOW();
  v_reset_at TIMESTAMPTZ;
  v_count    INTEGER;
BEGIN
  -- Purge expired entry for this key so the upsert starts fresh
  DELETE FROM public.rate_limit_store
  WHERE key = p_key AND rate_limit_store.reset_at < v_now;

  INSERT INTO public.rate_limit_store (key, count, reset_at)
    VALUES (p_key, 1, v_now + (p_window_seconds || ' seconds')::INTERVAL)
  ON CONFLICT (key) DO UPDATE
    SET count = public.rate_limit_store.count + 1
  RETURNING public.rate_limit_store.count, public.rate_limit_store.reset_at
  INTO v_count, v_reset_at;

  RETURN QUERY SELECT (v_count <= p_limit), v_count, v_reset_at;
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_rate_limit TO service_role;

-- Disable RLS on this table; it is only accessible via service role
ALTER TABLE public.rate_limit_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rate_limit_service_role_only"
ON public.rate_limit_store
USING (false);

COMMIT;
