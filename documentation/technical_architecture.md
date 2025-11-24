# FlowTrack Technical Architecture (MVP)

## 1. High-Level Overview

### Frontend

- **Next.js (App Router)**  
  **Reason:**  
  - Server Components → faster initial loads (<200ms requirement).  
  - Built-in caching + streaming fit the dashboard well.  
  - Cleaner co-location of server + client logic for Supabase auth.  
  - Predictable folder structure (`app/`) for Windsurf.

- **React 18**  
  - Client components for interactive flows (session wizard).  
  - Server components for data loading (dashboard, session list).

- **Tailwind CSS**  
  - Fast iteration (Windsurf friendly).  
  - Strict UI constraints from PRD (“max 8 components per screen”).  
  - Easy utility-first design.

### Backend / Database

- **Supabase (Postgres + Auth + Storage)**  
  - Tables: `sessions`, `physio_logs`, `flow_recipe_items` (from the data model).  
  - Row Level Security enabled.
  - Auth handles session, user identity.

### API / Data Fetching

- **Supabase client** used in two modes:
  - **Server-side** via `@supabase/auth-helpers-nextjs` inside Server Components (e.g., dashboard queries).
  - **Client-side** for interactive flows (session wizard, physio wizard).

### What Runs Where?

| Feature | Server Component? | Client Component? | Reason |
|--------|--------------------|-------------------|--------|
| Dashboard metrics | ✅ | ❌ | Fast SSR + caching |
| Sessions list | ✅ | ❌ | Heavy queries + grouping |
| Session wizard (Typeform-style) | ❌ | ✅ | Multi-step UI, timers |
| Physio wizard | ❌ | ✅ | Step-by-step questions |
| Flow recipe editing | ❌ | ✅ | Form interactions |
| Auth gating | Mixed | Mixed | Supabase helpers |

### Data Fetching Strategy

- **RSC (server)**: Dashboard, list pages  
- **Client**: Multi-step flows  
- **Thin data access layer** in `/lib/db/*`

---

## 2. Folder & File Structure

Using **Next.js App Router**.

```text
/app
  /dashboard
    page.tsx
  /physio
    /new
      page.tsx
  /sessions
    page.tsx
    /new
      page.tsx
    /[id]
      page.tsx
    /[id]/edit
      page.tsx
  /flow-recipe
    page.tsx
    /new
      page.tsx
    /[id]/edit
      page.tsx
  /auth
    login/page.tsx
    callback/route.ts
/components
  dashboard/
  physio/
  sessions/
  recipe/
  ui/
/lib
  supabaseClient.ts
  db/
    sessions.ts
    physio.ts
    flowRecipe.ts
/types
  session.ts
  physio.ts
  recipe.ts
/hooks
  useSessionWizard.ts
  usePhysioWizard.ts
/utils
  date.ts
  validation.ts
/styles
  globals.css
```

### Folder Purposes

- **/app**  
  Routes + top-level layout + server components.

- **/components**  
  Reusable UI + domain-specific components.

- **/lib/db**  
  Thin data access layer (recommended):  
  - `getSessions()`, `createSession()`, `getPhysioForDate()`, `insertPhysioLog()`, etc.

- **/hooks**  
  Wizard state logic (local React state).

- **/types**  
  Typescript types derived from Supabase schema.

- **/utils**  
  Formatting, helpers.

---

## 3. Routing Structure

### `/`  
Redirect to `/dashboard`.

### `/dashboard`  
- SSR Page  
- Fetch: today’s physio, today’s sessions, 7-day summary   
- Components: `<DashboardStats />`, optional `<DashboardCharts />` (v2+), `<QuickActions />`

### `/physio/new`  
- Client page  
- Typeform-style wizard: **Energy → Mood → Clarity → Stress → Context**  
- Save as a single physio log.

### `/sessions/new`  
Multi-step wizard:  
1. Activity name (autocomplete)  
2. Start timer  
3. End session  
4. Flow rating (required)  
5. Notes → Save

### `/sessions`  
SSR page  
- Fetch grouped sessions (“Today”, “Yesterday”, “Last 7 Days”).  
- Sorting toggle (newest, duration, flow rating).

### `/sessions/:id`  
Minimal detail view (optional v1). Includes:  
- start/end  
- duration_seconds  
- flow rating  
- notes  

### `/sessions/:id/edit`  
- Edit activity + notes  
- Delete session

### `/flow-recipe`  
- View current items (no reorder in v1).  
- Add/edit/delete.

### `/auth/login`  
Minimal Supabase auth page.

---

## 4. Component Architecture

### Dashboard Components

#### `DashboardStats` (server)
Responsibilities:
- Display today’s physio snapshot.
- Show session count + average flow today.
- Show 7-day stats.

Props:
- Data from server loader.

#### `QuickActions` (client)
Buttons:
- Log Physio  
- Start Session  

Props:
- None (callbacks via `next/link` or router).

---

### Physio Components

#### `PhysioWizard` (client)
Responsibilities:
- Multi-step UI.  
- Holds physio values in state.  
- Shows microcopy + progress dots.  

Props:
- None

Writes:
- Calls `insertPhysioLog()` on final submit.

---

### Session Components

#### `SessionWizard` (client)
Includes screens:
- `PreSessionScreen`
- `TimerScreen`
- `PostSessionScreen`

Responsibilities:
- Manage full multi-step session flow.
- Hold temporary state until final save.

Props:
- None

State shape example:
```ts
{
  activity: string;
  startTime: Date | null;
  endTime: Date | null;
  flowRating: number | null;
  notes: string;
}
```

Writes:
- Single `insertSession()` call on final submit.

