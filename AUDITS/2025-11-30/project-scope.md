# Project Scope — Full Architecture, Logic, and Data Flow

## 1. Overview
- FlowTrack is a personal productivity and well-being tracker. It records:
  - Daily physio snapshots (energy, mood, focus, stress, sleep/caffeine context).
  - Deep-work sessions (start/end, duration, flow rating, environment).
  - A configurable flow recipe (ordered practices).
  - Event-based logging for caffeine and water.
  - Tier-0 Garmin CSV imports (daily aggregates) merged into insights.
- Core goal: help users understand how sleep, caffeine, environment, context, HRV, resting HR, and training load correlate with subjective flow state.

## 2. Architecture
- Frontend: Next.js 16 (App Router), React, Tailwind CSS.
- Data: Supabase (Postgres + Auth + RLS).
- Clients:
  - Browser client (`lib/supabaseClient.ts`) via `@supabase/ssr` `createBrowserClient`.
  - Server client (`lib/supabaseServer.ts`) via `@supabase/ssr` `createServerClient` with cookie read-only integration for server components.
- Server logic via Next route handlers (`app/api/...`).
- RLS-first policy: user-scoped reads/writes via Supabase; service-role endpoints for maintenance/admin only.

## 3. Directory Structure and Responsibilities
- `flowtrack/app` — App Router pages:
  - `layout.tsx`, `page.tsx` (redirects to `/dashboard`).
  - Pages: `/dashboard`, `/today`, `/insights`, `/import`, `/export`, `/login`.
  - Resource routes: `/physio/new`, `/physio/history`, `/physio/history/[date]`, `/sessions`, `/sessions/new`, `/sessions/[id]/edit`, `/flow-recipe`.
  - API routes: `/api/physio/upsert`, `/api/sessions/create`, `/api/admin/seed-user`, `/api/import/garmin`.
  - Loading/error boundaries present in certain route directories.
- `flowtrack/components` — React components:
  - UI primitives (Buttons), feature components (PhysioForm, SessionWizard, FlowRecipeView).
  - Insights components (`components/insights/InsightsView.tsx`) — client component rendering daily trends, filters, and optional chart.
  - Logging components: `components/logging/CaffeineQuickLog.tsx`, `components/logging/WaterQuickLog.tsx`.
  - Import UI: `components/import/GarminImportView.tsx`.
- `flowtrack/lib` — Helpers:
  - Supabase clients (`supabaseClient.ts`, `supabaseServer.ts`).
  - DB helpers (`lib/db/*`): physio, sessions, flowRecipe, dashboard, external, insights.
  - Import helpers (`lib/import/garmin.ts`) for CSV parsing and normalization.
- `supabase/migrations` — SQL migrations:
  - Tables: `physio_logs`, `sessions`, `flow_recipe_items`, `caffeine_events`, `water_events`, `external_daily_snapshots`.
  - RLS policies for each table ensuring `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE.
- `docs/` — Project docs.

## 4. Database Schema and ERD Summary
- `physio_logs`: daily snapshot; sleep/caffeine/HR metrics; `day_tags`/`day_notes`; RLS enabled; recommend unique `(user_id,date)`.
- `sessions`: deep-work blocks; duration/flow rating; RLS enabled.
- `flow_recipe_items`: ordered practices; RLS enabled.
- `caffeine_events`: dose events; optional relation to `sessions`; RLS enabled.
- `water_events`: intake events; RLS enabled.
- `external_daily_snapshots`: wearable imports (provider 'garmin'); daily aggregates; RLS enabled.
- ERD:
  - `auth.users` 1—N `physio_logs`, `sessions`, `flow_recipe_items`, `caffeine_events`, `water_events`, `external_daily_snapshots`.
  - `sessions` 1—N `caffeine_events` via `session_id`.

## 5. Domain Workflows
- Physio: wizard → upsert `physio_logs` by `(user_id,date)`.
- Sessions: create/list/edit; compute duration and store flow rating.
- Flow Recipe: server fetch initial; client CRUD.
- Quick Actions: dashboard buttons + logging cards; import CTA.
- Import (Tier 0 Garmin CSV): upload 4 CSVs → parse → normalize date (strict 4-digit year) → build daily snapshots → upsert `external_daily_snapshots` with `user_id`.
- Insights: compute per-day metrics from sessions/physio; merge external snapshots (physio-first precedence) to fill sleep/HRV/resting HR/training minutes; client filters (range, exclude tags).

## 6. State Machines and Statuses
- Sessions wizard phases (pre → in → post) produce finalized row.
- Physio daily rows: created/updated, not formal states.

## 7. Validation and Rules
- Client validation: 0–10 scales; numeric fields; context trimmed.
- DB constraints: checks for allowed ranges.
- Import: strict date parsing; reject unsupported formats or out-of-range years.

## 8. Services, Jobs, Commands, Middleware
- DB helpers in `lib/db/*`; no queued jobs; imports via HTTP route.

## 9. API Endpoints
- `/api/physio/upsert` — service-role upsert; bearer auth.
- `/api/sessions/create` — service-role insert; bearer auth.
- `/api/admin/seed-user` — admin seeding.
- `/api/import/garmin` — authenticated multipart; parse CSVs and upsert external snapshots.

## 10. Security
- Auth via Supabase session; RLS on tables.
- Service role keys only server-side; no CSRF/rate limiting currently.

## 11. Analytics/ETL
- On-demand insights; external snapshots enrich analytics; consider caching/materialization later.

## 12. Background Jobs/Scheduling
- None.

## 13. Caching
- None; insights computed on demand; add indices for performance.

## 14. Error Handling
- Route handlers return JSON errors; server pages catch and fallback.
- Dev logs for import sample dates.

## 15. Testing
- No test suite; manual verification.

## 16. Ops Assumptions
- Env vars set for Supabase; Vercel deployment; cookie read-only in server components.

## 17. Appendices
- Day tags: `partner_sleepover`, `travel_day`, `sick`, `hangover`, `big_shooting_day`, `heavy_conflict`, `social_overload`, `social_recharge`.
- Date rules: 4-digit year required; [2010, 2100] only.

