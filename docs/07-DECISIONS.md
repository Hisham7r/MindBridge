# 07 — Design Decisions (ADR log)

> **Last updated:** 2026-07-08
> **What this is:** an append-only log of *why* the project is built the way it is — the reasoning
> code can't express, and the alternatives that were considered and rejected. **Do not silently
> "fix" something documented here as deliberate.** If a decision needs to change, add a new ADR that
> supersedes the old one (don't rewrite history).
>
> Format per entry: **Context → Decision → Alternatives rejected → Consequences.**

---

## ADR-001 — Manual EasyPaisa payments (no gateway integration)
- **Context:** Pakistani audience; card gateways are heavy to integrate and not how most users pay.
- **Decision:** Patients pay out-of-band via EasyPaisa and submit a **transfer screenshot + txn id**;
  an admin manually verifies. `Payment.screenshotUrl` is currently just a filename string.
- **Rejected:** Stripe/real gateway (overkill, audience mismatch); auto-approval (fraud risk).
- **Consequences:** Admin is in the loop for every payment. No real blob storage yet (screenshots are
  filename strings — a production gap). Payment lifecycle is `PENDING → APPROVED | REJECTED`.

## ADR-002 — `isActive` is the single "publicly listed & bookable" flag
- **Context:** Needed one unambiguous predicate for "does this therapist show in browse / can they be booked."
- **Decision:** Public queries filter on `therapist.isActive === true`, full stop. `getTherapistById`
  404s if not active. Booking rejects inactive therapists.
- **Rejected:** Deriving visibility from a combination of fields at every call site (error-prone, drifts).
- **Consequences:** Every code path that should hide a therapist just sets `isActive=false`. The review
  `status` is a *separate* axis (see ADR-003). "Suspended" is the `APPROVED + !isActive` combination (ADR-011).

## ADR-003 — Therapist onboarding is self-service + admin-approved (not seed, not auto-publish)
- **Context:** Originally therapists only existed via the seed script — not a real way to join. Then the
  question: once they can self-register, should completing a profile auto-publish them?
- **Decision:** Therapists **self-register** (Register page → Therapist tab), complete their profile in
  Settings, and **submit for review**. An **admin must approve** before they go live. Lifecycle enum
  `TherapistStatus { DRAFT → PENDING → APPROVED → REJECTED }`.
- **Rejected:** (a) Seed-only therapists (not production-real). (b) Auto-publish on profile completion —
  the owner explicitly wanted a vetting gate (a real therapist platform can't let anyone self-list
  unvetted). (c) A separate "applications" table with no account until approval — chose a status field
  on the account instead (simpler; the user exists and can edit/resubmit).
- **Consequences:** Completing a profile yields `PENDING`, not live. Admins review in the console's
  Security tab. Rejected therapists see the reason and can edit + resubmit → back to `PENDING`.
  Migration data-fix grandfathered pre-existing live therapists (seed) to `APPROVED`.

## ADR-004 — Fee is set by the therapist (no admin fee approval)
- **Context:** Who controls the session price?
- **Decision:** The therapist sets `feePkr` in their Settings profile. Admin approval is about
  *legitimacy*, not price.
- **Rejected:** Admin sets/adjusts fees (adds friction; not the product intent).
- **Consequences:** Fee is part of the profile-completeness gate (must be > 0 to be listed).

## ADR-005 — Specializations & languages are free text (not a fixed list)
- **Context:** How do therapists declare specializations/languages?
- **Decision:** Free-text, comma-separated in the UI, stored as child rows
  (`TherapistSpecialization`, `TherapistLanguage`).
- **Rejected:** Fixed checkbox taxonomy (cleaner data, but the owner chose flexibility for now).
- **Consequences:** Data is less normalized; search uses case-insensitive `contains`. A fixed taxonomy
  could be layered on later without a data-model change.

## ADR-006 — Title + Track collected in Settings, not Registration
- **Context:** The therapist card needs a professional **title**; the listing splits by **track**.
  Neither was in the owner's minimal 5-field registration list.
- **Decision:** Keep registration to exactly 5 fields (Name, Email, Password, Licence No,
  Specializations); collect Title + Track (and everything else) in the Settings profile step.
- **Rejected:** Growing the registration form to 7 fields (registration should stay light).
- **Consequences:** A freshly registered therapist has a minimal profile; they finish it in Settings,
  which is also the gate to `PENDING`.

## ADR-007 — Profile-completeness gate for listing
- **Context:** A half-filled profile must never appear as a broken public card.
- **Decision:** A therapist is only eligible to be live once **title + credentials + about +
  methodology + fee>0 + ≥1 specialization + ≥1 language** are all present (`isProfileComplete` in
  `therapist.service.js`). Incomplete → `DRAFT`, hidden.
- **Consequences:** The save state-machine keys off completeness. Even an approved therapist who
  deletes a required field is auto-unlisted back to `DRAFT`.

## ADR-008 — "Continue with Google" uses the OAuth 2.0 **ID-token** flow; sign-ups are PATIENT-only
- **Context:** Add Google sign-in with minimum moving parts and no server-side redirect handling.
- **Decision:** Browser uses Google Identity Services to obtain a signed **ID token**, POSTs it to
  `POST /auth/google`; the server verifies it with `google-auth-library` (`verifyIdToken`,
  audience = `GOOGLE_CLIENT_ID`). **Only the Client ID is used — no client secret, no redirect URI.**
  New Google users are always created as **PATIENT** (therapists must go through the licence+specializations form).
- **Rejected:** The redirect/authorization-code flow (needs a backend callback + client secret — more
  surface, unnecessary here). "OAuth 2.1" — it's a draft consolidation, not a provider toggle; our flow
  already follows its best practices. Letting Google pick a role (therapists need vetting).
- **Consequences:** Client ID is public and lives in **both** `Backend/.env` (`GOOGLE_CLIENT_ID`) and
  `Frontend/.env` (`VITE_GOOGLE_CLIENT_ID`). The OAuth client's **Authorized JavaScript origins** must
  include the frontend origin (`http://localhost:5173`) — otherwise `Error 400: origin_mismatch`
  (see `08-GOTCHAS.md`). Consent screen stays in "Testing" mode → only added test users can sign in.

## ADR-009 — Account linking by email; `passwordHash` is nullable
- **Context:** A user might sign up with a password, then later click "Continue with Google" (or vice versa).
- **Decision:** `googleAuth` does find-or-create: (1) existing `googleId` → sign in; (2) existing
  account with the **same email** → **link** `googleId` to it (keep role/profile; backfill
  `isVerified`/`avatarUrl`); (3) neither → create new PATIENT. `User.passwordHash` is **nullable**
  (Google-only accounts have none); password login on such an account returns a clear 400 ("use Google").
- **Rejected:** Treating Google and password accounts with the same email as separate users (confusing,
  duplicate accounts).
- **Consequences:** One human = one account regardless of sign-in method. `User.googleId` is unique.

## ADR-010 — Notification emails are best-effort (never block an admin decision)
- **Context:** Approve/reject a therapist should notify them by email — but email is flaky (test domain limits).
- **Decision:** `email.service.js` (Resend). Approve/reject wrap the send in try/catch and `console.warn`
  on failure — **the DB change commits regardless.** If `RESEND_API_KEY` is unset, it logs the email to
  console instead of sending (safe no-op).
- **Rejected:** Making the email part of the transaction (a mail outage would block admin work).
- **Consequences:** Sender is Resend's shared `onboarding@resend.dev`, which **only delivers to the
  Resend account owner's own email** until a real domain (`mindbridge.pk`) is verified. Emails to
  arbitrary therapist addresses won't land until then — expected, not a bug.

## ADR-011 — Suspension = `APPROVED + isActive:false`; edits preserve it
- **Context:** Admin needs to pull a therapist from the platform without losing their approved status.
- **Decision:** "Suspend" sets `isActive=false` while keeping `status=APPROVED`; "Reactivate" flips it
  back. Only APPROVED therapists can be suspended/reactivated (else 409). **Critical fix:** the profile
  save state-machine, for an already-APPROVED therapist, **preserves the current `isActive`** instead of
  forcing it `true` — otherwise a suspended therapist could un-suspend themselves by re-saving Settings.
- **Rejected:** A separate `SUSPENDED` enum value or `suspended` boolean (extra schema; the combination
  already expresses it cleanly).
- **Consequences:** "Suspended" is a derived display state (see glossary). The loophole fix lives in
  `therapist.service.updateMyProfile`.

## ADR-012 — Migrations are hand-authored, applied with `migrate deploy`
- **Context:** `prisma migrate dev` refuses to run in this non-interactive shell.
- **Decision:** Write `prisma/migrations/<timestamp>_<name>/migration.sql` by hand, then
  `npx prisma migrate deploy` + `npx prisma generate`. **Never edit an applied migration** — always add
  a new folder.
- **Rejected:** `prisma db push` (no migration file → history gap; bad for production).
- **Consequences:** Migration history stays clean and ordered. On Windows, `prisma generate` fails with
  `EPERM` on the query-engine DLL if the server is running — stop it first (see `08-GOTCHAS.md`).

## ADR-013 — Backend-first; the API is the source of truth; frontend adapts
- **Context:** The frontend began as a mock prototype with its own data shapes (integer ids, `fee`,
  `mental-health`); the backend uses UUIDs, `feePkr`, `MENTAL_HEALTH`.
- **Decision:** The **Prisma schema / API is the source of truth.** The frontend reconciles shapes in a
  single seam: `services/adapters.js` (`mapTherapist`, `mapUser`, `uiTrackToApi`) and the `services/api.js`
  HTTP client. Pages consume the adapted shape.
- **Consequences:** Backend changes ripple through one place, not every component. Keep new shape-mapping
  in `adapters.js`, not scattered in pages.

## ADR-014 — JWT in localStorage, 7-day expiry, no refresh; UI role ≠ JWT role
- **Context:** Simple SPA auth.
- **Decision:** On login/register/Google, the server returns `{user, token}`; the token (payload
  `{id, email, role}`, 7d) is stored in `localStorage` (`mindbridge_token`). Session restore on load
  calls `GET /auth/me`. The UI's `role` (lowercase) is display state; **the server only trusts the JWT role.**
- **Rejected (deferred):** Refresh/rotation, httpOnly cookies (more infra; fine for current stage).
- **Consequences:** One token per browser (shared across tabs — last login wins). A demo role-switcher can
  make the UI show a dashboard your token isn't authorized for → admin-only calls 403. Use real logins;
  two roles at once needs two browsers/incognito. (See `08-GOTCHAS.md`.)

## ADR-015 — Zoom is a link string; no Zoom API
- **Decision:** Therapist pastes a `zoomLink` onto a session (`PATCH /sessions/:id/zoom`). No Zoom
  integration. **Consequences:** zero external dependency; manual but sufficient.

## ADR-016 — Two coexisting backend code styles (match the file)
- **Context:** Files written in different phases use different styles.
- **Decision:** `auth.*`, `session.*`, `payment.*`, `admin.*` use **single quotes, no semicolons,
  `export const fn = async () =>`**; `therapist.*` uses **semicolons + `export async function`**.
  **Match the style of the file you're editing** rather than reformatting.
- **Consequences:** Don't "normalize" a file's style in an unrelated change — it bloats diffs.

## ADR-017 — Patient admin view is read-only (no ban action yet)
- **Context:** Admin needs to look up patients for support.
- **Decision:** `GET /admin/users/:id` returns identity + their sessions + payments; the UI shows a
  read-only detail modal. There is **no** patient ban/suspend action.
- **Rejected (deferred):** Patient banning — would need a new `User` flag + endpoint. Flagged as future,
  not faked.
- **Consequences:** Admin can investigate but not act on patients yet.

## ADR-018 — Admin dashboard is fully real; dropped the fake Rating column; single "View" action
- **Context:** The admin therapist/patient tables were the last mock-data (`adminTherapists`) users.
- **Decision:** Both tables now use real endpoints (`GET /admin/therapists`, `GET /admin/users`). "Patients"
  counts are **distinct patients with real sessions** (0 for a new therapist, grows as they book). Removed
  the hardcoded Rating column and all dead buttons (Edit/Add). Each row has one **View** action opening a
  detail modal; therapist suspension lives inside that modal.
- **Consequences:** `mockData.js` is imported nowhere in the app. No non-functional buttons.

## ADR-019 — Rejected payment leaves the session at `PENDING_PAYMENT`
- **Context:** What happens to a booking when its payment is rejected?
- **Decision:** `rejectPayment` sets `Payment.status=REJECTED` but **leaves `Session.status=PENDING_PAYMENT`**
  so the patient can resubmit a corrected payment (`submitPayment` reopens a REJECTED payment to PENDING).
- **Consequences:** A rejected booking looks identical to a fresh unpaid one — the **UI must hide it by
  filtering on `payment.status === 'REJECTED'`** (PatientDashboard already does this). Easy to forget.

## ADR-020 — `CLAUDE.md` is tracked (un-gitignored) as the handover front door
- **Context:** `CLAUDE.md` had been gitignored, so it wouldn't travel with the repo — breaking any handover.
- **Decision:** Remove it from `.gitignore` and commit it as the lean, always-loaded index that points
  into this `docs/` set.
- **Consequences:** A fresh clone (or new AI account) gets the full context entry point automatically.
  Keep `CLAUDE.md` lean — it's loaded every session; depth belongs in `docs/`.

## ADR-021 — Availability = weekly recurring rules → generated slots (self-healing window)
- **Context:** Slots were seed-only: a one-time 7-day batch that silently expired (the app became fully
  unbookable once the window passed), and self-registered therapists never got slots at all. For
  production, therapists must own their hours.
- **Decision:** New `TherapistAvailability` model — one row per enabled weekday (`dayOfWeek`,
  `startTime`, `endTime`), set by the therapist in Settings. Concrete hourly `AvailabilitySlot` rows are
  generated from the rules over a rolling **14-day** window: full regenerate on save (future *unbooked*
  slots replaced; **booked slots never touched**), plus an idempotent **top-up on every public slots
  read** (`ensureSlotWindow`) so the window can never silently expire again.
- **Rejected:** Manual one-off slot entry (same "someone forgets to top up" failure mode as the seed);
  a cron/scheduled generator (no job infra in this stack; read-time top-up achieves the same with zero
  infra at this scale).
- **Consequences:** The seed script is no longer the availability source; a therapist with no rules is
  simply unbookable until they set hours. Times are "HH:MM" server-local (PKT). Endpoints:
  `GET/PUT /therapists/me/availability`.

## ADR-022 — Removed the admin "global operation hours" (therapists own their hours)
- **Context:** The admin console had an "Operation Hours" card (Overview + an Operations tab) implying a
  platform-wide session window. It was **entirely cosmetic** — the button set a local state and showed
  "✅ updated" without any backend. With ADR-021, availability belongs to therapists.
- **Decision:** Deleted the card and the now-empty Operations tab. In a marketplace, the platform vets
  *who* can list (approval gate); the supplier decides *when* they work.
- **Rejected (deferred):** A real platform-wide constraint (e.g. "sessions only 08:00–22:00 PKT") — a
  legitimate concept, but it's a *validation clamp on therapist rules*, not a separate schedule; YAGNI
  until a real need appears. Clean bolt-on later: a settings row + one rule in `availabilitySchema`.
- **Consequences:** Admin nav = Overview, People, Finance, Security, Support. No fake controls remain in
  the admin console.
