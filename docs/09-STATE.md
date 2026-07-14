# 09 — Current State (done / cosmetic / pending)

> **Last updated:** 2026-07-11 · branch `master`
> **This is the fast-changing file.** It goes stale faster than the rest. Always cross-check against
> `git log --oneline` and the actual code. When status here disagrees with the code, the code wins.

---

## Snapshot

MindBridge's **core loops are complete and verified**: auth (email/password + Google), therapist
self-onboarding + admin approval, session booking, manual payments + admin verification, and a
**fully real admin console**. The frontend is entirely wired to the backend — **`mockData.js` is
imported nowhere in the app.**

---

## Feature status

| Area | Status | Notes |
|---|---|---|
| Auth: register / login / logout / me | ✅ Real | JWT (7d) + bcrypt + Zod |
| Google "Continue with Google" | ✅ Real, verified live | ID-token flow; PATIENT-only; email-linking. See `05-AUTH.md` |
| Therapist public API (list / detail / slots) | ✅ Real | `isActive` gated |
| Therapist self-registration | ✅ Real | Register → Therapist tab (5 fields) |
| Therapist profile completion (Settings) | ✅ Real | `GET/PATCH /therapists/me` + completeness gate |
| Admin approval gate (approve/reject + reason) | ✅ Real, e2e-verified | `TherapistStatus` state machine + emails |
| Session booking | ✅ Real | atomic slot claim (no double-book) |
| Payments (manual EasyPaisa) | ✅ Real | submit / approve / reject; reject→re-pay |
| Admin: stats / payments verify | ✅ Real | approve/reject payments |
| Admin: therapist roster + suspend/reactivate | ✅ Real, e2e-verified | real distinct-patient stats; View→profile modal |
| Admin: patient search + detail | ✅ Real, e2e-verified | name/email search; View→sessions+payments (read-only) |
| Admin: therapist applications review | ✅ Real | Security tab |
| **Therapist availability management** | ✅ Real, e2e-verified | weekly rules → generated slots, self-healing window (ADR-021) |
| Transactional email (Resend) | ✅ Wired, best-effort | test-domain delivery limit (ADR-010) |

**Admin payment queues** are pending-only: Overview shows only PENDING deposits and "View All
Transactions →" navigates to Finance; Finance has the pending queue + a collapsible processed history.
The cosmetic "Operation Hours" card and the Operations tab were **removed** (ADR-022).

## What is intentionally cosmetic / not backed (do NOT fake — see owner rules in `00`)

- **Patient actions** — the admin patient detail is **read-only**; no ban/suspend (would need a new
  `User` flag + endpoint — ADR-017).
- **Payment screenshots** — stored as a **filename string**; no real blob storage. The "View
  Screenshot/Proof" buttons in the admin payment queues don't open anything yet.
- **Assorted inert UI** — admin Support tab; patient streak/mood; therapist Resources. Left visibly
  inert on purpose.

## Pending backlog (roughly prioritized)

1. **Production hardening** (the app is functionally complete for its core loops):
   - Verify a real Resend domain (`mindbridge.pk`) so approval/rejection emails reach *any* address.
   - Publish the Google OAuth consent screen (out of "Testing" so non-test-users can sign in).
   - Real blob storage + viewer for payment screenshots.
   - Tighten CORS (currently wide open `cors()`); consider JWT refresh/rotation.
   - Hosting setup (env vars per environment, `FRONTEND_URL`, DB).
2. **Patient moderation** — optional ban/suspend patient (new `User` flag + endpoint) if needed.
3. **Seeded-therapist hours** — only Ayesha has weekly rules set (Mon–Fri 9–5, from testing). The other
   seeded therapists (+ Lisa/Hisham) are unbookable until hours are set — correct behavior; set via
   each therapist's Settings if demo bookability is wanted.
4. **Docs upkeep** — keep `09-STATE.md` + ADRs current as features land.

## ⚠️ Uncommitted / in-flight work (as of this writing)

Built and verified but possibly not yet committed — reconcile with `git status`:
- `docs/LEARNING-GUIDE.md` is a **personal, local-only textbook** (gitignored on purpose — the owner
  keeps it off GitHub). If it's missing on a fresh clone, that's expected.
- Therapist availability feature: migration `20260710120000_therapist_availability`, schema,
  `therapist.validator/service/controller/routes`, `api.js`, `TherapistDashboard.jsx` Settings editor.
- Admin queue rework + Operation Hours/Operations removal: `AdminConsole.jsx`, `sidebarConfig.jsx`.
- Doc updates: `02`, `04`, `06`, `07` (ADR-021/022), this file.

## Test data notes

- Seeded: 4 therapists (APPROVED), 1 patient, 1 admin, ~1 week of slots per therapist. All password
  `password123`.
- Real test rows created during this project (e.g. self-registered therapists like "Hisham", "Lisa",
  and patient bookings) exist in the dev DB — not part of seed. Reseeding (`npm run seed`) is
  idempotent for seeded rows and clears only *unbooked* slots.
