# 09 — Current State (done / cosmetic / pending)

> **Last updated:** 2026-07-08 · branch `master`
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
| Transactional email (Resend) | ✅ Wired, best-effort | test-domain delivery limit (ADR-010) |

## What is intentionally cosmetic / not backed (do NOT fake — see owner rules in `00`)

- **Therapist availability management** — Settings "Availability Hours" card is **disabled ("Coming
  soon")**. Therapists cannot publish their own bookable slots; slots exist **only via the seed
  script**. This is the **single biggest remaining functional gap.**
- **Patient actions** — the admin patient detail is **read-only**; no ban/suspend (would need a new
  `User` flag + endpoint — ADR-017).
- **Payment screenshots** — stored as a **filename string**; no real blob storage.
- **Assorted inert UI** — admin Operation Hours & Support tabs; patient streak/mood; therapist
  Resources. Left visibly inert on purpose.

## Pending backlog (roughly prioritized)

1. **Therapist availability management** — let approved therapists publish real bookable slots
   (replace the cosmetic card + seed-only slots). Needs schema/endpoints/UI. Biggest gap.
2. **Patient moderation** — optional ban/suspend patient (new `User` flag + endpoint) if needed.
3. **Production hardening:**
   - Verify a real Resend domain (`mindbridge.pk`) so approval/rejection emails reach *any* address.
   - Publish the Google OAuth consent screen (out of "Testing" so non-test-users can sign in).
   - Real blob storage for payment screenshots.
   - Tighten CORS (currently wide open `cors()`); consider JWT refresh/rotation.
4. **Docs upkeep** — keep `09-STATE.md` + ADRs current as features land.

## ⚠️ Uncommitted / in-flight work (as of this writing)

At the time of writing this doc, the following was **built and verified but not yet committed** — the
next agent should reconcile with `git status` (it may already be committed by the time you read this):

- **Admin dashboard "make it real" work:**
  - Backend: `admin.service.js` (`listTherapists`, `setTherapistActive`, `getUserDetail`),
    `admin.controller.js` (+ handlers), `admin.routes.js` (`GET /admin/therapists`,
    `GET /admin/users/:id`, `PATCH /admin/therapists/:id/suspend|reactivate`),
    `therapist.service.js` (the ADR-011 suspension-preserving loophole fix).
  - Frontend: `services/api.js` (`getAdminTherapists`, `getAdminUser`, `suspendTherapist`,
    `reactivateTherapist`), `pages/AdminConsole.jsx` (both tables real, therapist detail modal with
    suspend/reactivate, patient table + search + detail modal, mock import removed),
    `config/sidebarConfig.jsx` ("Intelligence" → "Overview").
- **This documentation set** (the `docs/` archive move + `00`–`09` + CLAUDE.md index rewrite).

Suggested commits (owner's convention: small, conventional, **no Co-Authored-By**):
1. `feat(backend): admin therapist roster, suspend/reactivate, and patient detail endpoints`
2. `feat(frontend): real admin therapist & patient management + rename Intelligence to Overview`
3. `docs: restructure into layered AI handover set (docs/00–09) + archive legacy guides`

## Test data notes

- Seeded: 4 therapists (APPROVED), 1 patient, 1 admin, ~1 week of slots per therapist. All password
  `password123`.
- Real test rows created during this project (e.g. self-registered therapists like "Hisham", "Lisa",
  and patient bookings) exist in the dev DB — not part of seed. Reseeding (`npm run seed`) is
  idempotent for seeded rows and clears only *unbooked* slots.
