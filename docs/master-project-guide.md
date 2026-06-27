# Master Project Guide — MindBridge

> The single document a new engineer reads to become productive on MindBridge with **no
> further guidance**. It ties together everything in the other five docs and adds the
> practical "run it / study it / interview-ready" layer.

**Read order for a brand-new engineer:**
1. This guide (the map).
2. [concepts-explained.md](./concepts-explained.md) (the ideas).
3. [detailed-architecture.md](./detailed-architecture.md) (the structure).
4. [request-flow.md](./request-flow.md) (the motion).
5. [phase4A-documentation.md](./phase4A-documentation.md) +
   [phase4B-documentation.md](./phase4B-documentation.md) (the history & the *why*).

> **Stack truth (don't be misled by generic tutorials):** MindBridge is
> **PostgreSQL + Prisma + Express** on the server and **React + Vite + Tailwind** on the
> client, talking over HTTP with the browser's **`fetch`**. There is **no MongoDB, no
> Mongoose, no Axios.** Where this guide says "models" it means **Prisma models /
> PostgreSQL tables**, not Mongo collections.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Run It Locally (Getting Started)](#2-run-it-locally-getting-started)
3. [Full System Walkthrough (startup → user journey)](#3-full-system-walkthrough-startup--user-journey)
4. [Frontend Walkthrough](#4-frontend-walkthrough)
5. [Backend Walkthrough](#5-backend-walkthrough)
6. [Database Walkthrough](#6-database-walkthrough)
7. [Authentication Walkthrough](#7-authentication-walkthrough)
8. [Scheduling Walkthrough](#8-scheduling-walkthrough)
9. [Booking Walkthrough](#9-booking-walkthrough)
10. [Learning Notes (study + interview prep)](#10-learning-notes-study--interview-prep)
11. [Glossary](#11-glossary)

---

## 1. Project Overview

### What problem does MindBridge solve?

Mental-health and career counselling in Pakistan is hard to access: stigma, distance,
and friction in *finding* a vetted professional and *paying* them. MindBridge is an
**online therapy platform** that lets a patient browse qualified therapists, book a
session, pay through a familiar local method (**EasyPaisa**, by uploading a transfer
screenshot), and meet over a video link — while therapists manage their schedule and
admins verify payments and oversee the platform.

### Who uses it (and what they want)

| Role | Wants to… |
|---|---|
| **Patient** | find the right therapist, book a time, pay, attend, track their journey |
| **Therapist** | see their schedule, manage patients, send the session link, track earnings |
| **Admin** | verify manual payments, see platform health, oversee users |

### Business goals

- Lower the barrier to therapy (language options, local payment, online sessions).
- Two "tracks": **mental-health** and **career** counselling.
- A trustworthy money flow even without a card gateway (manual EasyPaisa + admin review).

### Where the project stands today

The **entire core loop is built and live on the real backend**:

```mermaid
flowchart LR
    Reg[Register/Login] --> Browse[Browse therapists]
    Browse --> Book[Book a slot]
    Book --> Pay[Pay via EasyPaisa]
    Pay --> Approve[Admin approves]
    Approve --> Confirm[Session CONFIRMED]
    Confirm --> Zoom[Therapist sends Zoom link]
    Zoom --> Join[Patient joins session]
```

Phases 1–3 delivered schema, auth, and the public therapist API. **Phase 4A** built the
booking/payment/admin backend; **Phase 4B** wired the React app to it. (Full history:
the two phase docs.)

---

## 2. Run It Locally (Getting Started)

### Prerequisites
- Node.js (LTS), npm
- A PostgreSQL database (local or hosted)

### Backend

```bash
cd Backend
npm install
cp .env.example .env          # then edit values (see below)
npx prisma migrate deploy     # apply the schema to your database
npm run seed                  # create therapists, test patient/admin, future slots
npm run dev                   # starts on http://localhost:5000 (nodemon)
```

`.env` keys ([.env.example](../Backend/.env.example)):

| Key | Meaning |
|---|---|
| `DATABASE_URL` | `postgresql://USER:PASS@localhost:5432/mindbridge` |
| `PORT` | API port (default `5000`) |
| `JWT_SECRET` | secret used to sign/verify JWTs — **use a strong value** |
| `NODE_ENV` | `development` enables query logs + error stack traces |

Health check: `GET http://localhost:5000/api/health` → `{ status: 'ok' }`.

### Frontend

```bash
cd Frontend
npm install
cp .env.example .env          # VITE_API_URL=http://localhost:5000/api
npm run dev                   # starts Vite on http://localhost:5173
```

### Seeded test accounts (all password `password123`)

| Email | Role |
|---|---|
| `patient@mindbridge.pk` | PATIENT |
| `admin@mindbridge.pk` | ADMIN |
| `ayesha@mindbridge.pk`, `bilal@mindbridge.pk`, `sara.malik@mindbridge.pk`, `zara@mindbridge.pk` | THERAPIST |

### Useful commands

| Where | Command | Does |
|---|---|---|
| Backend | `npm run dev` / `npm start` | run with nodemon / plain node |
| Backend | `npm run seed` | (re)seed data — idempotent |
| Backend | `npx prisma studio` | visual DB browser |
| Backend | `npx prisma migrate dev` | create/apply a migration in dev |
| Frontend | `npm run dev` / `build` / `preview` / `lint` | Vite dev / build / preview / ESLint |

---

## 3. Full System Walkthrough (startup → user journey)

### What happens when the backend starts

```mermaid
flowchart TD
    A["node src/index.js"] --> B[dotenv loads .env]
    B --> C[create Express app]
    C --> D["cors() + express.json()"]
    D --> E[mount /api/auth, /therapists, /sessions, /payments, /admin]
    E --> F[404 handler, then errorHandler last]
    F --> G["app.listen(PORT) → logs ✅ running"]
    G --> H[Prisma singleton connects lazily on first query]
```

### What happens when the frontend starts

```mermaid
flowchart TD
    A[Vite serves index.html] --> B[main.jsx mounts App]
    B --> C[BrowserRouter + RoleProvider + Navbar]
    C --> D[RoleProvider useEffect: token? → GET /auth/me]
    D -->|valid| E[currentUser + role restored]
    D -->|none/invalid| F[stay guest]
    E & F --> G[Routes render the matched page]
```

### A complete patient journey (the happy path)

1. **Register/Login** → JWT stored, role set, redirected to `/dashboard/patient`.
2. **Browse** `/therapists` → real list via `GET /therapists` (adapted for the UI).
3. **Open a profile** `/therapist/:id` → `GET /therapists/:id`.
4. **Book** `/book/:id` → pick a real future slot → `POST /sessions` (slot claimed
   atomically) → redirected to `/payment/<sessionId>`.
5. **Pay** → EasyPaisa instructions; submit txn id + screenshot → `POST /payments`
   (amount derived server-side) → success screen.
6. **Admin approves** (separately) → `PATCH /payments/:id/approve` → session `CONFIRMED`.
7. **Therapist sends Zoom** → `PATCH /sessions/:id/zoom`.
8. **Patient dashboard** `/dashboard/patient` → `GET /sessions/my` shows the confirmed
   session with a working **"Join Session"** button.

Every arrow above is traced in detail in [request-flow.md](./request-flow.md).

---

## 4. Frontend Walkthrough

### 4.1 Entry & shell

| File | What to know |
|---|---|
| [main.jsx](../Frontend/src/main.jsx) | mounts `<App/>` in React StrictMode |
| [App.jsx](../Frontend/src/App.jsx) | `BrowserRouter` + `RoleProvider` + global `Navbar` + the route table; wraps protected routes in `<ProtectedRoute>` |
| [index.css](../Frontend/src/index.css) | Tailwind layers + shared component classes (`btn-primary`, `card`, `input-field`, `badge-*`, `slot-btn*`) — the design system the docs tell you **not** to alter |

### 4.2 Context (the only global state)

| File | What to know |
|---|---|
| [context/RoleContext.jsx](../Frontend/src/context/RoleContext.jsx) | the **entire** client auth: `role`, `currentUser`, `loading`, plus `login`/`register`/`logout`. Restores the session from the stored JWT on mount via `/auth/me`. `useRole()` is the hook every component uses. |

### 4.3 Services (the backend bridge)

| File | What to know |
|---|---|
| [services/api.js](../Frontend/src/services/api.js) | the `fetch` client: a private `request()` (token attach, JSON, error normalise) + the `api.*` method catalogue. **All** backend calls go through here. |
| [services/adapters.js](../Frontend/src/services/adapters.js) | `mapTherapist` / `mapUser` / `uiTrackToApi` — translate backend shapes to the UI's expected shapes. This is *why the UI didn't change* in Phase 4B. |

### 4.4 Components

| File | What to know |
|---|---|
| [components/Navbar.jsx](../Frontend/src/components/Navbar.jsx) | top nav + account dropdown + real logout; **hidden on `/dashboard/*`** (dashboards have their own sidebar) |
| [components/ProtectedRoute.jsx](../Frontend/src/components/ProtectedRoute.jsx) | role-gates a route; shows "Loading…" during session restore so a refresh doesn't bounce a valid user |
| [components/TherapistCard.jsx](../Frontend/src/components/TherapistCard.jsx) | one therapist tile; consumes adapted fields (`fee`, `reviews`) |
| [components/SidebarLink.jsx](../Frontend/src/components/SidebarLink.jsx) | one dashboard sidebar button |
| [components/Footer.jsx](../Frontend/src/components/Footer.jsx) | marketing footer |
| [config/sidebarConfig.jsx](../Frontend/src/config/sidebarConfig.jsx) | `ADMIN_NAV`/`THERAPIST_NAV`/`PATIENT_NAV` + `getNavByRole` + `shouldShowBookSessionButton` |

### 4.5 Pages

| Page | Route | Data source |
|---|---|---|
| [Home.jsx](../Frontend/src/pages/Home.jsx) | `/` | `GET /therapists` (featured + filters) |
| [Therapists.jsx](../Frontend/src/pages/Therapists.jsx) | `/therapists` | `GET /therapists` + client-side filters |
| [TherapistProfile.jsx](../Frontend/src/pages/TherapistProfile.jsx) | `/therapist/:id` | `GET /therapists/:id` |
| [CareerTherapy.jsx](../Frontend/src/pages/CareerTherapy.jsx) | `/career-therapy` | marketing (static) |
| [Login.jsx](../Frontend/src/pages/Login.jsx) | `/login` | `RoleContext.login` |
| [Register.jsx](../Frontend/src/pages/Register.jsx) | `/register` | `RoleContext.register` |
| [BookSession.jsx](../Frontend/src/pages/BookSession.jsx) | `/book/:id` | slots + `POST /sessions` |
| [Payment.jsx](../Frontend/src/pages/Payment.jsx) | `/payment/:id` (**session** id) | `GET /sessions/:id` + `POST /payments` |
| [PatientDashboard.jsx](../Frontend/src/pages/PatientDashboard.jsx) | `/dashboard/patient` | `GET /sessions/my` |
| [TherapistDashboard.jsx](../Frontend/src/pages/TherapistDashboard.jsx) | `/dashboard/therapist` | `GET /sessions/therapist/my` + zoom |
| [AdminConsole.jsx](../Frontend/src/pages/AdminConsole.jsx) | `/dashboard/admin` | stats/payments/users + approve/reject |

### 4.6 The hooks you'll see everywhere

| Hook | Used for | Example |
|---|---|---|
| `useState` | local state (lists, tabs, forms, busy flags) | `const [sessions, setSessions] = useState([])` |
| `useEffect(fn, [])` | fetch-on-mount side effects | load sessions when a dashboard opens |
| `useContext` (via `useRole`) | read global auth | `const { currentUser, logout } = useRole()` |
| `useParams` | read route params | `const { id } = useParams()` |
| `useNavigate` | programmatic navigation | `navigate('/payment/' + id)` |
| `useRef` | DOM handle (file input) | the upload box in Payment |

---

## 5. Backend Walkthrough

### 5.1 Every route (the public surface)

| Method | Path | Middleware | Controller → Service |
|---|---|---|---|
| `GET` | `/api/health` | — | inline (liveness) |
| `POST` | `/api/auth/register` | — | register → registerUser |
| `POST` | `/api/auth/login` | — | login → loginUser |
| `POST` | `/api/auth/logout` | auth | logout (client deletes token) |
| `GET` | `/api/auth/me` | auth | getMe → getUserById |
| `PATCH` | `/api/auth/me` | auth | updateMe → updateUserProfile |
| `GET` | `/api/therapists` | — | getTherapists |
| `GET` | `/api/therapists/:id` | — | getTherapistById |
| `GET` | `/api/therapists/:id/slots` | — | getTherapistSlots |
| `POST` | `/api/sessions` | auth, PATIENT | createSession (atomic) |
| `GET` | `/api/sessions/my` | auth, PATIENT | getSessionsByPatient |
| `GET` | `/api/sessions/therapist/my` | auth, THERAPIST | getSessionsByTherapist |
| `GET` | `/api/sessions/:id` | auth | getSessionById (ownership) |
| `PATCH` | `/api/sessions/:id/status` | auth, THERAPIST/ADMIN | updateStatus |
| `PATCH` | `/api/sessions/:id/zoom` | auth, THERAPIST/ADMIN | setZoomLink |
| `POST` | `/api/payments` | auth, PATIENT | submitPayment (derive amount) |
| `GET` | `/api/payments/:id` | auth | getPaymentById (ownership) |
| `PATCH` | `/api/payments/:id/approve` | auth, ADMIN | approvePayment (txn) |
| `PATCH` | `/api/payments/:id/reject` | auth, ADMIN | rejectPayment |
| `GET` | `/api/admin/stats` | auth, ADMIN | getDashboardStats |
| `GET` | `/api/admin/users` | auth, ADMIN | listUsers |
| `GET` | `/api/admin/sessions` | auth, ADMIN | listSessions |
| `GET` | `/api/admin/payments` | auth, ADMIN | listPayments |

### 5.2 Every controller (the HTTP layer)

| Controller | Responsibility |
|---|---|
| [auth.controller.js](../Backend/src/controllers/auth.controller.js) | register/login/logout/getMe/updateMe; Zod validate → 400; shape `{user,token}` |
| [therapist.controller.js](../Backend/src/controllers/therapist.controller.js) | 3 thin handlers; pass `req.query`/`req.params` to the service |
| [session.controller.js](../Backend/src/controllers/session.controller.js) | create/get/status/list(patient,therapist)/zoom; **inject `patientId` from JWT** |
| [payment.controller.js](../Backend/src/controllers/payment.controller.js) | submit/get/approve/reject; **inject `patientId`/`reviewedBy` from JWT** |
| [admin.controller.js](../Backend/src/controllers/admin.controller.js) | stats/users/sessions/payments; validates the `status` filter |

**Universal controller pattern:** `safeParse` the body → on failure `400`; call the
service inside `try`; on success return a `2xx` envelope; on error `next(err)`.

### 5.3 Every middleware

| Middleware | Responsibility |
|---|---|
| `cors()` | allow cross-origin requests (currently wide open) |
| `express.json()` | parse JSON bodies into `req.body` |
| [auth.js](../Backend/src/middleware/auth.js) | verify `Bearer` JWT → set `req.user = {id,email,role}`, else `401` |
| [requireRole.js](../Backend/src/middleware/requireRole.js) | `403` unless `req.user.role` is allowed |
| [errorHandler.js](../Backend/src/middleware/errorHandler.js) | final handler: `{ error }` (+ `stack` only in dev) |

### 5.4 Every service (the brains)

| Service | Key functions |
|---|---|
| [auth.service.js](../Backend/src/services/auth.service.js) | `registerUser`, `loginUser`, `getUserById`, `updateUserProfile`; bcrypt, `signToken`, `sanitizeUser` |
| [therapist.service.js](../Backend/src/services/therapist.service.js) | `getTherapists` (dynamic filter), `getTherapistById`, `getTherapistSlots` (future-only), `formatTherapist` |
| [session.service.js](../Backend/src/services/session.service.js) | `createSession` (atomic + txn), `getSessionById`, `updateStatus`, `getSessionsByPatient`, `getSessionsByTherapist`, `setZoomLink`; `formatSession`, `assertCanAccessSession` |
| [payment.service.js](../Backend/src/services/payment.service.js) | `submitPayment` (derive amount, reopen rejected), `getPaymentById`, `approvePayment` (txn), `rejectPayment`; `formatPayment`, `assertCanAccessPayment` |
| [admin.service.js](../Backend/src/services/admin.service.js) | `getDashboardStats` (parallel counts + aggregate), `listUsers`, `listSessions`, `listPayments` |

### 5.5 Every "model" (Prisma models = PostgreSQL tables)

Declared in [schema.prisma](../Backend/prisma/schema.prisma); see the full
[Database Walkthrough](#6-database-walkthrough). Models: `User`, `Therapist`,
`TherapistSpecialization`, `TherapistLanguage`, `AvailabilitySlot`, `Session`,
`Payment`. Enums: `Role`, `Track`, `SessionStatus`, `PaymentStatus`.

---

## 6. Database Walkthrough

> A generic course says "collections" (MongoDB). MindBridge uses **PostgreSQL tables**
> defined as **Prisma models**.

### 6.1 Every table & every field

**`User`** (`users`) — every account, all roles.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | string | |
| `email` | string | **unique** |
| `passwordHash` | string | bcrypt; never returned to clients |
| `role` | `Role` | default `PATIENT` |
| `initials` | string | derived from name |
| `avatarUrl`,`phone` | string? | optional |
| `language` | string | default `"English"` |
| `isVerified` | bool | default `false` |
| `createdAt` | datetime | default now |

**`Therapist`** (`therapists`) — 1:1 profile for a therapist user.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `userId` | uuid | **unique** FK → User (makes it 1:1) |
| `title`,`credentials`,`about`,`methodology` | string | profile copy |
| `feePkr` | int | **source of truth for price** |
| `rating` | decimal | default 0 (cast to Number for clients) |
| `reviewCount`,`sessionsCount` | int | |
| `color` | string | UI avatar colour |
| `track` | `Track` | default `MENTAL_HEALTH` |
| `isActive` | bool | default true |

**`TherapistSpecialization`** / **`TherapistLanguage`** — simple 1:N child rows (`name`
/ `language`).

**`AvailabilitySlot`** (`availability_slots`) — bookable times.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `therapistId` | uuid FK | |
| `slotDatetime` | datetime | the offered time |
| `isBooked` | bool | flipped atomically on booking |

**`Session`** (`sessions`) — a booking.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `patientId` | uuid FK → User | |
| `therapistId` | uuid FK → Therapist | |
| `slotId` | uuid | **unique** FK → Slot (1:1) |
| `status` | `SessionStatus` | default `PENDING_PAYMENT` |
| `sessionNumber` | int | patient's Nth with this therapist |
| `sessionType` | string | e.g. `video` |
| `zoomLink`,`notes`,`moodPost` | string? | optional |
| `durationMins` | int | default 60 |
| `createdAt` | datetime | |

**`Payment`** (`payments`) — a manual EasyPaisa record.

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `sessionId` | uuid | **unique** FK → Session (1:1) |
| `patientId` | uuid FK → User | |
| `amountPkr` | int | = therapist `feePkr` (server-derived) |
| `serviceFee` | int | default 250 |
| `totalPkr` | int | amount + serviceFee |
| `txnId`,`screenshotUrl` | string | submitted proof |
| `status` | `PaymentStatus` | default `PENDING` |
| `reviewedBy` | string? | admin id who actioned |
| `approvedAt` | datetime? | set on approval |

### 6.2 Every relationship

```mermaid
erDiagram
    User ||--o| Therapist : "1:0..1 (userId unique)"
    User ||--o{ Session : "patient 1:N"
    User ||--o{ Payment : "patient 1:N"
    Therapist ||--o{ TherapistSpecialization : "1:N"
    Therapist ||--o{ TherapistLanguage : "1:N"
    Therapist ||--o{ AvailabilitySlot : "1:N"
    Therapist ||--o{ Session : "therapist 1:N"
    AvailabilitySlot ||--o| Session : "1:1 (slotId unique)"
    Session ||--o| Payment : "1:1 (sessionId unique)"
```

The three **unique foreign keys** (`Therapist.userId`, `Session.slotId`,
`Payment.sessionId`) are what turn would-be 1:N links into strict **1:1** — a user has at
most one therapist profile, a slot powers at most one session, a session has at most one
payment.

---

## 7. Authentication Walkthrough (end-to-end)

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React (RoleContext)
    participant BE as Express
    participant DB as PostgreSQL
    U->>FE: register or login
    FE->>BE: POST /auth/(register|login)
    BE->>DB: create user / find user
    BE->>BE: bcrypt hash or compare
    BE->>BE: jwt.sign({id,email,role}, 7d)
    BE-->>FE: { user, token }
    FE->>FE: localStorage[token]; setCurrentUser/role
    Note over FE,BE: every later request: Authorization: Bearer <token>
    U->>FE: refresh page
    FE->>BE: GET /auth/me (Bearer)
    BE->>BE: auth middleware verifies JWT
    BE-->>FE: { user } → session restored
```

**The pieces, in one place:** issue token (`signToken`), store/attach (`api.js` +
`localStorage`), verify (`middleware/auth.js`), restore (`RoleContext` + `loading`
guard), gate (`requireRole` + service ownership checks). Roles are UPPERCASE in the
backend, lowercased for the UI by `toUiRole`. Full detail:
[concepts §6–10](./concepts-explained.md#6-authentication) and
[architecture §6–7](./detailed-architecture.md#6-authentication-architecture).

---

## 8. Scheduling Walkthrough (end-to-end)

```mermaid
flowchart LR
    SEED["seed.js: 6 hours × 7 days × N therapists"] --> SLOTS[(availability_slots)]
    SLOTS --> SVC["getTherapistSlots: isBooked=false AND slotDatetime ≥ now"]
    SVC --> UI["BookSession: group by date → calendar"]
    UI --> CLAIM["createSession: atomic flip isBooked=true"]
    CLAIM --> SLOTS
```

**Key rules:** only **future, unbooked** slots are ever served (the Phase 4B slot fix);
the calendar lights up only days/times that have availability; claiming a slot is atomic
so two patients can't take the same time. Detail:
[architecture §8](./detailed-architecture.md#8-scheduling-architecture),
[concepts §23](./concepts-explained.md#23-scheduling--slot-logic).

---

## 9. Booking Walkthrough (end-to-end)

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: book (slot claimed atomically)
    PENDING_PAYMENT --> CONFIRMED: admin approves payment (txn)
    PENDING_PAYMENT --> PENDING_PAYMENT: payment rejected → resubmit
    CONFIRMED --> IN_PROGRESS
    IN_PROGRESS --> COMPLETED
    CONFIRMED --> CANCELLED
    COMPLETED --> [*]
    CANCELLED --> [*]
```

**Invariants the server guarantees:**
- **No double-booking** — conditional `updateMany` on the slot.
- **No price tampering** — `totalPkr = feePkr + 250` computed server-side.
- **No impersonation** — `patientId` from the JWT.
- **No state drift** — approve confirms payment *and* session in one transaction.
- **Recoverable** — a rejected payment reopens for resubmission.
- **No editing terminal sessions** — `COMPLETED`/`CANCELLED` are frozen.

Detail: [concepts §24](./concepts-explained.md#24-therapist-booking-logic),
[request-flow §H–K](./request-flow.md#h-session-booking).

---

## 10. Learning Notes (study + interview prep)

For each major file: **what to study**, a likely **interview question**, and the **key
takeaway**.

### Backend

**[index.js](../Backend/src/index.js)**
- *Study:* middleware **order** (cors → json → routes → 404 → errorHandler).
- *Interview:* "Why must the error handler be registered last?" — Express runs
  middleware in registration order; only a 4-arg handler registered after the routes
  catches their `next(err)`.
- *Takeaway:* the pipeline's order is behaviour, not decoration.

**[config/db.js](../Backend/src/config/db.js)**
- *Study:* the **singleton** PrismaClient.
- *Interview:* "Why one shared client?" — one connection pool; creating a client per
  request exhausts DB connections.
- *Takeaway:* share expensive resources.

**[middleware/auth.js](../Backend/src/middleware/auth.js) & [requireRole.js](../Backend/src/middleware/requireRole.js)**
- *Study:* authn (who) vs authz (what); `req.user` handoff.
- *Interview:* "Difference between 401 and 403?" — 401 = not authenticated; 403 =
  authenticated but not allowed.
- *Takeaway:* identity and permission are separate checks.

**[services/auth.service.js](../Backend/src/services/auth.service.js)**
- *Study:* bcrypt hash/compare; `sanitizeUser`; generic login error.
- *Interview:* "Why the same error for unknown email and wrong password?" — prevents
  user enumeration.
- *Takeaway:* error messages are a security surface.

**[services/session.service.js](../Backend/src/services/session.service.js)**
- *Study:* `$transaction` + conditional `updateMany`; ownership via `therapist:{userId}`.
- *Interview:* "How do you prevent double-booking?" — atomic conditional update inside a
  transaction; the loser sees `count===0`.
- *Takeaway:* concurrency correctness needs the database, not just app logic.

**[services/payment.service.js](../Backend/src/services/payment.service.js)**
- *Study:* server-derived amount; approve-in-transaction; reopen-on-rejected.
- *Interview:* "Why compute the amount server-side?" — never trust the client with price.
- *Takeaway:* money rules live on the server.

**[services/admin.service.js](../Backend/src/services/admin.service.js)**
- *Study:* `Promise.all` for independent counts; `aggregate`/`groupBy`.
- *Interview:* "Sequential vs parallel queries — which and why?" — parallel for
  independent work; latency ≈ slowest one, not the sum.
- *Takeaway:* parallelise independent I/O.

**Controllers (all)**
- *Study:* the validate → service → envelope → `next(err)` pattern; injecting identity
  from `req.user`.
- *Interview:* "Why is `patientId` not read from the body?" — the body is attacker-
  controlled; the token isn't.
- *Takeaway:* trust the token, not the payload.

### Frontend

**[context/RoleContext.jsx](../Frontend/src/context/RoleContext.jsx)**
- *Study:* Context provider; session restore; the `loading` flag.
- *Interview:* "Why a `loading` state during auth restore?" — to avoid redirecting a
  valid user to login on refresh before `/auth/me` resolves.
- *Takeaway:* async auth needs an explicit "not yet known" state.

**[services/api.js](../Frontend/src/services/api.js)**
- *Study:* the `request()` wrapper; token attach; error normalisation (`status:0` for
  network).
- *Interview:* "Why centralise fetch?" — DRY, consistent errors, single place for the
  token.
- *Takeaway:* one boundary module per external system.

**[services/adapters.js](../Frontend/src/services/adapters.js)**
- *Study:* the adapter pattern; shape + enum-casing translation.
- *Interview:* "How did you integrate a real API without changing the UI?" — an adapter
  mapped backend shapes to the UI's expected shapes.
- *Takeaway:* adapters absorb impedance mismatch.

**[components/ProtectedRoute.jsx](../Frontend/src/components/ProtectedRoute.jsx)**
- *Study:* client gate vs server gate.
- *Interview:* "Is `<ProtectedRoute>` security?" — no; it's UX. The server enforces
  access.
- *Takeaway:* never trust the client for authorization.

**Pages with `useEffect` fetches** (Therapists, dashboards, BookSession, Payment)
- *Study:* fetch-on-mount; the `active` cleanup flag; loading/empty/error states; derived
  view-models; optimistic updates.
- *Interview:* "Why the `active` flag in `useEffect`?" — to ignore a response that
  arrives after the component unmounts.
- *Takeaway:* async UI must handle every phase and the unmount race.

### Cross-cutting interview questions

| Question | Short answer |
|---|---|
| REST resource design? | nouns as URLs, verbs as methods, status codes for outcome |
| JWT vs sessions? | JWT is stateless (no server store); trade-off is revocation |
| How is money kept correct? | integer PKR; amount derived server-side; transactions |
| How do two users not double-book? | atomic conditional `updateMany` in a transaction |
| Where is authorization enforced? | server: `requireRole` + per-row ownership checks |
| What did the adapter buy you? | real API integration with zero UI changes |
| Known security gaps? | open CORS, 7-day JWT no refresh, client-only logout, filter params unvalidated, screenshots are filenames |

---

## 11. Glossary

| Term | Meaning |
|---|---|
| **ORM** | Object-Relational Mapper; here **Prisma** — query the DB with JS, not raw SQL |
| **Prisma** | the ORM/query builder + schema + migrations |
| **PostgreSQL** | the relational SQL database |
| **JWT** | signed token carrying `{id,email,role}`; proves identity statelessly |
| **bcrypt** | one-way password hashing algorithm |
| **Middleware** | `(req,res,next)` function in the request pipeline |
| **RBAC** | Role-Based Access Control (`requireRole`) |
| **Adapter** | layer that converts backend shapes to UI shapes (`adapters.js`) |
| **Atomic claim** | conditional `updateMany(where isBooked:false)` to grab a slot race-free |
| **Transaction** | `$transaction` — all-or-nothing group of DB writes |
| **Idempotent** | safe to run again (seed upserts; payment resubmission) |
| **Track** | counselling category: `MENTAL_HEALTH` or `CAREER` |
| **EasyPaisa** | Pakistani mobile-money method; here a manual upload-screenshot flow |
| **Context** | React's app-wide state mechanism (`RoleContext`) |
| **Adapter / mapper** | `mapTherapist`, `mapUser`, `uiTrackToApi` |
| **Singleton** | one shared instance (the Prisma client) |

---

### The five companion documents
- [concepts-explained.md](./concepts-explained.md) — every concept, beginner→advanced.
- [detailed-architecture.md](./detailed-architecture.md) — system/structure/diagrams.
- [request-flow.md](./request-flow.md) — every feature traced end-to-end.
- [phase4A-documentation.md](./phase4A-documentation.md) — backend booking/payments/admin.
- [phase4B-documentation.md](./phase4B-documentation.md) — frontend wired to the API.

> **Final orientation for a new engineer:** start the backend, seed it, start the
> frontend, log in as `patient@mindbridge.pk`, and walk the booking flow with the
> Network tab open. Match each request you see to its row in
> [§5.1](#51-every-route-the-public-surface) and its trace in
> [request-flow.md](./request-flow.md). Within an hour you'll have the whole system in
> your head.
