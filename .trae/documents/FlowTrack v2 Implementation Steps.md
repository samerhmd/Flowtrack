# FlowTrack v2 – Step‑by‑Step Implementation Plan

## Prerequisites

* Confirm environment variables (local + Vercel):

  * `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

  * `SUPABASE_URL` (optional, server only), `SUPABASE_SERVICE_ROLE_KEY` (admin-only)

* Timezone assumption: For v2, treat `date` as derived from the user’s local time (e.g., Asia/Qatar). Minor drift while traveling is acceptable; revisit later.

* Success metrics (v2): After 4–6 weeks, `/insights` should identify:

  * Top 3 sleep + caffeine combos for high flow

  * Worst 3 conditions that consistently reduce flow

## Phase 2 – Simplify Auth & Data Flow \[CORE]

Goal: Eliminate service-role for normal writes; use RLS-backed clients everywhere.

### 2.1 Add Auth‑Aware Server Client

* Install: `npm i @supabase/auth-helpers-nextjs`

* Update `lib/supabaseServer.ts` to use `createServerClient` with `cookies()`; server components can read user‑scoped data.

* Verify in `app/dashboard/page.tsx` by reading via the auth‑aware server client.

### 2.2 RLS‑Safe Writes (remove service‑role usage)

* Ensure Supabase RLS policies:

  * physio\_logs: INSERT/UPDATE when `user_id = auth.uid()`

  * sessions: INSERT/UPDATE when `user_id = auth.uid()`

* Physio:

  * Replace `/api/physio/upsert` usage with direct `lib/db/physio.upsertPhysioLog()` from client.

  * Confirm `.upsert(..., { onConflict: 'user_id,date' })` returns 200 under RLS.

* Sessions:

  * Replace `/api/sessions/create` usage with direct `lib/db/sessions.createSession()` from client.

  * Include `date = start_time.slice(0,10)` in payload.

* Flow Recipe:

  * Keep client CRUD or create small session‑bound API routes (no service‑role) if needed.

### 2.3 Auth UX

* Add `/login` route (client) with email+password + optional magic‑link.

* Gate `/physio/new` and `/sessions/new`—if `!session`, redirect to `/login`.

### 2.4 Acceptance

* No service‑role used for normal writes.

* Dashboard/server reads are session‑aware.

* Upserts/Inserts succeed under RLS with authenticated user.

## Phase 3 – Extend Data Model (Vitals + Environment) \[CORE]

Goal: Capture sleep/caffeine/environment signals for correlation.

### 3.1 Schema Changes (SQL migration outline)

```
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
```

* Do not run here—implement via Supabase migration or SQL editor.

* Confirm RLS policies still allow INSERT/UPDATE for `user_id = auth.uid()`.

### 3.2 Types & Helpers

* Update `lib/db/physio.ts` interfaces to include new optional fields.

* Update `lib/db/sessions.ts` interfaces to include `environment`, `noise`, `session_type`, `distraction_level`.

### 3.3 UI Capture (Manual for v2)

* Physio wizard: add optional inputs for `sleep_hours`, `sleep_quality`, `resting_hr`, `hrv_score`, `caffeine_total_mg`, `caffeine_last_intake_time`, `bed_time`, `wake_time`.

* Session wizard: add a small step (pre/post) to capture `environment`, `noise`, `session_type`, `distraction_level`.

* Keep validation minimal; highlight manual nature (automation later).

### 3.4 Acceptance

* New fields are saved and loaded correctly under RLS.

* Minimal UI added; no wearable integration required in v2.

## Phase 4 – Insights Page \[CORE]

Goal: Show actionable correlations without AI.

### 4.1 Page & Aggregations

* Create `app/insights/page.tsx` (server component), read via auth‑aware client.

* Aggregation helpers (server):

  * Flow vs sleep buckets: `<6h`, `6–7h`, `7–8h`, `8+`

  * Flow vs caffeine buckets: `0`, `1–100`, `101–200`, `200+ mg`

  * Flow vs environment: `home`, `office`, `cafe`, `other`

  * Flow vs time of day: `morning`, `afternoon`, `evening`

* Query outline:

```
SELECT bucket, AVG(s.flow_rating) avg_flow, COUNT(*) session_count
FROM sessions s
JOIN physio_logs p USING (user_id, date)
GROUP BY bucket
ORDER BY avg_flow DESC;
```

### 4.2 UI Rendering

* Cards or simple tables listing buckets, avg flow, session count.

* Sort descending by avg flow.

* Optional: CSV export.

### 4.3 Acceptance

* `/insights` loads under auth.

* Displays clear “best → worst” conditions.

## Phase 5 – History & Editing \[CORE]

Goal: View and edit past entries.

### 5.1 Routes

* `/physio/history` (server): list by date; link to edit.

* `/sessions/[id]/edit` (client): edit rating, notes, environment fields.

### 5.2 Helpers & Forms

* Add `getPhysioLogsRange(userId, from, to)` and `updatePhysioLog(id, updates)`.

* Add `updateSession(id, updates)` for meta/context fields.

* Forms with validation + error handling; ensure RLS permits updates.

### 5.3 Acceptance

* History pages display correctly.

* Edits persist under RLS.

## Future – Garmin / Wearables (Conceptual)

* v2 fields are manual now; later integrate Garmin/Apple/Google.

* Map HRV/sleep/stress into daily fields.

* Consider correlating Flow Recipe usage (version/items) with flow outcomes.

## Implementation Notes

* Timezone: use local time (e.g., Asia/Qatar) for `date`; accept minor drift while traveling.

* Styling: ensure dark‑mode contrast on labels, helper text, cards, and inputs.

* Testing: add unit tests for helpers; manual testing of RLS paths; E2E smoke for wizards.

* Deployment: Vercel Root Directory `flowtrack`; set all envs for Production/Preview.

## Milestone Checklist (Condensed)

* [ ] Phase 2: Auth‑aware server client + RLS‑safe writes (physio, sessions); `/login` route.

* [ ] Phase 3: Schema extensions + UI capture (manual); type updates.

* [ ] Phase 4: `/insights` aggregations + UI.

* [ ] Phase 5: History routes + edit forms.

* [ ] Success metrics validated after 4–6 weeks.

