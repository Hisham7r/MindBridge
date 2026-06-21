# 🚀 PHASE 3: Quick Reference Guide

> TL;DR version of Phase 3 implementation

---

## 📦 What Was Added

```
NEW FILES CREATED:
✅ prisma/seed.js                    (140 lines) - Populate 4 therapists
✅ src/services/therapist.service.js (105 lines) - Business logic
✅ src/controllers/therapist.controller.js (32 lines) - HTTP handlers  
✅ src/routes/therapist.routes.js    (11 lines) - URL routing

FILES MODIFIED:
✅ package.json                      (1 line) - Added "seed" script
✅ src/index.js                      (0 lines) - No changes needed (already had mount)

TOTAL: 289 lines of new/modified code
```

---

## 🛣️ 3 New Public API Endpoints

```
1. GET /api/therapists
   Purpose:     List all therapists
   Filters:     ?track=CAREER, ?specialization=anxiety, ?language=urdu, ?minFee=2000&maxFee=4000
   Returns:     { therapists: [{ id, name, title, rating, specializations, languages, ... }] }
   Status:      200 OK
   Auth:        ❌ None required (public)

2. GET /api/therapists/:id
   Purpose:     Get single therapist profile
   Example:     GET /api/therapists/9afcc15a-6f29-4900-9420-6cf461f103d2
   Returns:     { therapist: { id, name, title, about, methodology, credentials, feePkr, ... } }
   Status:      200 OK (or 404 if not found)
   Auth:        ❌ None required (public)

3. GET /api/therapists/:id/slots
   Purpose:     Get therapist's available booking slots
   Query:       ?date=2026-05-20 (optional)
   Returns:     { slots: [] }  ← Empty array (no slots seeded yet)
   Status:      200 OK
   Auth:        ❌ None required (public)
```

---

## 🗄️ Database Structure

```
users
├─ id (UUID)
├─ name
├─ email
├─ passwordHash
├─ role (PATIENT | THERAPIST | ADMIN)
└─ therapistProfile → Therapist (1-to-1)

therapists
├─ id (UUID)
├─ userId → User (foreign key)
├─ title
├─ credentials
├─ about
├─ methodology
├─ feePkr (₨)
├─ rating (Decimal)
├─ reviewCount
├─ track (MENTAL_HEALTH | CAREER)
├─ isActive (boolean)
├─ specializations → TherapistSpecialization[] (1-to-many)
└─ languages → TherapistLanguage[] (1-to-many)

therapist_specializations
├─ id (UUID)
├─ therapistId → Therapist
└─ name (e.g., "Anxiety", "Depression")

therapist_languages
├─ id (UUID)
├─ therapistId → Therapist
└─ language (e.g., "English", "Urdu")

availability_slots
├─ id (UUID)
├─ therapistId → Therapist
├─ slotDatetime
└─ isBooked (boolean)
```

**Seeded Data:**
```
4 therapists with realistic profiles:
  1. Dr. Ayesha Raza     (₨3500, MENTAL_HEALTH, 4.9 rating)
  2. Bilal Chaudhry      (₨2500, CAREER, 4.7 rating)
  3. Dr. Sara Malik      (₨4500, MENTAL_HEALTH, 4.8 rating)
  4. Zara Ahmed          (₨3000, MENTAL_HEALTH, 4.6 rating)
```

---

## 🔄 Code Flow Walkthrough

### Request → Response (Example)

```
1. BROWSER REQUEST
   fetch('/api/therapists?track=CAREER&maxFee=3000')
   
2. ROUTE MATCHING
   src/index.js: app.use('/api/therapists', therapistRoutes)
   src/routes/therapist.routes.js: router.get('/', therapistController.getTherapists)
   
3. CONTROLLER
   src/controllers/therapist.controller.js:
   getTherapists(req, res, next) {
     const therapists = await therapistService.getTherapists(req.query)
     res.json({ therapists })
   }
   
4. SERVICE
   src/services/therapist.service.js:
   export async function getTherapists(filters) {
     const where = { isActive: true }
     if (filters.track) where.track = filters.track.toUpperCase()
     if (filters.maxFee) where.feePkr = { lte: Number(filters.maxFee) }
     
     const therapists = await prisma.therapist.findMany({
       where,
       include: { user: {...}, specializations: {...}, languages: {...} },
       orderBy: { rating: 'desc' }
     })
     
     return therapists.map(formatTherapist)
   }
   
5. DATABASE
   Prisma translates to SQL:
   SELECT * FROM therapists
   WHERE isActive = true AND track = 'CAREER' AND feePkr <= 3000
   ORDER BY rating DESC
   
   PostgreSQL executes, returns 1 result (Bilal)
   
6. TRANSFORMATION
   formatTherapist() converts:
   - rating: Decimal(4.7) → 4.7
   - nested user fields → flattened
   - specializations: [{name}] → ['Career Counseling', 'Life Coaching', ...]
   
7. RESPONSE
   HTTP 200 OK
   {
     "therapists": [{
       "id": "9afcc15a-...",
       "name": "Bilal Chaudhry",
       "feePkr": 2500,
       "track": "CAREER",
       "rating": 4.7,
       "specializations": ["Career Counseling", "Life Coaching", "Workplace Stress"],
       ...
     }]
   }
```

---

## ⚠️ Error Handling

