# Backend Implementation Plan

> Reference doc — pick up any phase independently. Each phase lists the model changes, routes, and key rules.
> Schema source: `gym-scheduler-db-schema.md` + dual-approval bookings and reviews from `db-schema-v2.md`.

---

## Schema at a Glance

| Collection | Status | Purpose |
|---|---|---|
| `users` | Modify | Add `isTrainer` flag + embedded `trainerProfile` |
| `exerciseMaster` | New | Per-user exercise library; referenced by schedules |
| `schedules` | Rework | Multiple programs per user; exercises FK to exerciseMaster |
| `gymTracker` | New | Daily workout log — planned vs actual reps/sets |
| `trainerSlots` | New | Individual time slots posted by trainers |
| `trainerSchedules` | New | Bookings with dual-approval flow |
| `reviews` | New | Trainee reviews trainer after a completed session |

---

## Phase 1 — User Model Update

**Status: [x] Done**

### Model changes (`server/models/User.js`)

Add to the existing schema:

```
isTrainer        Boolean    default false
trainerProfile   Object     default null
  ├── bio            String
  ├── certifications String
  ├── gymName        String
  └── location       String
```

- `googleId`, `name`, `email`, `picture`, `firstLogin` fields stay as-is.
- Existing documents are unaffected (Mongoose defaults handle missing fields).

### New routes (`server/routes/auth.js` or new `server/routes/trainer.js`)

| Method | Route | Description |
|---|---|---|
| PATCH | `/api/user/become-trainer` | Sets `isTrainer: true`, saves `trainerProfile` fields |
| PATCH | `/api/user/trainer-profile` | Update trainer profile fields |

### Rules
- `trainerProfile` is only populated when `isTrainer` becomes `true`.
- Auth middleware already attaches `req.user` — no changes needed there.

---

## Phase 2 — Exercise Master

**Status: [x] Done**

### New model (`server/models/ExerciseMaster.js`)

```
id              UUID (crypto.randomUUID())   PK
name            String    required, trim
description     String    optional
muscleImpact    [String]  e.g. ["chest", "triceps"]
createdBy       ObjectId  ref: User, required
createdAt / updatedAt     auto (timestamps: true)
```

### New routes (`server/routes/exercises.js`)

| Method | Route | Description |
|---|---|---|
| GET | `/api/exercises` | All exercises for the logged-in user |
| POST | `/api/exercises` | Create a new exercise |
| PATCH | `/api/exercises/:id` | Edit name, description, muscleImpact |
| DELETE | `/api/exercises/:id` | Delete (warn: also orphans any schedule references) |

### Rules
- All routes scoped to `req.user._id` — users only see their own exercises.
- On DELETE, no cascade needed yet; orphaned `exerciseId` refs in schedules are a v3 concern.

---

## Phase 3 — Schedules Rework

**Status: [x] Done**

### Model changes (`server/models/Schedule.js`)

**Remove:** unique constraint on `userId`.

**Add fields:**
```
programName     String    required  e.g. "Summer Cut"
goal            String    optional  e.g. "Cut", "Bulk", "Strength"
isActive        Boolean   default false
```

**Change ExerciseEntry shape** (inside `days[].exercises[]`):
```
OLD: { id, name, sets, reps }
NEW: { id (UUID), exerciseId (ref: ExerciseMaster), sets, reps }
```

`exerciseId` is a string UUID matching an `exerciseMaster` document's `id` field.

### Route changes (`server/routes/schedule.js`)

Replace the existing single-schedule GET/POST with:

| Method | Route | Description |
|---|---|---|
| GET | `/api/schedules` | All programs for the user |
| POST | `/api/schedules` | Create a new program |
| PATCH | `/api/schedules/:id` | Edit programName, goal, or days |
| PATCH | `/api/schedules/:id/activate` | Set this program active, deactivate all others |
| DELETE | `/api/schedules/:id` | Delete a program |

### Rules
- `PATCH /activate`: do both ops atomically — `updateMany` to set all user's schedules to `isActive: false`, then `findByIdAndUpdate` the target to `isActive: true`.
- `firstLogin` logic moves to `POST /api/schedules` (same as before — set `firstLogin: false` on first save).
- Client sends `exerciseId` (UUID string); server stores it as-is via `Schedule.fromJSON()` pattern.

### Migration note
Existing schedule documents use inline `name` on exercises. Leave them as-is until the client is updated — the old and new shapes coexist during transition.

---

## Phase 4 — Gym Tracker

**Status: [x] Done**

### New model (`server/models/GymTracker.js`)

```
id            UUID     PK
userId        ObjectId ref: User, required
date          Date     required (date only, no time)
scheduleId    ObjectId ref: Schedule (which program was active)
dayCardId     String   UUID of the DayCard followed
exercises     [LogEntry]
createdAt     auto
```

**Embedded LogEntry:**
```
exerciseId      String  UUID ref: ExerciseMaster
exerciseName    String  denormalized snapshot (preserved for history if exercise renamed/deleted)
plannedSets     Number
plannedReps     Number
actualSets      Number
actualReps      Number
notes           String  optional
```

### New routes (`server/routes/tracker.js`)

