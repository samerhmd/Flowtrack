DO $$
BEGIN
  -- sessions: insert policy (own rows)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sessions'
      AND policyname = 'sessions_insert_own'
  ) THEN
    CREATE POLICY "sessions_insert_own"
      ON public.sessions
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- sessions: update policy (own rows)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'sessions'
      AND policyname = 'sessions_update_own'
  ) THEN
    CREATE POLICY "sessions_update_own"
      ON public.sessions
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- physio_logs: insert policy (own rows)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physio_logs'
      AND policyname = 'physio_insert_own'
  ) THEN
    CREATE POLICY "physio_insert_own"
      ON public.physio_logs
      FOR INSERT
      WITH CHECK (user_id = auth.uid());
  END IF;

  -- physio_logs: update policy (own rows)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'physio_logs'
      AND policyname = 'physio_update_own'
  ) THEN
    CREATE POLICY "physio_update_own"
      ON public.physio_logs
      FOR UPDATE
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END
$$;
