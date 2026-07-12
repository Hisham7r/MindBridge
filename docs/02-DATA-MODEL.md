# 02 — Data Model (Prisma / PostgreSQL)

> **Last updated:** 2026-07-08 · **Code is truth:** `Backend/prisma/schema.prisma` +
> `Backend/prisma/migrations/`. Verify against them.

PostgreSQL via Prisma 5. All PKs are **UUID strings** (`@default(uuid())`). Tables are snake_case via
`@@map`; model fields stay camelCase. One shared client: `Backend/src/config/db.js`.

---

## Relationships

```
User ||--o| Therapist            (User.therapistProfile — 1 : 0..1)
User ||--o{ Session              (as patient — "PatientSessions")
User ||--o{ Payment              (as patient)
Therapist ||--o{ TherapistSpecialization
Therapist ||--o{ TherapistLanguage
Therapist ||--o{ AvailabilitySlot
Therapist ||--o{ Session         ("TherapistSessions")
AvailabilitySlot ||--o| Session  (Session.slotId is UNIQUE → one booking per slot)
Session ||--o| Payment           (Payment.sessionId is UNIQUE → one payment per session)
```

## Models

### User
`{ id, name, email(unique), passwordHash?, googleId?(unique), role(Role=PATIENT), initials,
avatarUrl?, phone?, language="English", isVerified=false, createdAt }`
- **`passwordHash` nullable** — Google-only accounts have no password (ADR-009). Login guards against
  a null hash.
- **`googleId` unique nullable** — the Google ID-token `sub` claim; used for OAuth find-or-create/link.
- **`role`** — `PATIENT | THERAPIST | ADMIN`. Set at creation; the JWT carries it.
- **`initials`** — derived from name (`generateInitials`) for avatar chips; recomputed on name change.
- **`isVerified`** — set true on Google email-verified sign-up and on admin therapist approval.
- Relations: `therapistProfile` (0..1), `patientSessions`, `payments`.

### Therapist
`{ id, userId(unique→User), title?, credentials?, about?, methodology?, licenseNumber?, feePkr?,
rating(Decimal=0), reviewCount=0, sessionsCount=0, color="#3B82F6", track(Track=MENTAL_HEALTH),
status(TherapistStatus=DRAFT), rejectionReason?, reviewedAt?, reviewedBy?, isActive=true }`
- **Profile fields nullable** (`title/credentials/about/methodology/feePkr`) — a therapist self-registers
  with a *minimal* row and completes the rest in Settings (ADR-003/006). They are non-null in practice
  for any *listed* therapist because of the completeness gate (ADR-007).
- **`credentials` = "Education"** in the UI.
- **`licenseNumber`** — collected at registration.
- **`status`** (`DRAFT|PENDING|APPROVED|REJECTED`) — the review lifecycle. **`isActive`** — the single
  public-visibility flag (ADR-002). These are **independent axes**: e.g. `APPROVED + isActive:false` =
  *suspended* (ADR-011). Public listing filters `isActive: true`.
- **`rejectionReason/reviewedAt/reviewedBy`** — populated on admin reject/approve.
- **`rating/reviewCount/sessionsCount`** — seeded values on demo therapists; **not** incremented by the
  app yet (real admin "patients" counts are derived live from sessions, not from `sessionsCount`).
- **`color`** — avatar background hex (seeded distinct; new therapists get the default blue).

### TherapistSpecialization / TherapistLanguage
Child rows: `{ id, therapistId, name }` / `{ id, therapistId, language }`. Free-text (ADR-005). Replaced
wholesale (delete + recreate) when a therapist edits their profile.

### AvailabilitySlot
`{ id, therapistId, slotDatetime, isBooked=false }`. `Session.slotId` is unique → **one booking per
slot**. Generated automatically from the therapist's weekly `TherapistAvailability` rules on a rolling
14-day window (see below + ADR-021); the seed script also creates some for the demo therapists.

### TherapistAvailability
`{ id, therapistId, dayOfWeek (0=Sun…6=Sat), startTime "HH:MM", endTime "HH:MM" }`, unique per
`(therapistId, dayOfWeek)`. The therapist's **recurring weekly working hours**, set in Settings.
Concrete hourly `AvailabilitySlot` rows are generated from these rules: regenerated on save (future
unbooked slots replaced; **booked slots untouched**) and topped up on every public slots read
(self-healing window — availability can never silently expire). Logic in `therapist.service.js`
(`buildSlotDatetimes`, `ensureSlotWindow`, `updateMyAvailability`).

### Session
`{ id, patientId, therapistId, slotId(unique), status(SessionStatus=PENDING_PAYMENT), sessionNumber,
sessionType, zoomLink?, notes?, moodPost?, durationMins=60, createdAt }`
- **`sessionNumber`** — this patient's Nth session with this therapist (computed at booking).
- **`zoomLink`** — pasted by the therapist (ADR-015). `notes`/`moodPost` exist but are largely unused UI-side.

### Payment
`{ id, sessionId(unique), patientId, amountPkr, serviceFee=250, totalPkr, txnId, screenshotUrl,
status(PaymentStatus=PENDING), reviewedBy?, createdAt, approvedAt? }`
- `amountPkr` = therapist's `feePkr` (server-derived, never trusted from client). `totalPkr = amountPkr +
  serviceFee`. `screenshotUrl` is a filename string (no blob storage yet).

## Enums

- `Role` = `PATIENT | THERAPIST | ADMIN`
- `TherapistStatus` = `DRAFT | PENDING | APPROVED | REJECTED`
- `Track` = `MENTAL_HEALTH | CAREER`
- `SessionStatus` = `PENDING_PAYMENT | CONFIRMED | IN_PROGRESS | COMPLETED | CANCELLED`
- `PaymentStatus` = `PENDING | APPROVED | REJECTED`

## Key lifecycles

- **Therapist:** `DRAFT` (registered/incomplete) → `PENDING` (complete, submitted) → `APPROVED` (admin,
  `isActive=true`) | `REJECTED` (+reason; can edit→`PENDING`). Suspend = `APPROVED` + `isActive=false`.
- **Session:** `PENDING_PAYMENT` → (payment approved) `CONFIRMED` → `COMPLETED` (therapist) / `CANCELLED`.
  `IN_PROGRESS` exists in the enum; UI treats it as active.
- **Payment:** `PENDING` → `APPROVED` (session → CONFIRMED) | `REJECTED` (session **stays**
  `PENDING_PAYMENT` so the patient can resubmit — ADR-019).

## Migrations (in order) — hand-authored (ADR-012)

1. `20260504184846_init` — all base tables/enums.
2. `20260629120000_therapist_onboarding_fields` — profile fields → nullable; add `licenseNumber`.
3. `20260706090000_therapist_approval_status` — add `TherapistStatus` + `rejectionReason/reviewedAt/
   reviewedBy`; **data-fix** `UPDATE therapists SET status='APPROVED' WHERE isActive=true` (grandfather
   seeded/live therapists).
4. `20260707100000_google_oauth_users` — `passwordHash` → nullable; add unique `googleId`.
5. `20260710120000_therapist_availability` — add `therapist_availability` (weekly recurring hours).

**Workflow (non-interactive shell):** write `migrations/<timestamp>_<name>/migration.sql` by hand →
`npx prisma migrate deploy` → `npx prisma generate`. **Never edit an applied migration.** On Windows,
stop the backend before `generate` (DLL lock — `08-GOTCHAS.md`).
