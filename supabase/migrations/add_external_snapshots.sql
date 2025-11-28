CREATE TABLE IF NOT EXISTS public.integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE DEFAULT auth.uid(),
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  status text DEFAULT 'active',
  external_user_id text,
  UNIQUE (user_id, provider)
);

CREATE TABLE IF NOT EXISTS public.external_daily_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE DEFAULT auth.uid(),
  provider text NOT NULL,
  "date" date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  sleep_hours numeric,
  sleep_quality int,
  resting_hr int,
  hrv_score int,
  steps int,
  calories_total numeric,
  calories_carbs numeric,
  calories_fat numeric,
  calories_protein numeric,

  raw_payload jsonb,

  UNIQUE (user_id, provider, "date")
);

ALTER TABLE public.integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_daily_snapshots ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'integration_connections'
      AND policyname = 'integration_connections_select_own'
  ) THEN
    CREATE POLICY "integration_connections_select_own"
      ON public.integration_connections
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'integration_connections'
      AND policyname = 'integration_connections_modify_own'
  ) THEN
    CREATE POLICY "integration_connections_insert_own"
      ON public.integration_connections
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "integration_connections_update_own"
      ON public.integration_connections
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "integration_connections_delete_own"
      ON public.integration_connections
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'external_daily_snapshots'
      AND policyname = 'external_daily_snapshots_select_own'
  ) THEN
    CREATE POLICY "external_daily_snapshots_select_own"
      ON public.external_daily_snapshots
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'external_daily_snapshots'
      AND policyname = 'external_daily_snapshots_modify_own'
  ) THEN
    CREATE POLICY "external_daily_snapshots_insert_own"
      ON public.external_daily_snapshots
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "external_daily_snapshots_update_own"
      ON public.external_daily_snapshots
      FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
    CREATE POLICY "external_daily_snapshots_delete_own"
      ON public.external_daily_snapshots
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
