# MindBridge

> Pakistan's online therapy & mental-health platform — connecting patients with
> qualified therapists for mental-health and career counseling.

MindBridge lets **patients** browse and book therapists across two tracks
(*mental-health* and *career*), pay via EasyPaisa, and manage their sessions;
**therapists** manage their schedule and patients; and **admins** verify payments
and oversee the platform.

> **Note:** the repository folder is named `Sukoon`, but the product is **MindBridge**.

---

## Monorepo Structure

```
Sukoon/
├── Backend/     # Express + Prisma + PostgreSQL REST API
└── Frontend/    # React + Vite + Tailwind SPA
```

| Part | Stack | Status |
|------|-------|--------|
| **Backend** | Node.js (ESM), Express 4, Prisma 5, PostgreSQL, Zod, JWT, bcrypt | Auth + Therapist API complete; booking/payments/admin in progress (Phase 4) |
| **Frontend** | React 18, React Router 6, Vite 8, Tailwind 3 | UI prototype complete; backend integration in progress (Phase 4) |

---

## Getting Started

### Backend

```bash
cd Backend
npm install
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET
npx prisma migrate dev        # apply database schema
npm run seed                  # seed therapists, slots, and test users
npm run dev                   # start API on http://localhost:5000
```

Required env vars: `DATABASE_URL`, `JWT_SECRET`, `PORT`, `NODE_ENV`.

### Frontend

```bash
cd Frontend
npm install
npm run dev                   # start SPA on http://localhost:5173
```

---

## API Overview

| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| `POST` | `/api/auth/register` | public | ✅ |
| `POST` | `/api/auth/login` | public | ✅ |
| `GET` | `/api/auth/me` | JWT | ✅ |
| `GET` | `/api/therapists` | public | ✅ |
| `GET` | `/api/therapists/:id` | public | ✅ |
| `GET` | `/api/therapists/:id/slots` | public | ✅ |
| `POST` | `/api/sessions` | patient | 🚧 Phase 4 |
| `POST` | `/api/payments` | patient | 🚧 Phase 4 |
| `GET` | `/api/admin/*` | admin | 🚧 Phase 4 |

---

## Build Phases

- **Phase 1** — Project setup, Prisma schema, database ✅
- **Phase 2** — Authentication (JWT, bcrypt, Zod) ✅
- **Phase 3** — Therapist public API (browse + filter) ✅
- **Phase 4** — Booking system: sessions, payments, admin review + frontend integration 🚧
