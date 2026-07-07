# 00 — Onboarding: Start Here

> **Last updated:** 2026-07-08 · **Applies to repo state:** branch `master`
> **Read this first.** It is the map and the mindset. Then follow the reading order below.

---

## How to use this documentation set

This `docs/` set is the **AI/engineer handover** for MindBridge. It is designed so a new
contributor (human or a fresh AI agent) can gain full context as if they'd been here since day one.

**Three rules for reading it:**

1. **Code is truth.** These docs explain *what exists and why*. If a doc ever conflicts with the
   actual code, **trust the code** and fix the doc (note it in the PR). Every doc is dated; treat
   anything undated or old with suspicion and verify against the source.
2. **Each fact has one home.** Topics don't repeat across files — they cross-link. Follow the links.
3. **Separate "how it works" from "what's true right now."** Structure/【architecture】 changes
   slowly (docs 01–06); the *current state* (what's done/pending/uncommitted) lives in
   [`09-STATE.md`](09-STATE.md) and changes fast. When in doubt about status, trust `09-STATE` + `git log`.

## Reading order

1. **`00-ONBOARDING.md`** ← you are here (map + how the owner works)
2. [`01-ARCHITECTURE.md`](01-ARCHITECTURE.md) — the system shape, request lifecycle, data flow
3. [`02-DATA-MODEL.md`](02-DATA-MODEL.md) — Prisma schema, every model/relation/enum + why
4. [`05-AUTH.md`](05-AUTH.md) — JWT, middleware, RBAC, Google OAuth (highest-gotcha area)
5. [`03-BACKEND.md`](03-BACKEND.md) & [`04-FRONTEND.md`](04-FRONTEND.md) — layer-by-layer detail
6. [`06-FEATURES.md`](06-FEATURES.md) — each user-facing feature end-to-end
7. [`07-DECISIONS.md`](07-DECISIONS.md) — **the "why"**: every design decision + rejected alternatives
8. [`08-GOTCHAS.md`](08-GOTCHAS.md) — footguns already solved + environment quirks + how to verify
9. [`09-STATE.md`](09-STATE.md) — current reality: done / cosmetic / pending / uncommitted

The always-loaded `../CLAUDE.md` is the **lean index** — essentials + pointers into this set. Keep it short.

---

## What MindBridge is (the 60-second model)

An online therapy / mental-health platform for a **Pakistani audience** (PKR pricing, manual
EasyPaisa payments, English/Urdu copy). Repo folder is `Sukoon`; the product is **MindBridge**
everywhere in code — same thing.

**Three roles, three journeys:**
- **Patient** → browses approved therapists → books a free slot → pays by uploading an EasyPaisa
  screenshot + txn id → admin verifies payment → session confirmed → therapist attaches a Zoom link.
- **Therapist** → self-registers → completes profile in Settings → submits for review → **admin
  approves** → listed & bookable → manages appointments (mark complete, Zoom link).
- **Admin** → verifies payments, reviews therapist applications (approve/reject), manages the
  therapist roster (suspend/reactivate) and patients (search + view).

**Two counseling tracks:** `MENTAL_HEALTH` and `CAREER`.

**Shape:** a two-part monorepo.
- `Backend/` — Express + Prisma + PostgreSQL REST API. Layered MVC: **Route → Controller → Service → Prisma**.
- `Frontend/` — React + Vite + Tailwind SPA, fully wired to the backend over HTTP with JWT auth
  (not a mock prototype).

It is **feature-complete for its core loops.** Auth (incl. Google), therapist onboarding + admin
approval, booking, payments, and a real admin console are all built and verified. See `09-STATE.md`
for the precise line between real, cosmetic, and pending.

---

## How the project owner works (read this — it's not in the code)

This is the single most important section for collaborating smoothly. The owner is the **fullstack
owner** of MindBridge, building it as a serious portfolio/production project, learning as they go.

- **Be a decisive senior engineer, not a menu.** Give a professional recommendation and a reason —
  don't lay out three options and ask "which?" When there's a genuine fork that changes the product,
  present it crisply with your pick first.
- **Explain shell commands in plain English *before* running them**, and explain the results after.
  The owner is careful about what runs on their machine and likes to understand each command
  (what each flag/pipe does). Don't fire off opaque one-liners.
- **Work section by section.** Say what will change and why, get a nod, build it, then report **what
  is now real vs. still cosmetic.** For multi-part features, build in chunks and checkpoint.
- **Never fake unbacked features.** If something has no backend model (e.g. therapist availability
  hours, patient mood/streak), leave it visibly inert ("Coming soon") — do **not** wire dummy data
  to make it look done. Honesty about limitations is explicitly valued.
- **Preserve the UI.** When swapping mock → real data, keep the JSX/styling identical; only change
  data sources + add loading/error/empty states + necessary correctness fixes. Flag even small
  visible changes (a renamed column, an added inline error).
- **Plain-language explanations are welcome** — the owner learns from them (e.g. "what's a JWT?" got
  answered with the "signed ID card" analogy). Teach while building.
- **Git:** small, logical, conventional-commit messages. **Never** add a `Co-Authored-By: Claude`
  trailer. Commit only when asked; **ask before pushing** — the owner often runs `git push`
  themselves and sometimes wants to be walked through the commands.
- **The owner runs the dev servers themselves** in their own terminals — don't spawn them (it caused
  `EADDRINUSE` before). Ask them to start/stop/restart and wait.

---

## How to verify your work (before claiming "done")

- **Frontend compiles:** `cd Frontend && npm run build` (ESLint isn't configured — the build is the
  real compile check).
- **Backend syntax:** `node --check <file>` per changed file (run from `Backend/`).
- **End-to-end:** write a throwaway script (Node `fetch` or curl) that logs in with a seeded account,
  hits the real endpoints, asserts the behavior, and **cleans up any test rows it created.** This
  pattern is used throughout — see `08-GOTCHAS.md` for examples. Put scratch scripts in the scratchpad,
  not the repo.
- **Seeded accounts** (all password `password123`): admin `admin@mindbridge.pk`,
  patient `patient@mindbridge.pk`, therapists `ayesha@mindbridge.pk` / `bilal@mindbridge.pk` /
  `sara.malik@mindbridge.pk` / `zara@mindbridge.pk`. `npm run seed` (in `Backend/`) reseeds.

---

## Glossary / naming quirks (small things that confuse newcomers)

- **Sukoon = MindBridge.** Folder name vs product name. Same project.
- **`credentials` (DB) = "Education" (UI).** The therapist's `credentials` field is labelled
  *Education* in forms/profiles.
- **"Suspended" therapist** = `status: APPROVED` **and** `isActive: false`. There is no `SUSPENDED`
  enum value; suspension is the combination (see `07-DECISIONS.md` ADR-011).
- **`isActive`** = the single "publicly listed & bookable" flag. **`status`** = the review lifecycle
  (`DRAFT → PENDING → APPROVED → REJECTED`). They are different axes; both matter.
- **UI role vs JWT role.** The frontend's `role` (lowercase, in `RoleContext`) is *display state*;
  the server only ever trusts the **role inside the JWT**. These can disagree — a top source of
  "why is this 403?" confusion (see `05-AUTH.md`).
- **Track values:** backend `MENTAL_HEALTH` / `CAREER`; UI `mental-health` / `career` (mapped in
  `adapters.js`).

---

## Where history lives

`docs/archive/` holds earlier point-in-time write-ups (Phase 4 guides, request-flow, concepts). They
are **frozen and superseded** by this numbered set — read them only for historical color, never as
current truth.
