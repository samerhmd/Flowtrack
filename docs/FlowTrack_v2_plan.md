# FlowTrack v2 – Implementation Plan

## 1. Executive Summary
- v1 delivers: daily physio logging, deep-work session capture, flow recipe, and a dashboard; all built on Next.js + Supabase with RLS and simple client/server API routes.
- v2 adds: cleaner auth/data flow (RLS-first), extended data model (sleep, caffeine, environment, vitals), insights/analytics, and history/editing.
- Goal: discover the personal “sweet spot” between sleep, caffeine, environment, physiology and deep-work performance by correlating signals (daily + session) against flow outcomes.
- Strategy: unify on an auth-aware Supabase client (browser + server), write via RLS-safe paths, instrument minimal UI capture for new signals, then deliver an Insights page with actionable patterns.
- Constraint: keep implementation practical, small, and iterative; design for future integrations (Garmin/wearables) without committing to them in v2.
**Success metrics (v2):**
- After 4–6 weeks of data, `/insights` should answer:
  - Top 3 sleep + caffeine combinations that correlate with highest flow.
  - Worst 3 conditions (environment/time-of-day/caffeine) that consistently reduce flow.

## 1.2 Current Architecture Snapshot (short)
- Stack: Next.js 16 App Router, React, Tailwind CSS, Supabase (Postgres + Auth + RLS).
- Entities: `physio_logs`, `sessions`, `flow_recipe_items` with user-scoped rows via RLS.
- Flows: daily physio wizard, session wizard (pre/in/post), flow recipe CRUD, dashboard aggregates.
- Auth: inline email+password; writes currently use server routes with the service role to bypass RLS; server components use a non-auth-aware Supabase client.

## 2. Auth & Data Flow Strategy (v2)
**Recommended Strategy A: Fully user-scoped app using RLS + auth-helpers**
- Browser and server both use Supabase clients bound to the user session.
- Normal writes are done via the regular (session-bound) Supabase client respecting RLS.
- Service role usage is reserved for admin/maintenance only.

### Tasks
- [CORE] Integrate `@supabase/auth-helpers-nextjs` for server-side session awareness
  - Configure an auth-aware server client (cookies-based) in `lib/supabaseServer.ts`.
  - Migrate server components (e.g., dashboard) to read via the auth-aware client.
- [CORE] Replace service-role API writes with RLS-safe writes
  - Physio: call `lib/db/physio.upsertPhysioLog()` directly from the client; ensure RLS has insert and update policies (`user_id = auth.uid()`).
  - Sessions: call `lib/db/sessions.createSession()` directly; add necessary RLS insert policies.
  - Flow recipe: consider moving to direct client writes or create small server routes that pass through the session (not the service role) if needed.
- [CORE] Remove `/api/admin/seed-user` for production use
  - Keep only for local dev/maintenance or delete entirely; prefer normal signup.
- [NICE] Add a dedicated `/login` route with magic-link and password flows.
- [LATER] Multi-device session persistence and refresh token handling (if required by future UX).

### Acceptance Criteria
- No service role used for standard writes in production.
- All reads/writes bound to the authenticated user and pass RLS.
- Dashboard/server components read the current user’s data via the auth-aware server client.

## 3. Data Model v2: Extending for Sleep, Caffeine, Environment
We need additional signals to correlate with flow outcomes.

### 3.1 Daily-level data (extend physio_logs)
**Option 1 (Recommended): Extend `physio_logs`** for simplicity; maintain a single daily row per user.
- Add fields:
  - `sleep_hours numeric` – e.g., `7.5`; manual input initially.
  - `sleep_quality int` – 0–10 (or map from external score later); manual now.
  - `resting_hr int` – bpm; manual now (or wearable later).
  - `hrv_score int` – 0–100; manual or later mapped from wearables.
  - `caffeine_total_mg numeric` – total daily caffeine (mg); manual.
  - `caffeine_last_intake_time timestamptz` – last caffeine time; manual.
  - `bed_time timestamptz` – optional; manual.
  - `wake_time timestamptz` – optional; manual.

Why: one daily record simplifies dashboard & insights joins (date/user_id unique), reduces write paths, and aligns with “snapshot per day.”

**Population (v2 manual):** add optional fields in the daily wizard; later, integrate with external sources (Garmin/Health).
**Source (v2 – manual now, automate later):**
- `sleep_hours` – manual.
- `sleep_quality` – manual (map external scores later).
- `resting_hr` – manual (wearables later).
- `hrv_score` – manual (Garmin/other later).
- `caffeine_total_mg` – manual estimate.
- `caffeine_last_intake_time` – manual.
- `bed_time` / `wake_time` – manual.

### 3.2 Session-level context (environment, task type)
**Extend `sessions`** with context:
- `environment text` – `'home'|'office'|'cafe'|'other'`.
- `noise text` – `'quiet'|'music'|'white_noise'|'unknown'`.
- `session_type text` – `'deep_work'|'shallow'|'admin'`.
- `distraction_level int` – 0–10 (optional).

Why: session-level environment influences flow; capturing these variables allows correlating rating with conditions.

**Collection (v2):** add a lightweight step in the session wizard (pre or post), with radio/select controls.
**Source (v2 – manual):** environment/noise/session_type/distraction_level captured via simple selects.

