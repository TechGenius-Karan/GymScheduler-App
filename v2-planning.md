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
- Submission either auto-approves them or queues them for review (TBD — see Open Questions).
- Trainers retain their trainee-side features (they can still have their own personal workout schedule).
- Role is stored additively: a user can be both trainee and trainer simultaneously.

---

## Interface Breakdown

### Trainee Navigation
| Page | Description |
|---|---|
| Schedule | Their personal weekly workout split (existing v1 feature) |
| Tools | Health/fitness calculators (1RM, etc.) |
| Tracking | Workout logs, progress over time (future feature) |
| Find Trainers | Browse trainer profiles, view availability, book sessions |

### Trainer Navigation
| Page | Description |
|---|---|
| My Clients | List of trainees who have booked or are working with them |
| Session Schedule | Calendar view of their booked/available sessions (time-blocked, not split-based) |
| Profile | Public trainer profile — bio, specializations, availability settings |
| (Personal Schedule) | Their own workout split, same as trainee view — accessed separately |

> Note: Trainers do NOT have the Tools (health calculators) page in their primary nav — they are viewed as professionals, not calculator users. Their personal schedule is accessible but not the primary focus of their trainer interface.

---

## Trainer Registration Flow

Registration is **self-service** — no admin approval required. However, the form must be thorough to maintain quality on the platform. Incomplete or low-effort submissions will not be visible to trainees until all required fields are filled.

1. User navigates to their profile page.
2. Clicks **"Opt to be a Trainer"** button.
3. A multi-step form or detailed single-page form with the following fields:

   **Required:**
   - Full name (may differ from Google display name)
   - Profile photo (upload or use Google avatar)
   - Bio / About Me (minimum character count enforced)
   - Specializations (multi-select from fixed list: Strength, Hypertrophy, Weight Loss, Rehab & Mobility, Cardio & Endurance, Bodybuilding, Sport-Specific, Nutrition Guidance)
   - Years of experience
   - Session type: In-Person / Online / Both
   - Location / city (required if In-Person or Both)
   - Whether they are currently accepting new clients

   **Optional but recommended:**
   - Certifications (e.g. NASM-CPT, ACE, CSCS — free text entries, multiple allowed)
   - Hourly rate (if left blank, profile shows "Rate: Contact for details")
   - Languages spoken
   - Any additional notes for prospective clients

4. On submit, a `TrainerProfile` document is created linked to their `User`.
5. Their role updates to include `'trainer'`.
6. They are redirected to the trainer-side interface.

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
- Trainers can also post **recurring availability** (e.g. every Tuesday 9am–12pm) which auto-generates individual slots.

### Booking Flow — Trainee Initiates
1. Trainee goes to **Find Trainers**.
2. Browses trainer cards (photo, name, specializations, rate, rating).
3. Clicks into a trainer's public profile.
4. Sees the trainer's available slots on a calendar.
5. Selects a slot, optionally adds a note (goals, injuries, etc.), and sends a booking request.
6. Booking status: `pending_trainer_approval` — the slot is soft-reserved.
7. Trainer sees the request on their calendar and accepts or rejects it.
8. On accept: status → `confirmed`. On reject: slot reopens for others.

### Booking Flow — Trainer Initiates
1. Trainer can browse trainees or see users who have indicated they go to the gym at a specific time.
2. Trainer sends a session invitation to a trainee for a specific slot.
3. Booking status: `pending_trainee_approval`.
4. Trainee sees the incoming request and accepts or rejects.
5. On accept: status → `confirmed`. On reject: no slot consumed.

### Key Rule
**Both trainer and trainee must approve before a booking is confirmed.** No session can be forced on either party. The initiating party's approval is implicit (they sent the request); the other party must explicitly confirm.

---

## Key Design Decisions

- **Roles are additive**: `user.roles = ['trainee']` by default; becomes `['trainee', 'trainer']` on opt-in. Avoids the complexity of separate accounts.
- **Trainer profiles are a separate collection**: keeps the `users` collection lean; trainer-specific fields only exist if the user opted in.
- **Dual-approval booking**: a booking is only confirmed when both parties have approved. The `bookings` document tracks `traineeApproved` and `trainerApproved` as separate booleans.
- **No in-app payments**: trainer's rate is displayed for reference. All financial arrangements happen off-platform between trainer and trainee.
- **Trainee owns their schedule**: trainers cannot edit a trainee's workout schedule. The trainee manages their own plan.
- **Bookings are their own collection**: decoupled from availability so history is preserved even after a slot is gone.
- **Availability supports recurring rules**: trainers can set recurring weekly patterns (e.g. every Monday 9am–11am) which auto-generate individual `availability_slot` documents. Manual one-off slots also supported.

---

## Decided

