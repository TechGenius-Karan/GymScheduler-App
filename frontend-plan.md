# Frontend Implementation Plan

> Reference doc — pick up any phase independently. Backend is fully implemented. This plan covers wiring the existing UI to the new API and building all new v2 pages and features.
> Companion docs: `v2-planning.md` (narrative/why), `gym-scheduler-db-schema.md` (schema), `backend-plan.md` (API reference).

---

## Product Philosophy

- **Convenience first** — every interaction should be fast and intuitive
- **Real app feel** — structured UI with clear sections, not a chat-driven interface
- **Minimal friction** — inline editing, no separate edit pages where avoidable
- **Role-additive** — a trainer is also a trainee; one account, two interfaces

---

## Current Frontend State (v1 — What Exists)

### File Structure
```
client/src/
├── api/
│   ├── authApi.js          getMe()
│   ├── scheduleApi.js      getSchedule(), saveSchedule()  ← needs update
│   └── templateApi.js      getAllTemplates(), getTemplate(id)
├── context/
│   ├── AuthContext.jsx     user + isNew state; login/logout
│   └── ScheduleContext.jsx activeView, myScheduleData, templateData, mutations
├── pages/
│   ├── LoginPage.jsx
│   ├── AuthCallbackPage.jsx
│   ├── SchedulePage.jsx
│   └── ToolsPage.jsx
├── components/
│   ├── Navbar.jsx
│   ├── WelcomeBanner.jsx
│   ├── WeeklyView.jsx
│   ├── DayCard.jsx
│   ├── ExerciseRow.jsx
│   ├── SplitPicker.jsx
│   ├── TemplateView.jsx
│   ├── ScheduleActionBar.jsx
│   └── NewProgramModal.jsx
└── utils/
    └── dateUtils.js        getTodayName(), getTodayWorkout()
```

### What the existing UI calls (v1 API — now stale)
| Old call | New endpoint | Action needed |
|---|---|---|
| `GET /api/schedule` | `GET /api/schedules` | Update + handle array response |
| `POST /api/schedule` | `POST /api/schedules` | Update + send programName/goal |

---

## Architecture Principles (carry forward)

- **Interface Segregation** — `api/` folder split by domain. Each new feature gets its own `api/*.js` file.
- **Open/Closed** — template splits are static JSON files; adding a new split = new file, no code change.
- **Single Responsibility** — context files hold state + API calls; components only render and emit events.
- No service layer or repository pattern — business logic is negligible at this scale.

---

## Phase Overview

| Phase | What | Status |
|---|---|---|
| A | Wire schedule UI to new multi-program API | Not started |
| B | Exercise Library UI | Not started |
| C | Gym Tracker UI | Not started |
| D | Trainer Profile + Become a Trainer | Not started |
| E | Find Trainers + Trainee Booking Flow | Not started |
| F | Trainer Dashboard (slots + calendar) | Not started |
| G | Reviews UI | Not started |
| H | Polish + Future (notifications, AI assistant) | Not started |

---

## Phase A — Wire Schedule UI to New API

**Status: [ ] Not started**

### What changed on the backend
- Route: `/api/schedule` → `/api/schedules`
- Response: single object → array of program objects
- Each program has: `_id`, `programName`, `goal`, `isActive`, `days[]`
- New endpoints: `POST /api/schedules`, `PATCH /api/schedules/:id`, `PATCH /api/schedules/:id/activate`, `DELETE /api/schedules/:id`

### `client/src/api/scheduleApi.js` — rewrite
```
getSchedules()             GET /api/schedules   → returns array
createSchedule(data)       POST /api/schedules
updateSchedule(id, data)   PATCH /api/schedules/:id
activateSchedule(id)       PATCH /api/schedules/:id/activate
deleteSchedule(id)         DELETE /api/schedules/:id
```

### `ScheduleContext.jsx` — updates
- Replace single `myScheduleData` with `programs[]` + `activeProgram` (the one with `isActive: true`)
- On load: call `getSchedules()`, find active program, set as the working schedule
- `saveSchedule()` → `createSchedule()` for new, `updateSchedule(id)` for edits
- Add `activateProgram(id)` mutation
- `firstLogin` / `isNew` logic stays the same (backend still handles it on first POST)

### New UI: Program Switcher
- Dropdown or sidebar showing all programs for the user
- Active program highlighted
- "New Program" button → opens `NewProgramModal` (already exists — wire it up)
- "Activate" and "Delete" actions per program
- `NewProgramModal` fields: **Program Name** (required), **Goal** (optional — Cut / Bulk / Strength / Custom)

### Rules
- If user has zero programs → show SplitPicker (same as before)
- If user has programs but none active → show program list, prompt to activate one
- Save button now calls `updateSchedule(activeProgram._id, days)`

---

## Phase B — Exercise Library UI

**Status: [ ] Not started**

### New file: `client/src/api/exercisesApi.js`
```
getExercises()             GET /api/exercises
createExercise(data)       POST /api/exercises
updateExercise(id, data)   PATCH /api/exercises/:id
deleteExercise(id)         DELETE /api/exercises/:id
```

