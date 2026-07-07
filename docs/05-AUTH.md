# 05 — Authentication & Authorization

> **Last updated:** 2026-07-08 · **Code is truth** — verify against the files cited.
> The highest-gotcha area of the codebase. Read this fully before touching anything auth-related.

Files: `Backend/src/middleware/auth.js`, `requireRole.js`; `services/auth.service.js`;
`controllers/auth.controller.js`; `routes/auth.routes.js`; `validators/auth.validator.js`;
`Frontend/src/context/RoleContext.jsx`, `services/api.js`, `components/ProtectedRoute.jsx`,
`main.jsx`, `pages/Login.jsx`, `pages/Register.jsx`.

---

## 1. The model in one paragraph

On login/register/Google, the server returns `{ user, token }`. The **token is a JWT** signed with
`JWT_SECRET`, payload `{ id, email, role }`, expiry **7 days**. The browser stores it in
`localStorage` under **`mindbridge_token`**. Every authed request sends `Authorization: Bearer <token>`.
The `auth` middleware verifies it and sets `req.user = { id, email, role }`. `requireRole(...roles)`
gates by `req.user.role`. On app load, the SPA restores the session by calling `GET /auth/me` with the
stored token. **The server only ever trusts the JWT** — never anything the client claims.

## 2. Backend building blocks

**`middleware/auth.js`** — reads `Authorization: Bearer <token>`; missing/malformed → `401 "No token
provided"`; `jwt.verify` failure → `401 "Invalid or expired token"`; success → `req.user = decoded`
(`{id, email, role}`) and `next()`.

**`middleware/requireRole.js`** — factory: `requireRole('ADMIN')` or `requireRole('THERAPIST','ADMIN')`.
No `req.user` → 401; role not in the allow-list → **`403 "Access denied. Required role: <...>"`**. Must
run **after** `auth`. (That exact 403 string is a debugging landmark — see §6.)

**`services/auth.service.js`** — `registerUser`, `loginUser`, `googleAuth`, `getUserById`,
`updateUserProfile`, plus helpers `generateInitials`, `signToken`, `sanitizeUser` (strips
`passwordHash`). Passwords hashed with `bcryptjs` (10 rounds).

**Endpoints (`/api/auth`)** — `POST /register`, `POST /login`, `POST /google` (all public),
`POST /logout` (auth), `GET /me` (auth), `PATCH /me` (auth). Every write is Zod-validated in the controller.

## 3. Register

`POST /register` (`registerSchema`). For `role === 'THERAPIST'` a `.superRefine` **also requires**
`licenseNumber` + non-empty `specializations[]`. `registerUser` runs a **transaction**: create the
`User`; if THERAPIST, also create a `Therapist` (`status: DRAFT`, `isActive: false`) + specialization
rows. Returns `{ user, token }`. (Therapist onboarding continues in `06-FEATURES.md` §Therapist.)

## 4. Login + the password-less guard

`POST /login` (`loginSchema`): look up by email → generic `401 "Invalid email or password"` if missing
(no user enumeration). **If `user.passwordHash` is null** (a Google-only account), return
`400 "This account uses Google sign-in. Please use 'Continue with Google'."` — otherwise `bcrypt.compare`
would throw on a null hash. Then compare; success → `{ user, token }`.

## 5. Google sign-in (ID-token flow) — `POST /auth/google`

**Why this flow:** see ADR-008. Only the **Client ID** is used — no secret, no redirect URI.

**Frontend:** `main.jsx` wraps the app in `<GoogleOAuthProvider clientId={VITE_GOOGLE_CLIENT_ID}>`.
`Login.jsx` and `Register.jsx` render `<GoogleLogin>` — but **only when `VITE_GOOGLE_CLIENT_ID` is set**
(`GOOGLE_ENABLED`), so the button silently disappears if unconfigured (no broken UI). On success the
component yields `credentialResponse.credential` (Google's signed ID token) → `RoleContext.loginWithGoogle`
→ `api.googleAuth(credential)` → `POST /auth/google`.

**Backend `googleAuth({ credential })`:**
1. If `GOOGLE_CLIENT_ID` unset → `503 "Google sign-in is not configured."`
2. `new OAuth2Client(GOOGLE_CLIENT_ID).verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID })`
   — cryptographically verifies it's really from Google, for our client, unexpired. Failure → `401`.
3. Extract `{ sub: googleId, email, name, picture, email_verified }` and **find-or-create** (ADR-009):
   - existing `googleId` → sign in;
   - existing account with same `email` → **link** `googleId` (backfill `isVerified`/`avatarUrl` if missing);
   - neither → create a new **PATIENT** (no password) with `isVerified = email_verified`.
4. Return the same `{ user, token }` envelope.

**Config:** same Client ID in `Backend/.env` `GOOGLE_CLIENT_ID` **and** `Frontend/.env`
`VITE_GOOGLE_CLIENT_ID`. In Google Cloud Console → OAuth client → **Authorized JavaScript origins**
must include `http://localhost:5173` (and `http://localhost`). Redirect URIs unused. Consent screen in
"Testing" → only added test users can sign in. (Setup pitfalls: `08-GOTCHAS.md`.)

## 6. Frontend auth state — `RoleContext.jsx`

Holds `role` (lowercase UI role: `'patient'|'therapist'|'admin'|'guest'`), `currentUser` (mapped user),
and `loading` (true while restoring the session). Exposes `login`, `register`, `loginWithGoogle`,
`logout`, `setRole`, `setCurrentUser`.

- **Session restore on load:** if a token exists, call `api.getMe()` → set `currentUser` + `role`; on
  failure, clear the token. `loading` stays true until this resolves.
- `login/register/loginWithGoogle` all: get `{user, token}` → `setToken` → set `currentUser` + `role` →
  return the UI role (pages navigate to the right dashboard).
- `toUiRole` lowercases the UPPERCASE backend role.
- **`ProtectedRoute`** waits for `loading` to finish (so a refresh doesn't bounce a logged-in user to
  `/login`), then renders children if `allowedRoles.includes(role)`, else `<Navigate to="/login">`.

`services/api.js` `request()` attaches the Bearer token, and normalizes errors into `Error` objects with
`.status` and `.details` (Zod field errors).

## 7. ⚠️ The #1 auth gotcha: UI role vs JWT role

`ProtectedRoute` gates on the **client-side `role`** (display state). The server gates on the **JWT
role**. These can disagree:

- A demo role-switcher (or a stale/other-role token) can make the UI *show* the admin console while the
  stored token belongs to a therapist. The page renders (client role = admin), but any admin API call
  returns **`403 "Access denied. Required role: ADMIN"`** because the *token's* role isn't ADMIN.
- **Diagnosis:** decode the token in the browser console —
  `JSON.parse(atob(localStorage.getItem('mindbridge_token').split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))`
  — and check `role`.
- **Fix:** actually log in through the Login page as the correct role. The token is what the server trusts.
- **One token per browser:** `localStorage` is shared across tabs; the last login overwrites it
  everywhere. To use two roles at once, use two browsers / an incognito window.

## 8. RBAC quick reference (who can call what)

- Public: therapist list/detail/slots, register, login, google.
- PATIENT: create session, list own sessions, submit payment.
- THERAPIST: `GET/PATCH /therapists/me`, list own sessions, set status/zoom on own sessions.
- ADMIN: all `/admin/*` (stats, users, user detail, therapists roster, suspend/reactivate, applications,
  approve/reject, payments verify).
- Any involved party: `GET /sessions/:id`, `GET /payments/:id` (ownership enforced in the service).
