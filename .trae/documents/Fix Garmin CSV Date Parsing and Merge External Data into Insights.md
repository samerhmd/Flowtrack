## Overview
We’ll resolve the incorrect 2001 dates by hardening the Garmin CSV date parsing and ensure imported daily snapshots show in /insights by merging external data with physio-first precedence.

## Root Cause Investigation
- Add temporary logging in the import path to capture sample raw date strings from each CSV (first 5 rows per file) to validate patterns encountered (without logging full payloads).
- Confirm which headers provide date fields per file: Sleep, HRV Status, Heart Rate, Activities. Validate header normalization and field alignment (quoted values).

## Parsing Improvements (lib/import/garmin.ts)
- Replace current fallback `new Date(s)` usage with an explicit normalizer that handles broader patterns and never emits year 2001 for partial dates.
- Implement `normalizeGarminDate(raw)` to support:
  - `YYYY-MM-DD`
  - `YYYY/MM/DD`
  - `MM-DD-YYYY`, `DD-MM-YYYY`
  - `MM/DD/YYYY`, `DD/MM/YYYY`
  - Two-digit years: `MM/DD/YY` or `DD/MM/YY` mapped to 20YY
  - Month names: `DD-MMM-YYYY`, `MMM DD, YYYY`
  - ISO strings with time: `YYYY-MM-DDTHH:mm:ssZ` or `YYYY-MM-DD HH:mm`
- Handle date/time with spaces: take full string into normalizer (it will extract yyyy-mm-dd).
- If date still cannot be parsed, skip the row and log once per file-type a count of skipped rows.
- Update all four parsers to exclusively use `normalizeGarminDate` and remove `toIsoDate`.
- Improve `parseSimpleCsv` to naïvely handle quotes so commas inside quoted cells don’t break column alignment (small regex/state-based splitter).

## External Snapshots → Insights Merge (lib/db/insights.ts)
- Query `external_daily_snapshots` for the current user and range with `provider='garmin'`.
- Select: `date, sleep_hours, sleep_quality, resting_hr, hrv_score, raw_payload` (read `training_minutes` from `raw_payload.training_minutes`).
- Build `externalByDate` map; prefer rows with provider `garmin` if multiple.
- Extend `DailyInsightRow` with merged fields:
  - `merged_sleep_hours`, `merged_hrv_score`, `merged_resting_hr`
- Merge rule:
  - Physio values win when present
  - External fills gaps
- Preserve existing tag filters and flow aggregation logic.
- Log small dev-only summary: count of external rows loaded and sample dates in the window.

## Insights UI Update (components/insights/InsightsView.tsx)
- Use `merged_sleep_hours` when rendering the “Daily trends (avg flow vs sleep/caffeine)” list.
- Keep caffeine display logic as-is (from physio). If charts exist, wire `merged_*` fields into chartData for sleep/HRV/resting HR.

## Verification Steps
- Re-run Garmin import with fixed date parsing using the same CSVs.
- Confirm API response sample dates show correct years (e.g., 2025-11-02).
- Verify external rows created in Supabase have correct `date` values.
- Visit `/insights` with 30/90 day range:
  - Days with only Garmin: sleep shows as `Xh` (not `–h`)
  - Days with Physio and Garmin: Physio sleep wins
- Ensure no runtime TypeErrors or dev overlay aborts beyond benign HMR warnings.

## Documentation Update
- Update `/insights` section in `PROJECT_SCOPE.md` to state sleep/HR/HRV are sourced from physio first, then external snapshots (Garmin), with precedence to manual entries.

## Safety & Backward Compatibility
- No changes to RLS or auth.
- If there are no external snapshots, `/insights` behaves exactly as before.

## Deliverables
- Hardened date parser covering common Garmin formats.
- Updated import parsers to use the new normalizer and improved CSV splitting.
- Extended insights data helper and UI to use merged fields.
- Dev-only logging for sample external dates and loaded count.
- Documentation updated accordingly.