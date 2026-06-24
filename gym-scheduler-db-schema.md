# Gym Scheduler App — Database Schema Plan
**Version 3.0** | Final agreed design

---

## Tech Stack (Unchanged)

- **Database:** MongoDB via Mongoose (ODM)
- **Backend:** Node.js + Express
- **IDs:** UUID v4 (GUID) on all documents

---

## Key Terms & Design Principles

Before the schema, here's what some recurring terms mean — important for understanding the decisions made below.

**Master vs Transactional**
- *Master* tables hold reference/lookup data that rarely changes. Think exercise library, user profiles, time slots.
- *Transactional* tables record events that happen over time and grow continuously. Think workout logs, bookings.

**Normalize vs Denormalize**
- *Normalize* = store data once, reference it by ID elsewhere. Keeps things consistent and avoids repetition.
- *Denormalize* = deliberately copy some data into a table for read speed. For example, storing `exerciseName` inside the workout log so that even if the exercise is renamed later, old logs still show the correct name.
- We use both strategically depending on the table.

**Created / Modified (Audit Timestamps)**
- Every collection will have `createdAt` and `updatedAt` fields. This is a global rule, not just for some tables.

**Constraints**
- Rules enforced at the database level:
  - `PK` — Primary Key. Uniquely identifies each document.
  - `FK` — Foreign Key. This field must reference a valid document in another collection.
  - `unique` — No two documents can share this value (e.g., email).
  - `required` — Field cannot be empty or null.
  - `default` — Value is assigned automatically if not provided.
  - `enum` — Field only accepts specific defined values.

---

## Collections Overview

| # | Collection | Type | Purpose |
|---|---|---|---|
| 1 | `users` | Master | All users; trainer profile embedded on opt-in |
| 2 | `exerciseMaster` | Master | Exercise library created by each user |
| 3 | `schedules` | Transactional | Weekly workout programs (multiple per user) |
| 4 | `gymTracker` | Transactional | Actual daily workout log (planned vs actual) |
| 5 | `trainerSlots` | Transactional | Trainer's available time slots per day |
| 6 | `trainerSchedules` | Transactional | Bookings between trainer and trainee — dual-approval |
| 7 | `reviews` | Transactional | Trainee reviews trainer after a completed session |

---

## Collection Schemas

---

### 1. `users` — Master

Every user starts as a trainee. The `isTrainer` flag is `false` by default and gets flipped to `true` when the user opts in and fills out their trainer credentials.

> **Design decision:** Single `users` collection with an `isTrainer` flag + embedded `trainerProfile`, instead of separate Trainer/Trainee collections or a role enum. A trainer is also a trainee — forcing a single role enum would require a "both" option which gets messy. One collection keeps auth, profile, and schedule logic unified.

> **`averageRating` / `reviewCount`** are cached on the embedded profile and updated atomically each time a new review is submitted. This avoids recomputing the average on every page load.

```
users {
  id                  GUID            PK
  googleId            String          unique, required
  name                String          required
  email               String          unique, required
  picture             String          default ''
  isTrainer           Boolean         default false
  trainerProfile      Object | null   default null        ← filled on opt-in only
    ├── bio               String
    ├── certifications    String
    ├── gymName           String
    ├── location          String
    ├── averageRating     Number        default 0          ← cached, updated on each review
    └── reviewCount       Number        default 0          ← cached, updated on each review
  firstLogin          Boolean         default true
  createdAt           Date            auto
  updatedAt           Date            auto
}
```

---

### 2. `exerciseMaster` — Master

A library of exercises created by the user. Each user builds their own list. These are referenced inside schedule programs.

> **Design note:** `createdBy` links the exercise to its owner. A future `isGlobal` flag can expose certain exercises to all users (shared library).

```
exerciseMaster {
  id                  GUID            PK
  name                String          required, trimmed
  description         String          optional
  muscleImpact        String[]        e.g. ["chest", "triceps"]
  createdBy           FK → users      required
  createdAt           Date            auto
  updatedAt           Date            auto
}
```

---

### 3. `schedules` — Transactional

One user can have **multiple programs**, each with a name and goal. Only one program is active at a time.

> **Why this matters:** A user may want a "Summer Cut" program and a separate "Winter Bulk" program. The day structure (7 days, DayCards, exercises) is identical across programs — only the exercise selections and split names change per goal.

```
schedules {
  id                  GUID            PK
  userId              FK → users      required  (no unique constraint — multiple programs allowed)
  programName         String          required  e.g. "Summer Cut", "Hypertrophy Phase"
  goal                String          optional  e.g. "Cut", "Bulk", "Strength"
  isActive            Boolean         default false  ← only one program active per user at a time
  days                DayCard[]       always 7 entries (Monday–Sunday)
  createdAt           Date            auto
  updatedAt           Date            auto
}
```