| Question | Decision |
|---|---|
| Trainer approval | Self-service — thorough form, auto-approved on submit |
| Booking confirmation | Both parties must approve. Initiator's approval is implicit; other party must accept explicitly. |
| Payment | No in-app transactions. Rate displayed as info only. |
| Trainer edits trainee schedule | No — trainee owns their schedule. |
| Recurring availability | Yes — trainers can set recurring weekly patterns. |
| Reviews & ratings | Yes — trainees can leave a review after a completed session; aggregate rating shown on trainer profile. |
| Workout tracking | Yes — simple tick marks per exercise per day (see Tracking Feature below). |

## Open Questions (Still Unresolved)

### Cancellation Policy
- Can trainees cancel confirmed bookings? Up to what point before the session?
- Can trainers cancel confirmed bookings? Any restrictions?
- What happens to the availability slot when a confirmed booking is cancelled — does it reopen?

### Notifications
- Email notifications for booking events (new request, confirmation, cancellation)?
- In-app notification badge/feed?

### Trainee-Trainer Relationship
- Is each booking one-off, or can there be an ongoing "active trainer" relationship?
- Can a trainee book multiple different trainers simultaneously?

### Find Trainers — Filtering & Search
- Which filters are shown? Candidates: specialization, session type (online/in-person), location, rate range, rating, accepting clients.
- Is there a free-text search bar for trainer name?

### Trainer Initiating a Booking — Discovery
- How does a trainer find a specific trainee to send a session invite?
- Does the trainee need to have a "discoverable" profile, or is there a search by name/email?
- Can the trainee opt out of being reachable by trainers?

---

## Tracking Feature

Trainees can mark their progress on any given day directly from their schedule view. The goal is maximum convenience — no separate logging flow, just tick marks.

### How It Works
- On the schedule page, each exercise row has a **checkbox / tick mark** next to it.
- Ticking an exercise marks it as completed for **today**.
- Ticking the day header (or a "Mark day complete" button) marks the whole day as done.
- The tick state is **date-specific** — Monday's ticks on June 16 do not affect Monday's ticks on June 23.
- A day card can show a completion summary: "3 / 5 exercises done" or a full green tick if all done.
- Rest days can be marked as "Rest taken" with a single tap.

### What is Tracked
- Per exercise: `completed: true/false` for a specific date
- Per day: derived from exercise completions (all ticked = day complete) OR a manual day-level override
- The underlying `schedule` document is not modified — completions are stored in a separate `workout_logs` collection keyed by user + date.

### Tracking Page (Trainee Nav)
- Shows a history of completed workouts — which days were done, how many exercises completed.
- Simple calendar or list view: each past day shows a green tick (full), partial indicator, or nothing.
- No complex analytics in v2 — just a clean history log.

---

## Review System

### How Reviews Work
- After a booking reaches `completed` status, the trainee is prompted (or can navigate) to leave a review on the trainer.
- One review per completed booking (not per trainer — so multiple sessions = multiple reviews possible).
- A review consists of:
  - **Star rating**: 1–5
  - **Written comment**: optional, free text
- Reviews are public and appear on the trainer's profile page.
- Aggregate rating (average of all ratings) is shown on the trainer listing card.

### Trainer Profile Page — Review Section
- Lists all reviews with reviewer name, date, rating, and comment.
- Average rating displayed prominently (e.g. "4.7 / 5 — 23 reviews").
- Trainer cannot delete or edit reviews left by trainees.

---

## v2 Build Phases (High-Level)

These phases assume v1 is already complete.

**Phase A — Role Infrastructure**
- Add `roles` array to `User` model
- Thorough trainer opt-in form + `TrainerProfile` creation
- Role-based routing (trainee nav vs trainer nav)

**Phase B — Workout Tracking**
- `workout_logs` collection + API endpoints
- Tick marks on exercise rows in the schedule view (date-specific)
- Day completion summary on day cards
- Tracking history page (trainee nav)

**Phase C — Trainer Profile & Discovery**
- Public trainer profile pages (bio, specializations, rate, rating)
- Find Trainers listing page with filters
- Trainer profile editing

**Phase D — Availability & Booking**
- Trainer availability slot management (manual + recurring rules)
- Trainee-initiated booking flow
- Trainer-initiated booking/invite flow
- Dual-approval logic (both must confirm)
- Trainer session calendar view
- Trainee's upcoming sessions view

**Phase E — Booking Lifecycle & Reviews**
- Booking status transitions and cancellation flows
- Session history for both parties
- Post-session review prompt
- Review display on trainer profiles + aggregate rating

**Phase F — Polish**
- Notifications (in-app or email — TBD)
- Responsive layouts for trainer calendar
- Loading/empty/error states for all new pages

---

## What Does NOT Change from v1

- Google OAuth login flow — unchanged
- Trainee weekly schedule (split picker, WeeklyView, inline editing, save)
- JWT auth middleware
- Template system (static JSON files)
- 1RM calculator (stays in Trainee > Tools)
- MongoDB + Mongoose architecture
- React + Vite + Tailwind frontend stack
