# FlowTrack – Mini PRD (v1, Revised)

## 1. Product Vision

FlowTrack helps me reach and maintain daily flow by combining three lightweight inputs: daily physio, focused work sessions, and a living Flow Recipe. It gives me a simple cockpit to understand when, why, and how I enter flow — and how to create more of it.

The app is **not** for teams, productivity hobbyists, quantified-self maximalists, or users seeking complex analytics, AI insights, or integrations. It is a single-user, minimal, personal tool.

### Simplicity Requirements (strict)
- **Every action must take ≤ 30 seconds.**
- **Every page must have exactly 1 primary action.**
- **All pages must load in < 200ms (post-cache).**
- **Daily logging must require ≤ 5 inputs.**
- **No page may contain more than 8 UI components.**

### Long‑term Hypothesis
Collecting compact physio + session data over time will reveal personal flow patterns, allowing refinement of the Flow Recipe and improving consistency of deep work performance.

---

## 2. Core User Flows

### 2.1 Log Daily Physio

**Goal:** Capture a minimal snapshot of the day’s physical state.

**Max Questions:** **4 required + 1 optional**  
- Energy (0–10)  
- Mood (0–10)  
- Focus/Clarity (0–10)  
- Stress (0–10)  
- Context (one word, optional: “tired”, “gym”, “fasted”)  

**Partial Entries:**  
- **Allowed.** Missing values default to `null`.  
- Dashboard uses whichever fields are present.

**Steps:**  
1. Dashboard → “Log Physio”  
2. Typeform-style flow with:
   - Energy → Mood → Clarity → Stress → Context  
   - Progress indicator: **● ○ ○ ○ ○**, then **● ● ○ ○ ○**, etc.  
   - Microcopy such as:  
     - “How’s your energy today?”  
     - “Nice. A few more…”  
     - “Almost done…”  
3. Save.

**Error States:**  
- Missing required field → “Please select a value (0–10).”
- Network/db error → “Could not save. Try again?”

**Expected Output:**  
- PhysioLog created with timestamp + context.

**Loading State:**  
- “Saving…” spinner for <1s.

**Empty State:**  
- “No physio logged today — let’s capture your state.”

---

### 2.2 Log a Session

**Activity Autocomplete:**  
- **Yes** — autocomplete from last 20 activity names.

**Timer Persistence:**  
- **Yes** — timer persists if user navigates away.  
- If tab is closed → session discarded in v1.

**Duration Limits:**  
- Sessions > 3 hours trigger a confirm dialog:  
  - “This session is unusually long. Save anyway?”

**Steps:**  
1. Dashboard → “Start Session”  
2. New Session page:
   - Activity field + autocomplete
   - Large Start button  
3. Timer view:
   - Running timer  
   - “End Session”  
4. End Session → post-form:
   - Flow rating (0–10, required)  
   - Activity (editable)  
   - Notes (optional)  
5. Save.

**Error states:**  
- Missing flow rating → highlight.  
- Timer failed → “Timer lost, log manually?”

**Loading:**  
- “Saving Session…” overlay.

**Empty State:**  
- Not applicable.

---

### 2.3 Sessions List

**Sorting Options:**  
- Default: **Newest first**  
- Optional toggles:  
  - Longest duration  
  - Highest flow rating  

**Grouping:**  
```
Today
  • PRD Writing — 45m — Flow 8
  • Email Cleanup — 20m — Flow 4
Yesterday
  • Coding — 60m — Flow 7
Last Week
  • …
```

**Features:**  
- Delete session  
- Edit session (title + notes only)

**Empty State:**  
- “No sessions yet — start your first deep work block.”

---

### 2.4 Dashboard

**Recalculation Frequency:**  
- Stats recompute **on each page load**, not cached.

**Sections:**  
- Today’s Physio  
- Today’s Sessions  
- Weekly Summary  
- Quick Actions  
- Link to Recipe

**Hierarchy:**  
- Large numbers for today’s physio  
- Primary CTAs in accent color  
- Horizontal separation for physio values

---

### 2.5 Flow Recipe

**Reorderable in v1?**  
- **No** — fixed order based on creation.  

**Titles Unique?**  
- **Not required**, but duplicates warned softly (“This looks similar to another item.”)

**Steps:**  
- View list  
- Add item  
- Edit item  
- Delete item  

**Empty State:**  
- “Your Flow Recipe is empty. Add 1–3 habits that help you focus.”

---

## 3. Feature List for v1 (Updated)