**Embedded `DayCard` (7 per schedule):**
```
DayCard {
  id                  GUID
  day                 enum            Monday | Tuesday | ... | Sunday
  isRest              Boolean         default false
  splitName           String          e.g. "Push", "Pull", "Legs"
  exercises           ExerciseEntry[]
}
```

**Embedded `ExerciseEntry` (per exercise within a day):**
```
ExerciseEntry {
  id                  GUID
  exerciseId          FK → exerciseMaster   UUID string ref
  sets                Number          required, positive integer
  reps                Number          required, positive integer
}
```

**`isActive` rule:** When a user activates a program, all their other programs are set to `isActive: false` first. Only one active program per user at any time.

---

### 4. `gymTracker` — Transactional

The actual workout log. Records what was *done* on a specific date, as opposed to what was *planned* in the schedule.

> **Denormalization note:** `exerciseName` is stored directly on each log entry. If a user later renames or deletes an exercise from their library, the historical log still shows the correct name from the time of the workout.

> **Upsert rule:** One document per user per date — use `findOneAndUpdate` with `upsert: true` keyed on `{ userId, date }`.

```
gymTracker {
  id                  GUID            PK
  userId              FK → users      required
  date                Date            required  (date only, no time)
  scheduleId          FK → schedules  (which program was active)
  dayCardId           String          (UUID of the DayCard followed)
  exercises           LogEntry[]
  createdAt           Date            auto
  updatedAt           Date            auto
}
```

**Embedded `LogEntry` (per exercise in the log):**
```
LogEntry {
  exerciseId          FK → exerciseMaster   UUID string ref
  exerciseName        String          denormalized snapshot — preserved for history
  plannedSets         Number          what the schedule said
  plannedReps         Number          what the schedule said
  actualSets          Number          what the user actually did
  actualReps          Number          what the user actually did
  notes               String          optional
}
```

---

### 5. `trainerSlots` — Transactional

One document per available slot. Each slot belongs to a specific trainer on a specific date.

> **Recurrence rule:** The `recurrenceRule` field stores a label only — the backend has zero recurrence logic. The frontend generates all individual slot instances and sends them as a batch POST. The backend just saves what it receives.

```
trainerSlots {
  id                  GUID            PK
  trainerId           FK → users      required  (user must have isTrainer: true)
  date                Date            required  (specific calendar date)
  startTime           String          e.g. "09:00"
  endTime             String          e.g. "10:00"
  gymName             String
  location            String
  isBooked            Boolean         default false
  recurrenceRule      String | null   e.g. "weekly" | null if one-off  (label only)
  createdAt           Date            auto
  updatedAt           Date            auto
}
```

---

### 6. `trainerSchedules` — Transactional

Booking between a trainer and trainee. Either party can initiate. **Both must approve** before the session is confirmed.

```
trainerSchedules {
  id                    GUID          PK
  trainerId             FK → users    required
  traineeId             FK → users    required
  slotId                FK → trainerSlots | null   (null if trainer invites without a slot)
  date                  Date          required
  startTime             String        e.g. "09:00"
  endTime               String        e.g. "10:00"
  initiatedBy           enum          "trainer" | "trainee"
  traineeApproved       Boolean       default false
  trainerApproved       Boolean       default false
  status                enum          "pending_trainer_approval" | "pending_trainee_approval" |
                                      "confirmed" | "cancelled" | "completed"
  cancelledBy           String | null "trainer" | "trainee" | null
  cancellationReason    String        optional
  notes                 String        optional  (requester adds context on booking)
  createdAt             Date          auto
  updatedAt             Date          auto
}
```

**Dual-approval rules:**
- **Trainee initiates:** `traineeApproved: true`, `trainerApproved: false`, status → `pending_trainer_approval`. Slot's `isBooked` set to `true` immediately (holds the slot).
- **Trainer initiates:** `trainerApproved: true`, `traineeApproved: false`, status → `pending_trainee_approval`.
- **On confirm:** set the caller's `*Approved` to `true`. If both are now `true` → status → `confirmed`.
- **On cancel:** status → `cancelled`, `cancelledBy` + `cancellationReason` saved. If `slotId` exists, slot's `isBooked` reverts to `false`.
- **Completed:** set manually (trainer marks done) or via a future scheduled job.

**Status lifecycle:**
```
[trainee requests]                    [trainer invites]
        |                                     |
pending_trainer_approval        pending_trainee_approval
        |                                     |
  trainer confirms                    trainee confirms
        |                                     |
        └──────────── confirmed ──────────────┘
                          |
               (session passes / manual mark)
                          |
                      completed

  (either party rejects or cancels at any stage → cancelled)
```

