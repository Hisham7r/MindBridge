# 06 — Features (end-to-end)

> **Last updated:** 2026-07-08 · **Code is truth.** Each feature lists its endpoints, the flow, and the
> key files. Auth basics live in `05-AUTH.md`; the "why" behind these designs is in `07-DECISIONS.md`.

---

## A. Therapist onboarding + admin approval ⭐ (the core custom flow)

The lifecycle and the code that drives it:

1. **Register** — Register page → "I am a Therapist" tab → 5 fields (Name, Email, Password, Licence No,
   Specializations, comma-separated). `auth.service.registerUser` (transaction) creates
   `User(role=THERAPIST)` + `Therapist(status=DRAFT, isActive=false)` + specialization rows. Returns
   `{user, token}`; the SPA lands on the therapist dashboard.
2. **Complete profile** — Therapist Dashboard → **Settings**. `GET /therapists/me` loads the profile;
   the form collects Title, Track, Education (`credentials`), About, Methodology, Languages, Fee (PKR),
   plus Name/Licence/Specializations. **Save** → `PATCH /therapists/me` →
   `therapist.service.updateMyProfile` runs the **state machine**:
   - incomplete → `DRAFT`, hidden
   - complete & not yet APPROVED → `PENDING`, hidden (enters admin queue; clears `rejectionReason`)
   - complete & already APPROVED → stays `APPROVED`, **preserving current `isActive`** (so a suspension
     survives an edit — ADR-011)
   - was APPROVED but now incomplete → `DRAFT`, auto-unlisted
   - "Complete" = title + credentials + about + methodology + fee>0 + ≥1 spec + ≥1 language.
   The Settings banner reflects the 4 states (draft / under review / live / rejected+reason); the Save
   button reads **"Submit for Review"** unless already approved.
3. **Admin review** — Admin Console → **Security** tab. `GET /admin/therapist-applications?status=PENDING`
   lists applications with full details. **Approve** → `PATCH /admin/therapists/:id/approve` → `APPROVED` +
   `isActive=true` + `user.isVerified=true` + approval email. **Reject** (inline reason, min 3 chars) →
   `PATCH /admin/therapists/:id/reject` → `REJECTED` + hidden + rejection email. Only `PENDING` can be
   decided (else 409 — prevents double-decisions).
4. **Rejected therapist** sees the reason in Settings, edits, resubmits → `PENDING` again.

Files: `Backend`: `auth.service`, `auth.validator` (therapist superRefine), `therapist.service`
(`getMyProfile`/`updateMyProfile`/`isProfileComplete`), `therapist.controller`, `therapist.routes`,
`admin.service`/`admin.controller`/`admin.routes` (applications + approve/reject), `admin.validator`
(reject reason), `email.service`. `Frontend`: `pages/Register.jsx`, `pages/TherapistDashboard.jsx`
(Settings), `pages/AdminConsole.jsx` (Security), `services/api.js`.

## B. Therapist public API + browsing
- `GET /therapists` — lists `isActive:true` therapists (+ optional track/specialization/language/fee
  filters), ordered by rating. `formatTherapist` flattens nested rows, casts Decimal→Number.
- `GET /therapists/:id` — single therapist; **404 if not `isActive`** (hidden/incomplete not public).
- `GET /therapists/:id/slots` — unbooked, future slots. **Self-healing:** tops up the therapist's
  rolling slot window from their weekly rules before answering (`ensureSlotWindow`).
- Frontend: `pages/Therapists.jsx`, `TherapistProfile.jsx`, `CareerTherapy.jsx`, `components/TherapistCard.jsx`.

