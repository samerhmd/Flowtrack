# FlowTrack v3 Plan

## 1. v3 Objectives
- v2 covers sleep, caffeine, HR/HRV, core physio and environment context.
- v3 adds daily exercise/movement, nutrition heaviness, mental load, and task‑psychology (goal clarity, perceived difficulty, motivation).
- After v3, the schema is stable enough for long‑term logging without changing core fields.

## 2. Data Model v3 Extensions

### 2.1 Daily‑level (physio_logs)
Add columns (all optional in UI; collected via Daily Physio wizard):
- `exercise_done boolean` — Example: `true` when intentional workout; collected with a simple toggle.
- `exercise_intensity int` — 0–3 scale: `0 none`, `1 light`, `2 moderate`, `3 hard`; collected when `exercise_done = true`.
- `exercise_time_block text` — `'morning' | 'afternoon' | 'evening' | 'none'`; collected when `exercise_done = true`.
- `breakfast_heaviness int` — 0–3 scale; quick selector.
- `carb_heaviness int` — 0–3 scale; quick selector.
- `post_lunch_slump int` (optional) — 0–3 scale; quick selector.
- `mental_load int` — 0–10; quick slider (additional lens beyond stress).

Example SQL (idempotent):
```sql
ALTER TABLE physio_logs
  ADD COLUMN IF NOT EXISTS exercise_done boolean,
  ADD COLUMN IF NOT EXISTS exercise_intensity int,
  ADD COLUMN IF NOT EXISTS exercise_time_block text,
  ADD COLUMN IF NOT EXISTS breakfast_heaviness int,
  ADD COLUMN IF NOT EXISTS carb_heaviness int,
  ADD COLUMN IF NOT EXISTS post_lunch_slump int,
  ADD COLUMN IF NOT EXISTS mental_load int;
```

### 2.2 Session‑level (sessions)
Add session psychology fields (collected in Post phase):
- `goal_clarity int` — 0–10; clarity of what success looked like.
- `perceived_difficulty int` — 0–10; challenge relative to skill.
- `motivation int` — 0–10; intrinsic motivation for the task.

Example SQL (idempotent):
```sql
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS goal_clarity int,
  ADD COLUMN IF NOT EXISTS perceived_difficulty int,
  ADD COLUMN IF NOT EXISTS motivation int;
```

### 2.3 Types / Helpers
- Extend `PhysioLog` / `PhysioLogInput` with the new optional fields above.
- Extend `Session` / `SessionCreateInput` with `goal_clarity`, `perceived_difficulty`, `motivation` (optional).
- Existing helpers (`upsertPhysioLog`, `createSession`, `updateSession`) forward these fields without additional logic.

## 3. UI Changes (v3)

### 3.1 Daily Physio Wizard
- In the existing “Daily Vitals” step (or split into two substeps), add:
  - Exercise:
    - Toggle “Did you exercise today?”
    - If yes: intensity (0–3) and time block radio buttons (`morning`, `afternoon`, `evening`, `none`).
  - Nutrition:
    - Breakfast heaviness (0–3)
    - Carb heaviness (0–3)
    - Optional post‑lunch slump (0–3)
- All fields remain optional and do not block submission.

### 3.2 Session Wizard (Post phase)
- After flow_rating + notes, add three quick inputs:
  - `goal_clarity` (0–10)
  - `perceived_difficulty` (0–10)
  - `motivation` (0–10)
- Defaults can be mid‑range or null; no blocking on submission.

### 3.3 History & Editing
- Physio history edit page exposes exercise/nutrition/mental_load fields.
- Session edit page allows adjusting `goal_clarity`, `perceived_difficulty`, `motivation` if mis‑entered.

## 4. Insights v3 Upgrades
Add new sections to `/insights` using the same aggregation pattern (bucket → avg flow + count):
- Flow vs `exercise_done` + `exercise_intensity` (intensity buckets 0–3).
- Flow vs `exercise_time_block` (`morning`, `afternoon`, `evening`, `none`).
- Flow vs `breakfast_heaviness` / `carb_heaviness` (0–3).
- Flow vs `goal_clarity` / `perceived_difficulty` / `motivation` (0–10 buckets; consider grouping e.g. `0–3`, `4–7`, `8–10`).

Notes:
- Buckets mirror existing sleep/caffeine/environment logic.
- After v3, refactor `/insights` to a small engine: input arrays of `{ bucket, flow }` → render sorted lists.

## 5. Roadmap Summary

### Phase v3.1: DB Columns + TS Types
- [ ] Add physio_logs columns (exercise, nutrition, mental_load) via migration.
- [ ] Add sessions columns (goal_clarity, perceived_difficulty, motivation) via migration.
- [ ] Extend `PhysioLog` / `PhysioLogInput` types.
- [ ] Extend `Session` / `SessionCreateInput` types.

### Phase v3.2: Wizard UI Updates
- [ ] Daily Physio: add exercise and nutrition inputs in Vitals step.
- [ ] Session Wizard: add goal_clarity / perceived_difficulty / motivation inputs in Post phase.
- [ ] Ensure all new fields are optional and kept minimal friction.

### Phase v3.3: Insights Upgrades
- [ ] Implement new aggregations for exercise intensity/time block.
- [ ] Add nutrition heaviness vs flow.
- [ ] Add task psychology (clarity/difficulty/motivation) vs flow.
- [ ] Reuse the generic bucket aggregation helper.

### Phase v3.4: History & Editing
- [ ] Expose new physio fields in `/physio/history/[date]` edit form.
- [ ] Expose new session psychology fields in `/sessions/[id]/edit` form.
- [ ] Keep validations light and consistent.

## 6. Final Note
After v3 is implemented, the schema is stable enough for long‑term data collection across the major drivers of flow. Future versions (v4+) focus on integrations (e.g., wearables/CGM), richer visualizations, and optional AI analysis layered on top of the insights engine.