---

### 7. `reviews` — Transactional

One review per completed booking. A trainee reviews the trainer after a session is marked `completed`.

> **Atomic update:** On submit, insert the review and update `users.trainerProfile.averageRating` and `users.trainerProfile.reviewCount` in the same operation.

```
reviews {
  id            GUID          PK
  bookingId     FK → trainerSchedules   unique (one review per booking)
  traineeId     FK → users    required  (denormalized — avoids join through booking)
  trainerId     FK → users    required  (denormalized — avoids join through booking)
  rating        Number        required, 1–5
  comment       String        optional
  createdAt     Date          auto
}
```

**Rules:**
- Only the trainee on a `completed` booking can submit a review.
- `bookingId` has a unique index — enforced at the DB level.
- No `updatedAt` — reviews are immutable once submitted.

---

## API Routes Summary

### Auth (`/auth`)

| Route | Description |
|---|---|
| `GET /auth/google` | Redirects to Google OAuth |
| `GET /auth/google/callback` | Issues JWT on successful login |
| `GET /auth/me` | Returns current user — requires Bearer token |

---

### User / Trainer Profile (`/api/user`)

| Route | Description |
|---|---|
| `PATCH /api/user/become-trainer` | Sets `isTrainer: true`, saves initial `trainerProfile` fields |
| `PATCH /api/user/trainer-profile` | Update trainer profile fields (bio, certifications, etc.) |

---

### Exercise Master (`/api/exercises`)

| Route | Description |
|---|---|
| `GET /api/exercises` | Returns user's exercise library |
| `POST /api/exercises` | Creates a new exercise |
| `PATCH /api/exercises/:id` | Edit an exercise |
| `DELETE /api/exercises/:id` | Deletes an exercise |

---

### Schedules (`/api/schedules`)

| Route | Description |
|---|---|
| `GET /api/schedules` | Returns all programs for the user |
| `POST /api/schedules` | Creates a new program |
| `PATCH /api/schedules/:id` | Edit a program's name, goal, or days |
| `PATCH /api/schedules/:id/activate` | Sets this program as active, deactivates all others |
| `DELETE /api/schedules/:id` | Deletes a program |

---

### Gym Tracker (`/api/tracker`)

| Route | Description |
|---|---|
| `GET /api/tracker` | Returns all workout logs for the user |
| `GET /api/tracker?date=YYYY-MM-DD` | Returns log for a specific date |
| `POST /api/tracker` | Saves/overwrites a workout log entry (upsert by userId + date) |

---

### Trainer Slots (`/api/slots`)

| Route | Description |
|---|---|
| `GET /api/slots` | Returns all slots for the logged-in trainer |
| `GET /api/slots/:trainerId` | Public — open slots for a specific trainer |
| `POST /api/slots` | Creates one slot or an array of slots (batch) |
| `PATCH /api/slots/:id` | Edit a slot (only if not booked) |
| `DELETE /api/slots/:id` | Removes a slot (only if not booked) |

---

### Bookings (`/api/bookings`)

| Route | Description |
|---|---|
| `GET /api/bookings` | Returns bookings for the current user (as trainer or trainee) |
| `POST /api/bookings` | Creates a booking request |
| `PATCH /api/bookings/:id/confirm` | Approve the booking (sets caller's side to true) |
| `PATCH /api/bookings/:id/cancel` | Cancel a booking at any stage |

---

### Reviews (`/api/reviews`)

| Route | Description |
|---|---|
| `POST /api/reviews` | Submit a review (booking must be `completed`) |
| `GET /api/reviews/:trainerId` | Public — all reviews for a trainer |

---

## What Changed from v1

| Area | v1 | v3 (This Plan) |
|---|---|---|
| User roles | `role: Trainer \| Trainee` enum | `isTrainer: Boolean` flag + embedded `trainerProfile` |
| Schedules | One schedule per user (unique) | Multiple programs per user with `isActive` flag |
| Exercise source | Exercise name stored inline | `exerciseMaster` collection — user builds their own library |
| Workout log | Not designed | `gymTracker` — full `LogEntry` with planned vs actual + denormalized name |
| Slot recurrence | Not designed | `recurrenceRule` label only; frontend generates and batch-POSTs instances |
| Bookings | Not designed | `trainerSchedules` with full dual-approval flow |
| Reviews | Not designed | `reviews` collection; rating cached on `trainerProfile` |
| Audit timestamps | Partial | `createdAt` + `updatedAt` on every collection |

---

*End of schema plan — v3.0*
