# 04 — Frontend Reference

> **Last updated:** 2026-07-08 · **Code is truth:** `Frontend/src/`. Overview/hierarchy is in
> `01-ARCHITECTURE.md`; auth-state detail is in `05-AUTH.md`.

React 18 + React Router 6, Vite (dev port 5173), Tailwind 3 + custom `@layer` component classes
(`btn-primary`, `btn-outline`, `card`, `input-field`, `badge`, `badge-green/red/gray/blue`, `sidebar-link*`).
ESLint is **not** configured — `npm run build` is the compile check.

---

## Entry & routing
- **`main.jsx`** — mounts `<App/>` inside `<GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>`.
- **`App.jsx`** — `<BrowserRouter><RoleProvider><Navbar/><Routes>…`. Public routes: `/`, `/register`,
  `/login`, `/therapists`, `/therapist/:id`, `/career-therapy`. Gated via
  `<ProtectedRoute allowedRoles={[...]}>`: `/book/:id` & `/payment/:id` & `/dashboard/patient` (patient),
  `/dashboard/therapist` (therapist), `/dashboard/admin` (admin). `*` → redirect `/`.

## State management
No Redux. Two tiers:
1. **`RoleContext`** (`context/RoleContext.jsx`) — global auth: `role` (lowercase UI role), `currentUser`,
   `loading`, and actions `login`/`register`/`loginWithGoogle`/`logout`/`setRole`/`setCurrentUser`.
   Restores session on load via `GET /auth/me`. See `05-AUTH.md`.
2. **Page-local `useState`** — each page fetches its own data on mount (`useEffect`) through `api.js` and
   holds it locally (e.g. AdminConsole's `stats/users/payments/applications/therapists`).

## Seams (change data here, not in components)
- **`services/api.js`** — the only place that calls `fetch`. `request(path, {method, body, auth})`
  attaches `Authorization: Bearer <token>` (from `localStorage` `mindbridge_token`), sets JSON headers,
  and **normalizes errors** into `Error` objects with `.status` and `.details` (Zod field errors). Exposes
  typed-ish methods grouped by domain (auth, therapists, therapist self-service, sessions, payments,
  admin). Base URL `import.meta.env.VITE_API_URL || 'http://localhost:5000/api'`.
- **`services/adapters.js`** — maps backend ↔ legacy UI shapes: `mapTherapist` (feePkr→fee,
  reviewCount→reviews, `MENTAL_HEALTH`→`mental-health`, adds `feeDisplay`), `mapUser`, `uiTrackToApi`.

## Config
- **`config/sidebarConfig.jsx`** — role-based nav arrays `ADMIN_NAV` / `THERAPIST_NAV` / `PATIENT_NAV`
  (each `{label, icon/svg, section, purpose[, subItems]}`), plus `getNavByRole(role)` and
  `shouldShowBookSessionButton(role)`. Admin sections: `overview` (label **"Overview"**), `people`
  (subitems therapists/patients), `finance`, `security`, `support`. Dashboards render
  sections by an `activeSection` state that maps to these `section` keys.

## Components
`Navbar` (role-aware top nav), `Footer`, `TherapistCard` (browse card), `SidebarLink` (dashboard nav item),
`ProtectedRoute` (waits for `loading`, then gates by `role`, else `<Navigate to="/login">`).

## Pages (what each does)
- **Home / CareerTherapy** — marketing + track entry points.
- **Register** — patient/therapist tab; therapist tab reveals Licence + Specializations; Google button
  (gated by `GOOGLE_ENABLED`). → `register()` / `loginWithGoogle()`.
- **Login** — email/password + Google button. → `login()` / `loginWithGoogle()`.
- **Therapists / TherapistProfile** — real listing + single profile (`api.getTherapists`/`getTherapist`).
- **BookSession** — pick a slot → `api.createSession`. **Payment** — submit EasyPaisa proof → `api.submitPayment`.
- **PatientDashboard** — real sessions/payments; **hides rejected bookings** by filtering
  `payment.status === 'REJECTED'` (ADR-019); dynamic next-session banner (EN+UR); past-sessions table.
- **TherapistDashboard** — sections: overview / appointments / patients / **settings**. Settings loads &
  saves the real profile (`getMyTherapistProfile`/`updateMyTherapistProfile`), shows the 4-state review
  banner, "Submit for Review" button; **Availability Hours is a real weekly editor** (7-day checkboxes +
  time pickers → `getMyAvailability`/`updateMyAvailability`, regenerates the bookable calendar). Sessions:
  Mark Complete (`updateSessionStatus`), Zoom link (`setSessionZoomLink`).
- **AdminConsole** — fully real (ADR-018): Overview (stats + **pending-only** payment queue; "View All
  Transactions →" navigates to Finance), People (Therapists roster with View→detail modal +
  Suspend/Reactivate; Patients with name/email search + View→detail modal), Security (therapist
  applications approve/reject), Finance (pending queue + collapsible processed history). No Operations
  tab (ADR-022). Loads everything in one `Promise.all` on mount.

## Conventions
- Function components + hooks. Keep JSX/styling identical when swapping mock→real data; only change data
  sources + add loading/error/empty states (owner rule — `00-ONBOARDING.md`).
- Optimistic list updates after an action, with a `busy<Thing>Id` state + inline error string (see the
  approve/suspend handlers in AdminConsole for the pattern).
- Env (`Frontend/.env`, gitignored): `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`.
