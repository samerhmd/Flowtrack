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