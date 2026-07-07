# Project Guide — MindBridge (repo folder: `Sukoon`)

> **Purpose of this file.** This is the single source of truth for understanding the MindBridge
> codebase — its architecture, every built feature, the reasoning behind key decisions, how to run
> it, and the gotchas learned the hard way. It is written so that **any developer or AI coding agent
> can pick up the project cold and work smoothly**. Last full rewrite: 2026-07-07.
>
> ⚠️ Folder is named `Sukoon` but the product is **MindBridge** everywhere in code. Same thing.

---

## 1. What MindBridge Is

An online therapy / mental-health platform for a Pakistani audience (PKR pricing, manual EasyPaisa
payments, English/Urdu copy). Three roles:

- **Patients** browse approved therapists, book a session on an available time slot, pay by uploading
  an EasyPaisa transfer screenshot, and manage sessions from a dashboard.
- **Therapists** self-register, complete a profile, get **admin-approved**, then manage their
  appointments (mark complete, attach Zoom links) and patients.
- **Admins** verify payments, review/approve/reject therapist applications, and oversee the platform.

Two counseling "tracks": **mental-health** and **career**.

It is a **two-part monorepo**:
- `Backend/` — Express + Prisma + PostgreSQL REST API. **Fully built**: auth (incl. Google
  sign-in), therapist public API, therapist onboarding + admin approval, session booking, payments,
  admin console, transactional email.
- `Frontend/` — React + Vite + Tailwind SPA. **Fully wired to the backend** over HTTP with JWT auth
  (it is *not* a mock prototype anymore — one small exception noted in §9).

---

## 2. Tech Stack

| Concern | Backend | Frontend |
|---|---|---|
| Language/Runtime | Node.js, ESM (`"type":"module"`) | Node.js, ESM |
| Framework | Express 4 | React 18 + React Router 6 |
| Dev server | nodemon — `npm run dev` (port 5000) | Vite — `npm run dev` (port 5173) |
| DB / ORM | PostgreSQL / Prisma 5 | — |
| Validation | Zod 4 (every write endpoint) | HTML `required` + light client checks |
| Auth | JWT (`jsonwebtoken`, 7d) + `bcryptjs`; Google via `google-auth-library` | JWT in `localStorage`; `@react-oauth/google` |
| Email | `resend` | — |
| Styling | — | Tailwind 3 + custom `@layer` component classes |

---

## 3. How To Run It

**Prerequisites:** Node.js, a running PostgreSQL instance.

**Backend**
```
cd Backend
npm install
# create .env from .env.example and fill values (see §11)
npx prisma migrate deploy      # apply all migrations
npx prisma generate            # generate the Prisma client
npm run seed                   # seed test accounts + therapists + slots
npm run dev                    # starts API on http://localhost:5000
```

**Frontend**
```
cd Frontend
npm install
# create .env from .env.example (VITE_API_URL, VITE_GOOGLE_CLIENT_ID)
npm run dev                    # starts SPA on http://localhost:5173
```

**Seeded accounts** (all password `password123`):
- Admin: `admin@mindbridge.pk`
- Patient: `patient@mindbridge.pk`
- Therapists: `ayesha@mindbridge.pk`, `bilal@mindbridge.pk`, `sara.malik@mindbridge.pk`, `zara@mindbridge.pk`
- Seed also creates ~1 week of bookable AvailabilitySlots per therapist.

> **Windows note:** `npx prisma generate` fails with `EPERM ... query_engine-windows.dll.node` if the
> backend server is running (the DLL is file-locked). **Stop the server first**, then generate.

---

## 4. Directory Map

