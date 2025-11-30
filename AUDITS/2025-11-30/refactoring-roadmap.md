# Refactoring Roadmap

## P0: Must Fix Immediately
- Add indices: `physio_logs (user_id, date)` unique; `sessions (user_id, date)`.
- Import guards: file size/MIME type.
- Insights performance: caching/limits.

## P1: Should Fix Next
- Tests: parsers, import route, insights merge precedence.
- Healthcheck endpoint.
- CSRF/rate limiting on POST routes.

## P2: Medium Effort
- Service layer: imports and insights computation.
- ETL/reporting: materialized views or scheduled aggregation.

## P3: Optional Polish
- UI polish: shared components; better error/success messages.
- Observability: metrics/logging.

## Module-by-Module Recommendations
- `lib/import/garmin.ts`: keep strict date normalization; add tests.
- `lib/db/insights.ts`: extract merge/precedence; test thoroughly.
- `app/api/import/garmin`: defensive logging; user-friendly errors.
- `lib/supabaseServer.ts`: maintain read-only cookie use in RSC.
- `components/insights/InsightsView.tsx`: wire merged fields to chart if present.

