# 🏗️ PHASE 3: THERAPIST PUBLIC API — Complete Architecture Guide

> This document explains every file change, how requests flow through the system, and what errors can occur.

---

## 📋 TABLE OF CONTENTS
1. [What Changed in Phase 3](#what-changed-in-phase-3)
2. [Project Structure](#project-structure)
3. [Database Schema & Data](#database-schema--data)
4. [Request Flow: Step-by-Step](#request-flow-step-by-step)
5. [Files Updated & Their Roles](#files-updated--their-roles)
6. [How Files Connect](#how-files-connect)
7. [Error Handling](#error-handling)
8. [Real-World Examples](#real-world-examples)

---

## ❓ What Changed in Phase 3

### Phase 2 (Complete - Authentication) ✅
- Built: User registration, login, JWT tokens, authentication middleware
- Result: Users can authenticate and get JWT tokens

### Phase 3 (Complete - Therapist Public API) ✅ **← WE ARE HERE**
**Added 3 new endpoints for browsing therapists (NO authentication required):**
1. `GET /api/therapists` — List all therapists with filters
2. `GET /api/therapists/:id` — Get single therapist details
3. `GET /api/therapists/:id/slots` — Get available booking slots

**Files Created/Updated:**
| File | Action | What It Does |
|------|--------|-------------|
| `prisma/seed.js` | **Created** | Populates DB with 4 therapist profiles |
| `src/services/therapist.service.js` | **Rewritten** | Business logic: fetch therapists, apply filters |
| `src/controllers/therapist.controller.js` | **Rewritten** | Request handlers: receive request, call service, send response |
| `src/routes/therapist.routes.js` | **Rewritten** | Define URL paths and map to handlers |
| `package.json` | **Updated** | Added `"seed"` script |
| `src/index.js` | **No change** | Already had therapist routes mounted ✓ |

---

## 🗂️ Project Structure

```
Backend/
├── prisma/
│   ├── schema.prisma          ← Database schema (models, relationships)
│   ├── migrations/            ← Database version history
│   └── seed.js                ← [NEW] Populate database with therapists
│
├── src/
│   ├── index.js               ← Express app setup, route mounting
│   ├── config/
│   │   └── db.js              ← PrismaClient (database connection)
│   │
│   ├── middleware/
│   │   ├── auth.js            ← Verify JWT token
│   │   ├── requireRole.js     ← Check user role (PATIENT/THERAPIST/ADMIN)
│   │   └── errorHandler.js    ← Catch and format errors
│   │
│   ├── routes/
│   │   ├── auth.routes.js     ← POST /api/auth (login, register)
│   │   ├── therapist.routes.js ← [UPDATED] GET /api/therapists endpoints
│   │   ├── session.routes.js  ← (Phase 4+)
│   │   ├── payment.routes.js  ← (Phase 4+)
│   │   └── admin.routes.js    ← (Phase 4+)
│   │
│   ├── controllers/
│   │   ├── auth.controller.js       ← Login/register handlers
│   │   ├── therapist.controller.js  ← [UPDATED] Therapist endpoint handlers
│   │   ├── session.controller.js    ← (Phase 4+)
│   │   ├── payment.controller.js    ← (Phase 4+)
│   │   └── admin.controller.js      ← (Phase 4+)
│   │
│   ├── services/
│   │   ├── auth.service.js       ← Login/register logic
│   │   ├── therapist.service.js  ← [UPDATED] Therapist filtering, DB queries
│   │   ├── session.service.js    ← (Phase 4+)
│   │   └── payment.service.js    ← (Phase 4+)
│   │
│   └── validators/
│       └── auth.validator.js     ← Validate login/register input
│
└── package.json                  ← [UPDATED] Added "seed" script
```

---

## 🗄️ Database Schema & Data

### Table Relationships (ER Diagram)

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER (users table)                     │
├──────────────────────────────────────────────────────────────────┤
│  id (UUID)                                                       │
│  name (e.g., "Dr. Ayesha Raza")                                 │
│  email (UNIQUE)                                                  │
│  passwordHash (bcrypt)                                           │
│  role (PATIENT | THERAPIST | ADMIN)  ← Determines access level │
│  initials (e.g., "DAR")                                         │
│  createdAt (timestamp)                                           │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │ (1-to-1 relation)
                              │ "therapistProfile"
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    THERAPIST (therapists table)                 │
├──────────────────────────────────────────────────────────────────┤
│  id (UUID)                                                       │
│  userId (FK → User.id)  ← Links to user account                │
│  title (e.g., "Clinical Psychologist")                         │
│  credentials (e.g., "PhD Clinical Psychology, Aga Khan")       │
│  about (long bio paragraph)                                      │
│  methodology (how they work)                                     │
│  feePkr (₨3500 = session cost in Pakistani Rupees)             │
│  rating (4.9 = average rating)                                  │
│  reviewCount (127 = total reviews)                              │
│  track (MENTAL_HEALTH | CAREER)  ← Specialization area         │
│  isActive (true | false)  ← Can client book?                    │
└─────────────────────────────────────────────────────────────────┘
        ▲                               ▲                    ▲
        │ (1-to-many)                  │ (1-to-many)       │ (1-to-many)
        │                              │                   │
    ┌───┴─────────────────────┐  ┌────┴──────────────────┐ │
    │   SPECIALIZATIONS       │  │    LANGUAGES          │ │
    ├──────────────────────────┤  ├───────────────────────┤ │
    │ therapistId (FK)         │  │ therapistId (FK)      │ │
    │ name                     │  │ language              │ │
    │                          │  │                       │ │
    │ E.g., "Anxiety"          │  │ E.g., "Urdu", "Pun" │ │
    │ E.g., "Depression"       │  │ E.g., "English"       │ │
    │ E.g., "CBT"              │  │ (Multiple per therapist)
    └──────────────────────────┘  └───────────────────────┘
                                                            │
                                                    ┌───────┴──────────────┐
                                                    │ AVAILABILITY_SLOTS   │
                                                    ├──────────────────────┤
                                                    │ therapistId (FK)     │
                                                    │ slotDatetime         │
                                                    │ isBooked (T/F)       │
                                                    │ (When can they meet?)
                                                    └──────────────────────┘
```

### Example Data (4 Seeded Therapists)

```javascript
// Database now contains:

1. Dr. Ayesha Raza
   ├─ email: ayesha@mindbridge.pk
   ├─ title: Clinical Psychologist
   ├─ credentials: PhD Clinical Psychology, Aga Khan University
   ├─ feePkr: 3500  (₨3,500 per session)
   ├─ track: MENTAL_HEALTH
   ├─ rating: 4.9 / 5
   ├─ reviewCount: 127
   ├─ specializations: ["Anxiety", "Depression", "CBT", "Trauma"]
   └─ languages: ["English", "Urdu"]

2. Bilal Chaudhry
   ├─ email: bilal@mindbridge.pk
   ├─ title: Career Counselor & Life Coach
   ├─ feePkr: 2500  ← Cheapest
   ├─ track: CAREER  ← Only CAREER therapist
   ├─ rating: 4.7 / 5
   ├─ specializations: ["Career Counseling", "Life Coaching", "Workplace Stress"]
   └─ languages: ["English", "Urdu", "Punjabi"]

3. Dr. Sara Malik
   ├─ email: sara.malik@mindbridge.pk
   ├─ title: Child & Adolescent Psychiatrist
   ├─ feePkr: 4500  ← Most expensive
   ├─ track: MENTAL_HEALTH
   ├─ rating: 4.8 / 5
   ├─ reviewCount: 203  ← Most reviews
   └─ specializations: ["Child Psychology", "Family Therapy", "Adolescent MH"]

4. Zara Ahmed
   ├─ email: zara@mindbridge.pk
   ├─ title: Relationships & Grief Therapist
   ├─ feePkr: 3000
   ├─ track: MENTAL_HEALTH
   ├─ rating: 4.6 / 5 (lowest rated, but still good)
   └─ specializations: ["Relationships", "Grief", "Self-Esteem", "Couples Therapy"]
```

---

## 🔄 Request Flow: Step-by-Step

### Example 1: Simple List Request
**User clicks "Browse All Therapists"**

```
BROWSER/FRONTEND
     │
     │ HTTP GET http://localhost:5000/api/therapists
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/index.js                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ app.use(cors())                ← Allow cross-origin req │ │
│ │ app.use(express.json())        ← Parse JSON body       │ │
│ │ app.use('/api/therapists', therapistRoutes)            │ │
│ │                                                         │ │
│ │ → Request matched! Now delegate to therapistRoutes     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/routes/therapist.routes.js                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ router.get('/', getTherapists)                          │ │
│ │              ↑   ↑                                       │ │
│ │         matches '/' so calls getTherapists handler      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/controllers/therapist.controller.js                     │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ export async function getTherapists(req, res, next) {  │ │
│ │   try {                                                 │ │
│ │     const therapists =                                  │ │
│ │       await therapistService.getTherapists(req.query)  │ │
│ │       ↓                                                 │ │
│ │    (Passes filter params from URL query string)        │ │
│ │       ↓                                                 │ │
│ │     res.json({ therapists })  ← Send response          │ │
│ │   } catch (err) {                                       │ │
│ │     next(err)  ← Pass error to errorHandler            │ │
│ │   }                                                     │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/services/therapist.service.js                           │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ export async function getTherapists(filters) {          │ │
│ │   // Step 1: Build WHERE clause                        │ │
│ │   const where = { isActive: true }                     │ │
│ │                                                         │ │
│ │   // Step 2: Apply filters if provided                 │ │
│ │   if (filters.track) {                                  │ │
│ │     where.track = filters.track.toUpperCase()          │ │
│ │   }                                                     │ │
│ │   if (filters.specialization) {                         │ │
│ │     where.specializations = {                           │ │
│ │       some: { name: { contains: filters.specialization │ │
│ │     }                                                   │ │
│ │   }                                                     │ │
│ │   // ... more filters (language, fee range) ...         │ │
│ │                                                         │ │
│ │   // Step 3: Query database                            │ │
│ │   const therapists = await prisma.therapist.findMany({ │ │
│ │     where,                                              │ │
│ │     include: therapistInclude,  ← Include relations     │ │
│ │     orderBy: { rating: 'desc' }  ← Sort by rating      │ │
│ │   })                                                    │ │
│ │                                                         │ │
│ │   // Step 4: Format and return                         │ │
│ │   return therapists.map(formatTherapist)               │ │
│ │ }                                                       │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ src/config/db.js                                            │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ import { PrismaClient } from '@prisma/client'          │ │
│ │ const prisma = new PrismaClient()  ← Database client   │ │
│ │ export default prisma                                   │ │
│ │                                                         │ │
│ │ Prisma translates findMany() to SQL and talks to DB   │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ PostgreSQL DATABASE (actual data on disk)                   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SELECT t.*, u.name, u.email, u.initials,               │ │
│ │        ts.name, tl.language                             │ │
│ │ FROM therapists t                                        │ │
│ │ JOIN users u ON t.userId = u.id                         │ │
│ │ LEFT JOIN therapist_specializations ts ON ...           │ │
│ │ LEFT JOIN therapist_languages tl ON ...                 │ │
│ │ WHERE t.isActive = true                                 │ │
│ │ ORDER BY t.rating DESC                                  │ │
│ │                                                         │ │
│ │ Returns 4 therapists with related specializations      │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
     │
     ▼ (Results bubble back up)
┌─────────────────────────────────────────────────────────────┐
│ therapistService.getTherapists()                            │
│ Calls formatTherapist() to transform raw data:              │
│                                                             │
│ RAW from Prisma:                                            │
│ {                                                           │
│   rating: Decimal(4.9),  ← Prisma Decimal type           │
│   specializations: [{ name: "Anxiety" }, { name: "..." }]  │
│   languages: [{ language: "English" }, ...]                │
│ }                                                           │
│                                                             │
│ FORMATTED:                                                  │
│ {                                                           │
│   rating: 4.9,  ← Plain number (safe for JSON)           │
│   specializations: ["Anxiety", "Depression", ...]  ← Array │
│   languages: ["English", "Urdu"]                           │
│ }                                                           │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────┐
│ therapistController.getTherapists()                         │
│                                                             │
│ res.json({ therapists })  ← Send formatted data to client  │
└─────────────────────────────────────────────────────────────┘
     │
     ▼
  BROWSER RECEIVES:
  
  {
    "therapists": [
      {
        "id": "8771e330-d400-4e6b-a607-39ccadca22b5",
        "name": "Dr. Ayesha Raza",
        "title": "Clinical Psychologist",
        "feePkr": 3500,
        "rating": 4.9,
        "specializations": ["Anxiety", "Depression", "CBT", "Trauma"],
        "languages": ["English", "Urdu"],
        ... (more fields)
      },
      ... (3 more therapists)
    ]
  }
```

---

### Example 2: Filtered Request
**User filters: "Show CAREER therapists under ₨3000"**

```
URL: GET /api/therapists?track=CAREER&maxFee=3000

┌────────────────────────────────────────────────────────┐
│ req.query = {                                          │
│   track: "CAREER",                                     │
│   maxFee: "3000"  ← Still a STRING from URL           │
│ }                                                      │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ therapistService.getTherapists(filters)                │
│                                                        │
│ Step 1: Start with base filter                        │
│ const where = { isActive: true }                      │
│                                                        │
│ Step 2: Add track filter                              │
│ if (filters.track) {                                   │
│   where.track = "CAREER".toUpperCase()  ← "CAREER"   │
│ }                                                      │
│ → where.track = "CAREER"                              │
│                                                        │
│ Step 3: Add fee range filter                          │
│ if (filters.minFee || filters.maxFee) {               │
│   where.feePkr = {}                                   │
│   if (filters.maxFee)                                  │
│     where.feePkr.lte = Number(filters.maxFee)         │
│     ↓                                                  │
│     converts "3000" → 3000 (number)                   │
│ }                                                      │
│ → where.feePkr = { lte: 3000 }                        │
│                                                        │
│ Final WHERE clause:                                    │
│ {                                                      │
│   isActive: true,                                      │
│   track: "CAREER",                                     │
│   feePkr: { lte: 3000 }                               │
│ }                                                      │
│                                                        │
│ SQL Translation:                                       │
│ WHERE isActive = true AND track = 'CAREER'            │
│   AND feePkr <= 3000                                  │
│                                                        │
│ Result: Only Bilal (₨2500, CAREER) matches           │
└────────────────────────────────────────────────────────┘
```

---

### Example 3: Get Single Therapist
**User clicks on Dr. Ayesha's profile**

```
URL: GET /api/therapists/8771e330-d400-4e6b-a607-39ccadca22b5

┌──────────────────────────────────────────────────────────────┐
│ Router matches /:id pattern                                   │
│ Extracts: req.params.id = "8771e330-d400-4e6b-a607-..."     │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ Controller: getTherapistById(req, res, next)                │
│                                                              │
│ await therapistService.getTherapistById(req.params.id)      │
│                        ↓                                     │
│                    UUID string                              │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────────┐
│ Service: getTherapistById(id)                               │
│                                                              │
│ const therapist = await prisma.therapist.findUnique({       │
│   where: { id: "8771e330-d400-4e6b-a607-..." },            │
│   include: therapistInclude  ← Fetch related data          │
│ })                                                          │
│                                                              │
│ if (!therapist) {                                           │
│   const error = new Error('Therapist not found.')           │
│   error.status = 404  ← IMPORTANT: Custom error property   │
│   throw error                                               │
│ }                                                           │
│                                                              │
│ return formatTherapist(therapist)                           │
└──────────────────────────────────────────────────────────────┘
     │
     ▼
  Database lookup returns full therapist object
  formatTherapist() transforms it
  
  RESPONSE (if found):
  {
    "therapist": {
      "id": "8771e330-...",
      "name": "Dr. Ayesha Raza",
      "title": "Clinical Psychologist",
      "credentials": "PhD Clinical Psychology, Aga Khan University",
      "about": "Dr. Ayesha Raza is a licensed clinical psychologist...",
      "methodology": "Cognitive Behavioural Therapy...",
      "feePkr": 3500,
      "rating": 4.9,
      "reviewCount": 127,
      ...
    }
  }
```

---

### Example 4: Error Handling (What if therapist doesn't exist?)

```
URL: GET /api/therapists/00000000-0000-0000-0000-000000000000

┌──────────────────────────────────────────────────────────┐
│ Controller: getTherapistById()                           │
│                                                          │
│ try {                                                     │
│   const therapist = await therapistService.findUnique() │
│   ...                                                     │
│ } catch (err) {                                          │
│   next(err)  ← Pass error to error handler              │
│ }                                                        │
└──────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ Service throws error:                                    │
│                                                          │
│ const error = new Error('Therapist not found.')          │
│ error.status = 404                                       │
│ throw error                                              │
└──────────────────────────────────────────────────────────┘
     │ (caught by catch block)
     ▼
┌──────────────────────────────────────────────────────────┐
│ next(err) passes to Express middleware chain             │
└──────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────────────────────────────────────────────────────┐
│ src/middleware/errorHandler.js                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ export default function errorHandler(err, req, res) │ │
│ │   const status = err.status || 500  ← Uses 404     │ │
│ │   const message = err.message       ← "Therapist..." │ │
│ │                                                      │ │
│ │   res.status(404).json({                            │ │
│ │     error: "Therapist not found.",                  │ │
│ │     stack: [error stack in development]             │ │
│ │   })                                                │ │
│ └──────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
     │
     ▼
  RESPONSE TO BROWSER:
  
  HTTP/1.1 404 Not Found
  
  {
    "error": "Therapist not found.",
    "stack": "Error: Therapist not found.\n    at Module..."
  }
```

---

## 📁 Files Updated & Their Roles

### 1️⃣ **prisma/seed.js** (NEW - 140 lines)

**What it does:** Populates database with 4 test therapists when you run `npm run seed`

**Key concepts:**
```javascript
// For each therapist:
1. Hash password with bcrypt (bcryptjs)
2. Create User record with role='THERAPIST'
3. Create Therapist record linked to User
4. Add specializations (many-to-many)
5. Add languages (many-to-many)

// Uses upsert = "insert if not exists, else update"
// This makes it safe to run multiple times
```

**When called:** `npm run seed` (one-time setup)

**Error possibilities:**
- Database connection fails → "Cannot reach database"
- Invalid email format → Database constraint error
- User already exists → Upsert skips, no error

---

### 2️⃣ **src/services/therapist.service.js** (REWRITTEN - 105 lines)

**What it does:** Business logic layer. Builds queries, applies filters, formats data.

```javascript
export async function getTherapists(filters)
├─ Takes: req.query object { track, specialization, language, minFee, maxFee }
├─ Builds WHERE clause progressively
├─ Queries: prisma.therapist.findMany()
├─ Returns: Array of formatted therapist objects
└─ Can throw: Nothing (all inputs validated as optional)

export async function getTherapistById(id)
├─ Takes: UUID string
├─ Queries: prisma.therapist.findUnique()
├─ Returns: Single formatted therapist object
└─ Can throw: Error with status 404 if not found

export async function getTherapistSlots(therapistId, date)
├─ Takes: therapistId, optional date string
├─ Filters: isBooked = false (only available slots)
├─ If date provided: parse and create time range
├─ Returns: Array of availability slots
└─ Can throw: Nothing (returns empty array if none)

function formatTherapist(t)
├─ Takes: Raw therapist object from Prisma
├─ Transforms: 
│  ├─ rating: Decimal(4.9) → 4.9 (plain number)
│  ├─ specializations: [{name}] → ["Anxiety", "Depression"]
│  ├─ languages: [{language}] → ["English", "Urdu"]
│  └─ user data: Flattens nested user fields
└─ Returns: Clean, JSON-safe object
```

**Key technical details:**

```javascript
// The therapistInclude object tells Prisma what to fetch
const therapistInclude = {
  user: { select: { name, email, initials } },  // Only these 3 fields
  specializations: { select: { name } },        // Not the UUID
  languages: { select: { language } }           // Just the language string
};

// Example: Filtering by specialization
where.specializations = {
  some: {  // ← "some" means "at least one related record matches"
    name: { contains: filters.specialization, mode: 'insensitive' }
  }
}
// SQL: WHERE EXISTS (SELECT * FROM therapist_specializations 
//                    WHERE name ILIKE '%anxiety%')
```

**Error possibilities:**
- Database down → Prisma throws error
- Invalid UUID → Prisma throws error (caught by controller)
- Decimal conversion fails → Runtime error in formatTherapist
- Invalid date string → Runtime error in slot filtering

---

### 3️⃣ **src/controllers/therapist.controller.js** (REWRITTEN - 32 lines)

**What it does:** HTTP request handlers. Receives requests, calls service, sends responses.

```javascript
export async function getTherapists(req, res, next)
├─ Receives: HTTP request
├─ Extracts: req.query (filter params)
├─ Calls: therapistService.getTherapists()
├─ Sends: res.json({ therapists: [...] })
└─ Error: Passes to next(err)

export async function getTherapistById(req, res, next)
├─ Receives: HTTP request
├─ Extracts: req.params.id (from URL path)
├─ Calls: therapistService.getTherapistById()
├─ Sends: res.json({ therapist: {...} })
└─ Error: Passes to next(err)

export async function getTherapistSlots(req, res, next)
├─ Receives: HTTP request
├─ Extracts: req.params.id, req.query.date
├─ Calls: therapistService.getTherapistSlots()
├─ Sends: res.json({ slots: [...] })
└─ Error: Passes to next(err)
```

**Pattern (try/catch/next):**
```javascript
export async function getTherapists(req, res, next) {
  try {
    // Happy path: business logic
    const therapists = await therapistService.getTherapists(req.query);
    res.json({ therapists });
  } catch (err) {
    // Error path: pass to error handler middleware
    next(err);
  }
}
```

**Why this pattern?**
- If service throws, catch block prevents server crash
- `next(err)` passes to errorHandler middleware
- errorHandler formats error as JSON and sends response

**Error possibilities:**
- Service throws any error → Caught and passed to next()
- No error → Response sent successfully

---

### 4️⃣ **src/routes/therapist.routes.js** (REWRITTEN - 11 lines)

**What it does:** Maps HTTP paths to handler functions.

```javascript
import { Router } from 'express'
import * as therapistController from '../controllers/therapist.controller.js'

const router = Router()

router.get('/', therapistController.getTherapists)
router.get('/:id', therapistController.getTherapistById)
router.get('/:id/slots', therapistController.getTherapistSlots)

export default router
```

**How routing works:**

```
Client Request: GET /api/therapists
      ↓
index.js: app.use('/api/therapists', therapistRoutes)
      ↓ (removes '/api/therapists' prefix, passes '/' to therapistRoutes)
therapist.routes.js: router.get('/', ...)
      ↓ (matches '/', calls getTherapists)
controller.getTherapists()


Client Request: GET /api/therapists/xyz-123
      ↓
index.js: app.use('/api/therapists', therapistRoutes)
      ↓ (removes '/api/therapists' prefix, passes '/xyz-123' to therapistRoutes)
therapist.routes.js: router.get('/:id', ...)
      ↓ (matches '/:id' with id='xyz-123', calls getTherapistById)
controller.getTherapistById(req, res, next)
      ↓ (req.params.id = 'xyz-123')


Client Request: GET /api/therapists/xyz-123/slots?date=2026-05-20
      ↓
index.js: app.use('/api/therapists', therapistRoutes)
      ↓ (passes '/xyz-123/slots?date=...' to therapistRoutes)
therapist.routes.js: router.get('/:id/slots', ...)
      ↓ (matches '/:id/slots', calls getTherapistSlots)
controller.getTherapistSlots(req, res, next)
      ↓ (req.params.id = 'xyz-123', req.query.date = '2026-05-20')
```

**Order matters!** Express evaluates routes top-to-bottom:
```javascript
router.get('/:id', ...)       // Matches ANY single segment
router.get('/:id/slots', ...) // More specific, won't be reached if above matches first

// CORRECT ORDER (specific first):
router.get('/:id/slots', ...)       // Specific
router.get('/:id', ...)             // General (catches leftovers)
```

**Error possibilities:**
- Route not found → Express 404 handler triggers
- No matching handler → 404

---

### 5️⃣ **src/index.js** (NO CHANGES - Already correct)

**Current state:**
```javascript
// ✅ Already imports therapistRoutes
import therapistRoutes from './routes/therapist.routes.js'

// ✅ Already mounts at correct path
app.use('/api/therapists', therapistRoutes)
```

**Why no changes needed:**
- index.js was set up during project initialization
- therapist routes were already mounted

---

### 6️⃣ **package.json** (UPDATED - Added 1 line)

**Before:**
```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js"
}
```

**After:**
```json
"scripts": {
  "dev": "nodemon src/index.js",
  "start": "node src/index.js",
  "seed": "node prisma/seed.js"
}
```

**What it does:** Defines `npm run seed` command

---

## 🔗 How Files Connect

### Connection Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        HTTP REQUEST                                 │
│                   GET /api/therapists?track=CAREER                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    src/index.js                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ app.use(cors())                                            │ │
│  │ app.use(express.json())                                    │ │
│  │ app.use('/api/therapists', therapistRoutes)  ← Delegates  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                  (Request reaches therapistRoutes)
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               src/routes/therapist.routes.js                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ import * as therapistController from                      │ │
│  │   '../controllers/therapist.controller.js'                 │ │
│  │                                                            │ │
│  │ router.get('/', therapistController.getTherapists)       │ │
│  │            ↑ Matches! Calls handler function             │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│            src/controllers/therapist.controller.js               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ import * as therapistService from                         │ │
│  │   '../services/therapist.service.js'                       │ │
│  │                                                            │ │
│  │ export async function getTherapists(req, res, next) {     │ │
│  │   try {                                                    │ │
│  │     const therapists = await therapistService.getTherapists( │
│  │       req.query  ← { track: 'CAREER' }                    │ │
│  │     )                                                      │ │
│  │     res.json({ therapists })                              │ │
│  │   } catch (err) {                                          │ │
│  │     next(err)  ← Calls error handler                      │ │
│  │   }                                                        │ │
│  │ }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               src/services/therapist.service.js                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ import prisma from '../config/db.js'                       │ │
│  │                                                            │ │
│  │ export async function getTherapists(filters) {            │ │
│  │   const where = { isActive: true }                        │ │
│  │                                                            │ │
│  │   if (filters.track) {                                     │ │
│  │     where.track = filters.track.toUpperCase()             │ │
│  │   }                                                        │ │
│  │                                                            │ │
│  │   const therapists = await prisma.therapist.findMany({    │ │
│  │     where,                                                │ │
│  │     include: therapistInclude,                             │ │
│  │     orderBy: { rating: 'desc' }                           │ │
│  │   })                                                      │ │
│  │                                                            │ │
│  │   return therapists.map(formatTherapist)                  │ │
│  │ }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   src/config/db.js                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ import { PrismaClient } from '@prisma/client'              │ │
│  │ const prisma = new PrismaClient()                          │ │
│  │ export default prisma  ← Singleton connection              │ │
│  │                                                            │ │
│  │ (Translates Prisma query to SQL and talks to DB)          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│               PostgreSQL Database (disk)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ SELECT t.*, u.name, u.email, u.initials,                  │ │
│  │        ts.name, tl.language                                │ │
│  │ FROM therapists t                                          │ │
│  │ JOIN users u ON t.userId = u.id                           │ │
│  │ LEFT JOIN therapist_specializations ts ON ...             │ │
│  │ LEFT JOIN therapist_languages tl ON ...                   │ │
│  │ WHERE t.isActive = true AND t.track = 'CAREER'            │ │
│  │ ORDER BY t.rating DESC;                                   │ │
│  │                                                            │ │
│  │ Result: 1 row (Bilal Chaudhry)                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
             (Results bubble back UP the chain)
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│     therapistService.getTherapists() continues...                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ therapists.map(formatTherapist)                            │ │
│  │                                                            │ │
│  │ RAW from Prisma: { rating: Decimal(4.7), ... }           │ │
│  │ FORMATTED:       { rating: 4.7, ... }                    │ │
│  │                                                            │ │
│  │ Returns: [{ id, name, title, ..., rating: 4.7 }]         │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│     therapistController.getTherapists() continues...             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ res.json({ therapists })  ← Send to browser                │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    HTTP RESPONSE                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ {                                                          │ │
│  │   "therapists": [                                          │ │
│  │     {                                                      │ │
│  │       "id": "9afcc15a-6f29-4900-9420-6cf461f103d2",       │ │
│  │       "name": "Bilal Chaudhry",                           │ │
│  │       "title": "Career Counselor & Life Coach",           │ │
│  │       "feePkr": 2500,                                      │ │
│  │       "track": "CAREER",                                  │ │
│  │       "rating": 4.7,                                      │ │
│  │       ...                                                  │ │
│  │     }                                                      │ │
│  │   ]                                                        │ │
│  │ }                                                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
                               │
                               ▼
                         BROWSER RECEIVES
```

---

## ⚠️ Error Handling

### Error Types & How They're Handled

#### 1. **Database Connection Error**
```
Scenario: PostgreSQL server is down
┌─────────────────────────────────────────────────┐
│ prisma.therapist.findMany()                     │
│ → Cannot connect to database                    │
│ → Throws: PrismaClientInitializationError       │
└─────────────────────────────────────────────────┘
     │
     ├─ Not caught in service (error propagates)
     ├─ Caught in controller's catch block
     ├─ next(err) passed to errorHandler
     └─ Response: 500 Internal Server Error

Response to Browser:
{
  "error": "Internal server error",
  "stack": "PrismaClientInitializationError: Can't reach database server..."
}
```

#### 2. **Therapist Not Found (404)**
```
Scenario: GET /api/therapists/00000000-0000-0000-0000-000000000000
┌─────────────────────────────────────────────────┐
│ therapistService.getTherapistById(id)            │
│ → prisma.therapist.findUnique() returns null   │
│ → Explicitly throw error with status: 404       │
│ → throw error                                    │
└─────────────────────────────────────────────────┘
     │
     ├─ Caught in controller's catch block
     ├─ next(err) passed to errorHandler
     └─ Response: 404 Not Found

Response to Browser:
{
  "error": "Therapist not found.",
  "stack": "Error: Therapist not found.\n    at..."
}
```

#### 3. **Invalid Query Parameter**
```
Scenario: GET /api/therapists?maxFee=abc
┌─────────────────────────────────────────────────┐
│ filters.maxFee = "abc"                          │
│ Number("abc") = NaN                             │
│ where.feePkr.lte = NaN                          │
│ → Prisma sends invalid SQL                      │
│ → Database returns error                        │
└─────────────────────────────────────────────────┘
     │
     ├─ Thrown by Prisma
     ├─ Not caught (no validation layer!)
     ├─ Caught in controller's catch block
     ├─ next(err)
     └─ Response: 500 Internal Server Error

IMPROVEMENT NEEDED: Add input validation!
```

#### 4. **Missing Required Parameter**
```
Scenario: POST /api/therapists/:id with no ID
┌─────────────────────────────────────────────────┐
│ req.params.id = undefined                       │
│ therapistService.getTherapistById(undefined)    │
│ → prisma.therapist.findUnique({                 │
│     where: { id: undefined }  ← Invalid!        │
│   })                                             │
│ → Prisma throws error                           │
└─────────────────────────────────────────────────┘
```

#### 5. **Route Not Found (404)**
```
Scenario: GET /api/therapists/unknown-endpoint
┌─────────────────────────────────────────────────┐
│ No route matches this path                      │
│ → Falls through to 404 handler in index.js      │
│ res.status(404).json({                          │
│   error: "Route GET /api/therapists/... not..."│
│ })                                              │
└─────────────────────────────────────────────────┘

Response to Browser:
{
  "error": "Route GET /api/therapists/unknown-endpoint not found"
}
```

### Error Handling Flow

```
Service throws error
        │
        ▼
Controller catch block
        │
        ├─ If NO catch: App crashes! ❌
        ├─ If catch + next(err): ✅ Proper handling
        │
        ▼
next(err) calls errorHandler middleware
        │
        ├─ Extract status (err.status || 500)
        ├─ Extract message (err.message)
        │
        ▼
res.status(status).json({
  error: message,
  stack: [in development only]
})
        │
        ▼
Response sent to browser
```

### The errorHandler Middleware

```javascript
export default function errorHandler(err, req, res, next) {
  console.error(err.stack)  ← Log for debugging

  const status  = err.status  || 500  ← Default to 500
  const message = err.message || 'Internal server error'

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    // ↑ Only include stack trace in development, not production
  })
}
```

**Why last in middleware chain?**
```javascript
// In src/index.js
app.use('/api/therapists', therapistRoutes)  // Handle requests
app.use((req, res) => { /* 404 handler */ })  // Handle not found
app.use(errorHandler)  // LAST: Catch any errors from above

// If errorHandler were earlier, it wouldn't catch errors from routes below it
```

---

## 💡 Real-World Examples

### Example 1: Patient browses therapists by budget

```
FRONTEND:
<select>
  <option>₨0 - ₨3000</option>
  <option>₨3000 - ₨4000</option>
  <option>₨4000+</option>
</select>
     │
     ▼
fetch('/api/therapists?minFee=0&maxFee=3000')
     │
     ▼
BACKEND:
req.query = { minFee: '0', maxFee: '3000' }  ← Strings
     │
     ▼
getTherapists(filters):
  where.feePkr = {}
  where.feePkr.gte = Number('0')    → 0
  where.feePkr.lte = Number('3000') → 3000
     │
     ▼
prisma.therapist.findMany({
  where: { isActive: true, feePkr: { gte: 0, lte: 3000 } }
})
     │
     ▼
Results: Bilal (₨2500) + Zara (₨3000)
     │
     ▼
formatTherapist() converts rating Decimal → number
     │
     ▼
RESPONSE:
{
  "therapists": [
    {
      "name": "Bilal Chaudhry",
      "feePkr": 2500,
      "rating": 4.7,
      ...
    },
    {
      "name": "Zara Ahmed",
      "feePkr": 3000,
      "rating": 4.6,
      ...
    }
  ]
}
     │
     ▼
FRONTEND: Display cards for each therapist
```

### Example 2: Search by specialization

```
FRONTEND:
Patient types "Anxiety" in search box
     │
     ▼
fetch('/api/therapists?specialization=anxiety')
     │
     ▼
BACKEND:
req.query = { specialization: 'anxiety' }
     │
     ▼
getTherapists(filters):
  where.specializations = {
    some: {
      name: { contains: 'anxiety', mode: 'insensitive' }
    }
  }
     │
     ▼
SQL:
  SELECT t.* FROM therapists t
  WHERE EXISTS (
    SELECT 1 FROM therapist_specializations ts
    WHERE ts.therapistId = t.id
    AND ts.name ILIKE '%anxiety%'
  )
     │
     ▼
Results: Only Dr. Ayesha Raza (has "Anxiety" specialization)
     │
     ▼
RESPONSE:
{
  "therapists": [
    {
      "name": "Dr. Ayesha Raza",
      "specializations": ["Anxiety", "Depression", "CBT", "Trauma"],
      "rating": 4.9,
      ...
    }
  ]
}
```

### Example 3: View therapist profile

```
FRONTEND:
Click on therapist card
     │
     ▼
fetch('/api/therapists/8771e330-d400-4e6b-a607-39ccadca22b5')
     │
     ▼
BACKEND:
req.params.id = '8771e330-d400-4e6b-a607-39ccadca22b5'
     │
     ▼
getTherapistById(id):
  prisma.therapist.findUnique({
    where: { id: '8771e330-d400-4e6b-a607-39ccadca22b5' }
  })
     │
     ▼
Found! Return formatted object
     │
     ▼
RESPONSE:
{
  "therapist": {
    "id": "8771e330-d400-4e6b-a607-39ccadca22b5",
    "name": "Dr. Ayesha Raza",
    "title": "Clinical Psychologist",
    "about": "Dr. Ayesha Raza is a licensed clinical psychologist...",
    "methodology": "Cognitive Behavioural Therapy (CBT)...",
    "credentials": "PhD Clinical Psychology, Aga Khan University",
    "feePkr": 3500,
    "rating": 4.9,
    "reviewCount": 127,
    "specializations": ["Anxiety", "Depression", "CBT", "Trauma"],
    "languages": ["English", "Urdu"],
    ...
  }
}
     │
     ▼
FRONTEND:
  Display all fields (name, title, credentials, about, methodology)
  Show specializations as tags
  Show languages as list
  Display rating and review count
  Show fee with "Book Session" button
```

### Example 4: Error - therapist not found

```
FRONTEND:
Click on deleted/invalid therapist link
     │
     ▼
fetch('/api/therapists/invalid-id-xyz')
     │
     ▼
BACKEND:
req.params.id = 'invalid-id-xyz'
     │
     ▼
getTherapistById('invalid-id-xyz'):
  const therapist = prisma.therapist.findUnique({
    where: { id: 'invalid-id-xyz' }
  })
  → Returns null (not found)
     │
     ▼
  if (!therapist) {
    const error = new Error('Therapist not found.')
    error.status = 404
    throw error  ← Service throws
  }
     │
     ▼
Controller catch block:
  catch (err) {
    next(err)  ← Pass to errorHandler
  }
     │
     ▼
errorHandler middleware:
  const status = err.status || 500  → 404
  const message = err.message       → "Therapist not found."
  res.status(404).json({ error: message, ... })
     │
     ▼
RESPONSE:
HTTP/1.1 404 Not Found

{
  "error": "Therapist not found.",
  "stack": "Error: Therapist not found.\n    at Module..."
}
     │
     ▼
FRONTEND:
  Detect HTTP 404
  Show: "Therapist not found. Please go back."
```

---

## 📊 Comparison: Phase 2 vs Phase 3

### Phase 2: Authentication

```
Endpoints Added:
  POST /api/auth/register    ← Create new user
  POST /api/auth/login       ← Get JWT token

Requires:
  Email + Password validation
  JWT token generation
  Password hashing (bcryptjs)

Protected:
  No endpoints in Phase 2 are protected yet
  (Phase 4 will use authenticateToken middleware)

Database Changes:
  Only User table (no new relations)
```

### Phase 3: Therapist Public API (Current Phase)

```
Endpoints Added:
  GET /api/therapists           ← List with filters (public)
  GET /api/therapists/:id       ← Single therapist (public)
  GET /api/therapists/:id/slots ← Availability (public)

Requires:
  Complex filtering logic
  Related data fetching
  Data transformation

Protected:
  NO authentication required! These are PUBLIC endpoints
  (Phase 4 will add protected endpoints for booking)

Database Changes:
  New: Therapist table
  New: TherapistSpecialization (many-to-many)
  New: TherapistLanguage (many-to-many)
  New: AvailabilitySlot
  New: Seed data (4 therapists)

Filtering Capabilities:
  By track (MENTAL_HEALTH | CAREER)
  By specialization (text search, case-insensitive)
  By language (text search, case-insensitive)
  By fee range (minFee, maxFee)
  By availability (date range for slots)
```

---

## 🎯 Key Takeaways

1. **Layered Architecture**
   - Routes → Controllers → Services → Database
   - Each layer has one responsibility
   - Makes testing and maintenance easier

2. **Request Flow**
   - Browser sends HTTP request
   - Express matches URL to route
   - Controller receives request, extracts parameters
   - Service contains business logic and queries
   - Prisma translates to SQL and fetches data
   - Data is formatted and returned as JSON

3. **Error Handling**
   - Service throws errors with `.status` property
   - Controller's catch block prevents app crash
   - `next(err)` passes to errorHandler middleware
   - errorHandler formats error as JSON response

4. **No Authentication Needed**
   - Phase 3 endpoints are PUBLIC
   - Anyone can browse therapists (good for UX)
   - Phase 4 will add authentication for sensitive operations

5. **Database Design**
   - Proper relational structure (1-to-many, many-to-many)
   - Seed data makes testing reproducible
   - Queries are optimized with `include` and `select`

---

## 🚀 Next Phase (Phase 4): Booking System

Phase 4 will add:
- Protected endpoints (require JWT token)
- Session booking (user reserves therapist slot)
- Payment processing
- Admin review of payments

These will use the same layered architecture!