### 3.3 SQL Change Plan (for future migration)
_Do not run now; reference for future migration files._
```sql
-- Extend physio_logs
ALTER TABLE physio_logs
  ADD COLUMN sleep_hours numeric,
  ADD COLUMN sleep_quality int,
  ADD COLUMN resting_hr int,
  ADD COLUMN hrv_score int,
  ADD COLUMN caffeine_total_mg numeric,
  ADD COLUMN caffeine_last_intake_time timestamptz,
  ADD COLUMN bed_time timestamptz,
  ADD COLUMN wake_time timestamptz;

-- Extend sessions
ALTER TABLE sessions
  ADD COLUMN environment text,
  ADD COLUMN noise text,
  ADD COLUMN session_type text,
  ADD COLUMN distraction_level int;

-- RLS policies (outline)
-- Ensure insert/update policies exist for physio_logs and sessions where user_id = auth.uid().
```
**Timezone & “today” assumption:**
- For v2, treat `date` as derived from the user’s local time (e.g., `Asia/Qatar`).
- Minor drift while traveling is acceptable; revisit timezone normalization later if needed.

## 4. v2 Features: Insights & History
### 4.1 /insights Page (Analytics, No AI)
Answer: **Under what conditions are my flow ratings highest?** and **When do I perform poorly?**

**Analytics (examples):**
- Flow vs sleep (from physio)
  - Buckets: `<6h`, `6–7h`, `7–8h`, `8+`
  - Aggregation: `avg(flow_rating), count(*)` for sessions joined on date with daily snapshot.
- Flow vs caffeine (from physio)
  - Buckets: `0 mg`, `1–100 mg`, `101–200 mg`, `200+ mg`
  - Aggregation: same as above.
- Flow vs environment (from sessions)
  - Groups: `home`, `office`, `cafe`, `other`
  - Aggregation: average rating + session count.
- Flow vs time of day (from sessions)
  - Groups: `morning (05:00–11:59)`, `afternoon (12:00–17:59)`, `evening (18:00–23:59)`
  - Aggregation: average rating + session count.

**Data inputs:** join `sessions` (date/time/rating) with `physio_logs` (daily) by `(user_id, date)`.

**Query outline (pseudocode):**
```
SELECT bucket, AVG(sessions.flow_rating) AS avg_flow, COUNT(*) AS session_count
FROM sessions
JOIN physio_logs USING (user_id, date)
GROUP BY bucket
ORDER BY avg_flow DESC;
```

**UI rendering:** simple cards/tables; bar-like lists sorted by “best → worst” conditions.

**Tasks:**
- [CORE] Implement `/insights` page (server component) reading via auth-aware server client.
- [CORE] Build reusable aggregation helpers for sleep/caffeine/environment/time buckets.
- [NICE] Add export as CSV for the aggregated results.

### 4.2 History Views & Editing
- `/physio/history` (server): list past days (date + key metrics); link to edit.
- `/sessions/[id]/edit` (client): form to edit activity, notes, rating, environment fields.

**Tasks:**
- [CORE] New routes `/physio/history`, `/sessions/[id]/edit`.
- [CORE] DB helpers: add `getPhysioLogsRange`, `updatePhysioLog`, `updateSession` for meta/context fields.
- [CORE] Forms with validation + error messages; RLS-safe updates.
- [NICE] Add filters by date range and environment.

## 5. Implementation Roadmap (Phased)
### Phase 2 – Simplify Auth & Data Flow
_Goal:_ eliminate service-role for normal writes; bind reads/writes to user session.
- [ ] [CORE] Add auth-aware server client via `@supabase/auth-helpers-nextjs`.
- [ ] [CORE] Migrate dashboard and server components to the auth-aware client.
- [ ] [CORE] Replace `/api/physio/upsert` with direct RLS-safe upsert.
- [ ] [CORE] Replace `/api/sessions/create` with direct RLS-safe insert.
- [ ] [CORE] Ensure RLS insert/update policies exist for physio and sessions.
- [ ] [LATER] Remove `/api/admin/seed-user` from production.

### Phase 3 – Extend Data Model (Vitals + Environment)
_Goal:_ capture sleep/caffeine/environment signals.
- [ ] [CORE] Add new columns to `physio_logs` and `sessions` (SQL migration).
- [ ] [CORE] Extend wizards’ UIs to capture new fields (manual inputs), minimal validation.
- [ ] [NICE] Dashboard tiles for sleep/caffeine summary.

### Phase 4 – Build Insights Page
_Goal:_ visualize correlations.
- [ ] [CORE] Implement `/insights` (server) with auth-aware client.
- [ ] [CORE] Aggregations: sleep buckets, caffeine buckets, environment groups, time-of-day groups.
- [ ] [CORE] Present results as sorted lists/cards (avg flow + counts).
- [ ] [NICE] CSV export.

### Phase 5 – History & Editing
_Goal:_ view and correct past entries.
- [ ] [CORE] `/physio/history` list + per-day edit.
- [ ] [CORE] `/sessions/[id]/edit` page.
- [ ] [CORE] Update helpers (RLS-safe) + forms.
- [ ] [NICE] Filters/search.

## 6. Future: Garmin / Wearable Integration (Conceptual)
- v2 fields (sleep_hours, hrv_score, resting_hr, stress equivalents) are designed for manual input initially.
- Future Phase X could:
  - Integrate Garmin Health API / Apple Health / Google Fit.
  - Map external metrics to the daily fields and automate population.
- Out of scope for v2; keep code modular so these integrations can plug into existing data model and aggregations later.
- Consider future correlation between Flow Recipe usage (version/items) and session flow ratings to measure adherence impact.

## 7. Notes on Style & Execution
- Use markdown headings for structure.
- Use checklists for tasks; keep paragraphs short and practical.
- Assume a future copilot can follow phases without re-asking goals.

## 8. Appendices (Optional)
- Bucket boundaries and thresholds can be tuned after initial data collection.
- Consider anonymized exports for long-term pattern analysis.
