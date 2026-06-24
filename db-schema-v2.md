# Gym Scheduler v2 — MongoDB Schema Design

## Collections Overview

| Collection | Status | Description |
|---|---|---|
| `users` | Modified | Add `roles` array; `firstLogin` stays |
| `schedules` | Unchanged | Trainee weekly workout split |
| `workout_logs` | New | Per-day exercise completion ticks (tracking feature) |
| `trainer_profiles` | New | Trainer-specific details, opt-in only |
| `availability_slots` | New | Time blocks posted by trainers as open for booking |
| `recurring_availability` | New | Trainer's repeating weekly schedule rules (auto-generates slots) |
| `bookings` | New | Session request between trainee and trainer — dual-approval required |
| `reviews` | New | Trainee review of a trainer after a completed session |

> Not yet designed (pending open questions): `notifications`

---

## `users` Collection (Modified)

```json
{
  "_id": "ObjectId",
  "googleId": "string",
  "email": "string",
  "name": "string",
  "avatarUrl": "string (from Google profile photo)",
  "roles": ["trainee"],
  "firstLogin": true,
  "createdAt": "ISODate"
}
```

### Notes
- `roles` is an array so a user can be both trainee and trainer simultaneously.
- Default on creation: `roles: ["trainee"]`.
- When a user completes trainer registration: `roles: ["trainee", "trainer"]`.
- `firstLogin` is the existing Mongoose field (renamed from `isNew` to avoid reserved key conflict). `toJSON()` re-exposes it as `isNew` to the client. Unchanged from v1.
- `avatarUrl` is new — pulled from Google profile on login. Useful for displaying trainer photos on the Find Trainers page.

### Mongoose Role Helpers (to add to `User.js`)
- `user.isTrainer()` — returns `this.roles.includes('trainer')`
- `user.becomeTrainer()` — pushes `'trainer'` to roles, saves

---

## `workout_logs` Collection (New)

One document per user per calendar date. Created or updated when the trainee ticks exercises on the schedule page. The underlying `schedules` document is never modified by ticking — logs are fully separate.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "date": "ISODate (e.g. 2026-06-16 — date only, no time)",
  "day": "Monday",

  "exercises": [
    {
      "exerciseId": "uuid-v4 (matches id in schedules.days[n].exercises)",
      "name": "Bench Press",
      "completed": true
    },
    {
      "exerciseId": "uuid-v4",
      "name": "Overhead Press",
      "completed": false
    }
  ],

  "isRestDay": false,
  "restTaken": false,

  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### Field Notes
- `exerciseId` mirrors the UUID assigned in the `schedules` collection so we can cross-reference which exercise was ticked.
- `name` is denormalized (copied from the schedule at the time of logging) so the log remains accurate even if the user later renames an exercise.
- `isRestDay` copied from the schedule at the time of logging.
- `restTaken: true` means the user confirmed they rested on a rest day (optional UX touch).
- Day completeness is derived: if all `exercises[].completed === true` then the day is fully done. No separate `dayComplete` boolean needed.

### API Endpoints (planned)
| Method | Route | Description |
|---|---|---|
| GET | `/api/logs/:date` | Get log for a specific date (creates blank if none exists) |
| POST | `/api/logs/:date` | Save exercise tick state for a date |
| GET | `/api/logs?from=&to=` | Get logs for a date range (for the tracking history page) |

### Indexes
- `{ userId: 1, date: 1 }` — unique compound index; primary lookup key

---

