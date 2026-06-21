 # 🧠 PHASE 3: Concepts & Architecture Patterns Explained

> Deep-dive explanations of WHY we structure code this way and HOW each pattern works

---

## 📚 TABLE OF CONTENTS

1. [MVC Architecture Pattern](#mvc-architecture-pattern)
2. [Three-Layer Architecture](#three-layer-architecture)
3. [Prisma & Database Queries](#prisma--database-queries)
4. [Error Handling Strategy](#error-handling-strategy)
5. [Filtering & Query Building](#filtering--query-building)
6. [Data Transformation](#data-transformation)
7. [API Design Principles](#api-design-principles)

---

## 🏛️ MVC Architecture Pattern

Our backend follows **MVC (Model-View-Controller)** pattern adapted for APIs:

### Traditional MVC (Web Apps)
```
Browser → Controller → Service → Model → Database
   ↑                                          ↓
   └──────────── View (HTML) ──────────────┘
```

### MVC for APIs (Our Setup)
```
Browser/Client → Controller → Service → Model → Database
      ↓                                              ↓
   JSON (in)                                   Data (out)
      ↑                                              ↓
      └────────────── JSON (out) ──────────────────┘
```

### What Each Layer Does

```
┌─────────────────────────────────────────────────────────────────┐
│                       LAYER 1: ROUTES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ File: src/routes/therapist.routes.js                           │
│                                                                 │
│ Responsibility: URL → Function mapping                         │
│                                                                 │
│ Code:                                                           │
│   router.get('/', getTherapists)           ← Route definition │
│   router.get('/:id', getTherapistById)     ← With parameters  │
│   router.get('/:id/slots', getTherapistSlots)                 │
│                                                                 │
│ Decision: Which code runs for this path?                       │
│                                                                 │
│ Example: GET /api/therapists/xyz                              │
│   ┌─ Check: Does '/' match? No                                │
│   ├─ Check: Does '/:id' match? Yes! → Call getTherapistById   │
│   └─ Never checks '/:id/slots' (already matched)              │
│                                                                 │
│ Key Principle: Routes are just traffic directors              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 2: CONTROLLERS                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ File: src/controllers/therapist.controller.js                  │
│                                                                 │
│ Responsibility: HTTP request handling & response formatting    │
│                                                                 │
│ Code:                                                           │
│   export async function getTherapists(req, res, next) {        │
│     try {                                                       │
│       // Extract request data                                  │
│       const therapists = await therapistService.getTherapists( │
│         req.query  ← Query parameters from URL                │
│       )                                                         │
│                                                                 │
│       // Send response                                         │
│       res.json({ therapists })                                 │
│                                                                 │
│     } catch (err) {                                             │
│       next(err)  ← Pass error to error handler                │
│     }                                                           │
│   }                                                             │
│                                                                 │
│ Decision: What parameters do we have? How do we respond?       │
│                                                                 │
│ Key Principle: Controller is a "translator"                    │
│   - IN: HTTP request (req)                                    │
│   - OUT: HTTP response (res)                                  │
│   - LOGIC: Delegates to service                               │
│                                                                 │
│ Anti-Pattern: Writing business logic in controller             │
│   ❌ DON'T: const filtered = therapists.filter(...)            │
│   ✅ DO:   const filtered = therapistService.filter(...)       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 3: SERVICES                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ File: src/services/therapist.service.js                        │
│                                                                 │
│ Responsibility: Business logic & database queries              │
│                                                                 │
│ Code:                                                           │
│   export async function getTherapists(filters) {               │
│     // 1. Understand what data we need                         │
│     const where = { isActive: true }                           │
│                                                                 │
│     // 2. Apply logic to filters                               │
│     if (filters.track) {                                        │
│       where.track = filters.track.toUpperCase()                │
│     }                                                           │
│                                                                 │
│     // 3. Query database                                       │
│     const therapists = await prisma.therapist.findMany({...})  │
│                                                                 │
│     // 4. Transform data for consumption                       │
│     return therapists.map(formatTherapist)                     │
│   }                                                             │
│                                                                 │
│ Decision: How do we fetch data? How do we process it?          │
│                                                                 │
│ Key Principle: Pure business logic, no HTTP knowledge          │
│   - Doesn't know about req/res                                 │
│   - Doesn't know about status codes                            │
│   - Only knows about data logic                                │
│                                                                 │
│ Why? Easy to test and reuse                                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 4: DATABASE MODEL                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ File: prisma/schema.prisma                                     │
│                                                                 │
│ Responsibility: Define data structure                          │
│                                                                 │
│ Code:                                                           │
│   model Therapist {                                             │
│     id String @id @default(uuid())                             │
│     userId String @unique                                       │
│     user User @relation(...)                                    │
│     title String                                                │
│     credentials String                                          │
│     specializations TherapistSpecialization[]  ← Relation      │
│     languages TherapistLanguage[]              ← Relation      │
│   }                                                             │
│                                                                 │
│ Decision: What data do we store? How are they related?        │
│                                                                 │
│ Key Principle: Schema as contract                              │
│   - Defines all possible data                                  │
│   - Defines all relationships                                  │
│   - Ensures data integrity                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Three-Layer Architecture

More detailed breakdown:

```
                        REQUEST COMES IN
                            ▼
                    ╔════════════════╗
                    ║  LAYER 1: API  ║
                    ║   ROUTES       ║
                    ╚════════════════╝
                            │
                   Matches route pattern
                            │
                            ▼
                    ╔════════════════╗
        ┌───────────║  LAYER 2: API  ║───────────┐
        │           ║  CONTROLLER    ║           │
        │           ╚════════════════╝           │
        │                   │                    │
        │        Extract HTTP request data       │
        │        (params, query, body)           │
        │                   │                    │
        │                   ▼                    │
        │           ╔════════════════╗           │
        │           ║  LAYER 3:      ║           │
        │           ║  SERVICE/      ║           │
        │           ║  BUSINESS LOGIC║           │
        │           ╚════════════════╝           │
        │                   │                    │
        │        Build queries, apply filters    │
        │        Call database via Prisma        │
        │                   │                    │
        │                   ▼                    │
        │           ╔════════════════╗           │
        │           ║  LAYER 4:      ║           │
        │           ║  DATABASE      ║           │
        │           ║  (PostgreSQL)  ║           │
        │           ╚════════════════╝           │
        │                   │                    │
        │      Return query results              │
        │                   │                    │
        │                   ▼                    │
        │           ╔════════════════╗           │
        │           ║  LAYER 3:      ║           │
        │           ║  Transform     ║           │
        │           ║  data          ║           │
        │           ╚════════════════╝           │
        │                   │                    │
        │      Return clean JavaScript objects   │
        │                   │                    │
        └──→ ╔════════════════╗ ←────────────────┘
             ║  LAYER 2: API  ║
             ║  CONTROLLER    ║
             ╚════════════════╝
                        │
             Format as JSON response
                        │
                        ▼
                ╔════════════════╗
                ║   HTTP 200     ║
                ║   RESPONSE     ║
                ╚════════════════╝
                        │
                        ▼
                   TO BROWSER
```

### Why This Separation?

```
BENEFIT 1: Single Responsibility
────────────────────────────────
  ❌ Without separation (BAD):
  getTherapists(req, res) {
    // Parse request, validate, query, transform, 
    // format, error handle, all mixed together
    // 200+ lines of spaghetti code
  }

  ✅ With separation (GOOD):
  Route:       Matches URL
  Controller:  Gets req, calls service, sends res (10 lines)
  Service:     Queries DB, transforms (50 lines)
  Model:       Defines structure (self-documenting)

BENEFIT 2: Testing
──────────────────
  ✅ Can test service WITHOUT HTTP
  test.js:
    const results = therapistService.getTherapists({ track: 'CAREER' })
    assert(results.length === 1)
    // No mocking HTTP, no server running

BENEFIT 3: Reusability
──────────────────────
  ✅ Service can be used by multiple interfaces
  
  // HTTP API
  app.get('/api/therapists', therapistController.getTherapists)
  
  // WebSocket (Phase 4+)
  socket.on('list-therapists', (filters) => {
    const therapists = therapistService.getTherapists(filters)
    socket.emit('therapists-list', therapists)
  })
  
  // CLI (admin tool)
  console.log(await therapistService.getTherapists({ track: 'MENTAL_HEALTH' }))

BENEFIT 4: Maintenance
──────────────────────
  ✅ Change database query? Only touch service
  ✅ Change response format? Only touch controller
  ✅ Change URL structure? Only touch routes
  
  Changes don't cascade through entire codebase
```

---

## 🗄️ Prisma & Database Queries

### What is Prisma?

```
Prisma = ORM (Object-Relational Mapping) + Query Builder + Type Safety

Without Prisma (Raw SQL):
─────────────────────────
const client = new pg.Client(...)
const res = await client.query(
  'SELECT t.* FROM therapists t WHERE t.track = $1',
  ['CAREER']
)
const therapists = res.rows.map(row => ({
  id: row.id,
  name: row.name,
  // Manually map every column... tedious!
}))

With Prisma:
────────────
const therapists = await prisma.therapist.findMany({
  where: { track: 'CAREER' }
})
// Done! Prisma handles mapping automatically

Benefits:
  ✅ Type safety (know columns at compile time)
  ✅ Less boilerplate (no manual mapping)
  ✅ Relationship handling (includes/selects)
  ✅ Migration management (schema versioning)
```

### Query Examples in Our Code

#### Example 1: Simple List
```javascript
// Code:
const therapists = await prisma.therapist.findMany({
  where: { isActive: true },
  include: {
    user: { select: { name, email } },
    specializations: { select: { name } }
  },
  orderBy: { rating: 'desc' }
})

// Prisma translates to SQL:
SELECT t.*, u.name, u.email, ts.name
FROM therapists t
JOIN users u ON t.userId = u.id
LEFT JOIN therapist_specializations ts ON ts.therapistId = t.id
WHERE t.isActive = true
ORDER BY t.rating DESC
```

#### Example 2: Filtered Search
```javascript
// Code:
const where = {
  isActive: true,
  track: 'CAREER',
  feePkr: { lte: 3000 },
  specializations: {
    some: { name: { contains: 'Counseling', mode: 'insensitive' } }
  }
}
const therapists = await prisma.therapist.findMany({ where })

// Prisma translates to SQL:
SELECT t.*
FROM therapists t
WHERE t.isActive = true
  AND t.track = 'CAREER'
  AND t.feePkr <= 3000
  AND EXISTS (
    SELECT 1 FROM therapist_specializations ts
    WHERE ts.therapistId = t.id
    AND ts.name ILIKE '%Counseling%'
  )
```

#### Example 3: By ID
```javascript
// Code:
const therapist = await prisma.therapist.findUnique({
  where: { id: 'uuid-here' }
})

// Prisma translates to SQL:
SELECT * FROM therapists
WHERE id = 'uuid-here'
LIMIT 1

// Returns: Single object or null
// This is why we check: if (!therapist) throw error
```

### Key Prisma Concepts

```
findMany()
─────────
  - Returns: Array (can be empty [])
  - Use when: You expect multiple results or need to filter
  - Example: Get all CAREER therapists

findUnique()
────────────
  - Returns: Single object or null
  - Use when: Querying by unique field (id, email, etc.)
  - Example: Get therapist by ID
  - NEVER use: If field is not marked @unique in schema
  
findFirst()
───────────
  - Returns: First match or null
  - Use when: Want first record matching criteria
  - Example: Find first therapist with 5-star rating

include vs select
─────────────────
include:  { user: true }  → Fetch entire related object
select:   { user: { select: { name, email } } }  → Only these fields

Why use select?
  ✅ Faster query (less data transferred)
  ✅ Cleaner API response (don't expose all fields)
  ❌ Have to list fields explicitly

When to use:
  Relations with many fields → Use select to limit
  Relations with few fields → Use include for simplicity
```

---

## ⚠️ Error Handling Strategy

### The Try-Catch-Next Pattern

```javascript
export async function getTherapists(req, res, next) {
  try {
    // ✅ Happy path: everything works
    const therapists = await therapistService.getTherapists(req.query)
    res.json({ therapists })
    
  } catch (err) {
    // ❌ Error path: something broke, pass to error handler
    next(err)
  }
}
```

### Why This Pattern?

```
Without try-catch:
──────────────────
export async function getTherapists(req, res) {
  const therapists = await therapistService.getTherapists(req.query)
  // If service throws, server CRASHES
  // User gets "Connection reset" error
  // No response body, just broken
  res.json({ therapists })
}

With try-catch + next(err):
───────────────────────────
export async function getTherapists(req, res, next) {
  try {
    const therapists = await therapistService.getTherapists(req.query)
    res.json({ therapists })
  } catch (err) {
    // Error handler catches ALL errors from this route
    // Server doesn't crash
    // Client gets proper JSON error response
    next(err)
  }
}
```

### Error Types Our API Handles

```
1. VALIDATION ERROR (400)
   ├─ What: Input data is invalid
   ├─ Example: maxFee="abc" (not a number)
   ├─ Currently: Not handled (need to add!)
   └─ Should return:
      {
        "error": "Invalid query parameter: maxFee must be a number",
        "status": 400
      }

2. NOT FOUND ERROR (404)
   ├─ What: Requested resource doesn't exist
   ├─ Example: GET /api/therapists/fake-uuid
   ├─ Currently: ✅ Handled in service
   ├─ Service code:
      if (!therapist) {
        const error = new Error('Therapist not found.')
        error.status = 404
        throw error
      }
   └─ Returns:
      {
        "error": "Therapist not found.",
        "status": 404
      }

3. DATABASE ERROR (500)
   ├─ What: Database connection failed or query error
   ├─ Example: PostgreSQL server is down
   ├─ Currently: ✅ Caught and formatted
   ├─ Flow:
      Prisma throws PrismaClientKnownRequestError
        └─ Caught by controller's catch block
           └─ next(err)
              └─ Error handler sets status 500
   └─ Returns:
      {
        "error": "Internal server error",
        "status": 500,
        "stack": "[error stack trace in development]"
      }

4. UNEXPECTED ERROR (500)
   ├─ What: Code crashed unexpectedly
   ├─ Example: formatTherapist tries to access null.field
   ├─ Currently: ✅ Caught
   └─ Returns: 500 error with stack trace
```

### Error Propagation Chain

```
Service throws error
        │
        │ error = new Error('Therapist not found.')
        │ error.status = 404
        │ throw error
        │
        ▼
Controller catch block
        │
        │ catch (err) {
        │   next(err)
        │ }
        │
        ▼
Express error handler middleware
        │
        │ function errorHandler(err, req, res, next) {
        │   const status = err.status || 500
        │   const message = err.message
        │   res.status(status).json({ error: message })
        │ }
        │
        ▼
HTTP Response (404 Not Found)
        │
        ▼
Browser
```

### Anti-Patterns to Avoid

```
❌ ANTI-PATTERN 1: Swallowing errors
function getTherapists(req, res) {
  try {
    const therapists = await therapistService.getTherapists(req.query)
    res.json({ therapists })
  } catch (err) {
    console.log('Some error happened')  // Silent failure!
    res.json({ therapists: [] })        // Returns fake data
  }
}

Problems:
  - User gets empty list instead of error
  - Impossible to debug (error logged but not visible)
  - Silent failures are the worst

✅ CORRECT: Let error propagate
function getTherapists(req, res, next) {
  try {
    const therapists = await therapistService.getTherapists(req.query)
    res.json({ therapists })
  } catch (err) {
    next(err)  // Pass to error handler
  }
}


❌ ANTI-PATTERN 2: Catching too much
function getTherapists(req, res) {
  try {
    // 100 lines of unrelated code
    // opening files, parsing configs, etc.
    const therapists = await therapistService.getTherapists(req.query)
    res.json({ therapists })
  } catch (err) {
    // Which error? File read? Database? Parsing?
    res.status(500).json({ error: err.message })
  }
}

✅ CORRECT: Catch only what you expect
function getTherapists(req, res, next) {
  try {
    const therapists = await therapistService.getTherapists(req.query)
    res.json({ therapists })
  } catch (err) {
    // Clear what errors we expect here (database errors)
    next(err)
  }
}


❌ ANTI-PATTERN 3: Not setting error status
throw new Error('Not found')

✅ CORRECT: Set meaningful status
const error = new Error('Therapist not found.')
error.status = 404
throw error
```

---

## 🔍 Filtering & Query Building

### Dynamic Query Building Pattern

Our service builds WHERE clauses dynamically based on filters:

```javascript
export async function getTherapists(filters) {
  // Start with base filter
  const where = { isActive: true }
  
  // Progressively add filters if provided
  if (filters.track) {
    where.track = filters.track.toUpperCase()
  }
  
  if (filters.specialization) {
    where.specializations = {
      some: {
        name: { contains: filters.specialization, mode: 'insensitive' }
      }
    }
  }
  
  if (filters.language) {
    where.languages = {
      some: {
        language: { contains: filters.language, mode: 'insensitive' }
      }
    }
  }
  
  if (filters.minFee || filters.maxFee) {
    where.feePkr = {}
    if (filters.minFee) where.feePkr.gte = Number(filters.minFee)
    if (filters.maxFee) where.feePkr.lte = Number(filters.maxFee)
  }
  
  // Use built WHERE clause
  const therapists = await prisma.therapist.findMany({
    where,
    include: therapistInclude,
    orderBy: { rating: 'desc' }
  })
  
  return therapists.map(formatTherapist)
}
```

### Why This Approach?

```
BENEFIT: Composability
───────────────────────
Can combine any filters:

  ?track=CAREER
  → { isActive: true, track: 'CAREER' }
  
  ?specialization=anxiety&language=urdu
  → { isActive: true, specializations: {...}, languages: {...} }
  
  ?minFee=2000&maxFee=3500&track=MENTAL_HEALTH
  → { isActive: true, feePkr: {...}, track: 'MENTAL_HEALTH' }
  
All combinations work without special cases!

BENEFIT: No SQL Injection
──────────────────────────
String literals directly in SQL:
  SELECT * FROM therapists WHERE name = 'O''Brien'
  Risks: SQL injection vulnerabilities

Prisma parameterized queries:
  Prisma automatically escapes all values
  { name: "O'Brien" } is safe
  
In our code:
  filters.specialization = "'; DROP TABLE therapists; --"
  → Safely escaped, not executed as SQL


BENEFIT: Type Safety
───────────────────
where = {
  isActive: true,           ← boolean
  track: 'CAREER',          ← enum (only CAREER or MENTAL_HEALTH)
  feePkr: { lte: 3000 },    ← number comparison
  specializations: {        ← relational filter
    some: { ... }
  }
}
TypeScript would catch:
  where.rating = "high"  ← Type error! rating is Decimal, not string
```

### Relational Filtering Pattern

```javascript
// Find therapists WITH "Anxiety" specialization
where.specializations = {
  some: {
    name: { contains: 'anxiety', mode: 'insensitive' }
  }
}

// Translates to SQL EXISTS subquery:
WHERE EXISTS (
  SELECT 1 FROM therapist_specializations ts
  WHERE ts.therapistId = t.id
  AND ts.name ILIKE '%anxiety%'
)

// Pattern explanation:
// some:        "At least one related record must match"
// contains:    "Field value contains this string"
// mode:        "Case-insensitive search"
```

---

## 🎨 Data Transformation

### Why Transformation Layer?

```
RAW DATABASE RESPONSE:
{
  id: 'uuid1',
  userId: 'user-uuid',
  rating: Decimal(4.9),  ← Not JSON-safe!
  user: {
    name: 'Dr. Ayesha',
    email: '...',
    initials: '...'
  },
  specializations: [
    { id: 'spec-uuid', name: 'Anxiety', therapistId: '...' },
    { id: 'spec-uuid', name: 'Depression', therapistId: '...' }
  ]
}

Problems:
  ❌ Decimal(4.9) is Prisma type, not JSON
  ❌ Nested user object is awkward
  ❌ Specializations have extra fields (id, therapistId)
  ❌ User data mixed with therapist data


TRANSFORMED RESPONSE:
{
  id: 'uuid1',
  name: 'Dr. Ayesha',    ← Flattened from user.name
  email: '...',          ← Flattened from user.email
  initials: '...',       ← Flattened from user.initials
  rating: 4.9,           ← Plain number
  specializations: ['Anxiety', 'Depression'],  ← Simple strings
  title: 'Clinical Psychologist',
  credentials: '...',
  feePkr: 3500,
  track: 'MENTAL_HEALTH',
  ...
}

Benefits:
  ✅ JSON-serializable (no Decimal objects)
  ✅ Flat structure (easier to use in frontend)
  ✅ Only fields we want to expose
  ✅ Clean, predictable schema
```

### The formatTherapist Function

```javascript
function formatTherapist(t) {
  return {
    // Copy basic fields
    id: t.id,
    title: t.title,
    credentials: t.credentials,
    about: t.about,
    methodology: t.methodology,
    feePkr: t.feePkr,
    track: t.track,
    reviewCount: t.reviewCount,
    sessionsCount: t.sessionsCount,
    color: t.color,
    isActive: t.isActive,
    
    // Flatten nested user object
    name: t.user.name,
    email: t.user.email,
    initials: t.user.initials,
    
    // Convert Decimal to number
    rating: Number(t.rating),
    // Without this: { "_decimal": "4.9" }  ← Prisma internal format
    // With this:    4.9  ← Plain JSON number
    
    // Flatten arrays of objects to arrays of strings
    specializations: t.specializations.map(s => s.name),
    // Input:  [{ id, name: "Anxiety", therapistId }]
    // Output: ["Anxiety"]
    
    languages: t.languages.map(l => l.language),
    // Input:  [{ id, language: "English", therapistId }]
    // Output: ["English"]
  }
}
```

### Why Use map()?

```javascript
// Input: Array of objects
const specializations = [
  { id: 'uuid-1', name: 'Anxiety', therapistId: 'xyz' },
  { id: 'uuid-2', name: 'Depression', therapistId: 'xyz' },
  { id: 'uuid-3', name: 'CBT', therapistId: 'xyz' }
]

// transform: map over each item
const result = specializations.map(s => s.name)
// Result: ['Anxiety', 'Depression', 'CBT']

// This is JavaScript's standard transform pattern
// = forEach + reduce + return combined into one line
```

---

## 🎯 API Design Principles

### RESTful API Conventions

```
Resource: Therapists

GET /api/therapists
  ├─ What: List all therapists
  ├─ Returns: Array of therapists
  └─ Status: 200 OK

GET /api/therapists?track=CAREER
  ├─ What: List filtered therapists
  ├─ Returns: Filtered array
  └─ Status: 200 OK

GET /api/therapists/:id
  ├─ What: Get single therapist
  ├─ Returns: Single therapist object
  └─ Status: 200 OK (or 404 if not found)

GET /api/therapists/:id/slots
  ├─ What: Get therapist's availability
  ├─ Returns: Array of slots
  └─ Status: 200 OK

(Phase 4+ will add):
POST /api/therapists/:id/book
  ├─ What: Book a session
  └─ Status: 201 Created

PATCH /api/therapists/:id
  ├─ What: Update therapist profile
  └─ Status: 200 OK

DELETE /api/therapists/:id
  ├─ What: Deactivate therapist
  └─ Status: 204 No Content


VERB MEANING:
─────────────
GET     Retrieve (safe, idempotent)
POST    Create new resource
PUT     Replace entire resource
PATCH   Partial update
DELETE  Remove resource

STATUS CODES:
─────────────
200  OK (request succeeded)
201  Created (new resource created)
204  No Content (operation succeeded, no data to return)
400  Bad Request (invalid input)
404  Not Found (resource doesn't exist)
500  Server Error (unexpected failure)
```

### Query Parameter Conventions

```javascript
// Optional filters as query parameters
GET /api/therapists?track=CAREER&minFee=2000&maxFee=4000&language=urdu

// Advantages:
✅ Standard HTTP (everyone understands ?key=value)
✅ Cacheable (different queries = different cache entries)
✅ Bookmarkable (user can save filtered URL)
✅ Simple URL structure

// Alternative (Body parameters):
POST /api/therapists/search
Content-Type: application/json

{
  "track": "CAREER",
  "minFee": 2000,
  "maxFee": 4000,
  "language": "urdu"
}

// Why not for listing?
❌ Can't bookmark
❌ Not idempotent (shouldn't use POST for filtering)
❌ Less discoverable (filters aren't visible in URL)
```

### Response Format Conventions

```javascript
// ✅ GOOD: Consistent wrapping
GET /api/therapists
{
  "therapists": [
    { id: "...", name: "..." },
    { id: "...", name: "..." }
  ]
}

GET /api/therapists/id
{
  "therapist": {
    id: "...",
    name: "..."
  }
}

Benefits:
  ✅ If we add metadata later, no breaking change:
    {
      "therapist": {...},
      "meta": { "fetched": "2026-05-16T..." }
    }
  ✅ Consistent structure (always wrapped)


❌ BAD: Returning raw array
GET /api/therapists
[
  { id: "...", name: "..." },
  { id: "...", name: "..." }
]

Problems:
  ❌ Can't add metadata without breaking change
  ❌ Top-level array can cause JavaScript parsing issues


❌ BAD: Inconsistent structure
GET /api/therapists          → Array
GET /api/therapists/:id      → Object (not wrapped)
GET /api/therapists?search   → Sometimes array, sometimes single

Frontend has to handle multiple response types
```

---

## 🔄 Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│                   COMPLETE DATA FLOW                         │
└─────────────────────────────────────────────────────────────┘

BROWSER MAKES REQUEST
  ▼
fetch('/api/therapists?track=CAREER')
  ▼
HTTP GET with query string
  ▼
┌─────────────────────────────────────────────────────────────┐
│ EXPRESS SERVER                                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Middleware chain (top to bottom):                           │
│  1. CORS                                                     │
│  2. JSON parser                                             │
│  3. Route matching                                          │
│  4. Route handler (therapistRoutes)                        │
│  5. Error handler (at end)                                  │
│                                                              │
│ Request→ ROUTE LAYER                                        │
│          router.get('/', handler)  ← Matches!             │
│          ▼                                                  │
│ Request→ CONTROLLER LAYER                                   │
│          getTherapists(req, res, next)                     │
│          extract: req.query = { track: 'CAREER' }         │
│          call: therapistService.getTherapists()           │
│          ▼                                                  │
│ Request→ SERVICE LAYER                                      │
│          getTherapists(filters)                            │
│          build: where = { track: 'CAREER', isActive: true }
│          query: prisma.therapist.findMany({ where })      │
│          ▼                                                  │
│ Request→ DATABASE LAYER                                     │
│          Prisma translates to SQL                          │
│          ▼                                                  │
└─────────────────────────────────────────────────────────────┘
  ▼
┌─────────────────────────────────────────────────────────────┐
│ POSTGRESQL DATABASE                                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Execute SQL:                                                │
│ SELECT * FROM therapists                                   │
│ WHERE isActive = true AND track = 'CAREER'                 │
│ ORDER BY rating DESC;                                       │
│                                                              │
│ Result: 1 therapist (Bilal Chaudhry)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
  ▼
┌─────────────────────────────────────────────────────────────┐
│ RESPONSE BUBBLES BACK UP                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Service receives: {                                         │
│   id: 'uuid',                                               │
│   rating: Decimal(4.7),  ← Prisma type                     │
│   user: { name, email, ... },                              │
│   specializations: [{ name }, ...]                         │
│ }                                                            │
│                                                              │
│ Transform: therapists.map(formatTherapist)                 │
│                                                              │
│ Returns to Controller:                                      │
│ [{                                                          │
│   id: 'uuid',                                               │
│   name: 'Bilal',         ← Flattened                       │
│   rating: 4.7,           ← Converted                       │
│   specializations: ['Career Counseling', ...]  ← Simplified
│ }]                                                          │
│                                                              │
│ Controller wraps:                                           │
│ res.json({ therapists: [...] })                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
  ▼
HTTP 200 Response with JSON body
  ▼
BROWSER RECEIVES

{
  "therapists": [{
    "id": "9afcc15a-...",
    "name": "Bilal Chaudhry",
    "feePkr": 2500,
    "rating": 4.7,
    "specializations": ["Career Counseling", "Life Coaching", "Workplace Stress"],
    ...
  }]
}
  ▼
JavaScript Promise resolves
  ▼
Frontend code processes response
  ▼
UI updates (displays therapist card)
```

---

## ✅ Checklist: Understanding Phase 3

- [ ] Understand why we have Routes → Controllers → Services → Database layers
- [ ] Know how Prisma translates JavaScript to SQL
- [ ] Can explain where error handling happens (try-catch-next pattern)
- [ ] Understand dynamic WHERE clause building for filters
- [ ] Know why data transformation (formatTherapist) is needed
- [ ] Can trace a request from browser through all layers to database and back
- [ ] Understand REST conventions (GET, POST, query params, status codes)
- [ ] Know what Decimal() is and why we convert to number
- [ ] Understand map() for array transformation
- [ ] Can explain the difference between findMany and findUnique

If you can explain all of these, you understand the entire architecture!

