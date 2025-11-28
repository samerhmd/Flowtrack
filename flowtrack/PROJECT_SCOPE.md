# FlowTrack Project Scope and Technical Overview

## Overview
- Purpose: Track daily physio state and deep-work/flow sessions with a simple Typeform-like UI, provide a dashboard summary, and manage a personal flow recipe.
- Stack: Next.js 16 (App Router), React, Tailwind CSS (utility classes), Supabase (Postgres + Auth + RLS).
- Monorepo layout: `flowtrack/` is the app root (contains `app/`, `lib/`, `components/`, `.env.local`, etc.).

## Architecture
- App Router pages (server/client components as noted):
  - `/` → redirects to `/dashboard` (server component)
  - `/dashboard` (client): loads auth and aggregates today/last 7 days via browser Supabase client
  - `/physio/new` (client): Typeform-style daily physio wizard
  - `/sessions` (client): list view of sessions
  - `/sessions/new` (client): session wizard (pre → in → post)
  - `/flow-recipe` (server + client): initial fetch server-side, client component for CRUD
  - `/physio/history` (server): list of past physio logs (last ~90 days)
  - `/physio/history/[date]` (client): edit a specific day’s physio
  - `/sessions/[id]/edit` (client): edit a specific session
  - `/today` (server): daily command center showing today’s physio snapshot, sleep/caffeine/water totals, quick log actions, and today’s sessions
- API Routes (server-only):
  - `POST /api/physio/upsert` → legacy/dev-only; normal UI flows use client helpers with RLS
  - `POST /api/sessions/create` → legacy/dev-only; normal UI flows use client helpers with RLS
  - `POST /api/admin/seed-user` → admin-only endpoint to create/confirm a user
- Supabase Clients:
  - `lib/supabaseClient.ts` → browser client via `@supabase/ssr` `createBrowserClient(url, anonKey)`
  - `lib/supabaseServer.ts` → server client via `@supabase/ssr` `createServerClient(url, anonKey, { cookies })`
- DB Helpers (`lib/db/*`): typed interfaces + minimal functions to select/insert/update, used by components/pages.

## Data Model (Supabase Postgres)
### caffeine_events
- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()`
  - `created_at timestamptz not null default now()`
  - `event_time timestamptz not null default now()`
  - `date date not null default now()::date`
  - `mg numeric not null`
  - `source text`
  - `label text`
  - `session_id uuid references public.sessions(id) on delete set null`

### water_events
- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()`
  - `created_at timestamptz not null default now()`
  - `event_time timestamptz not null default now()`
  - `date date not null default now()::date`
  - `ml int not null`
  - `source text`
### physio_logs
- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()`
  - `created_at timestamptz not null default now()`
  - `date date not null`
  - `energy int check (energy between 0 and 10)`
  - `mood int check (mood between 0 and 10)`
  - `focus_clarity int check (focus_clarity between 0 and 10)`
  - `stress int check (stress between 0 and 10)`
  - `context text`
  - `day_tags text[]`
  - `day_notes text`
  - Unique: `(user_id, date)`

### sessions
- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()`
  - `created_at timestamptz not null default now()`
  - `flow_recipe_version int`
  - `date date not null`
  - `start_time timestamptz not null`
  - `end_time timestamptz not null`
  - `duration_seconds int not null`
  - `activity text`
  - `flow_rating int check (flow_rating between 0 and 10)`
  - `notes text`

### flow_recipe_items
- Columns:
  - `id uuid primary key default gen_random_uuid()`
  - `user_id uuid not null references auth.users(id) on delete cascade default auth.uid()`
  - `created_at timestamptz not null default now()`
  - `updated_at timestamptz not null default now()`
  - `title text not null`
  - `notes text not null`
  - `order_index int default 0`

### RLS Policies
- Enabled on all tables.
- Users can only read/write rows where `user_id = auth.uid()`.
- Note: client-side writes can be blocked by RLS if update/insert policies are incomplete; server routes use the service role to perform writes safely.

### Logging Primitives
- Caffeine and water are logged as discrete events per timestamp.
- Daily totals for caffeine and water will be derived later.

## Environment Variables
- Required (local + Vercel):
  - `NEXT_PUBLIC_SUPABASE_URL` → Supabase project URL
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → public anon key (safe for browser)
  - `SUPABASE_URL` → (server-only) same project URL (optional fallback used by API routes)
  - `SUPABASE_SERVICE_ROLE_KEY` → service role key for server API routes; DO NOT expose to browser
