# Gym Scheduler — v2 Planning: Trainer/Trainee Platform

## Overview

v2 transforms the app from a single-user schedule tool into a two-sided platform. Every user starts as a **trainee** and can opt into becoming a **trainer** from their profile. The two roles have overlapping but distinct interfaces and data needs.

---

## Role System

### Default: Trainee
- Every new user is a trainee by default.
- Has access to: Schedule, Tools, Tracking, Find Trainers.

### Opt-in: Trainer
- From their profile page, any user can click **"Become a Trainer"**.
- They fill in a trainer profile form (details below).
- Self-service — auto-approved on submit. No admin review.
- Trainers retain their trainee-side features (they can still have their own personal workout schedule).
- **Role is stored additively**: `isTrainer: Boolean` flag on the `users` document (default `false`). Flipped to `true` on opt-in. A trainer is always also a trainee — no separate account needed.

> **Design decision (locked):** `isTrainer: Boolean` + embedded `trainerProfile` object on the `users` document, rather than a `roles` array or a separate `TrainerProfile` collection. A trainer is also a trainee, so a single role enum with a "both" option gets messy. Embedding keeps auth, profile, and schedule logic unified, and avoids joins on every profile fetch.

---

## Interface Breakdown

### Trainee Navigation
| Page | Description |
|---|---|
| Schedule | Their personal weekly workout split (existing v1 feature, updated for multi-program) |
| Tools | Health/fitness calculators (1RM, etc.) |
| Tracking | Workout logs, planned vs actual progress over time |
| Find Trainers | Browse trainer profiles, view availability, book sessions |
| Sessions | Upcoming and past booked sessions |

### Trainer Navigation
| Page | Description |
|---|---|
| My Sessions | Calendar view of their booked/available sessions (time-blocked, not split-based) |
| Availability | Manage their time slots (add, edit, delete, recurring batch) |
| Profile | Public trainer profile — bio, specializations, availability settings |
| (Personal Schedule) | Their own workout split, same as trainee view — accessible separately |

> Note: Trainers do NOT have the Tools (health calculators) page in their primary nav — they are viewed as professionals, not calculator users. Their personal schedule is accessible but not the primary focus of their trainer interface.

---

## Trainer Registration Flow

Registration is **self-service** — no admin approval required. The form must be thorough to maintain quality on the platform.

1. User navigates to their profile page.
2. Clicks **"Opt to be a Trainer"** button.
3. Fills in a detailed form:

   **Currently in backend (`trainerProfile` fields):**
   - Bio / About Me
   - Certifications (free text)
   - Gym Name
   - Location / City

   **Future additions (not yet in backend schema):**
   - Profile photo (upload or use Google avatar)
   - Specializations (multi-select: Strength, Hypertrophy, Weight Loss, Rehab & Mobility, Cardio & Endurance, Bodybuilding, Sport-Specific, Nutrition Guidance)
   - Years of experience
   - Session type: In-Person / Online / Both
   - Whether currently accepting new clients
   - Hourly rate (optional — if blank, shows "Rate: Contact for details")
   - Languages spoken

4. On submit: `isTrainer` flips to `true`, `trainerProfile` is populated.
5. User is redirected to the trainer-side interface.

---

## Trainer Session Schedule

The trainer's schedule is fundamentally different from a trainee's weekly split:
- It is **time-based** (specific dates + start/end times), not day-of-week based.
- Trainers post **availability slots** — blocks of time when they are free.
- Sessions can be initiated by either the trainee or the trainer (see below).
- **Both parties must approve** before a booking is confirmed.

### Trainer's Calendar View
- Shows a week or day view (like Google Calendar, not a split grid).
- Available (unbooked) slots shown in one color.
- Pending sessions (waiting for approval) shown in a distinct color.
- Confirmed sessions shown with the client's name.
- Trainer can add/remove availability slots.
- Trainers can post **recurring availability** (e.g. every Tuesday 9am–12pm) — the frontend generates individual slot documents and batch-POSTs them. Backend has zero recurrence logic.

### Booking Flow — Trainee Initiates
1. Trainee goes to **Find Trainers**.
2. Browses trainer cards (photo, name, gym, location, rating).
3. Clicks into a trainer's public profile.
4. Sees the trainer's available slots on a calendar.
5. Selects a slot, optionally adds a note (goals, injuries, etc.), and sends a booking request.
6. Booking status: `pending_trainer_approval` — the slot is soft-reserved (`isBooked: true`).
7. Trainer sees the request and confirms or cancels it.
8. On confirm: status → `confirmed`. On cancel: slot's `isBooked` reverts to `false`.

### Booking Flow — Trainer Initiates
1. Trainer sends a session invitation to a trainee for a specific slot.
2. Booking status: `pending_trainee_approval`.
3. Trainee sees the incoming request and confirms or cancels.
4. On confirm: status → `confirmed`. On cancel: no slot consumed.

### Key Rule
**Both trainer and trainee must approve before a booking is confirmed.** The initiating party's approval is implicit (they sent the request); the other party must explicitly confirm.

---

## Key Design Decisions (Locked)