### New context or state: `ExerciseContext.jsx` (or fold into ScheduleContext)
- Holds `exercises[]` — the user's exercise library
- Loaded once on app mount (or lazily when schedule page opens)
- `createExercise`, `updateExercise`, `deleteExercise` mutations

### New page/modal: Exercise Library
- Accessible from the Schedule page (e.g. "Manage Exercises" link)
- List of all exercises with muscle groups
- Inline edit: name, description, muscleImpact (multi-select chips)
- "+ New Exercise" row at the bottom
- Delete with confirmation

### `ExerciseRow.jsx` — update
- Replace free-text name input with a **dropdown/search picker** that reads from the exercise library
- Selected exercise stores `exerciseId` (UUID) instead of `name`
- Display: show exercise name resolved from context (not stored inline)
- "+" to add exercise to library inline if it doesn't exist yet

### `DayCard.jsx` — update
- "+ Add Exercise" opens the exercise picker (not a blank free-text row)

### Migration note
Old schedules with inline `name` (no `exerciseId`) still render — show the `name` field as-is. Only new additions use the library picker.

---

## Phase C — Gym Tracker UI

**Status: [ ] Not started**

### New file: `client/src/api/trackerApi.js`
```
getLogs()                  GET /api/tracker
getLogByDate(date)         GET /api/tracker?date=YYYY-MM-DD
saveLog(data)              POST /api/tracker
```

### What a log entry looks like (sent by client)
```js
{
  date: "2026-06-25",
  scheduleId: "<active program _id>",
  dayCardId: "<UUID of today's DayCard>",
  exercises: [
    {
      exerciseId: "<UUID>",
      exerciseName: "Bench Press",   // snapshot — client must provide this
      plannedSets: 4, plannedReps: 8,
      actualSets: 4,  actualReps: 7,
      notes: "felt strong"
    }
  ]
}
```

### `DayCard.jsx` — update (tracker mode)
- Add a "Log Workout" mode toggle or a dedicated tracker view for today's card
- Each exercise row shows: planned (from schedule, read-only) + actual inputs (sets, reps, notes)
- Auto-populates `plannedSets` / `plannedReps` from the active schedule
- "Save Log" button → calls `saveLog()` (upsert — safe to call multiple times per day)

### New page: `TrackingPage.jsx`
- Route: `/tracking`
- Shows history of past workout logs
- Simple list or calendar view: date, program name, exercises completed
- Clicking a date expands to show the full log (planned vs actual per exercise)

### Navbar update
- Add "Tracking" to trainee nav

---

## Phase D — Trainer Profile + Become a Trainer

**Status: [ ] Not started**

### New file: `client/src/api/trainerApi.js`
```
becomeTrainer(data)        PATCH /api/user/become-trainer
updateTrainerProfile(data) PATCH /api/user/trainer-profile
```

### `AuthContext.jsx` — update
- Expose `isTrainer` and `trainerProfile` from `/auth/me` response (backend already returns them)
- Add `becomeTrainer(data)` and `updateTrainerProfile(data)` actions

### New page: `ProfilePage.jsx`
- Route: `/profile`
- Shows user info (name, email, avatar from Google)
- If `isTrainer: false` → shows **"Become a Trainer"** button
- If `isTrainer: true` → shows trainer profile with edit option

### New component: `BecomeTrainerForm.jsx`
Full form per `v2-planning.md` spec:

**Required fields:**
- Bio / About Me (textarea, minimum character count)
- Gym Name
- Location / City
- Certifications (free-text, multiple entries)

**Optional fields:**
- (Extend `trainerProfile` fields as the platform grows — `specializations`, `yearsExperience`, `sessionType`, `hourlyRate` etc. are future additions once trainerProfile is expanded on the backend)

On submit: calls `becomeTrainer(data)` → updates `AuthContext` → redirects to trainer interface

### `Navbar.jsx` — update
- Add "Profile" link for all users

---

## Phase E — Find Trainers + Trainee Booking Flow

**Status: [ ] Not started**

### New files
```
client/src/api/slotsApi.js
  getTrainerSlots(trainerId)   GET /api/slots/:trainerId   (public — no auth)

client/src/api/bookingsApi.js
  getBookings()                GET /api/bookings
  createBooking(data)          POST /api/bookings
  confirmBooking(id)           PATCH /api/bookings/:id/confirm
  cancelBooking(id, reason)    PATCH /api/bookings/:id/cancel
```

### New page: `FindTrainersPage.jsx`
- Route: `/find-trainers`
- Calls `GET /api/users?isTrainer=true` — **Note: this route does not exist yet in the backend; needs adding in a future backend patch**
- Trainer cards: avatar, name, gym, location, `averageRating`, `reviewCount`
- Filters: location, rating (future — implement search/filter once trainer list grows)
- Clicking a card → `TrainerProfilePage`

### New page: `TrainerProfilePage.jsx`
- Route: `/trainers/:trainerId`
- Public — no auth required to view
- Shows: bio, certifications, gym, location, rating, reviews
- Availability calendar (reads from `GET /api/slots/:trainerId`)
- Auth-gated "Book This Slot" button