#### `SessionTimer` (client)
- Uses `useEffect` + `setInterval`.  
- Displays elapsed time.  

---

### Sessions List Components

#### `SessionsList` (server)
Responsibilities:
- Render grouped sessions (Today, Yesterday, etc.).  
- Provide sort toggles (handled via query params or client state).

Props:
- `sessions: SessionWithGrouping[]`

---

### Flow Recipe Components

#### `FlowRecipeList` (client)
Responsibilities:
- Show list of items.  
- Trigger edit/delete actions.

Props:
- `items: FlowRecipeItem[]`

#### `FlowRecipeItemForm` (client)
Responsibilities:
- Add/edit single item (title + notes).  
- Submit via `insertFlowRecipeItem()` / `updateFlowRecipeItem()`.

Props:
- `initialItem?: FlowRecipeItem`

---

### Layout Components

#### `AppLayout` (server)
Responsibilities:
- Shared navigation (Dashboard, Sessions, Physio, Recipe).  
- Enforce “one primary action per page” visual hierarchy.

Props:
- `children: ReactNode`

---

## 5. State Management Strategy

### Recommendation: Local component state + custom hooks

- Use `useState` / `useReducer` inside wizard components.  
- Use React Context only for auth/user info if needed (Supabase helpers already provide this).  
- Dashboard filters, if any, live in page-level state.

**Justification (3–5 sentences):**  
The app’s flows are short-lived and linear, so global state adds more complexity than value. Local state per page/component keeps logic easy to reason about and makes components testable in isolation. Supabase already provides an auth/session layer, reducing the need for a heavy client-side store. This aligns with the MVP goal of simplicity and speed while still being easy to evolve later if the app grows.

---

## 6. Data Access Layer

### Supabase Client Initialization

`/lib/supabaseClient.ts`:

```ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

For server-side (e.g., in RSC):

```ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/auth-helpers-nextjs';

export const createServerSupabase = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: () => cookieStore }
  );
};
```

### Thin `/lib/db/*` Layer

**Example: `lib/db/physio.ts`**

```ts
import { createServerSupabase } from '../supabaseServer';

export async function getLatestPhysioForToday(userId: string) {
  const supabase = createServerSupabase();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('physio_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
```

**Example: `lib/db/sessions.ts`**

```ts
import { supabase } from '../supabaseClient';

export async function insertSession(payload: {
  user_id: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  activity: string;
  flow_rating: number;
  notes?: string;
}) {
  const { data, error } = await supabase
    .from('sessions')
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}
```

**Dashboard Query (conceptual):**  
- Get last 7 days of sessions by `user_id` and `date`.  
- Aggregate on server (in RSC) to derive counts + averages.  
- Optionally join with physio by `date` for future insights.

---

## 7. Session Wizard Flow

### Conceptual Flow

1. **User clicks “Start Session”** → navigate to `/sessions/new`.  
2. **Pre-session screen** (activity + microcopy)  
   - On “Begin deep work”: set `startTime = new Date()` in state.  
3. **Timer screen**  
   - Shows elapsed time.  
   - “End Session” button sets `endTime = new Date()` and moves to next step.  
4. **Post-session screen**  
   - Collect `flowRating` (required) + `notes` (optional).  
5. **Save screen**  
   - Assembles final session object.  
   - Calls `insertSession()` with:
     - `date` (from `startTime`)
     - `start_time`, `end_time`
     - `duration_seconds`
     - `activity`, `flow_rating`, `notes`
   - Redirect to `/sessions` or `/dashboard` with success toast.

### Wizard State Management

Use a dedicated hook: `useSessionWizard`

```ts
type SessionWizardState = {
  step: 'pre' | 'timer' | 'post' | 'saving';
  activity: string;
  startTime: Date | null;
  endTime: Date | null;
  flowRating: number | null;
  notes: string;
};
```

- `step` controls which screen is shown.  
- No partial writes: state is only in memory until final save.  
- If user leaves page, state is lost in v1 (acceptable per MVP).

---

## 8. Error & Loading Handling

### Loading Patterns

- Dashboard:  
  - Use Next.js `loading.tsx` in `/app/dashboard/loading.tsx` with “Loading your stats…” message.
- Wizard saves:  
  - Disable buttons + show inline “Saving…” text or spinner.

### Error Patterns

- **Inline errors** below inputs for validation (e.g., missing flow rating).  
- **Toast notifications** for Supabase/API errors.  
- Retry buttons where appropriate (“Try again”).

### Empty States

- **Dashboard**:  
  - If no physio today → show CTA “Log today’s physio.”  
  - If no sessions → “Start your first deep work block.”
- **Sessions List**:  
  - Show message + button to `/sessions/new`.
- **Flow Recipe**:  
  - “Your Flow Recipe is empty. Add 1–3 habits that help you focus.”

---

## 9. Notes & v2+ Ideas

### v2+ Technical Enhancements

- **Persistent in-progress sessions**  
  - Store `startTime` in `localStorage` or Supabase when the timer starts.  
  - Restore on page reload.

- **Analytics / charts**  
  - Add a `/api/dashboard` route to precompute stats.  
  - Use a chart library (e.g., Recharts) for trend views.

- **Flow Recipe versioning**  
  - Store `flow_recipe_version` on sessions.  
  - Support historic analysis by recipe version.

- **Wearable integration**  
  - Serverless functions (Edge/Vercel) to pull HRV/sleep data from Garmin/Oura.  

### Intentionally Kept Simple in v1

- No global state management library.  
- No tags or complex search.  
- No multi-user/team features.  
- No offline mode.  

This architecture is intentionally minimal, so you can start implementing in Windsurf immediately and evolve as you discover real usage patterns.
