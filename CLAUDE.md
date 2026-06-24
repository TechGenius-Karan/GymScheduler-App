
# CLAUDE.md

## Git Commit Rules
- Keep commit messages brief (one short subject line is enough)
- Never include `Co-Authored-By` or any Claude attribution in commits


This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the App

Two separate processes must run simultaneously.

**Server** (`server/`):
```bash
cd server
node index.js        # production
npm run dev          # development (nodemon, auto-restarts on change)
```
Runs on `http://localhost:5000`. Requires `server/.env` to exist (see `.env.example`).

**Client** (`client/`):
```bash
cd client
npm run dev          # dev server at http://localhost:5173
npm run build        # production build to client/dist/
npm run lint         # ESLint
```

## Architecture

Two-layer architecture: **data layer** (Mongoose models + static JSON) and **UI layer** (React components + context), with an API layer in between.

### Auth Flow
1. Browser → `GET /auth/google` → Passport redirects to Google
2. Google → `GET /auth/google/callback` → `User.fromGoogle()` → JWT issued
3. Server redirects to `CLIENT_URL/auth/callback?token=...`
4. `AuthCallbackPage` reads token, calls `GET /auth/me`, stores token in `localStorage`
5. All subsequent API requests send `Authorization: Bearer <token>`
6. `authMiddleware.js` verifies JWT and attaches `req.user` before every protected route

### State Management
`ScheduleContext` drives the entire schedule page through `activeView`:
- `'splitPicker'` → `SplitPicker` component (choose a template or start fresh)
- `'template'` → `TemplateView` component (read-only preview)
- `'mySchedule'` → `WeeklyView` component (editable 7-day grid)

Context also holds the four schedule mutation helpers (`updateDay`, `addExercise`, `removeExercise`, `updateExercise`) which components call directly — components never call `setMyScheduleData` themselves.

### Key Data Conventions
- **`firstLogin`** is the internal Mongoose field name on `User` (renamed from `isNew` to avoid a Mongoose reserved key conflict). `User.toJSON()` re-exposes it as `isNew` to the client.
- **Exercise IDs**: assigned client-side via `crypto.randomUUID()` when copying a template or adding an exercise. Server accepts whatever IDs are sent and stores them as-is via `Schedule.fromJSON()`.
- **Templates** are static JSON files in `server/data/templates/`. The `GET /api/templates` route auto-discovers all `.json` files in that directory — adding a new split requires only a new file, no code changes.
- **`GET /api/schedule`** returns `null` (not 404) when a user has no schedule yet. The client uses this to distinguish new vs returning users.
- **`POST /api/schedule`** sets `firstLogin: false` on the user on first save only.

### MongoDB Connection
The `mongodb+srv://` SRV format can fail on some Windows DNS configurations. If it does, use the standard `mongodb://` direct connection string from Atlas (Connect → Drivers → "connecting behind a firewall" link). See `server/.env.example`.

## Environment Variables

`server/.env` is required and never committed. Required keys:
```
MONGO_URI, PORT, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, JWT_SECRET, CLIENT_URL
```
Google OAuth authorised redirect URI must be set to `http://localhost:5000/auth/google/callback` in Google Cloud Console.