## B2. Therapist availability management ⭐ (production slot source)
Therapists own their calendar — slots no longer depend on the seed script (ADR-021).
- `GET /therapists/me/availability` (THERAPIST) — weekly rules for the Settings form.
- `PUT /therapists/me/availability` (THERAPIST) — replaces the weekly schedule wholesale
  (`availabilitySchema`: ≤1 rule per weekday, HH:MM times, ≥1 bookable hour), then rebuilds the future
  calendar: future **unbooked** slots deleted + regenerated hourly from the rules over a **14-day
  window**; **booked slots are never touched** (changing hours can't destroy an appointment).
- Settings UI (`TherapistDashboard.jsx`): 7-day editor (checkbox per day + start/end time pickers) +
  "Save Availability". A therapist with no rules simply has no bookable slots.
- E2E-verified: set hours → slots appear (correct hours/days, none past) → patient books → hours
  changed → booking survives, free slots regenerate to the new hours.

## C. Session booking
- `POST /sessions` (PATIENT) — `session.service.createSession`: verify therapist active → **transaction**:
  `availabilitySlot.updateMany({where:{id, isBooked:false}, data:{isBooked:true}})` (atomic claim; if
  `count===0` the slot was taken → 409) → create `Session(PENDING_PAYMENT)` with computed `sessionNumber`.
- `GET /sessions/my` (PATIENT) · `GET /sessions/therapist/my` (THERAPIST). Static `/therapist/my`
  declared **before** `/:id` so it isn't captured as an id.
- `GET /sessions/:id` (auth) — any involved party; ownership enforced in `assertCanAccessSession`.
- `PATCH /sessions/:id/status` (THERAPIST/ADMIN) — e.g. "Mark Complete" → `COMPLETED`; terminal states
  can't change (409).
- `PATCH /sessions/:id/zoom` (THERAPIST/ADMIN) — attach a Zoom link.
- Frontend: `pages/BookSession.jsx`, `PatientDashboard.jsx`, `TherapistDashboard.jsx`.

## D. Payments — manual EasyPaisa (ADR-001)
- `POST /payments` (PATIENT) — `payment.service.submitPayment`: `amountPkr` derived from therapist
  `feePkr` (server-side), `serviceFee=250`, `totalPkr` computed. A previously **REJECTED** payment for the
  same session is **reopened** to `PENDING` (resubmit); an APPROVED/PENDING one is rejected (409).
- `GET /payments/:id` (auth) — owner patient or admin.
- `PATCH /payments/:id/approve` (ADMIN) — **transaction**: `Payment=APPROVED` + `Session=CONFIRMED`.
- `PATCH /payments/:id/reject` (ADMIN) — `Payment=REJECTED`; **`Session` stays `PENDING_PAYMENT`**
  (ADR-019). ⚠️ UI must hide rejected bookings by filtering `payment.status === 'REJECTED'`.
- Frontend: `pages/Payment.jsx`, `PatientDashboard.jsx`, `AdminConsole.jsx` (payment verification).

## E. Admin console (`/api/admin`, all `auth + requireRole('ADMIN')`)
Sidebar sections (`config/sidebarConfig.jsx` → `ADMIN_NAV`): **Overview** (renamed from "Intelligence"),
People (Therapists / Patients), Finance, **Security**, Support. (The former Operations tab and its fake
"global operation hours" card were removed — ADR-022.)

**Payment queues are pending-only:** Overview's Payment Verification shows only PENDING deposits
("all caught up" when empty) and its "View All Transactions →" navigates to Finance. Finance shows the
pending queue plus a collapsible **View All (N processed)** history of approved/rejected payments.

- `GET /admin/stats` — user/session/payment counts + revenue (Σ APPROVED payments).
- `GET /admin/users` · `GET /admin/users/:id` — all users; single user detail = identity + their
  patient-side **sessions + payments** (powers the read-only Patient detail modal).
- `GET /admin/sessions` · `GET /admin/payments?status=` — oversight lists.
- `GET /admin/therapists` — **full roster (any status)** with **real distinct-patient stats**
  (`patientsToday/Week/AllTime`, `upcomingSessions`) derived live from sessions (0 for a new therapist).
- `PATCH /admin/therapists/:id/suspend` · `.../reactivate` — APPROVED-only `isActive` toggle (ADR-011).
- `GET /admin/therapist-applications?status=` · `PATCH .../approve` · `.../reject` — the review queue (§A).

**Admin UI (`AdminConsole.jsx`) is fully real** (ADR-018): Overview stat cards + payment verification;
Therapist Performance Snapshot + People→Therapists tables (real data, real status badges, single **View**
→ therapist detail modal with **Suspend/Reactivate**); People→Patients (name/email search + **View** →
patient detail modal, read-only); Security → applications review. `mockData.js` imported nowhere.

## F. Email (Resend) — `services/email.service.js`
`sendTherapistApproved({name,email})` / `sendTherapistRejected({name,email,reason})`. Reads
`RESEND_API_KEY`; unset → logs to console (no-op). Wired into admin approve/reject as **best-effort**
(try/catch; DB commits regardless — ADR-010). Sender `onboarding@resend.dev` only delivers to the Resend
account owner's email until `mindbridge.pk` is verified.
