# MindBridge (repo folder: `Sukoon`) — Project Index

> **This file is the lean, always-loaded entry point.** The full handover lives in **`docs/`** —
> a numbered, layered set. **Read [`docs/00-ONBOARDING.md`](docs/00-ONBOARDING.md) first**, then follow
> its reading order.
>
> **Code is truth.** These docs explain *what & why*; if any doc conflicts with the code, trust the code
> and fix the doc. `docs/` files are dated — check freshness.
>
> ⚠️ Folder is named `Sukoon`; the product is **MindBridge** everywhere in code. Same thing.

---

## What MindBridge is

An online therapy / mental-health platform for a Pakistani audience (PKR pricing, manual EasyPaisa
payments, English/Urdu). Three roles — **Patient** (browse → book → pay → sessions), **Therapist**
(self-register → complete profile → **admin-approved** → manage appointments), **Admin** (verify
payments, review/approve/reject therapists, manage roster & patients). Two tracks: mental-health, career.

Two-part monorepo: `Backend/` (Express + Prisma + PostgreSQL REST API, layered Route→Controller→Service)
and `Frontend/` (React + Vite + Tailwind SPA, fully wired over HTTP with JWT auth). Core loops are
built and verified; see `docs/09-STATE.md` for the exact real-vs-cosmetic-vs-pending line.

## Documentation map (read in this order)

| Doc | What's in it |
|---|---|
| [`docs/00-ONBOARDING.md`](docs/00-ONBOARDING.md) | **START HERE** — map, mental model, **how the owner works**, verify-your-work, glossary |
| [`docs/01-ARCHITECTURE.md`](docs/01-ARCHITECTURE.md) | layers, request lifecycle, data flow UI→DB→UI, folder map, component tree |
| [`docs/02-DATA-MODEL.md`](docs/02-DATA-MODEL.md) | Prisma schema: every model/relation/enum + why, lifecycles, migrations |
| [`docs/03-BACKEND.md`](docs/03-BACKEND.md) | module-by-module (route→controller→service), patterns, code styles |
| [`docs/04-FRONTEND.md`](docs/04-FRONTEND.md) | routing, RoleContext state, api/adapters seams, pages, components |
| [`docs/05-AUTH.md`](docs/05-AUTH.md) | JWT, middleware, RBAC, Google OAuth, **UI-role vs JWT-role** (top gotcha) |
| [`docs/06-FEATURES.md`](docs/06-FEATURES.md) | each feature end-to-end (onboarding+approval, booking, payments, admin, email) |
| [`docs/07-DECISIONS.md`](docs/07-DECISIONS.md) | **the "why"** — ADR log: decision → alternatives rejected → consequences |
| [`docs/08-GOTCHAS.md`](docs/08-GOTCHAS.md) | solved footguns, environment quirks, how to verify a change |
| [`docs/09-STATE.md`](docs/09-STATE.md) | current reality: done / cosmetic / pending / uncommitted (volatile) |
| `docs/archive/` | frozen legacy write-ups — historical only, not current truth |

## Run it

**Backend:** `cd Backend && npm install` → fill `.env` from `.env.example` → `npx prisma migrate deploy`
→ `npx prisma generate` → `npm run seed` → `npm run dev` (port 5000).
**Frontend:** `cd Frontend && npm install` → `.env` (`VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`) →
`npm run dev` (port 5173). Compile check: `npm run build`.

**Seeded accounts** (all `password123`): admin `admin@mindbridge.pk`, patient `patient@mindbridge.pk`,
therapists `ayesha@mindbridge.pk` / `bilal@mindbridge.pk` / `sara.malik@mindbridge.pk` / `zara@mindbridge.pk`.

**Env:** Backend — `DATABASE_URL, JWT_SECRET, PORT, NODE_ENV, RESEND_API_KEY, FRONTEND_URL,
GOOGLE_CLIENT_ID`. Frontend — `VITE_API_URL, VITE_GOOGLE_CLIENT_ID`. (`.env` gitignored; `.env.example` documents each.)

## Must-remember rules (condensed — details in the linked docs)

**How the owner works** (`docs/00`): be a decisive senior engineer (recommend, don't offer menus);
**explain shell commands in plain English before running them**; work section-by-section with approval;
**never fake unbacked features** (leave inert); keep the UI intact when swapping mock→real; commits are
small + conventional with **no `Co-Authored-By` trailer**; **ask before pushing**; the **owner runs the
dev servers** — don't spawn them.

**Conventions** (`docs/03`): every write endpoint Zod-validates → `400 {error, details}`; services
`throw Error` + numeric `.status`, controllers `next(err)`, one `errorHandler`; response envelopes like
`{user, token}` / `{therapists}` / `{error}`; RBAC = `auth` + `requireRole(...)`; static routes before
`/:id`; **two backend code styles coexist — match the file** (ADR-016).

**Top gotchas** (`docs/08`): (1) UI role ≠ JWT role → surprise 403s; the server trusts the JWT.
(2) Rejected payment leaves the session `PENDING_PAYMENT` — UI hides it via `payment.status==='REJECTED'`.
(3) Migrations are **hand-authored** (`migrate deploy`, non-interactive shell); **stop the backend before
`prisma generate`** on Windows (DLL lock). (4) New route 404? The backend needs a restart (use nodemon).

## Git
Work on `master`, pushed to `origin/master`; repo default branch is `main`. Conventional commits, **no
Co-Authored-By**. Check `docs/09-STATE.md` + `git status` for uncommitted work before starting.
