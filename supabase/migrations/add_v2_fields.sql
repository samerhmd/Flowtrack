ALTER TABLE physio_logs
  ADD COLUMN sleep_hours numeric,
  ADD COLUMN sleep_quality int,
  ADD COLUMN resting_hr int,
  ADD COLUMN hrv_score int,
  ADD COLUMN caffeine_total_mg numeric,
  ADD COLUMN caffeine_last_intake_time timestamptz,
  ADD COLUMN bed_time timestamptz,
  ADD COLUMN wake_time timestamptz;

ALTER TABLE sessions
  ADD COLUMN environment text,
  ADD COLUMN noise text,
  ADD COLUMN session_type text,
  ADD COLUMN distraction_level int;
