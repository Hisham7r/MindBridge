# 08 — Gotchas, Environment Quirks & Verification

> **Last updated:** 2026-07-08
> Footguns already hit and solved. Reading this saves you from re-paying for lessons already learned.

---

## Auth / RBAC

1. **UI role vs JWT role → surprise 403s.** The UI can *show* a dashboard your token isn't authorized
   for (demo role-switcher / stale token). Admin-only calls then return
   `403 "Access denied. Required role: ADMIN"` even though the page looks right. **The server only trusts
   the JWT.** Decode it in the console to check `role` (snippet in `05-AUTH.md` §7); fix by logging in as
   the correct role. Full detail: `05-AUTH.md`.
2. **One JWT per browser.** `localStorage` (`mindbridge_token`) is shared across tabs — the last login
   overwrites it everywhere. Two roles at once → two browsers / incognito.
3. **Password login on a Google-only account** would crash `bcrypt.compare(null)` — guarded with a clear
   400 ("use Google"). Keep that guard if you touch `loginUser`.

## Google OAuth setup (not code bugs — Google Cloud config)

4. **`Error 400: origin_mismatch`** — the current origin isn't in the OAuth client's **Authorized
   JavaScript origins**. Add `http://localhost:5173` (and `http://localhost`). The redirect-URI field is
   irrelevant to our ID-token flow.
5. **Client ID must match in two places** — `Backend/.env` `GOOGLE_CLIENT_ID` and `Frontend/.env`
   `VITE_GOOGLE_CLIENT_ID` (same value). Env var names must be exact (a stray `Client ID = ` with spaces
   is not a valid var and is silently ignored).
6. **Consent screen "Testing" mode** — only added **test users** can sign in until it's published.
7. **The Google button hides itself** when `VITE_GOOGLE_CLIENT_ID` is unset (`GOOGLE_ENABLED`). If it's
   "missing," check the frontend env + restart Vite (env is read at startup).

## Prisma / migrations / Windows

8. **`prisma migrate dev` fails in this non-interactive shell.** Hand-author the migration SQL folder,
   then `npx prisma migrate deploy` + `npx prisma generate` (ADR-012 / `02-DATA-MODEL.md`). Never edit an
   applied migration.
9. **`prisma generate` → `EPERM ... query_engine-windows.dll.node`** — the running backend has the DLL
   locked. **Ask the owner to stop the backend first**, generate, then restart.
10. **Run Prisma/npm from `Backend/`.** The shell's cwd may be the repo root; `node --check src/...` and
    `npx prisma ...` need the `Backend/` working directory (or `cd` first).

## Dev server behavior

11. **New routes/code not taking effect → 404 on a new endpoint.** If the backend was started with
    `node src/index.js` (not `npm run dev`/nodemon) it won't auto-reload; **restart it**. Symptom seen
    repeatedly: a brand-new `/admin/...` route returns `{"error":"Route ... not found"}` until restart.
    Recommend `npm run dev` (nodemon) to auto-reload on save. Schema changes still need stop → `generate`
    → start.
12. **Don't spawn the servers yourself.** The owner runs them; a second `npm run dev` causes
    `EADDRINUSE` on port 5000. Ask them to start/stop and wait.

## Business-logic traps

13. **Rejected payment leaves the session `PENDING_PAYMENT`** (ADR-019) — a rejected booking looks
    identical to a fresh unpaid one. **Filter `payment.status === 'REJECTED'`** to hide it (PatientDashboard
    does). Forgetting this shows "ghost" bookings.
14. **Suspended therapist could self-unsuspend.** `updateMyProfile` must **preserve `isActive`** for an
    already-APPROVED therapist (not force `true`), or re-saving Settings un-suspends them (ADR-011).
15. **Completeness gate.** Editing an approved profile to remove a required field auto-unlists them to
    `DRAFT`. Expected, not a bug.
16. **Route ordering.** Static paths (`/me`, `/therapist/my`, and `/therapists`/`/therapist-applications`)
    must be declared before/apart from `/:id` params or Express captures them wrong.
17. **Server-derived money.** Payment `amountPkr` comes from the therapist's `feePkr`, never the client
    body. Keep it that way.
18. **Only `PENDING` therapist applications can be approved/rejected; only `APPROVED` can be
    suspended/reactivated** (else 409). These guards prevent double-decisions — keep them.

## Email

19. **Resend test-domain limit.** `onboarding@resend.dev` only delivers to the **Resend account owner's
    own email** until `mindbridge.pk` is verified. Approval/rejection emails to other addresses silently
    won't arrive — the code logs a best-effort warning; the DB change still commits (ADR-010). Not a bug.

## How to verify a change (the house pattern)

- **Frontend compiles:** `cd Frontend && npm run build`.
- **Backend syntax:** `node --check <file>` per changed file (from `Backend/`).
- **End-to-end:** a throwaway Node script (global `fetch`) or curl sequence that:
  1. logs in with a seeded account (admin `admin@mindbridge.pk` / `password123`, etc.),
  2. hits the real endpoints and asserts the behavior,
  3. **reverses/cleans up anything it created** (e.g. suspend→reactivate, or delete a throwaway user +
     its therapist/spec/lang rows) so the dev DB ends unchanged.
  Put these in the scratchpad, not the repo. Examples used this project: register→complete→PENDING→approve
  →listed; suspend→listing −1→reactivate→restored; patient list→detail.
- **Seeded accounts / reseed:** `npm run seed` (idempotent for seeded rows; clears only unbooked slots).