### New component: `SlotCalendar.jsx`
- Reads unbooked slots for the trainer
- Calendar or list view showing available dates + times
- Clicking a slot → opens booking confirmation modal

### New component: `BookingModal.jsx`
- Shows slot details (date, time, gym, location)
- Notes field (goals, injuries, questions)
- "Send Booking Request" → calls `createBooking()`
- Shows pending status after submission

### New page: `MySessionsPage.jsx`
- Route: `/sessions`
- Shows all bookings for the current user (trainer or trainee)
- Status badges: pending / confirmed / completed / cancelled
- "Confirm" button for pending approvals
- "Cancel" button for active bookings (with reason input)

### Navbar update
- Add "Find Trainers" and "Sessions" to trainee nav

---

## Phase F — Trainer Dashboard

**Status: [ ] Not started**

### Role-based navigation
When `isTrainer: true`, show a distinct trainer nav (or a mode switcher):

| Trainer Nav Link | Page |
|---|---|
| My Sessions | `/trainer/sessions` — calendar of bookings |
| Availability | `/trainer/availability` — manage slots |
| Profile | `/profile` — edit trainer profile (shared with Phase D) |

### New page: `TrainerAvailabilityPage.jsx`
- Route: `/trainer/availability`
- Shows trainer's own slots (`GET /api/slots`)
- Add slot form: date picker, start/end time, gym name, location
- Recurring slot generator: pick day-of-week + time + date range → client generates individual slot objects → batch `POST /api/slots` with array
- Edit/delete unbooked slots inline
- Booked slots shown as read-only (greyed out with trainee placeholder)

### New page: `TrainerSessionsPage.jsx`
- Route: `/trainer/sessions`
- Week/day calendar view (similar to Google Calendar feel — see `v2-planning.md`)
- Available slots: one color
- Pending bookings: distinct color
- Confirmed sessions: shown with trainee name
- Clicking a booking → details + Confirm / Cancel actions

### New component: `TrainerSlotForm.jsx`
- Used inside `TrainerAvailabilityPage`
- Fields: date, startTime, endTime, gymName, location, recurrenceRule (label only)
- On recurrence select: expands to show date range picker; client generates the individual slot array

---

## Phase G — Reviews UI

**Status: [ ] Not started**

### New file: `client/src/api/reviewsApi.js`
```
submitReview(data)           POST /api/reviews
getTrainerReviews(trainerId) GET /api/reviews/:trainerId
```

### Review prompt
- On `MySessionsPage` / `TrainerSessionsPage`, completed bookings show a **"Leave a Review"** button (trainee-side only)
- Opens `ReviewModal.jsx`: star rating (1–5) + optional comment text area
- Submits via `submitReview()` — button disappears after submission (one per booking, enforced by backend)

### `TrainerProfilePage.jsx` — update
- Reviews section: list of reviews with star rating, comment, date, reviewer name
- Aggregate: "4.7 / 5 — 23 reviews" shown prominently
- Reviews fetched via `getTrainerReviews(trainerId)`

---

## Phase H — Polish + Future

**Status: [ ] Not started**

### Notifications (future)
Per `v2-planning.md` open questions — in-app badge/feed or email. Not in scope until decided.

### AI Chat Assistant (future)
- Floating chat bubble on the Schedule page
- User describes what happened: "I missed Push day", "I only did half my leg workout"
- Assistant reads current schedule, suggests exercise redistribution or revised weekly plan
- Powered by `@anthropic-ai/sdk` calling `claude-sonnet-4-6`
- Requires Anthropic API key in `server/.env`

### Responsive layouts
- 7-day grid on Schedule page (already partially handled)
- Trainer calendar needs mobile-friendly collapse

### Loading / empty / error states
- Skeleton cards on schedule load
- Empty states for: no programs yet, no exercises in library, no trainers found, no bookings
- Error boundaries on all new pages

---

## New Backend Routes Needed (Frontend Blockers)

These are gaps identified while planning the frontend — not yet implemented on the backend:

| Route | Needed for | Priority |
|---|---|---|
| `GET /api/users?isTrainer=true` | Find Trainers page | High |
| `GET /auth/me` already returns `isTrainer` | AuthContext update | Already works |
| `PATCH /api/bookings/:id/complete` | Mark session done (trainer action) | Medium |

---

## Implementation Order

```
Phase A  →  Phase B  →  Phase C  →  Phase D  →  Phase E  →  Phase F  →  Phase G  →  Phase H
Schedule     Exercise     Tracker     Profile      Find          Trainer     Reviews     Polish
Rework       Library      UI          + Trainer    Trainers      Dashboard   UI          + AI
(critical)   (medium)     (medium)    opt-in       + Booking     (complex)   (simple)
                                      (medium)     (complex)
```

Phase A is the only breaking change — it must be done first. Phases B–D are independent of each other and can be done in any order. Phases E and F both depend on D. Phase G depends on E+F. Phase H is ongoing.