```
Sukoon/
├── CLAUDE.md                      # ← this file
├── docs/                          # long-form architecture/phase write-ups
├── Backend/
│   ├── .env / .env.example        # DATABASE_URL, JWT_SECRET, PORT, NODE_ENV,
│   │                              #   RESEND_API_KEY, FRONTEND_URL, GOOGLE_CLIENT_ID
│   ├── prisma/
│   │   ├── schema.prisma          # 7 models + 5 enums (see §6)
│   │   ├── seed.js                # therapists (APPROVED) + patient + admin + slots
│   │   └── migrations/            # 4 migrations (init → onboarding → approval → google)
│   ├── scripts/create-test-session.js   # dev helper (date filter hardcoded — edit before use)
│   └── src/
│       ├── index.js               # app bootstrap: cors, json, mounts 5 route groups, 404, errorHandler
│       ├── config/db.js           # singleton PrismaClient
│       ├── routes/                # auth · therapist · session · payment · admin  (ALL real)
│       ├── controllers/           # thin HTTP handlers, Zod-validate, shape JSON, next(err)
│       ├── services/              # business logic: auth · therapist · session · payment · admin · email
│       ├── middleware/            # auth.js (JWT) · requireRole.js (RBAC) · errorHandler.js
│       └── validators/            # auth · therapist · session · payment · admin (Zod)
└── Frontend/
    ├── .env / .env.example        # VITE_API_URL, VITE_GOOGLE_CLIENT_ID
    └── src/
        ├── main.jsx               # mounts App inside <GoogleOAuthProvider>
        ├── App.jsx                # BrowserRouter + RoleProvider + Navbar + routes
        ├── context/RoleContext.jsx# real auth state (login/register/loginWithGoogle/logout + session restore)
        ├── services/api.js        # real fetch client (JWT Bearer, error normalization)
        ├── services/adapters.js   # maps backend shape ↔ UI shape (mapTherapist/mapUser/uiTrackToApi)
        ├── config/sidebarConfig.jsx
        ├── data/mockData.js       # LEGACY — only AdminConsole still uses `adminTherapists` (see §9)
        ├── components/            # Navbar, Footer, TherapistCard, SidebarLink, ProtectedRoute
        └── pages/                 # Home, Register, Login, Therapists, TherapistProfile,
                                   #   CareerTherapy, BookSession, Payment, +3 dashboards
```

---

## 5. Architecture

**Backend — layered MVC:** `Route → Controller → Service → Prisma → PostgreSQL`, with cross-cutting
middleware (CORS, JSON, JWT auth, RBAC, error handler).

| Layer | Responsibility |
|---|---|
| Routes | map URL+verb → controller; attach `auth` + `requireRole(...)` middleware |
| Controllers | parse `req`, Zod `safeParse` → 400 on failure, call service, shape JSON, `next(err)` |
| Services | business logic, Prisma queries, transactions, throw `Error` with numeric `.status` |
| `config/db.js` | one shared `PrismaClient` |
| Middleware | `auth` (verify JWT → `req.user = {id,email,role}`), `requireRole(...roles)` (401/403), `errorHandler` (formats `{error[,details]}`, adds `stack` in dev) |

**Frontend — client-side SPA.** React Router renders pages; `RoleContext` holds real auth state
(restored from a JWT in `localStorage` via `GET /auth/me` on load); `services/api.js` is the single
HTTP seam; `adapters.js` reconciles backend↔UI shapes; `ProtectedRoute` gates dashboard/booking
routes by the (lowercase) UI role.

**Request lifecycle example (approve a therapist):**
`PATCH /api/admin/therapists/:id/approve` → `index.js` (cors, json) → `admin.routes` (`auth` →
`requireRole('ADMIN')`) → `admin.controller.approveTherapist` → `admin.service.approveTherapist`
(tx: set status APPROVED + isActive true + user verified; best-effort email) → `res.json` → client.

---

## 6. Data Model (Prisma / PostgreSQL, snake_case tables via `@@map`, UUID PKs)

```
User ||--o| Therapist            (therapistProfile, 1:0..1)
User ||--o{ Session              (patientSessions)
User ||--o{ Payment              (payments as patient)
Therapist ||--o{ TherapistSpecialization / TherapistLanguage / AvailabilitySlot
Therapist ||--o{ Session         (therapistSessions)
AvailabilitySlot ||--o| Session  (slotId unique — one booking per slot)
Session ||--o| Payment           (sessionId unique)
```

- **User** `{id, name, email(unique), passwordHash?, googleId?(unique), role(Role=PATIENT),
  initials, avatarUrl?, phone?, language="English", isVerified=false, createdAt}`
  - `passwordHash` is **nullable** (Google accounts have no password).
  - `googleId` is the Google ID-token `sub` claim, for OAuth sign-in.