| Method | Route | Description |
|---|---|---|
| GET | `/api/tracker` | All logs for the user |
| GET | `/api/tracker?date=YYYY-MM-DD` | Log for a specific date |
| POST | `/api/tracker` | Save/overwrite a workout log entry |

### Rules
- One document per user per date — use `findOneAndUpdate` with `upsert: true` keyed on `{ userId, date }`.
- `exerciseName` must be populated by the client at log time (snapshot from the schedule, not looked up server-side).

---

## Phase 5 — Trainer Slots

**Status: [ ] Not started**

### New model (`server/models/TrainerSlot.js`)

```
id              UUID      PK
trainerId       ObjectId  ref: User, required (must have isTrainer: true)
date            Date      required
startTime       String    e.g. "09:00"
endTime         String    e.g. "10:00"
gymName         String
location        String
isBooked        Boolean   default false
recurrenceRule  String    e.g. "weekly" | null  (label only — no backend logic)
createdAt / updatedAt     auto
```

### New routes (`server/routes/trainerSlots.js`)

| Method | Route | Description |
|---|---|---|
| GET | `/api/slots` | All slots for the logged-in trainer |
| GET | `/api/slots/:trainerId` | Public — open slots for a specific trainer (for Find Trainers page) |
| POST | `/api/slots` | Create one slot or an array of slots (batch) |
| PATCH | `/api/slots/:id` | Edit a slot (date, time, location) |
| DELETE | `/api/slots/:id` | Remove a slot (only if not booked) |

### Rules
- POST accepts either a single object or an array — `insertOne` vs `insertMany`.
- `recurrenceRule` is stored as-is; the frontend generates individual slot objects and sends them in bulk. Backend has zero recurrence logic.
- A slot with `isBooked: true` cannot be edited or deleted (return 400).

---

## Phase 6 — Bookings (Dual-Approval)

**Status: [ ] Not started**

### New model (`server/models/TrainerSchedule.js`)

```
id                  UUID      PK
trainerId           ObjectId  ref: User
traineeId           ObjectId  ref: User
slotId              ObjectId  ref: TrainerSlot | null
date                Date
startTime           String
endTime             String
initiatedBy         enum      "trainer" | "trainee"
traineeApproved     Boolean   default false
trainerApproved     Boolean   default false
status              enum      "pending_trainer_approval" | "pending_trainee_approval" |
                              "confirmed" | "cancelled" | "completed"
cancelledBy         String    "trainer" | "trainee" | null
cancellationReason  String    optional
notes               String    optional
createdAt / updatedAt         auto
```

### New routes (`server/routes/trainerSchedules.js`)

| Method | Route | Description |
|---|---|---|
| GET | `/api/bookings` | All bookings for the current user (as trainer or trainee) |
| POST | `/api/bookings` | Create a booking request |
| PATCH | `/api/bookings/:id/confirm` | Approve the booking (sets your side to true) |
| PATCH | `/api/bookings/:id/cancel` | Cancel a booking at any stage |

### Dual-Approval Rules
- **Trainee initiates:** `traineeApproved: true`, `trainerApproved: false`, status → `pending_trainer_approval`. Slot's `isBooked` set to `true` immediately (holds the slot).
- **Trainer initiates:** `trainerApproved: true`, `traineeApproved: false`, status → `pending_trainee_approval`.
- **On confirm:** set the caller's `*Approved` field to `true`. If both are now `true` → status → `confirmed`.
- **On cancel:** status → `cancelled`, `cancelledBy` + `cancellationReason` saved. If `slotId` exists, set slot's `isBooked: false` (frees the slot).
- **Completed:** set manually via PATCH or a future scheduled job. No auto-completion in v2.

---

## Phase 7 — Reviews

**Status: [ ] Not started**

### New model (`server/models/Review.js`)

```
id          UUID      PK
bookingId   ObjectId  ref: TrainerSchedule, unique (one review per booking)
traineeId   ObjectId  ref: User
trainerId   ObjectId  ref: User
rating      Number    required, 1–5
comment     String    optional
createdAt   auto
```

### New routes (`server/routes/reviews.js`)

| Method | Route | Description |
|---|---|---|
| POST | `/api/reviews` | Submit a review (booking must be `completed`) |
| GET | `/api/reviews/:trainerId` | Public — all reviews for a trainer |

### Rules
- Enforce `bookingId` uniqueness at the DB level (unique index) — one review per booking.
- On submit: insert review, then `findOneAndUpdate` the trainer's... wait, `trainerProfile` is embedded in `users`. So update `users.trainerProfile` to cache `averageRating` and `reviewCount` (compute from all reviews, or increment atomically).
- Only the trainee on a `completed` booking can submit a review (validate `req.user._id === booking.traineeId`).

---

## Implementation Order

```
Phase 1  →  Phase 2  →  Phase 3  →  Phase 4  →  Phase 5  →  Phase 6  →  Phase 7
User          Exercises   Schedules   Tracker     Slots       Bookings    Reviews
(quick)       (quick)     (medium)    (medium)    (medium)    (complex)   (simple)
```

Phases 1–2 are non-breaking additions. Phase 3 is the biggest change (reworks existing Schedule model and routes). Phases 4–7 are all greenfield.
