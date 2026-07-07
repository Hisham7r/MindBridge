# 03 — Backend Reference

> **Last updated:** 2026-07-08 · **Code is truth:** `Backend/src/`. Layers/lifecycle overview is in
> `01-ARCHITECTURE.md`; this is the module-by-module + patterns reference.

Express 4, ESM (`"type":"module"` → relative imports **include the `.js` extension**). Dev: `npm run dev`
(nodemon, port 5000). Prisma 5 / PostgreSQL. Zod 4 validation. `jsonwebtoken` + `bcryptjs`.

---

## Bootstrap — `index.js`
`dotenv.config()` → `express()` → `app.use(cors())` (⚠️ wide open — hardening TODO) → `express.json()` →
`GET /api/health` → mount `/api/{auth,therapists,sessions,payments,admin}` → 404 JSON handler →
`errorHandler` (must be last).

## Middleware
- **`auth.js`** — Bearer JWT → `jwt.verify` → `req.user = {id, email, role}`; 401 on missing/invalid.
- **`requireRole.js`** — `requireRole(...roles)`; 401 if no `req.user`, 403 if role not allowed. Runs
  after `auth`. The 403 string is `Access denied. Required role: <...>`.
- **`errorHandler.js`** — logs stack; responds `{ error: message }` with `err.status || 500`; adds
  `stack` when `NODE_ENV==='development'`.

## Modules (route → controller → service)

**auth** (`/api/auth`) — `POST /register`, `/login`, `/google` (public); `POST /logout`, `GET /me`,
`PATCH /me` (auth). Service: `registerUser` (tx: user + therapist-if-THERAPIST), `loginUser` (+ null-hash
guard), `googleAuth` (verify ID token → find/create/link), `getUserById`, `updateUserProfile`. Helpers:
`generateInitials`, `signToken`, `sanitizeUser`. See `05-AUTH.md`.

**therapist** (`/api/therapists`) — `GET /me`, `PATCH /me` (auth; **declared before `/:id`**);
`GET /`, `GET /:id`, `GET /:id/slots` (public). Service: `getTherapists` (filters + `isActive:true`),
`getTherapistById` (404 if !isActive), `getTherapistSlots`, `getMyProfile`, `updateMyProfile` (the review
state machine — ADR-003/011), helpers `isProfileComplete`, `formatTherapist`, `formatOwnProfile`,
`generateInitials`.

**session** (`/api/sessions`) — `POST /` (PATIENT), `GET /my` (PATIENT), `GET /therapist/my` (THERAPIST,
**before `/:id`**), `GET /:id` (auth), `PATCH /:id/status` & `/:id/zoom` (THERAPIST/ADMIN). Service:
`createSession` (atomic slot claim), `getSessionById`, `updateStatus` (terminal-state guard),
`getSessionsByPatient`, `getSessionsByTherapist` (resolves via `therapist.userId`), `setZoomLink`.
Helpers: `sessionInclude`, `formatSession`, `assertCanAccessSession`.

**payment** (`/api/payments`) — `POST /` (PATIENT), `GET /:id` (auth), `PATCH /:id/approve` &
`/:id/reject` (ADMIN). Service: `submitPayment` (server-derived amount; reopens REJECTED),
`getPaymentById`, `approvePayment` (tx → session CONFIRMED), `rejectPayment` (session stays
PENDING_PAYMENT — ADR-019). Const `SERVICE_FEE = 250`.

**admin** (`/api/admin`, all `auth + requireRole('ADMIN')`) — `GET /stats`, `/users`, `/users/:id`,
`/sessions`, `/payments`, `/therapists`, `/therapist-applications`; `PATCH /therapists/:id/{approve,
reject,suspend,reactivate}`. Service: `getDashboardStats`, `listUsers`, `getUserDetail`, `listSessions`,
`listPayments`, `listTherapists` (real distinct-patient stats), `listTherapistApplications`,
`approveTherapist`/`rejectTherapist` (+best-effort email), `setTherapistActive` (suspend/reactivate,
APPROVED-only), private `getPendingTherapist` (404/409 guard).

## Patterns to follow

- **Validation:** every write endpoint — `const parsed = schema.safeParse(req.body); if (!parsed.success)
  return res.status(400).json({ error: 'Validation failed', details: parsed.error.issues.map(...) })`.
  Schemas in `validators/`.
- **Errors:** services `throw Object.assign(new Error(msg), { status })` (or set `.status`); controllers
  `try/catch → next(err)`. Never `res.status(500)` by hand in a service.
- **Transactions:** use `prisma.$transaction` whenever two writes must not drift (slot-claim+create,
  payment-approve+session-confirm, approve therapist+verify user). Prefer the **atomic conditional
  update** (`updateMany({where:{...,isBooked:false}})`) for claims to avoid race double-booking.
- **Response shaping:** always return a `format*()` object, never a raw Prisma row; never leak
  `passwordHash` (use `sanitizeUser`/`select`).
- **RBAC:** protected route = `auth` + `requireRole(...)`. Ownership that RBAC can't express (patient owns
  session) is enforced inside the service (`assertCanAccess*`).
- **Route ordering:** static segments before `/:id`.
- **Code style (ADR-016):** `auth/session/payment/admin` = single quotes, **no semicolons**,
  `export const fn = async () =>`. `therapist` = **semicolons**, `export async function`. Match the file.

## Env vars (`Backend/.env`, gitignored; documented in `.env.example`)
`DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `RESEND_API_KEY`, `FRONTEND_URL`, `GOOGLE_CLIENT_ID`.

## Commands
`npm run dev` · `npm start` · `npm run seed` · `npx prisma migrate deploy` · `npx prisma generate` ·
`npx prisma studio`. Migration authoring + Windows DLL lock: `02-DATA-MODEL.md` / `08-GOTCHAS.md`.