- **Therapist** `{id, userId(unique→User), title?, credentials?, about?, methodology?,
  licenseNumber?, feePkr?, rating(Decimal=0), reviewCount=0, sessionsCount=0, color, track(Track),
  status(TherapistStatus=DRAFT), rejectionReason?, reviewedAt?, reviewedBy?, isActive=true}`
  - Profile fields are **nullable** so a therapist can register minimally and finish later.
  - `credentials` is surfaced in the UI as **"Education"**.
  - `status` drives the approval lifecycle; `isActive` is the single "publicly listed/bookable" flag.
- **TherapistSpecialization** / **TherapistLanguage** — child rows (`name` / `language`), free-text.
- **AvailabilitySlot** `{id, therapistId, slotDatetime, isBooked=false}`.
- **Session** `{id, patientId, therapistId, slotId(unique), status(SessionStatus=PENDING_PAYMENT),
  sessionNumber, sessionType, zoomLink?, notes?, moodPost?, durationMins=60, createdAt}`.
- **Payment** `{id, sessionId(unique), patientId, amountPkr, serviceFee=250, totalPkr, txnId,
  screenshotUrl, status(PaymentStatus=PENDING), reviewedBy?, createdAt, approvedAt?}`.

**Enums:** `Role(PATIENT|THERAPIST|ADMIN)` · `TherapistStatus(DRAFT|PENDING|APPROVED|REJECTED)` ·
`Track(MENTAL_HEALTH|CAREER)` · `SessionStatus(PENDING_PAYMENT|CONFIRMED|IN_PROGRESS|COMPLETED|CANCELLED)`
· `PaymentStatus(PENDING|APPROVED|REJECTED)`.

**Migrations (in order):** `init` → `therapist_onboarding_fields` (nullable profile + licenseNumber)
→ `therapist_approval_status` (TherapistStatus + review fields; data-fix `isActive=true → APPROVED`)
→ `google_oauth_users` (nullable passwordHash + unique googleId).

> Migrations are **hand-authored** in this environment because the shell is non-interactive and
> `prisma migrate dev` refuses to run. Pattern: write `migrations/<timestamp>_<name>/migration.sql`
> by hand, then `npx prisma migrate deploy` + `npx prisma generate`. **Never edit an applied
> migration** — always add a new folder.

---

## 7. Features — What's Built & How It Works

### 7.1 Auth (`/api/auth`)
- `POST /register` — Zod-validated. For `role=THERAPIST` it also requires `licenseNumber` +
  `specializations[]` and creates the Therapist profile in the same transaction (see 7.3).
  Returns `{user, token}`.
- `POST /login` — bcrypt check; generic "Invalid email or password" (no user enumeration). If the
  account is Google-only (`passwordHash` null) it returns a clear 400 telling them to use Google.
- `POST /google` — **Continue with Google.** Browser gets a Google ID token via Google Identity
  Services and posts it as `credential`. Server verifies it with `google-auth-library`
  (`verifyIdToken`, audience = `GOOGLE_CLIENT_ID`), then **find-or-create**:
  1. existing `googleId` → sign in;
  2. existing account with same email → **link** `googleId` to it (keeps role/profile; backfills
     `isVerified`/`avatarUrl` if missing);
  3. neither → create a new **PATIENT** (Google sign-ups are always patients — therapists must use
     the therapist form). Returns the same `{user, token}` envelope.
- `POST /logout` (auth) — client deletes the token; no server-side revocation.
- `GET /me` (auth) · `PATCH /me` (auth) — current user; profile update.

### 7.2 Therapist public API (`/api/therapists`)
- `GET /` — lists therapists filtered by `isActive:true` (+ optional track/specialization/language/
  fee filters), ordered by rating. `formatTherapist` flattens nested rows and casts Decimal→Number.
