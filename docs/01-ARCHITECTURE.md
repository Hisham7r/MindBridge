# 01 — Architecture

> **Last updated:** 2026-07-08 · **Code is truth.** High-level shape, request lifecycle, and data flow.
> Layer detail is in `03-BACKEND.md` / `04-FRONTEND.md`; data model in `02-DATA-MODEL.md`.

---

## System shape

Two-part monorepo, HTTP/JSON between them, JWT auth.

```
Browser (React SPA :5173)  ──fetch + Bearer JWT──▶  Express API (:5000)  ──▶  Prisma  ──▶  PostgreSQL
        ▲                                                   │
        └──────────────── JSON { ... } ─────────────────────┘
External: Google Identity Services (ID token), Resend (email)
```

- **Backend** — Express 4, ESM, layered **MVC**: `Route → Controller → Service → Prisma`.
- **Frontend** — React 18 + React Router 6 + Vite + Tailwind. Client-side SPA; one HTTP seam (`api.js`)
  + one shape-adapter seam (`adapters.js`).

## Backend layers

| Layer | Responsibility | Rule |
|---|---|---|
| **Routes** (`routes/*.routes.js`) | map URL+verb → controller; attach `auth` + `requireRole(...)` | thin |
| **Controllers** (`controllers/*.controller.js`) | parse `req`; Zod `safeParse` → 400; call service; shape JSON; `next(err)` | no business logic |
| **Services** (`services/*.service.js`) | business logic, Prisma queries, transactions; `throw Error` w/ numeric `.status` | no `req`/`res` |
| **config/db.js** | one shared `PrismaClient` | singleton |
| **Middleware** | `auth` (JWT→`req.user`), `requireRole` (RBAC), `errorHandler` (formats `{error[,details]}`, `stack` in dev) | cross-cutting |

Mounted in `index.js`: `cors()` (wide open) → `express.json()` → `/api/health` → 5 route groups
(`/api/auth`, `/api/therapists`, `/api/sessions`, `/api/payments`, `/api/admin`) → 404 handler →
`errorHandler` (last).

## Request lifecycle (example: admin approves a therapist)

```
PATCH /api/admin/therapists/:id/approve  (Bearer JWT)
 → index.js: cors, json
 → admin.routes: auth (verify JWT → req.user) → requireRole('ADMIN')
 → admin.controller.approveTherapist  (parse params)
 → admin.service.approveTherapist
      · load PENDING therapist (else 404/409)
      · $transaction: therapist → APPROVED + isActive:true ; user → isVerified:true
      · best-effort sendTherapistApproved() (try/catch)
 → res.json({ message, therapist })
 (any thrown Error with .status → next(err) → errorHandler → { error })
```

Every write endpoint validates with Zod first (`schema.safeParse(req.body)` → `400 {error, details}`).

## Data flow, UI → DB → UI (example: booking)

```
BookSession.jsx  → api.createSession(payload)  → POST /api/sessions
  → session.controller → session.service.createSession
      → prisma $transaction: claim slot (updateMany isBooked:false→true) + create Session
  → returns formatSession(...)  → api.js normalizes  → page state → re-render
```

The backend returns **flattened, client-friendly shapes** (`formatSession`, `formatTherapist`,
`formatPayment`) — never raw Prisma rows, never password hashes. The frontend further maps to legacy UI
shapes in `adapters.js` where needed (`mapTherapist`, `mapUser`).

## Frontend architecture

- **`main.jsx`** → `<GoogleOAuthProvider>` → `<App/>`.
- **`App.jsx`** → `<BrowserRouter>` → `<RoleProvider>` → `<Navbar/>` + `<Routes>`. Public routes +
  `<ProtectedRoute allowedRoles=[...]>`-gated routes (`/book/:id`, `/payment/:id`, `/dashboard/*`).
- **State:** `RoleContext` (auth/session). No Redux; page-local `useState` elsewhere. The API is the
  source of truth (ADR-013); pages fetch on mount via `useEffect`.
- **Seams:** `services/api.js` (all HTTP; Bearer token; error normalization) and `services/adapters.js`
  (backend↔UI shape mapping). Change data shapes in these, not in components.

### Component / page hierarchy (top level)
```
App
├─ Navbar (role-aware)
├─ public: Home · Register · Login · Therapists · TherapistProfile · CareerTherapy
├─ ProtectedRoute(patient):   BookSession · Payment · PatientDashboard
├─ ProtectedRoute(therapist): TherapistDashboard
└─ ProtectedRoute(admin):     AdminConsole
Shared components: TherapistCard · SidebarLink · ProtectedRoute · Footer
```

## Folder map (responsibilities)

```
Backend/src/
  index.js            app bootstrap + route mounting
  config/db.js        singleton PrismaClient
  routes/             auth · therapist · session · payment · admin  (URL→controller + RBAC)
  controllers/        HTTP glue: validate, call service, shape response, next(err)
  services/           business logic: auth · therapist · session · payment · admin · email
  middleware/         auth (JWT) · requireRole (RBAC) · errorHandler
  validators/         Zod schemas: auth · therapist · session · payment · admin
Backend/prisma/       schema.prisma · migrations/ · seed.js
Frontend/src/
  main.jsx · App.jsx
  context/RoleContext.jsx      auth state + session restore
  services/api.js              HTTP client (typed-ish methods)
  services/adapters.js         shape mapping
  config/sidebarConfig.jsx     role-based nav (ADMIN/THERAPIST/PATIENT)
  components/                  Navbar · Footer · TherapistCard · SidebarLink · ProtectedRoute
  pages/                       Home · Register · Login · Therapists · TherapistProfile ·
                               CareerTherapy · BookSession · Payment · {Patient,Therapist,Admin} dashboards
  data/mockData.js             LEGACY — imported nowhere now (safe to delete later)
```

## Cross-cutting conventions (quick)
- Response envelopes: `{user, token}`, `{therapists}`, `{therapist}`, `{sessions}`, `{applications}`,
  `{payments}`, `{stats}`, `{error[,details]}`.
- Errors: service `throw new Error(msg)` + numeric `.status`; controller `try/catch → next(err)`.
- Route ordering: static paths (`/me`, `/therapist/my`) declared before `/:id`.
- Two backend code styles coexist — match the file (ADR-016). Full detail: `03-BACKEND.md`.
