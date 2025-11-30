# Project Scope Diff Report

## Previous Scope Availability
- No previous `project-scope.md` was provided for automated diff comparison in this audit context.
- Skipping detailed comparison.

## Summary of Recently Added/Changed (based on current codebase state)
- Added: Tier 0 Garmin CSV import (`lib/import/garmin.ts`, `app/api/import/garmin/route.ts`).
- Added: `external_daily_snapshots` table and helper (`lib/db/external.ts`).
- Added: Insights merge from external snapshots with physio-first precedence (`lib/db/insights.ts`, updates in `components/insights/InsightsView.tsx`).
- Added: Quick logging components and dashboard integration (`CaffeineQuickLog.tsx`, `WaterQuickLog.tsx`).
- Hardened cookie usage in server components; guards for `auth.getUser`.
- Improved CSV parser (quoted fields) and date normalization with strict year.
- Docs updated to reflect import and insights precedence.