- `.env.local` in `flowtrack/` is used locally and ignored by Git.

## Auth Flows
- Inline email+password form (`components/auth/SignInInline.tsx`):
  - `signUp(email,password)` + optional immediate `signIn`
  - `signInWithPassword(email,password)`
- Wizards gate saves behind `supabase.auth.getSession()`; if not authenticated, the inline component is shown.
- Optional admin seeding via `POST /api/admin/seed-user` using `SUPABASE_SERVICE_ROLE_KEY` to create/confirm `admin@gymie.com` with `password`.

## Frontend Features
### Daily Physio Wizard (`components/physio/PhysioForm.tsx`)
- Steps: Energy → Mood → Focus Clarity → Stress → Context (optional)
- Adds Daily Vitals step (optional): sleep hours, sleep quality, resting HR, HRV score, caffeine total (mg), last caffeine time
- Day context step with optional anomaly tags (partner_sleepover, travel_day, sick, etc.) and a short free-text day_notes field.
- Today’s date: `new Date().toISOString().slice(0,10)`
- Validates 0–10 for required fields, context trimmed
- Save flow:
  - Calls `upsertPhysioLog(supabase, input)` via the browser Supabase client
  - RLS insert/update policies enforce `user_id = auth.uid()` with `{ onConflict: 'user_id,date' }`
- Behavior: starts fresh (no prefill)
- Styling: dark-mode readable (labels, inputs, buttons)

### Session Wizard (`components/sessions/SessionWizard.tsx`)
- Phases: Pre (optional activity) → In (timer) → Post (rating + notes)
- Computes `duration_seconds` from start/end
- Derives `date` from `start_time`
- Save flow:
  - Calls `createSession(supabase, input)` via the browser Supabase client
  - RLS insert policies enforce `user_id = auth.uid()` for writes
- Styling: dark-mode readable throughout (labels, text, panels, inputs)

### Flow Recipe (`app/flow-recipe/page.tsx` + `components/recipe/FlowRecipeView.tsx`)
- Server fetch initial items (page flagged dynamic due to cookies); client manages local state
- All writes use `lib/db/flowRecipe.ts` helpers with a session-bound client (RLS-first)
- Inline form for Add/Edit/Delete with basic error messages

### Dashboard (`app/dashboard/page.tsx`)
- Client-side aggregation via `lib/db/dashboard.ts` using browser Supabase client:
  - `todayPhysio`: maybeSingle on `physio_logs` for today
  - `todaySessions`: sessions with `date = today`
  - `last7Days`: sessions in `[today-6, today]`, returns `sessionCount` and `avgFlow`
- Dark-mode contrast on headings and stats
- Quick actions:
  - `CaffeineQuickLog` for event-based caffeine logging
  - `WaterQuickLog` for event-based water logging
 - Dashboard provides Quick Actions: log physio, start session, quick caffeine logging, and quick water logging.

### Sessions List (`app/sessions/page.tsx` + `components/sessions/SessionCard.tsx`)
- Client-side fetch recent sessions via `getSessions`; empty state CTA
- Cards show date, activity, duration, flow rating; dark-mode contrast
- Dark-mode contrast on text + cards
- Each card links to `/sessions/[id]/edit` for quick edits

### Insights (`app/insights/page.tsx`)
- Server component using auth-aware server client; last ~60 days
- Joins sessions with physio_logs by date and computes:
  - Sleep hours buckets (<6h, 6–7h, 7–8h, 8+)
  - Caffeine buckets (0, 1–100, 101–200, 200+ mg)
  - Environment groups (home, office, cafe, other, unknown)
  - Time of day (morning, afternoon, evening)
- Renders lists sorted by average flow with counts; handles empty states
 - Supports date range filters (7/30/90 days) and the ability to exclude sick days and partner_sleepover days from the charts

## API Routes (server-only)
### POST `/api/physio/upsert`
- Headers: `Authorization: Bearer <supabase access_token>`
- Body:
  ```json
  {
    "date": "YYYY-MM-DD",
    "energy": 0,
    "mood": 0,
    "focus_clarity": 0,
    "stress": 0,
    "context": "optional string"
  }
  ```
- Behavior: decodes JWT to get `sub` (user id), upserts into `physio_logs` with `{ onConflict: 'user_id,date' }`
- Env: `SUPABASE_SERVICE_ROLE_KEY` required; `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`

