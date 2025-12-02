# Integrations Plan (Garmin & MyFitnessPal)

## Goal
Prepare FlowTrack to ingest normalized daily snapshots from Garmin and MyFitnessPal without implementing HTTP integrations yet.

## Schema
Two new tables (with RLS):
- `integration_connections`
  - Tracks per-user provider connections (provider, status, external_user_id)
  - Unique `(user_id, provider)`
- `external_daily_snapshots`
  - Normalized daily values per provider and date
  - Includes sleep_hours, sleep_quality, resting_hr, hrv_score, steps, calories_total/carbs/fat/protein, plus `raw_payload` for debugging
  - Unique `(user_id, provider, date)`

RLS: users can only read/modify their own rows.

## Mapping Examples
- Garmin → `external_daily_snapshots` → influences `physio_logs`
  - Total sleep duration → `sleep_hours`
  - HRV → `hrv_score`
  - Resting HR → `resting_hr`
- MyFitnessPal → `external_daily_snapshots` → influences `physio_logs`
  - Daily calories/macros → `calories_total`, `calories_carbs`, `calories_fat`, `calories_protein`

Later, derived fields can populate or inform `physio_logs` and insights.

## Helper Stub
We provide a placeholder helper to upsert daily snapshots (no network calls yet):
- `flowtrack/lib/db/external.ts`
  - `upsertExternalDailySnapshot(supabase, input)`
  - Upserts by `(user_id, provider, date)`, returns the full row

## Notes
- No HTTP integration implemented in v2/v3 context; this is schema + helper only.
- Date normalization: importer enforces strict `YYYY-MM-DD` within year range [2010, 2100]. Rows with invalid dates are skipped and logged.
- Merge precedence in insights: physio fields take precedence; if physio sleep is missing, external sleep (e.g., Garmin) is used after numeric coercion.
- Future work: OAuth/device linking, scheduled ingestion jobs, reconciliation of provider data with local `physio_logs`.
