# LeadMedicaps

LeadMedicaps is a **Medicaps University competitive programming platform** that aggregates student performance from **LeetCode, Codeforces, and CodeChef**, computes a unified CP score, and provides leaderboard, profile, contests, and messaging features.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Authentication & Session Flow](#authentication--session-flow)
- [Routes](#routes)
  - [App Routes](#app-routes)
  - [API Routes](#api-routes)
- [Data Model](#data-model)
- [CP Score Formula](#cp-score-formula)
- [Environment Variables](#environment-variables)
- [Getting Started](#getting-started)
- [Firestore Rules & Indexes](#firestore-rules--indexes)
- [Deployment](#deployment)
- [Security Notes](#security-notes)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Overview

LeadMedicaps is designed for a closed university ecosystem (`@medicaps.ac.in`) and focuses on:

- Ranking students by a **normalized, weighted CP score**
- Maintaining rich coding profiles
- Showing upcoming contests across platforms
- Enabling direct student-to-student messaging
- Showing presence (online/offline) and unread message counters

---

## Key Features

- **University-only auth** (email/password + Google)
- **Onboarding setup** for profile + CP handles + branch/batch
- **Live leaderboard** sorted by CP score and total solved
- **Dashboard analytics** with platform-level stats and score breakdown
- **Contest aggregation** from LeetCode, Codeforces, CodeChef
- **In-app direct messages** with read/unread flow
- **Presence tracking** via Firebase Realtime Database
- **Dark-mode-first UI** with polished Tailwind + Radix components

---

## Tech Stack

### Frontend / App

- Next.js `^15.5.12` (App Router)
- React `^19.2.4`
- TypeScript `^5.9.3`
- Tailwind CSS `^4.2.1`
- Radix UI components
- Framer Motion, Lucide icons, Recharts, Sonner

### Backend / Data

- Firebase Auth (client)
- Firebase Admin SDK (server)
- Cloud Firestore (profiles, messages)
- Firebase Realtime Database (presence)

### Tooling

- ESLint (`next lint`)
- PostCSS + Autoprefixer
- Vercel config (`vercel.json`)
- Firebase config (`firebase.json`, `firestore.rules`, `firestore.indexes.json`)

---

## Architecture

### High-level

1. User signs in via Firebase Auth (client SDK).
2. Client exchanges ID token with `/api/auth/session`.
3. Server creates a secure `__session` HTTP-only cookie (14 days).
4. Server components and APIs validate user using Firebase Admin + session cookie.
5. Firestore stores core app data (`profiles`, `messages`); RTDB handles presence.

### Runtime boundaries

- `firebase-admin` is server-only (`next.config.ts` uses `serverExternalPackages`).
- Edge middleware does **lightweight cookie expiry checks only**.
- Full token/session verification happens in Node runtime via Firebase Admin.

---

## Project Structure

```text
src/
  app/
    (auth)/login, signup
    (dashboard)/dashboard, leaderboard, contests, messages, setup, profile/[username]
    api/
      auth/session
      cp/{leetcode,codeforces,codechef,refresh,username}
      contests
      messages
      notify/contests
    auth/{auth-code-error, callback}
  components/
    dashboard, leaderboard, contests, messages, profile, layout, providers, ui
  hooks/
    usePresence, useUnreadCount
  lib/
    cp-fetch, cp-score, contests
    firebase/{client,admin,server,middleware}
  types/
    index.ts, database.ts
supabase/
  schema.sql (legacy artifact)
```

---

## Authentication & Session Flow

### Sign-up/Login

- Login supports:
  - Email/password
  - Google popup auth
- Sign-up with email enforces email verification before usable session.
- Server-side domain enforcement: only `@medicaps.ac.in` users can establish app sessions.

### Session handling

- `POST /api/auth/session`
  - Verifies Firebase ID token
  - Enforces verified email + domain
  - Auto-creates profile if missing
  - Sets HTTP-only `__session` cookie
- `DELETE /api/auth/session`
  - Clears `__session` cookie

### Route protection

- Middleware redirects unauthenticated users from protected pages to `/login`.
- Dashboard layout also enforces auth server-side.

---

## Routes

## App Routes

| Route | Purpose | Auth |
|---|---|---|
| `/` | Landing page with features + CTA | Public |
| `/login` | Sign in (email/password + Google) | Public |
| `/signup` | Sign up + email verification flow | Public |
| `/auth/auth-code-error` | Auth error screen | Public |
| `/dashboard` | Personal stats overview + CP breakdown | Required |
| `/leaderboard` | Ranked students list + filters/search | Required (layout) |
| `/contests` | Contest feed with platform tabs | Required (layout) |
| `/messages` | Conversation list + chat view | Required |
| `/profile/[username]` | Public-style profile inside app | Required |
| `/setup` | Initial profile + handles onboarding | Required |

## API Routes

| Endpoint | Method | Input | Auth | Output / Behavior |
|---|---|---|---|---|
| `/api/auth/session` | `POST` | `{ idToken }` | Firebase ID token | Creates `__session` cookie, optional profile bootstrap |
| `/api/auth/session` | `DELETE` | — | Session | Clears cookie |
| `/api/contests` | `GET` | — | No | Returns `{ contests, byPlatform }` |
| `/api/messages` | `GET` | optional `?with=<uid>` | Yes | Full conversation or conversation summaries |
| `/api/messages` | `POST` | `{ receiver_id, content }` | Yes | Creates message |
| `/api/cp/leetcode` | `GET` | `?username=` | No | LeetCode stats fetch |
| `/api/cp/codeforces` | `GET` | `?username=` | No | Codeforces stats fetch |
| `/api/cp/codechef` | `GET` | `?username=` | No | CodeChef stats fetch |
| `/api/cp/refresh` | `POST` | CP usernames payload | Yes | Re-fetches stats + recomputes score |
| `/api/cp/username` | `PATCH` | `{ platform, username }` | Yes | Updates single handle + recalculates score |
| `/api/notify/contests` | `POST` | — | Yes | Builds contest email preview (currently logs only) |

---

## Data Model

### Firestore: `profiles`

Core fields (from types + route usage):

- `id`, `email`, `name`, `username`, `batch`, `branch`
- `avatar_url`, `linkedin_url`
- `leetcode_username`, `codeforces_username`, `codechef_username`
- `cp_score`, `total_solved`
- `leetcode_stats`, `codeforces_stats`, `codechef_stats`
- `setup_complete`, `created_at`, `updated_at`

### Firestore: `messages`

- `sender_id`, `receiver_id`, `content`, `read`, `created_at`

### RTDB: `presence/{uid}`

- `online: boolean`
- `lastSeen: timestamp`

---

## CP Score Formula

Platform normalization (0–100), then weighted aggregation:

- LeetCode norm: based on contest rating (`(contestRating - 1200) / 10`, clamped)
- Codeforces norm: `rating / 20` (clamped)
- CodeChef norm: `(rating - 1000) / 15` (clamped)

Weights:

- LeetCode: **30%**
- Codeforces: **40%**
- CodeChef: **30%**

If one/more platforms are missing, weights are redistributed over available platforms.

Tie-breaker on leaderboard: **`total_solved`**.

---

## Environment Variables

Create `.env.local` in project root.

### Firebase Client SDK (browser-safe)

```dotenv
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=
```

### Firebase Admin SDK (server-only)

```dotenv
FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### App URL

```dotenv
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Note: keep `FIREBASE_ADMIN_PRIVATE_KEY` on one line with escaped `\n`.

---

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment

- Copy values from your Firebase project into `.env.local`.
- Ensure Firestore + Realtime Database are enabled in Firebase.

### 3) Run dev server

```bash
npm run dev
```

App runs at `http://localhost:3000`.

### 4) Build and run production locally

```bash
npm run build
npm run start
```

### 5) Lint

```bash
npm run lint
```

---

## Firestore Rules & Indexes

- Rules file: `firestore.rules`
- Indexes file: `firestore.indexes.json`

Deploy them with Firebase CLI (if configured):

```bash
firebase deploy --only firestore:rules,firestore:indexes
```

---

## Deployment

### Vercel

`vercel.json` includes:

- Framework: `nextjs`
- Region: `bom1`
- Build command: `npm run build`

Set all required environment variables in Vercel project settings.

### Firebase

`firebase.json` maps Firestore rules and indexes used by this app.

---

## Security Notes

- Session cookie is HTTP-only; `secure` in production.
- Domain and email verification enforced before session issuance.
- Firestore rules enforce ownership and message access constraints.
- Middleware does expiry checks at edge, but full signature verification is server-side.
- `next.config.ts` currently has permissive settings:
  - `images.remotePatterns` allows all hosts
  - `experimental.serverActions.allowedOrigins = ["*"]`

Review and tighten these before large-scale/public rollout.

---

## Known Limitations

- `/api/notify/contests` currently logs a preview (no real email provider integration).
- Some legacy Supabase artifacts remain (`supabase/schema.sql`, `src/types/database.ts`), while runtime is Firebase-first.
- `.env.example` does not currently include `NEXT_PUBLIC_FIREBASE_DATABASE_URL` though the code uses it.
- CodeChef solved-problem metrics are currently mapped as `0` in `cp-fetch`.
- Legacy fallback route exists: `/auth/callback`.

---

## Future Improvements

- Add role-based authorization for admin-only operations (e.g., notify-all endpoint).
- Integrate production email provider (Resend/Nodemailer) for contest notifications.
- Tighten Next.js config security defaults.
- Add automated tests (API + critical UI flows).


---