- `GET /:id` — single therapist; **404s if not `isActive`** (hidden/incomplete profiles aren't public).
- `GET /:id/slots` — available (unbooked, future) slots.
- `GET /me` (auth) · `PATCH /me` (auth) — the logged-in therapist's **own** profile (any status),
  for the Settings form. See 7.3.

### 7.3 Therapist self-service onboarding + admin approval  ⭐ (core custom flow)
The lifecycle a new therapist goes through, and the code that drives it:

1. **Register** (Register page → "I am a Therapist" tab): collects Name, Email, Password,
   Licence No, Specializations. `auth.service.registerUser` creates `User(role=THERAPIST)` +
   `Therapist(status=DRAFT, isActive=false)` + specialization rows in one transaction.
2. **Complete profile** (Therapist Dashboard → Settings): Title, Track, Education (`credentials`),
   About, Methodology, Languages, Fee (PKR), plus Name/Licence/Specializations.
   `therapist.service.updateMyProfile` runs a **state machine** on save:
   - incomplete → `DRAFT`, hidden
   - complete & not yet approved → `PENDING`, hidden (enters admin queue; clears `rejectionReason`)
   - complete & already `APPROVED` → stays `APPROVED`, live (trusted edits stay live)
   - was approved but now incomplete → `DRAFT`, auto-unlisted
   "Complete" = title + credentials + about + methodology + fee>0 + ≥1 specialization + ≥1 language.
3. **Admin review** (Admin Console → **Security** tab): `GET /api/admin/therapist-applications?status=PENDING`
   lists applications. `PATCH /api/admin/therapists/:id/approve` → APPROVED + `isActive=true` +
   `user.isVerified=true` + sends approval email. `PATCH /api/admin/therapists/:id/reject` (with a
   required `reason`) → REJECTED + hidden + sends rejection email. Only `PENDING` applications can be
   decided (else 409 — prevents double-decisions).
4. **Rejected therapist** sees the reason in Settings, edits, resubmits → back to `PENDING`.

Key point: **completing a profile does NOT auto-publish** — an admin must approve. `isActive` is only
ever `true` for APPROVED therapists, and the public listing filters on `isActive`.

### 7.4 Session booking (`/api/sessions`)
- `POST /` (PATIENT) — books a slot. Atomic transaction: verify slot is free → create Session
  (`PENDING_PAYMENT`) → flip `slot.isBooked=true`.
- `GET /my` (PATIENT) · `GET /therapist/my` (THERAPIST) — role-specific lists (the `/therapist/my`
  static path is declared **before** `/:id` so it isn't captured as an id).
- `GET /:id` (auth) — any involved party (patient/therapist/admin); ownership enforced in the service.
- `PATCH /:id/status` (THERAPIST/ADMIN) — e.g. therapist "Mark Complete" → `COMPLETED`.
- `PATCH /:id/zoom` (THERAPIST/ADMIN) — attach a Zoom link.

### 7.5 Payments — manual EasyPaisa (`/api/payments`)
Not a gateway integration. Patient pays out-of-band and uploads a screenshot + txn id.
- `POST /` (PATIENT) — submit payment for a session (`amountPkr` from the therapist's `feePkr`,
  `serviceFee` default 250, `totalPkr` computed).
- `GET /:id` (auth) — owner patient or admin.
- `PATCH /:id/approve` (ADMIN) — tx: `Payment=APPROVED` + `Session=CONFIRMED`.
- `PATCH /:id/reject` (ADMIN) — `Payment=REJECTED` but **`Session` stays `PENDING_PAYMENT`** so the
  patient can re-pay. ⚠️ A rejected booking therefore looks identical to a fresh unpaid one — the UI
  hides it by filtering on `payment.status === 'REJECTED'` (PatientDashboard already does this).

### 7.6 Admin console (`/api/admin`, all `auth + requireRole('ADMIN')`)
- `GET /stats` — user/session/payment counts + revenue (sum of APPROVED payments).
- `GET /users` · `GET /sessions` · `GET /payments?status=` — oversight lists.
- `GET /therapist-applications?status=` · `PATCH /therapists/:id/approve` · `.../reject` — see 7.3.

### 7.7 Email (Resend) — `services/email.service.js`
- `sendTherapistApproved({name,email})` and `sendTherapistRejected({name,email,reason})`.
- Reads `RESEND_API_KEY`; if unset, it **logs to console instead of sending** (safe no-op).
- Wired into admin approve/reject as **best-effort**: wrapped in try/catch so a failed email never
  blocks the admin's decision (the DB change commits regardless).
- Sender is `onboarding@resend.dev` (Resend's shared test domain). **Limitation:** in test mode
  Resend only delivers to the account owner's own verified email until a real domain (e.g.
  `mindbridge.pk`) is verified.

---

## 8. Frontend Details

- **Routing** (`App.jsx`): public (Home, Register, Login, Therapists, TherapistProfile,
  CareerTherapy) + `ProtectedRoute`-gated (`/book/:id`, `/payment/:id`, `/dashboard/{patient,
  therapist,admin}`).
- **Auth state** (`RoleContext.jsx`): `login`, `register`, `loginWithGoogle`, `logout`, plus session
  restore on load (reads token → `GET /auth/me`). Exposes lowercase `role` for the UI and the raw
  `currentUser`. Backend roles are UPPERCASE; `toUiRole` lowercases them.
- **HTTP** (`api.js`): one `request()` helper attaches the `Bearer` token, normalizes errors into
  `Error` objects with `.status` and `.details`. All endpoints have typed-ish methods here.
- **Shape mapping** (`adapters.js`): `mapTherapist` (feePkr→fee, reviewCount→reviews, track
  MENTAL_HEALTH→'mental-health', etc.), `mapUser`, `uiTrackToApi`.
- **Google button**: `main.jsx` wraps the app in `<GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>`;
  Register **and** Login render `<GoogleLogin>` — but only when `VITE_GOOGLE_CLIENT_ID` is set
  (`GOOGLE_ENABLED`), so the button simply doesn't appear if unconfigured (no broken UI).

---

## 9. What's Still Cosmetic / Not Backed (do NOT fake these)

Per the owner's rule (§10), unbacked sections are left visibly inert rather than faked with dummy data:
- **AdminConsole** still imports `adminTherapists` from `mockData.js` for the "Therapist Performance
  Snapshot" and "People → Therapists" tables (the only remaining mockData usage in the app).
- **Therapist availability management** — the Settings "Availability Hours" card is **disabled
  ("Coming soon")**; there is no endpoint for therapists to publish their own slots. Slots currently
  come only from the seed script. **This is the biggest remaining functional gap.**
- Assorted cosmetic bits with no model: admin Operation Hours / Support, patient streak/mood, therapist
  Resources, payment screenshot stored as a filename string (no blob storage).

---

## 10. Conventions & Working Rules

**Backend code**
- ESM; relative imports include the `.js` extension.
- Two coexisting styles (by author/phase): `auth.*` and `session.*`/`payment.*` use single quotes,
  **no semicolons**, `export const fn = async () =>`; `therapist.*`/`admin.*` use **semicolons** and
  `export async function`. Match the style of the file you're editing.
- Errors: services `throw new Error(msg)` with a numeric `.status`; controllers `try/catch → next(err)`;
  the single `errorHandler` formats `{error}` (+`details` for Zod, +`stack` in dev).
- Validation: every write endpoint uses `schema.safeParse(req.body)` → `400 {error, details}`.
- RBAC: protected routes are `auth` + `requireRole(...)`. JWT payload is `{id, email, role}`.
- Response envelopes: `{user, token}`, `{therapists}`, `{therapist}`, `{sessions}`, `{applications}`,
  `{payments}`, `{stats}`, `{error[,details]}`.

**Frontend code**
- Function components + hooks; Tailwind utilities + shared `@layer` classes (`btn-primary`, `card`,
  `input-field`, `badge*`, etc.). Keep visual design intact when changing data sources.

**How the project owner likes to work** (important for smooth collaboration)
- Treat them as the **fullstack owner**; be decisive — give a professional recommendation, not a menu.
- **Explain shell commands in plain English before running them**, and explain results afterwards.
- Work **section by section**: say what will change and why, get approval, then build. Report what is
  now real vs. still cosmetic.
- **Never fake** unbacked features with dummy data — leave them clearly inert.
- **Git commits:** small, logical, conventional-commit messages, and **no `Co-Authored-By` trailer**.
  Ask before pushing; the owner sometimes prefers to run `git push` themselves.

---

## 11. External Integrations & Their Config

- **PostgreSQL** via `DATABASE_URL`.
- **Google OAuth (ID-token flow):** needs a Google Cloud **OAuth Web Client ID**. Same value goes in
  `Backend/.env` as `GOOGLE_CLIENT_ID` **and** `Frontend/.env` as `VITE_GOOGLE_CLIENT_ID` (Client IDs
  are public; **no client secret and no redirect URI are used** by this flow). In Google Cloud
  Console → the OAuth client → **Authorized JavaScript origins** must include `http://localhost:5173`
  (and `http://localhost`). Redirect URIs are irrelevant. The consent screen starts in **"Testing"**
  mode → only added **test users** can sign in until it's published.
- **Resend** for email: `RESEND_API_KEY` in `Backend/.env`; `FRONTEND_URL` is used to build links in
  emails. See the test-mode delivery limitation in §7.7.
- **Zoom**: just a `zoomLink` string on Session (therapist pastes it); no Zoom API.
- **EasyPaisa**: manual (screenshot + txn id); no API.

`.env` files are gitignored. `.env.example` in each app documents every required variable.

---

## 12. Gotchas & Lessons Learned (read before debugging)

1. **UI role vs. JWT role.** The UI role in `RoleContext` is separate from the role inside the JWT.
   You can *view* a dashboard while holding a token for a different role → admin-only calls then fail
   with `403 "Access denied. Required role: ADMIN"` even though the page looks right. Fix: actually
   log in as the correct role (the token is what the server trusts).
2. **One JWT per browser.** The token lives in `localStorage` (`mindbridge_token`), shared across all
   tabs — logging in as a different user in any tab overwrites it everywhere. To use two roles at
   once, use two browsers / an incognito window.
3. **Google `Error 400: origin_mismatch`** = the current origin isn't in the OAuth client's
   Authorized JavaScript origins. Add `http://localhost:5173`. (Not a code bug.)
4. **`prisma migrate dev` fails** in a non-interactive shell → hand-author the migration + `migrate
   deploy` (see §6). **`prisma generate` EPERM on Windows** → stop the backend first (DLL is locked).
5. **Rejected payment leaves the session at `PENDING_PAYMENT`** (by design, to allow re-payment) —
   the UI must filter on `payment.status === 'REJECTED'` to hide it.
6. **Route ordering:** static paths (`/me`, `/therapist/my`) are declared before `/:id` so Express
   doesn't capture them as params.

---

## 13. Git & Backlog

**Git state:** work has been developed on branch `master` and pushed to `origin/master`; earlier
Phase 4 was also pushed to `main` (`git push origin master:main`). The repo's default branch is
`main`. Commits follow conventional style with **no Co-Authored-By trailer**.

**Immediate backlog (roughly in priority order):**
1. Commit + push the **Google sign-in** feature if not already done (schema/migration, `auth.service`
   `googleAuth` + password-less login guard, validator, controller, route; frontend `main.jsx`,
   `api.js`, `RoleContext`, Register/Login buttons, env docs).
2. **Therapist availability management** — let approved therapists publish their own bookable slots
   (replace the cosmetic "Availability Hours" card + seed-only slots). Biggest functional gap.
3. Make the AdminConsole therapist tables real (derive from `/admin/sessions` + `/admin/users` +
   `/therapists`) to remove the last `mockData` dependency.
4. Production hardening: verify a real Resend domain (for email to arbitrary addresses); publish the
   Google OAuth consent screen (out of "Testing"); CORS allow-list (currently wide open); consider
   token refresh/rotation; real blob storage for payment screenshots.

---

## 14. Command Reference

- **Backend:** `npm run dev` · `npm start` · `npm run seed` · `npx prisma migrate deploy` ·
  `npx prisma generate` · `npx prisma studio`
- **Frontend:** `npm run dev` · `npm run build` (use to verify it compiles) · `npm run preview`
- **Env required:** Backend — `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`, `RESEND_API_KEY`,
  `FRONTEND_URL`, `GOOGLE_CLIENT_ID`. Frontend — `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.
