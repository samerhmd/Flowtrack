# Project Risks

## Architecture Risks
- 🟠 Lack of caching for insights windows.
- 🟡 No queue system for heavy imports.

## Data Integrity Risks
- 🔴 Missing unique index `(user_id, date)` on `physio_logs`.
- 🟠 `training_minutes` stored in `raw_payload` (not normalized) in external snapshots.
- 🟡 Skipped rows on unsupported date formats may hide data issues.

## Domain Logic Risks
- 🟠 Physio-first precedence needs user-facing clarity.
- 🟡 Time-of-day assumptions may ignore time zones.

## Security Risks
- 🟠 No CSRF/rate limiting on POST routes.
- 🟡 Ensure admin/service-role endpoints are server-only.

## Operational/Queue/Cron Risks
- 🟠 Large CSV uploads synchronous; timeouts under load.
- 🟡 No scheduled jobs for ETL/backfill.

## Reporting/ETL Risks
- 🟠 On-demand insights may slow with larger datasets; no pre-aggregation.
- 🟡 No freshness indicators.

## Testing Coverage Risks
- 🔴 No tests for parsers, insights, or DB helpers.
- 🟠 No e2e coverage for core flows.