| Decision | What was chosen | Why |
|---|---|---|
| Role storage | `isTrainer: Boolean` flag + embedded `trainerProfile` on `users` | Additive roles, no separate collection, no join needed |
| Trainer profiles | Embedded in `users` document | Avoids cross-collection joins on every profile load |
| Dual-approval booking | `traineeApproved` + `trainerApproved` booleans | Neither party can be forced into a session |
| Payment | No in-app transactions | Rate displayed as info only; off-platform arrangements |
| Trainee owns their schedule | Trainers cannot edit a trainee's workout schedule | Clear ownership |
| Bookings collection | Separate `trainerSchedules` collection | Decoupled from slots so booking history is preserved |
| Availability recurrence | Frontend generates individual slot docs, batch-POSTs | Backend stays simple; all recurrence logic in the client |
| Reviews | One per completed booking, rating cached on `trainerProfile` | Avoids recomputing average on every profile load |
| Workout tracking | Planned vs actual (sets + reps per exercise) | More useful than a binary tick — shows where performance diverged from the plan |

---

## Decided

| Question | Decision |
|---|---|
| Trainer approval | Self-service — thorough form, auto-approved on submit |
| Booking confirmation | Both parties must approve. Initiator's approval is implicit; other party must accept explicitly. |
| Payment | No in-app transactions. Rate displayed as info only. |
| Trainer edits trainee schedule | No — trainee owns their schedule. |
| Recurring availability | Yes — trainers set recurring patterns; frontend generates and batch-POSTs individual slot docs. |
| Reviews & ratings | Yes — trainees can leave a review after a completed session; aggregate rating shown on trainer profile. |
| Workout tracking | Yes — planned vs actual reps/sets per exercise per day (not just a tick mark). |

## Open Questions (Still Unresolved)

### Cancellation Policy
- Can trainees cancel confirmed bookings? Up to what point before the session?
- Can trainers cancel confirmed bookings? Any restrictions?
- What happens to the availability slot when a confirmed booking is cancelled — does it reopen? *(Backend already frees the slot on cancel — frontend just needs to reflect this.)*

### Notifications
- Email notifications for booking events (new request, confirmation, cancellation)?
- In-app notification badge/feed?

### Trainee-Trainer Relationship
- Is each booking one-off, or can there be an ongoing "active trainer" relationship?
- Can a trainee book multiple different trainers simultaneously?

### Find Trainers — Filtering & Search
- Which filters are shown? Candidates: specialization, session type (online/in-person), location, rate range, rating, accepting clients.
- Is there a free-text search bar for trainer name?
- **Missing backend route:** `GET /api/users?isTrainer=true` — needed for the Find Trainers page, not yet implemented.

### Trainer Initiating a Booking — Discovery
- How does a trainer find a specific trainee to send a session invite?
- Does the trainee need a "discoverable" profile, or is there a search by name/email?
- Can the trainee opt out of being reachable by trainers?

---

## Tracking Feature

Trainees log their actual workout performance against what was planned in their schedule.

### How It Works
- Each exercise row on the daily tracker shows two columns: **Planned** (from the active schedule — read-only) and **Actual** (editable inputs for sets and reps).
- An optional **Notes** field per exercise for qualitative observations.
- The log is **date-specific** — Monday's log on June 16 is a separate document from Monday's log on June 23.
- One document per user per date (upsert — safe to update mid-workout).
- The underlying `schedules` document is never modified — logs go to the separate `gymTracker` collection.

### What is Tracked (per exercise, per day)
- `exerciseId` — UUID ref to exercise library
- `exerciseName` — denormalized snapshot (preserved if exercise is later renamed/deleted)
- `plannedSets` / `plannedReps` — pulled from the active schedule at log time
- `actualSets` / `actualReps` — entered by the user
- `notes` — optional free text

### Tracking Page (Trainee Nav)
- Shows a history of completed workout logs — which days were done and how performance compared to the plan.
- Calendar or list view: each past day shows the program name and a summary of planned vs actual.
- No complex analytics in v2 — just a clean history log.

---

## Review System

### How Reviews Work
- After a booking reaches `completed` status, the trainee can leave a review on the trainer.
- One review per completed booking (multiple sessions = multiple reviews possible).
- A review consists of:
  - **Star rating**: 1–5
  - **Written comment**: optional, free text
- Reviews are public and appear on the trainer's profile page.
- Aggregate rating (average of all ratings) is cached on `trainerProfile.averageRating` and updated atomically on each new review.

### Trainer Profile Page — Review Section
- Lists all reviews with reviewer name, date, rating, and comment.
- Average rating displayed prominently (e.g. "4.7 / 5 — 23 reviews").
- Trainer cannot delete or edit reviews left by trainees.

---

## Build Status

### Backend — Complete
All 7 backend phases are implemented and pushed.

| Phase | What | Status |
|---|---|---|
| 1 | User model: `isTrainer` + embedded `trainerProfile` | Done |
| 2 | `exerciseMaster` collection + CRUD routes | Done |
| 3 | Schedules rework: multi-program, FK to exerciseMaster | Done |
| 4 | `gymTracker` — planned vs actual workout logs | Done |
| 5 | `trainerSlots` — trainer availability | Done |
| 6 | `trainerSchedules` — dual-approval bookings | Done |
| 7 | `reviews` — trainee reviews trainer post-session | Done |

### Frontend — In Progress
See `frontend-plan.md` for the full phase breakdown.

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

## What Does NOT Change from v1

- Google OAuth login flow — unchanged
- Trainee weekly schedule (split picker, WeeklyView, inline editing, save) — updated for multi-program but same UX shape
- JWT auth middleware
- Template system (static JSON files)
- 1RM calculator (stays in Trainee > Tools)
- MongoDB + Mongoose architecture
- React + Vite + Tailwind frontend stack