```
HAPPY PATH (Everything Works):
  Controller.try → Service → Database → formatTherapist() → res.json() ✅

ERROR PATH (Something Breaks):
  Service throws error
    └─ error.status = 404
    └─ throw error
         └─ Controller.catch(err)
             └─ next(err)
                 └─ errorHandler middleware
                     └─ res.status(404).json({ error: "..." }) ✅

COMMON ERRORS:

1. Therapist Not Found (404)
   GET /api/therapists/fake-uuid
   Response: { "error": "Therapist not found." }
   Status: 404

2. Database Connection Error (500)
   If PostgreSQL is down
   Response: { "error": "Internal server error" }
   Status: 500

3. Invalid Input (500 - needs improvement)
   GET /api/therapists?maxFee=abc
   Currently: Crashes with 500 (should be 400)
   TODO: Add input validation in service
```

---

## 🧪 Test Results

```
TEST A: GET /api/therapists
  ✅ Returns 4 therapists
  ✅ Sorted by rating (4.9 → 4.8 → 4.7 → 4.6)
  ✅ All fields present

TEST B: GET /api/therapists?track=CAREER
  ✅ Returns 1 therapist (Bilal)
  ✅ Other 3 excluded

TEST C: GET /api/therapists?specialization=anxiety
  ✅ Returns 1 therapist (Ayesha)
  ✅ Case-insensitive match works

TEST D: GET /api/therapists?language=punjabi
  ✅ Returns 1 therapist (Bilal)
  ✅ Case-insensitive match works

TEST E: GET /api/therapists?minFee=3000&maxFee=4000
  ✅ Returns 2 therapists (Ayesha 3500, Zara 3000)
  ✅ Range filtering works

TEST F: GET /api/therapists/:id
  ✅ Returns full therapist object
  ✅ Includes methodology field

TEST G: GET /api/therapists/:id (fake UUID)
  ✅ Returns 404 error
  ✅ Error message: "Therapist not found."

TEST H: GET /api/therapists/:id/slots
  ✅ Returns empty array
  ✅ No errors for missing slots
```

---

## 📝 Key Concepts

### Layers (MVC Pattern)
```
Routes    → Define URL paths
Controller → Extract HTTP params, call service, send response
Service   → Business logic, database queries, data transformation
Database  → Store and retrieve data
```

### Prisma Queries
```
findMany()    → Returns array (can be empty [])
findUnique()  → Returns single object or null
where clause  → Filter conditions
include       → Fetch related data (entire objects)
select        → Fetch specific fields only
orderBy       → Sort results
```

### Error Handling
```
try {
  // Code that might throw
} catch (err) {
  next(err)  // Pass to error handler middleware
}
```

### Data Transformation
```
Raw from DB:       { rating: Decimal(4.9), user: {...} }
After format():    { rating: 4.9, name: "..." }
Why: JSON-safe, flat structure, clean API
```

### Filtering Pattern
```
const where = { isActive: true }  // Base filter
if (filter1) where.field1 = ...   // Add optional filters
if (filter2) where.field2 = ...
// Use in query: prisma.model.findMany({ where })
```

---

## 🎯 What You Should Be Able to Do

After understanding Phase 3, you should be able to:

- [ ] Explain request flow from browser through all layers to database
- [ ] Describe what each file does (routes, controller, service, model)
- [ ] Understand how Prisma queries work
- [ ] Trace an error through the try-catch-next pattern
- [ ] Explain why we transform data (Decimal → number, nested → flat)
- [ ] Build a WHERE clause dynamically based on filters
- [ ] Understand why this architecture is better than spaghetti code
- [ ] Add a new filter to the therapists endpoint
- [ ] Spot and fix a bug in the error handling
- [ ] Explain the difference between public (Phase 3) and protected (Phase 4) endpoints

---

## 🚀 What's Next (Phase 4)

```
Phase 4: Session Booking System
├─ Protected endpoints (require JWT token)
├─ POST /api/sessions (book a therapist)
├─ GET /api/sessions (view my bookings)
├─ POST /api/payments (submit payment proof)
├─ Admin endpoints (/api/admin/payments)
└─ Same architecture (routes → controllers → services → database)

Phase 5: Notifications & Messaging
├─ Email notifications
├─ In-app messaging
└─ Real-time updates (WebSocket)

Phase 6: Advanced Features
├─ Reviews & ratings
├─ Session recordings
├─ Patient notes
└─ Analytics dashboard
```

---

## 💡 Quick Tips

```
DEBUGGING:
  ✅ Use console.log in service to see what data looks like
  ✅ Check error stack trace in error response
  ✅ Use Prisma Studio: npx prisma studio

TESTING:
  ✅ Use curl or Postman
  ✅ Try with and without filters
  ✅ Test error cases (fake IDs, invalid params)

COMMON MISTAKES:
  ❌ Mixing business logic in controller
  ❌ Forgetting to catch errors (server crashes)
  ❌ Not converting Decimal to number
  ❌ Not flattening nested objects
  ✅ Keep layers separate
  ✅ Always use try-catch-next
  ✅ Transform data before returning

RUNNING LOCALLY:
  npm run seed        → Populate database
  npm run dev         → Start server with hot reload
  curl localhost:5000/api/therapists  → Test endpoint
  npx prisma studio  → Browse database
```

---

## 📚 Reference Files

| File | Lines | Purpose |
|------|-------|---------|
| `prisma/seed.js` | 140 | Populate 4 therapists |
| `src/services/therapist.service.js` | 105 | Queries & transformations |
| `src/controllers/therapist.controller.js` | 32 | HTTP handlers |
| `src/routes/therapist.routes.js` | 11 | URL → handler mapping |
| `package.json` | +1 | Added "seed" script |

---

## 🎓 Learn More

Read detailed explanations:
- **Architecture Patterns**: `PHASE3_CONCEPTS_EXPLAINED.md`
- **Request Flows**: `PHASE3_REQUEST_FLOW_VISUAL.md`
- **Complete Guide**: `PHASE3_DETAILED_ARCHITECTURE.md`

All files are in the project root directory.
