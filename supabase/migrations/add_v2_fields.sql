ALTER TABLE physio_logs
  ADD COLUMN IF NOT EXISTS sleep_hours numeric,
  ADD COLUMN IF NOT EXISTS sleep_quality int,
  ADD COLUMN IF NOT EXISTS resting_hr int,
  ADD COLUMN IF NOT EXISTS hrv_score int,
  ADD COLUMN IF NOT EXISTS caffeine_total_mg numeric,
  ADD COLUMN IF NOT EXISTS caffeine_last_intake_time timestamptz,
  ADD COLUMN IF NOT EXISTS bed_time timestamptz,
  ADD COLUMN IF NOT EXISTS wake_time timestamptz;

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS environment text,
  ADD COLUMN IF NOT EXISTS noise text,
  ADD COLUMN IF NOT EXISTS session_type text,
  ADD COLUMN IF NOT EXISTS distraction_level int;