### POST `/api/sessions/create`
- Headers: `Authorization: Bearer <supabase access_token>`
- Body:
  ```json
  {
    "date": "YYYY-MM-DD",
    "start_time": "ISO",
    "end_time": "ISO",
    "duration_seconds": 1234,
    "activity": "optional",
    "flow_rating": 7,
    "notes": "optional",
    "flow_recipe_version": 1
  }
  ```
- Behavior: decodes JWT to `sub` and inserts into `sessions` (service role)
- Env: same as above

### POST `/api/admin/seed-user`
- Body (optional): `{ "email": "admin@gymie.com", "password": "password" }`
- Behavior: list users; create or update password; `email_confirm: true`
- Env: `SUPABASE_SERVICE_ROLE_KEY` required

## DB Helpers (types + functions)
- `lib/db/physio.ts`
  - Types: `PhysioLog`, `PhysioLogInput`
  - `getPhysioLogForDate(supabase, date)` → returns row or null
  - `upsertPhysioLog(supabase, input)` → upsert with `{ onConflict: 'user_id,date' }`
- `lib/db/sessions.ts`
  - Types: `Session`, `SessionCreateInput` (includes `date`)
  - `getSessions(supabase, { limit, offset })`
  - `getSessionById(supabase, id)`
  - `createSession(supabase, input)` → client helper (server route now preferred for writes)
  - `updateSessionMeta(supabase, id, { activity, notes })`
  - `deleteSession(supabase, id)`
- `lib/db/flowRecipe.ts`
  - Types: `FlowRecipeItem`, `FlowRecipeItemInput`, `FlowRecipeItemUpdate`
  - `getFlowRecipeItems`, `createFlowRecipeItem`, `updateFlowRecipeItem`, `deleteFlowRecipeItem`
- `lib/db/dashboard.ts`
  - `getDashboardData(supabase)` → returns `{ todayPhysio, todaySessions, last7Days }`

## Styling and UX
- Tailwind utility classes; explicit dark-mode variants added across wizards/pages.
- Typeform-style navigation: Back / Next / Save with validation and inline errors.
- Empty states and CTAs on sessions, dashboard.

## Deployment
- Vercel settings (monorepo):
  - Root Directory: `flowtrack`
  - Framework Preset: Next.js (auto)
  - Build Command: `npm run build`
  - Output Directory: `.next`
- Env vars must be set in Vercel (Prod + Preview):
  - `SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Local Development
- `flowtrack/.env.local` (ignored by Git) with the four envs above
- `npm run dev` → Next.js dev server
- Seed admin user (optional): `POST http://localhost:3000/api/admin/seed-user`

## Error Handling & Common Issues
- RLS errors (`code 42501`) on client-side writes usually mean insert/update policies are missing or misconfigured. Fix RLS policies (e.g., `user_id = auth.uid()`) rather than bypassing them; service-role endpoints are for admin/maintenance only.
- “Missing Supabase envs” from server routes: ensure `SUPABASE_SERVICE_ROLE_KEY` and URL envs are present; restart dev.
- Turbopack dev logs `net::ERR_ABORTED ...?_rsc=...` are HMR navigation aborts; harmless in dev.

## Known Limitations / Next Steps
- Flow Recipe CRUD uses client helpers with RLS; future server-side helpers may support batch ops, but standard user writes remain session-bound.
- Add session/physio history views and editing.
- Filters on history pages (by date range, flow rating, environment).
- Weekly Review page summarizing last 7 days using insights.
- Add robust auth (email confirmations, OAuth) and a dedicated login page.
- Add tests and monitoring.

## Security Notes
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Normal app flows do not use the service role; it is only used in rare admin endpoints.
- RLS is enforced in Postgres; server routes with service role are admin-only.

## Quick Data Payloads
### Physio payload
```json
{
  "date": "2025-11-26",
  "energy": 6,
  "mood": 7,
  "focus_clarity": 5,
  "stress": 3,
  "context": "gym"
}
```

### Session payload
```json
{
  "date": "2025-11-26",
  "start_time": "2025-11-26T09:00:00.000Z",
  "end_time": "2025-11-26T10:30:00.000Z",
  "duration_seconds": 5400,
  "activity": "writing",
  "flow_rating": 8,
  "notes": "solid focus"
}
```
### Export (`/export`)
- Lets the user download `physio_logs`, `sessions`, `caffeine_events`, `water_events`, and `external_daily_snapshots` as CSV files for backup/analysis.