## `schedules` Collection (Unchanged)

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",
  "days": [
    {
      "day": "Monday",
      "isRest": false,
      "splitName": "Push",
      "exercises": [
        { "id": "uuid-v4", "name": "Bench Press", "sets": 4, "reps": 8 }
      ]
    }
  ],
  "updatedAt": "ISODate"
}
```

This is the trainee's personal workout plan. Trainers can also have one (they remain trainees too). No changes needed.

---

## `recurring_availability` Collection (New)

Stores a trainer's repeating weekly availability rules. A background job (or on-demand trigger) generates individual `availability_slots` documents from these rules for upcoming weeks.

```json
{
  "_id": "ObjectId",
  "trainerId": "ObjectId (ref: users)",

  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "11:00",

  "isActive": true,
  "createdAt": "ISODate"
}
```

### Field Notes
- `dayOfWeek` follows JS convention: 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
- A trainer can have multiple rules (e.g. Mon 9–11, Wed 14–16, Fri 9–12).
- `isActive: false` pauses the rule without deleting it (e.g. trainer is on holiday).
- Slot generation: when the server runs the generation job, it looks ahead N days (e.g. 4 weeks), creates `availability_slots` documents for each matching date that doesn't already have one.

### Indexes
- `{ trainerId: 1, isActive: 1 }`

---

## `trainer_profiles` Collection (New)

One document per trainer. Created when a user opts into the trainer role.

```json
{
  "_id": "ObjectId",
  "userId": "ObjectId (ref: users)",

  "displayName": "string (may differ from Google display name)",
  "bio": "string (required, minimum length enforced)",
  "specializations": ["Strength Training", "Weight Loss", "Rehab & Mobility"],
  "certifications": ["NASM-CPT", "ACE"],
  "yearsExperience": 5,
  "languages": ["English", "Hindi"],

  "sessionType": "in-person | online | both",
  "location": "string (city/area — required if sessionType is in-person or both)",

  "hourlyRate": 60,
  "currency": "USD",
  "rateIsPublic": true,

  "isAcceptingClients": true,

  "averageRating": 4.7,
  "reviewCount": 23,

  "createdAt": "ISODate"
}
```

### Field Notes
- Registration is **self-service** — no `isApproved` field needed. Profile is live immediately on submission.
- `specializations` — fixed enum list on the client (multi-select), stored as string array.
- `certifications` — free text entries, stored as string array.
- `hourlyRate` + `currency` — optional. `rateIsPublic: false` shows "Contact for details" on the listing. No in-app payments.
- `isAcceptingClients` — trainer can toggle this; profile stays visible but the Book/Request button is hidden if false.
- `averageRating` + `reviewCount` — cached fields, updated each time a new review is submitted. Avoids recomputing the average on every page load. Updated atomically alongside the `reviews` insert.

### Indexes
- `{ userId: 1 }` — unique, for fast trainer profile lookup by user
- `{ isApproved: 1, isAcceptingClients: 1 }` — for filtering the Find Trainers listing

---

## `availability_slots` Collection (New)

Trainers post blocks of time when they are free. Each slot is one bookable unit.

```json
{
  "_id": "ObjectId",
  "trainerId": "ObjectId (ref: users)",

  "date": "ISODate (date only, no time — e.g. 2026-06-20)",
  "startTime": "09:00",
  "endTime": "10:00",

  "status": "open | booked | cancelled",
  "bookingId": "ObjectId (ref: bookings) or null",

  "createdAt": "ISODate"
}
```

### Field Notes
- `date` stored as a plain date (no timezone in v2 — assume local time for now; timezone support is a v3 concern).
- `startTime` / `endTime` stored as `"HH:MM"` strings. Simple and sufficient for v2.
- `status: "open"` — visible and bookable on the Find Trainers page.
- `status: "booked"` — slot is claimed; `bookingId` is set. Hidden from the public slot picker.
- `status: "cancelled"` — trainer cancelled this slot (even if previously booked). Kept for history.
- Slots are individual documents, not embedded in the trainer profile, so they can be queried efficiently by date range.

### Indexes
- `{ trainerId: 1, date: 1, status: 1 }` — for fetching a trainer's open slots for a given date range
- `{ bookingId: 1 }` — for looking up which slot belongs to a booking

---

## `bookings` Collection (New)

Created when either a trainee requests a trainer's slot, or a trainer sends an invite to a trainee. **Both parties must approve** before the booking is confirmed.

```json
{
  "_id": "ObjectId",
  "traineeId": "ObjectId (ref: users)",
  "trainerId": "ObjectId (ref: users)",
  "slotId": "ObjectId (ref: availability_slots) or null",

  "date": "ISODate",
  "startTime": "09:00",
  "endTime": "10:00",

  "initiatedBy": "trainee | trainer",
  "traineeApproved": true,
  "trainerApproved": false,

  "status": "pending_trainer_approval | pending_trainee_approval | confirmed | cancelled | completed",
  "cancelledBy": "trainee | trainer | null",
  "cancellationReason": "string or null",

  "notes": "string (optional — requester adds context: goals, injuries, session focus)",

  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### Dual-Approval Logic
- When `initiatedBy: "trainee"`: `traineeApproved` starts `true`, `trainerApproved` starts `false`. Status: `pending_trainer_approval`.
- When `initiatedBy: "trainer"`: `trainerApproved` starts `true`, `traineeApproved` starts `false`. Status: `pending_trainee_approval`.
- When both are `true` → status transitions to `confirmed`.
- Either party can reject at the pending stage → status → `cancelled` (slot reopens if slotId is set).

### Status Lifecycle
```
[trainee requests]                    [trainer invites]
        |                                     |
pending_trainer_approval        pending_trainee_approval
        |                                     |
  trainer accepts                     trainee accepts
        |                                     |
        └──────────── confirmed ──────────────┘
                          |
          (session date passes or manual mark)
                          |
                      completed

  (either party rejects at pending stage, or cancels after confirmation)
                          |
                      cancelled
```

- `confirmed → completed`: triggered once the session datetime has passed (or manual "mark as done" by trainer).
- `confirmed → cancelled`: either party cancels a confirmed booking. `cancelledBy` + `cancellationReason` recorded.
- When cancelled: if `slotId` is set, `availability_slots.status` reverts to `"open"` so the trainer can re-offer it.

### Indexes
- `{ traineeId: 1, status: 1 }` — for trainee's "My Sessions" view
- `{ trainerId: 1, date: 1, status: 1 }` — for trainer's session calendar
- `{ slotId: 1 }` — for slot-to-booking lookups

---

## `reviews` Collection (New)

One review per completed booking. A trainee reviews the trainer after a session is marked `completed`.

```json
{
  "_id": "ObjectId",
  "bookingId": "ObjectId (ref: bookings)",
  "traineeId": "ObjectId (ref: users)",
  "trainerId": "ObjectId (ref: users)",

  "rating": 5,
  "comment": "string (optional free text)",

  "createdAt": "ISODate"
}
```

### Field Notes
- One review per booking — enforced via a unique index on `bookingId`.
- `traineeId` + `trainerId` are denormalized for faster queries (avoids joining through `bookings`).
- On submit: insert the review, then atomically update `trainer_profiles.averageRating` and `trainer_profiles.reviewCount`.
- Reviews are public. Trainers cannot delete or respond to reviews in v2.

### Indexes
- `{ bookingId: 1 }` — unique (one review per booking)
- `{ trainerId: 1, createdAt: -1 }` — for fetching a trainer's reviews in reverse chronological order

---

## Relationships Diagram

```
users
  |
  |--< schedules               (one user → one schedule doc)
  |--< workout_logs            (one user → many daily logs)
  |
  |--< trainer_profiles        (one user → zero or one trainer profile)
  |--< recurring_availability  (as trainer → many weekly rules)
  |--< availability_slots      (as trainer → many posted slots)
  |
  |--< bookings                (as trainee → many bookings they requested/accepted)
  |--< bookings                (as trainer → many bookings on their slots/invites)
  |--< reviews                 (as trainee → many reviews they wrote)

availability_slots
  |
  |--< bookings                (one slot → zero or one active booking)

recurring_availability
  |
  |--< availability_slots      (one rule → many generated slot docs)

bookings
  |
  |--< reviews                 (one completed booking → zero or one review)
```

---

## What's Not Designed Yet (Pending Decisions)

### `notifications` Collection
If in-app notifications are added for booking events (new request, confirmation, cancellation, review received). Shape TBD depending on whether we go in-app badge or email.

---

## Migration Notes (v1 → v2)

- All existing `users` documents need `roles: ["trainee"]` added. A one-time migration script or Mongoose default handles this.
- `avatarUrl` can be added lazily — populate it on next login for existing users.
- No changes to `schedules` collection.
- All new collections start empty.
