CREATE TABLE IF NOT EXISTS public.caffeine_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_time timestamptz NOT NULL DEFAULT now(),
  "date" date NOT NULL DEFAULT now()::date,
  mg numeric NOT NULL,
  source text,
  label text,
  session_id uuid REFERENCES public.sessions (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.water_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_time timestamptz NOT NULL DEFAULT now(),
  "date" date NOT NULL DEFAULT now()::date,
  ml int NOT NULL,
  source text
);

ALTER TABLE public.physio_logs
  ADD COLUMN IF NOT EXISTS day_tags text[],
  ADD COLUMN IF NOT EXISTS day_notes text;

ALTER TABLE public.caffeine_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.water_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caffeine_events'
      AND policyname = 'caffeine_events_select_own'
  ) THEN
    CREATE POLICY "caffeine_events_select_own"
      ON public.caffeine_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caffeine_events'
      AND policyname = 'caffeine_events_insert_own'
  ) THEN
    CREATE POLICY "caffeine_events_insert_own"
      ON public.caffeine_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caffeine_events'
      AND policyname = 'caffeine_events_update_own'
  ) THEN
    CREATE POLICY "caffeine_events_update_own"
      ON public.caffeine_events
      FOR UPDATE
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'caffeine_events'
      AND policyname = 'caffeine_events_delete_own'
  ) THEN
    CREATE POLICY "caffeine_events_delete_own"
      ON public.caffeine_events
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'water_events'
      AND policyname = 'water_events_select_own'
  ) THEN
    CREATE POLICY "water_events_select_own"
      ON public.water_events
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'water_events'
      AND policyname = 'water_events_insert_own'
  ) THEN
    CREATE POLICY "water_events_insert_own"
      ON public.water_events
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'water_events'
      AND policyname = 'water_events_update_own'
  ) THEN
    CREATE POLICY "water_events_update_own"
      ON public.water_events
      FOR UPDATE
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'water_events'
      AND policyname = 'water_events_delete_own'
  ) THEN
    CREATE POLICY "water_events_delete_own"
      ON public.water_events
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END
$$;