### MUST HAVE
- Minimal Dashboard  
- Physio logging (4 core values + 1 optional context)  
- Session start/end with timer persistence  
- Flow rating input  
- Activity autocomplete  
- Edit session (title + notes)  
- Delete session  
- Edit physio notes/context  
- Sessions list with grouping + sort modes  
- Flow Recipe (add/edit/delete)  
- All durations stored in **seconds**  

### NICE TO HAVE (excluded)
- Tags  
- Charts  
- Reordering Flow Recipe  
- Auto-saving mid-session  
- Multi-user  
- Session-physio linking  

### FUTURE
- Wearable integrations  
- Time-of-day flow predictions  
- Flow Recipe version evolution with analytics  

---

## 4. Data Model (Updated)

### Table: physio_logs
| Field | Type |
|------|------|
| id | uuid |
| user_id | uuid |
| created_at | timestamptz |
| date | date |
| energy | int |
| mood | int |
| focus_clarity | int |
| stress | int |
| context | text (1 word optional) |

---

### Table: sessions
| Field | Type |
|------|------|
| id | uuid |
| user_id | uuid |
| created_at | timestamptz |
| flow_recipe_version | int (optional) |
| date | date |
| start_time | timestamptz |
| end_time | timestamptz |
| duration_seconds | int |
| activity | text |
| flow_rating | int |
| notes | text |

---

### Table: flow_recipe_items
| Field | Type |
|------|------|
| id | uuid |
| user_id | uuid |
| created_at | timestamptz |
| updated_at | timestamptz |
| title | text |
| notes | text |
| order_index | int |

---

## 5. Error States, Loading States, Empty States

### Error States
- Physio missing required value → highlight + microcopy  
- Session missing flow rating → prevent submission  
- DB/network fail → retry button  

### Loading States
- “Saving…”  
- “Syncing…” for session save  

### Empty States
- No physio today → invitation to log  
- No sessions → invite to start first session  
- No recipe items → explanation + CTA  

---

## 6. Routing Map

```
/dashboard
/physio/new
/sessions
/sessions/:id
/sessions/:id/edit
/recipe
/recipe/new
/recipe/:id/edit
```

---

## 7. Component List

- DashboardStats  
- PhysioForm (Typeform-style)  
- SessionTimer  
- SessionPostForm  
- SessionsList  
- RecipeList + RecipeItemForm  
- Modal  
- Button / Slider / RatingInput components  

---

## 8. UI Constraints

- Colors: 1 primary, 1 accent, grayscale palette  
- Typography: 1 font, 2 weights, 3 sizes max  
- Spacing: 8px grid  
- Max 8 components per screen  
- Buttons: full-width primary when possible  

---

# End of Document
2. Wireframes (text-based)

These are intentionally rough and minimal, to guide layout and UX.

2.1 Dashboard
+------------------------------------------------------+
| FlowTrack                                            |
|------------------------------------------------------|
| [Log Physio]   [Start Session]                       |
|------------------------------------------------------|
| Today                                              ⓘ |
|  - Physio (latest):                                  |
|      Energy: 7   Focus: 6   Stress: 3                |
|  - Sessions today: 2                                 |
|  - Avg flow today: 8.0                               |
|------------------------------------------------------|
| Last 7 Days                                          |
|  - Sessions: 10                                      |
|  - Avg flow: 7.2                                     |
|------------------------------------------------------|
| Links                                                |
|  [View Sessions]   [Flow Recipe]                     |
+------------------------------------------------------+

2.2 New Session Page
+------------------------------------------------------+
| FlowTrack                                            |
|------------------------------------------------------|
| < Back    New Session                                |
|------------------------------------------------------|
| Activity (optional): [___________________________]   |
|                                                      |
|         [   START SESSION   ]                        |
|                                                      |
| (When started)                                       |
|   Status: Running...                                 |
|   Started at: 09:15                                  |
|   Time elapsed: 00:23:17                             |
|                                                      |
|         [   END SESSION   ]                          |
|------------------------------------------------------|
| (After End Session clicked)                          |
|  Flow Rating (0-10): [ 0 1 2 3 4 5 6 7 8 9 10 ]      |
|  Notes (optional):                                   |
|    [___________________________________________]     |
|                                                      |
|  Tags (optional, comma-separated):                   |
|    [writing, deep_work]                              |
|                                                      |
|         [   SAVE SESSION   ]                         |
+------------------------------------------------------+

2.3 Sessions List
+------------------------------------------------------+
| FlowTrack                                            |
|------------------------------------------------------|
| < Back    Sessions                                   |
|------------------------------------------------------|
| [Most recent first]                                  |
|                                                      |
|  2025-11-24   "PRD draft"         45 min   Flow: 8   |
|  2025-11-24   "Email cleanup"     25 min   Flow: 4   |
|  2025-11-23   "Study JS"          60 min   Flow: 7   |
|  2025-11-22   "(no title)"        90 min   Flow: 9   |
|                                                      |
|  [Load more] (optional)                              |
+------------------------------------------------------+


(Optional v1 detail view: click a row to see start/end times & notes.)

2.4 New Physio Page

Option A: Typeform-style (one question per screen).

Screen 1:
+------------------------------------------------------+
| < Back   Log Physio (1/5)                            |
|------------------------------------------------------|
| How is your energy today?                            |
|                                                      |
|   [0] [1] [2] [3] [4] [5] [6] [7] [8] [9] [10]       |
|                                                      |
|                         [ Next → ]                   |
+------------------------------------------------------+

Screen 2:
| How is your mood today?   (same layout)              |

Screen 3:
| How clear/focused do you feel?                       |

Screen 4:
| How stressed or tense do you feel?                   |

Screen 5:
+------------------------------------------------------+
| Any quick notes about today?                         |
|  [__________________________________________]        |
|                                                      |
|         [   SAVE PHYSIO   ]                          |
+------------------------------------------------------+


Option B (if you want more compact v1): single-page form.

+------------------------------------------------------+
| < Back   Log Physio                                  |
|------------------------------------------------------|
| Energy (0-10):        [ slider or buttons ]          |
| Mood (0-10):          [ slider or buttons ]          |
| Focus/Clarity (0-10): [ slider or buttons ]          |
| Stress (0-10):        [ slider or buttons ]          |
| Notes (optional):                                    |
|   [__________________________________________]       |
|                                                      |
|         [   SAVE PHYSIO   ]                          |
+------------------------------------------------------+

2.5 Flow Recipe Page
+------------------------------------------------------+
| FlowTrack                                            |
|------------------------------------------------------|
| < Back   Flow Recipe                                 |
|------------------------------------------------------|
| Your current flow recipe:                            |
|                                                      |
| 1. [Morning deep work (7–9am)]                       |
|    Notes: "No phone, single task, coffee OK."        |
|    [Edit] [Delete]                                   |
|                                                      |
| 2. [Lo-fi music + headphones]                        |
|    Notes: "Use same playlist to create context cue." |
|    [Edit] [Delete]                                   |
|                                                      |
| 3. [2-min breathing before start]                    |
|    Notes: "Physiological sigh x2."                   |
|    [Edit] [Delete]                                   |
|------------------------------------------------------|
| [+ Add item]                                         |
+------------------------------------------------------+

(Add/Edit form)
+------------------------------------------------------+
| Title: [______________________________________]      |
| Notes:                                              |
|   [__________________________________________]       |
|                                                      |
|      [ Cancel ]  [ Save ]                            |
+------------------------------------------------------+

3. One final “v1 summary” (checklist)

Core pages

 Dashboard

 Show today’s latest physio snapshot (energy, mood, focus, stress).

 Show today’s session count and average flow rating.

 Show simple last-7-days session count and average flow rating.

 Buttons: “Log Physio”, “Start Session”.

 Links: “Sessions”, “Flow Recipe”.

 New Physio

 Capture energy (0–10), mood (0–10), focus/clarity (0–10), stress (0–10).

 Optional notes.

 Save as PhysioLog with date/time.

 Allow multiple logs per day; latest is “today’s”.

 New Session

 Activity name (optional).

 Start/End session with a timer.

 After end: collect flow rating (0–10), optional notes, optional tags.

 Save Session with start_time, end_time, duration_min, flow_rating, etc.

 Sessions List

 Reverse-chronological list of sessions.

 Each row: date, activity, duration, flow rating.

 Optional minimal detail view.

 Flow Recipe

 List of flow recipe items (title + notes).

 Add new item.

 Edit existing item.

 Delete item.

Backend / data

 physio_logs table with core fields (id, user_id, created_at, date, energy, mood, focus_clarity, stress, notes).

 sessions table with core fields (id, user_id, created_at, date, start_time, end_time, duration_min, activity, flow_rating, notes, tags).

 flow_recipe_items table with fields (id, user_id, created_at, updated_at, title, notes, order_index).

 Optional user_preferences table for defaults (session length, time zone, physio input mode).