# 🔄 PHASE 3: Complete Request Flow Diagrams

## 📊 Visual Request Flows for All 3 Endpoints

---

## 🔹 REQUEST FLOW #1: GET /api/therapists (List all)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           BROWSER/FRONTEND                               │
│                                                                           │
│  Client Code:                                                            │
│  fetch('http://localhost:5000/api/therapists')                           │
│  .then(res => res.json())                                                │
│  .then(data => console.log(data))                                        │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                                   │ HTTP GET Request
                                   │ (No body, no auth header)
                                   │
                                   ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS SERVER                                    │
│                                                                           │
│  1. CORS Middleware                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Check: Is request origin allowed?                                   │ │
│  │ ✅ Allowed (CORS enabled for all origins in dev)                    │ │
│  │ Continue to next middleware...                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  2. JSON Parser Middleware                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ Check: Is there a JSON body?                                        │ │
│  │ ✅ No body in GET request, skip parsing                             │ │
│  │ Continue to next middleware...                                       │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
│                                                                           │
│  3. Route Matching                                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐ │
│  │ REQUEST PATH: GET /api/therapists                                   │ │
│  │                                                                      │ │
│  │ index.js: app.use('/api/therapists', therapistRoutes)              │ │
│  │           ✅ Matches! Delegates to therapistRoutes                  │ │
│  │                                                                      │ │
│  │ therapist.routes.js:                                                │ │
│  │   router.get('/', getTherapists)    ✅ Matches!                    │ │
│  │   router.get('/:id', ...)           ✗ No match (/ is not /:id)    │ │
│  │   router.get('/:id/slots', ...)     ✗ No match                     │ │
│  │                                                                      │ │
│  │ HANDLER MATCHED: therapistController.getTherapists                  │ │
│  └─────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                       │
│               src/controllers/therapist.controller.js                    │
│                                                                           │
│  getTherapists(req, res, next) {                                         │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ try {                                                          │   │
│    │   req.query = {}  ← No filter params                          │   │
│    │                                                               │   │
│    │   Call: therapistService.getTherapists({})                   │   │
│    │                                                               │   │
│    │ } catch (err) {                                               │   │
│    │   // Will not trigger in happy path                           │   │
│    │ }                                                             │   │
│    └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          SERVICE                                         │
│              src/services/therapist.service.js                           │
│                                                                           │
│  getTherapists(filters) {                                                │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ Step 1: Build WHERE clause                                     │   │
│    │ ───────────────────────────────────────────────────────────    │   │
│    │ const where = { isActive: true }  ← Base: only active         │   │
│    │                                                                │   │
│    │ Step 2: Check if filters provided (in this case, none)        │   │
│    │ ──────────────────────────────────────────────────────────    │   │
│    │ if (filters.track) { ... }           → filters.track undefined │   │
│    │ if (filters.specialization) { ... }  → undefined              │   │
│    │ if (filters.language) { ... }        → undefined              │   │
│    │ if (filters.minFee || ...) { ... }   → undefined              │   │
│    │                                                                │   │
│    │ Final WHERE: { isActive: true }  ← No additional filters      │   │
│    │                                                                │   │
│    │ Step 3: Query database                                         │   │
│    │ ──────────────────────────────────────────────────────────    │   │
│    │ const therapists = await prisma.therapist.findMany({          │   │
│    │   where: { isActive: true },                                   │   │
│    │   include: {                                                   │   │
│    │     user: { select: { name, email, initials } },              │   │
│    │     specializations: { select: { name } },                    │   │
│    │     languages: { select: { language } }                       │   │
│    │   },                                                            │   │
│    │   orderBy: { rating: 'desc' }  ← Sort best first             │   │
│    │ })                                                              │   │
│    │                                                                │   │
│    │ Step 4: Transform and return                                   │   │
│    │ ──────────────────────────────────────────────────────────    │   │
│    │ return therapists.map(formatTherapist)                         │   │
│    │        ↓                                                        │   │
│    │        Converts each raw DB object:                            │   │
│    │        { rating: Decimal(4.9), ... } → { rating: 4.9, ... }  │   │
│    └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         DATABASE LAYER                                   │
│                    src/config/db.js (Prisma)                             │
│                                                                           │
│  Prisma translates to SQL:                                               │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ SELECT                                                         │      │
│  │   t.id, t.userId, t.title, t.credentials, t.about,           │      │
│  │   t.methodology, t.feePkr, t.rating, t.reviewCount,          │      │
│  │   t.sessionsCount, t.color, t.track, t.isActive,             │      │
│  │   u.name, u.email, u.initials,                                │      │
│  │   ts.name AS specialization,                                  │      │
│  │   tl.language                                                  │      │
│  │ FROM therapists t                                              │      │
│  │ JOIN users u ON t.userId = u.id                               │      │
│  │ LEFT JOIN therapist_specializations ts ON ts.therapistId = t.id       │
│  │ LEFT JOIN therapist_languages tl ON tl.therapistId = t.id    │      │
│  │ WHERE t.isActive = true                                       │      │
│  │ ORDER BY t.rating DESC;                                       │      │
│  └────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                                 │
│                       (Disk Storage)                                     │
│                                                                           │
│  ✅ Query executed successfully                                          │
│  Returns 4 therapist records with relationships:                         │
│                                                                           │
│  Row 1: Dr. Ayesha Raza (rating 4.9)                                    │
│    ├─ user.name: "Dr. Ayesha Raza"                                     │
│    ├─ user.email: "ayesha@mindbridge.pk"                               │
│    ├─ user.initials: "DAR"                                              │
│    ├─ specializations: ["Anxiety", "Depression", "CBT", "Trauma"]       │
│    └─ languages: ["English", "Urdu"]                                    │
│                                                                           │
│  Row 2: Dr. Sara Malik (rating 4.8)                                     │
│  Row 3: Bilal Chaudhry (rating 4.7)                                     │
│  Row 4: Zara Ahmed (rating 4.6)                                         │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ (Results flow back UP)
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                           SERVICE                                        │
│            Back in therapistService.getTherapists()                      │
│                                                                           │
│  therapists.map(formatTherapist)                                         │
│                                                                           │
│  For each therapist, formatTherapist() does:                             │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ function formatTherapist(t) {                                  │      │
│  │   return {                                                     │      │
│  │     id: t.id,                                                  │      │
│  │     name: t.user.name,           ← Flatten nested user object  │      │
│  │     email: t.user.email,                                       │      │
│  │     initials: t.user.initials,                                │      │
│  │     title: t.title,                                            │      │
│  │     credentials: t.credentials,                                │      │
│  │     about: t.about,                                            │      │
│  │     methodology: t.methodology,                                │      │
│  │     feePkr: t.feePkr,                                          │      │
│  │     track: t.track,                                            │      │
│  │     rating: Number(t.rating),    ← Convert Decimal to number   │      │
│  │     reviewCount: t.reviewCount,                                │      │
│  │     sessionsCount: t.sessionsCount,                            │      │
│  │     color: t.color,                                            │      │
│  │     isActive: t.isActive,                                      │      │
│  │     specializations: t.specializations.map(s => s.name),      │      │
│  │                      ↑ Extract just the name string            │      │
│  │     languages: t.languages.map(l => l.language)                │      │
│  │   }                                                             │      │
│  │ }                                                              │      │
│  └────────────────────────────────────────────────────────────────┘      │
│                                                                           │
│  Result: Array of 4 cleaned-up objects                                   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                       │
│              Back in therapistController.getTherapists()                 │
│                                                                           │
│  res.json({ therapists })                                               │
│                                                                           │
│  Sends HTTP 200 response with JSON body                                  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         HTTP RESPONSE                                    │
│                                                                           │
│  HTTP/1.1 200 OK                                                         │
│  Content-Type: application/json                                          │
│                                                                           │
│  {                                                                        │
│    "therapists": [                                                       │
│      {                                                                    │
│        "id": "8771e330-d400-4e6b-a607-39ccadca22b5",                    │
│        "name": "Dr. Ayesha Raza",                                       │
│        "email": "ayesha@mindbridge.pk",                                 │
│        "initials": "DAR",                                                │
│        "title": "Clinical Psychologist",                                 │
│        "credentials": "PhD Clinical Psychology, Aga Khan University",   │
│        "about": "Dr. Ayesha Raza is a licensed clinical psychologist...",
│        "methodology": "Cognitive Behavioural Therapy (CBT)...",         │
│        "feePkr": 3500,                                                   │
│        "track": "MENTAL_HEALTH",                                         │
│        "rating": 4.9,  ← Plain number, not Decimal object              │
│        "reviewCount": 127,                                               │
│        "sessionsCount": 0,                                               │
│        "color": "#6366F1",                                               │
│        "isActive": true,                                                 │
│        "specializations": ["Anxiety", "Depression", "CBT", "Trauma"],   │
│        "languages": ["English", "Urdu"]                                 │
│      },                                                                  │
│      {                                                                    │
│        "id": "fd9ed95c-453e-4927-a3f3-765858104bd6",                    │
│        "name": "Dr. Sara Malik",                                        │
│        "feePkr": 4500,                                                   │
│        "rating": 4.8,                                                    │
│        ...                                                               │
│      },                                                                  │
│      {                                                                    │
│        "id": "9afcc15a-6f29-4900-9420-6cf461f103d2",                    │
│        "name": "Bilal Chaudhry",                                        │
│        "feePkr": 2500,                                                   │
│        "rating": 4.7,                                                    │
│        ...                                                               │
│      },                                                                  │
│      {                                                                    │
│        "id": "45392f59-6552-46db-bd3b-99463d0546d2",                    │
│        "name": "Zara Ahmed",                                            │
│        "feePkr": 3000,                                                   │
│        "rating": 4.6,                                                    │
│        ...                                                               │
│      }                                                                    │
│    ]                                                                      │
│  }                                                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER/FRONTEND                                    │
│                                                                           │
│  Promise resolves with data:                                             │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ const data = {                                                 │      │
│  │   therapists: [                                                │      │
│  │     { ... Dr. Ayesha Raza ... },                              │      │
│  │     { ... Dr. Sara Malik ... },                               │      │
│  │     { ... Bilal Chaudhry ... },                               │      │
│  │     { ... Zara Ahmed ... }                                    │      │
│  │   ]                                                            │      │
│  │ }                                                              │      │
│  │                                                                │      │
│  │ Render therapist cards:                                        │      │
│  │ ✅ Dr. Ayesha Raza - ₨3500 - ⭐ 4.9                          │      │
│  │ ✅ Dr. Sara Malik - ₨4500 - ⭐ 4.8                           │      │
│  │ ✅ Bilal Chaudhry - ₨2500 - ⭐ 4.7                           │      │
│  │ ✅ Zara Ahmed - ₨3000 - ⭐ 4.6                               │      │
│  └────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔹 REQUEST FLOW #2: GET /api/therapists?track=CAREER&maxFee=3000

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           BROWSER/FRONTEND                               │
│                                                                           │
│  User selects filters: Track=CAREER, Max Fee=₨3000                       │
│                                                                           │
│  fetch('http://localhost:5000/api/therapists?track=CAREER&maxFee=3000')  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                       │
│                                                                           │
│  getTherapists(req, res, next) {                                         │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ req.query = {                                                  │   │
│    │   track: "CAREER"  ← Still a string!                           │   │
│    │   maxFee: "3000"   ← Still a string!                           │   │
│    │ }                                                              │   │
│    │                                                                │   │
│    │ therapistService.getTherapists(req.query)  ← Pass raw params  │   │
│    │                                                                │   │
│    └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          SERVICE                                         │
│              src/services/therapist.service.js                           │
│                                                                           │
│  getTherapists(filters) {                                                │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ const where = { isActive: true }                               │   │
│    │                                                                │   │
│    │ ► FILTER 1: Track                                             │   │
│    │   if (filters.track) {  ✅ "CAREER" is truthy                 │   │
│    │     where.track = filters.track.toUpperCase()                 │   │
│    │     → where.track = "CAREER".toUpperCase() = "CAREER"         │   │
│    │   }                                                            │   │
│    │   Result: where = { isActive: true, track: "CAREER" }        │   │
│    │                                                                │   │
│    │ ► FILTER 2: Specialization                                    │   │
│    │   if (filters.specialization) {  ✗ undefined (not provided)   │   │
│    │   }  → Skipped                                                │   │
│    │                                                                │   │
│    │ ► FILTER 3: Language                                          │   │
│    │   if (filters.language) {  ✗ undefined (not provided)         │   │
│    │   }  → Skipped                                                │   │
│    │                                                                │   │
│    │ ► FILTER 4: Fee Range                                         │   │
│    │   if (filters.minFee || filters.maxFee) {  ✅ "3000" is truthy │   │
│    │     where.feePkr = {}                                         │   │
│    │     if (filters.minFee) { ... }  ✗ Not provided              │   │
│    │     if (filters.maxFee) {  ✅ "3000"                          │   │
│    │       where.feePkr.lte = Number(filters.maxFee)               │   │
│    │       → Number("3000") = 3000 (conversion!)                   │   │
│    │     }                                                          │   │
│    │   }                                                            │   │
│    │   Result: where = {                                            │   │
│    │     isActive: true,                                            │   │
│    │     track: "CAREER",                                           │   │
│    │     feePkr: { lte: 3000 }                                     │   │
│    │   }                                                            │   │
│    │                                                                │   │
│    │ SQL Translation:                                              │   │
│    │   WHERE                                                       │   │
│    │     isActive = true                                           │   │
│    │     AND track = 'CAREER'                                      │   │
│    │     AND feePkr <= 3000                                        │   │
│    │                                                                │   │
│    │ await prisma.therapist.findMany({                             │   │
│    │   where: {...},  ← Complex WHERE clause above                 │   │
│    │   include: {...},                                             │   │
│    │   orderBy: { rating: 'desc' }                                 │   │
│    │ })                                                             │   │
│    │                                                                │   │
│    │ return therapists.map(formatTherapist)                        │   │
│    │                                                                │   │
│    └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      POSTGRESQL DATABASE                                 │
│                                                                           │
│  Query Results:                                                          │
│  ┌────────────────────────────────────────────────────────────────┐      │
│  │ Only 1 therapist matches:                                      │      │
│  │                                                                │      │
│  │ Bilal Chaudhry                                                │      │
│  │   track: CAREER          ✅ Matches                           │      │
│  │   feePkr: 2500           ✅ 2500 <= 3000 (within budget)     │      │
│  │   rating: 4.7                                                 │      │
│  │                                                                │      │
│  │ Other therapists are EXCLUDED:                                │      │
│  │   Dr. Ayesha Raza: track=MENTAL_HEALTH  ✗ Wrong track        │      │
│  │   Dr. Sara Malik: track=MENTAL_HEALTH   ✗ Wrong track        │      │
│  │   Zara Ahmed: track=MENTAL_HEALTH       ✗ Wrong track        │      │
│  └────────────────────────────────────────────────────────────────┘      │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         HTTP RESPONSE                                    │
│                                                                           │
│  {                                                                        │
│    "therapists": [                                                       │
│      {                                                                    │
│        "id": "9afcc15a-6f29-4900-9420-6cf461f103d2",                    │
│        "name": "Bilal Chaudhry",                                        │
│        "email": "bilal@mindbridge.pk",                                 │
│        "title": "Career Counselor & Life Coach",                        │
│        "credentials": "MSc Organizational Psychology, LUMS",            │
│        "feePkr": 2500,  ← Within budget                                │
│        "track": "CAREER",  ← Matches filter                             │
│        "rating": 4.7,                                                   │
│        "specializations": ["Career Counseling", "Life Coaching", "..."], │
│        "languages": ["English", "Urdu", "Punjabi"],                    │
│        ...                                                              │
│      }                                                                    │
│    ]                                                                      │
│  }                                                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER/FRONTEND                                    │
│                                                                           │
│  Filtered results displayed:                                             │
│  ✅ Bilal Chaudhry - ₨2500 - ⭐ 4.7                                     │
│  (Only 1 result, other 3 therapists don't match filters)                 │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔹 REQUEST FLOW #3: GET /api/therapists/:id (Single therapist)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           BROWSER/FRONTEND                               │
│                                                                           │
│  User clicks on Bilal Chaudhry's card → View full profile               │
│                                                                           │
│  fetch('/api/therapists/9afcc15a-6f29-4900-9420-6cf461f103d2')           │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          ROUTES                                          │
│            src/routes/therapist.routes.js                                │
│                                                                           │
│  Request path: GET /api/therapists/9afcc15a-6f29-4900-9420-6cf461f103d2  │
│                                                                           │
│  Route matching (in order):                                              │
│  1. router.get('/', ...)              ✗ No match (path is not just /)   │
│  2. router.get('/:id', ...)           ✅ MATCHES!                       │
│     req.params = { id: '9afcc15a-...' }                                  │
│  3. router.get('/:id/slots', ...)     (Not evaluated, already matched)   │
│                                                                           │
│  Calls: therapistController.getTherapistById(req, res, next)             │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                       │
│                                                                           │
│  getTherapistById(req, res, next) {                                      │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ try {                                                          │   │
│    │   const therapist =                                            │   │
│    │     await therapistService.getTherapistById(req.params.id)     │   │
│    │     ↓                                                          │   │
│    │     '9afcc15a-6f29-4900-9420-6cf461f103d2'  ← Pass UUID      │   │
│    │                                                                │   │
│    │   res.json({ therapist })  ← Send full object                │   │
│    │                                                                │   │
│    │ } catch (err) {                                                │   │
│    │   next(err)  ← Only triggered if service throws              │   │
│    │ }                                                              │   │
│    └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          SERVICE                                         │
│                                                                           │
│  getTherapistById(id) {                                                   │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │ const therapist = await prisma.therapist.findUnique({          │   │
│    │   where: { id: '9afcc15a-6f29-4900-9420-6cf461f103d2' },      │   │
│    │   include: {                                                   │   │
│    │     user: { select: { name, email, initials } },              │   │
│    │     specializations: { select: { name } },                    │   │
│    │     languages: { select: { language } }                       │   │
│    │   }                                                             │   │
│    │ })                                                              │   │
│    │                                                                │   │
│    │ ► FOUND!  therapist = {                                       │   │
│    │     id: '9afcc15a-...',                                        │   │
│    │     userId: 'user-uuid',                                       │   │
│    │     title: 'Career Counselor & Life Coach',                   │   │
│    │     credentials: 'MSc Organizational Psychology, LUMS',        │   │
│    │     about: 'Bilal Chaudhry has spent 8 years...',             │   │
│    │     methodology: 'Solution-Focused Brief Therapy...',          │   │
│    │     feePkr: 2500,                                              │   │
│    │     track: 'CAREER',                                           │   │
│    │     rating: Decimal(4.7),  ← Still Decimal type from DB       │   │
│    │     reviewCount: 89,                                           │   │
│    │     sessionsCount: 0,                                          │   │
│    │     color: '#10B981',                                          │   │
│    │     isActive: true,                                            │   │
│    │     user: {                                                    │   │
│    │       name: 'Bilal Chaudhry',                                  │   │
│    │       email: 'bilal@mindbridge.pk',                            │   │
│    │       initials: 'BC'                                           │   │
│    │     },                                                         │   │
│    │     specializations: [                                         │   │
│    │       { name: 'Career Counseling' },                           │   │
│    │       { name: 'Life Coaching' },                               │   │
│    │       { name: 'Workplace Stress' }                             │   │
│    │     ],                                                         │   │
│    │     languages: [                                               │   │
│    │       { language: 'English' },                                 │   │
│    │       { language: 'Urdu' },                                    │   │
│    │       { language: 'Punjabi' }                                  │   │
│    │     ]                                                          │   │
│    │   }                                                            │   │
│    │                                                                │   │
│    │ if (!therapist) {  ✗ False, so skip error block               │   │
│    │   throw error with status: 404                                │   │
│    │ }                                                              │   │
│    │                                                                │   │
│    │ return formatTherapist(therapist)  ← Transform nested data   │   │
│    │                                                                │   │
│    └────────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         TRANSFORMATION                                   │
│                                                                           │
│  formatTherapist() cleans up the object:                                 │
│                                                                           │
│  INPUT (Raw from Prisma):                                                │
│  {                                                                        │
│    rating: Decimal(4.7),                                                 │
│    specializations: [{ name: 'Career Counseling' }, ...],               │
│    languages: [{ language: 'English' }, ...],                           │
│    user: { name: 'Bilal', ... }  ← Nested                               │
│  }                                                                        │
│                                                                           │
│  ↓ formatTherapist processes it ↓                                        │
│                                                                           │
│  OUTPUT (Clean JSON):                                                    │
│  {                                                                        │
│    rating: 4.7,  ← Decimal converted to plain number                    │
│    specializations: ['Career Counseling', 'Life Coaching', ...],        │
│    languages: ['English', 'Urdu', 'Punjabi'],                           │
│    name: 'Bilal Chaudhry',  ← user.name brought to top level           │
│    email: 'bilal@mindbridge.pk',  ← user.email brought to top level    │
│    initials: 'BC'  ← user.initials brought to top level                │
│  }                                                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         HTTP RESPONSE                                    │
│                                                                           │
│  HTTP/1.1 200 OK                                                         │
│                                                                           │
│  {                                                                        │
│    "therapist": {                                                        │
│      "id": "9afcc15a-6f29-4900-9420-6cf461f103d2",                      │
│      "name": "Bilal Chaudhry",                                          │
│      "email": "bilal@mindbridge.pk",                                    │
│      "initials": "BC",                                                   │
│      "title": "Career Counselor & Life Coach",                          │
│      "credentials": "MSc Organizational Psychology, LUMS",              │
│      "about": "Bilal Chaudhry has spent 8 years guiding professionals   │
│               through career pivots, job searches, and workplace        │
│               conflicts. He specializes in helping young graduates      │
│               and mid-career professionals find their direction.",      │
│      "methodology": "Solution-Focused Brief Therapy, Motivational       │
│                    Interviewing, Strengths-Based Coaching.",           │
│      "feePkr": 2500,                                                     │
│      "track": "CAREER",                                                 │
│      "rating": 4.7,                                                     │
│      "reviewCount": 89,                                                  │
│      "sessionsCount": 0,                                                 │
│      "color": "#10B981",                                                 │
│      "isActive": true,                                                   │
│      "specializations": ["Career Counseling", "Life Coaching", "Workplace Stress"],
│      "languages": ["English", "Urdu", "Punjabi"]                        │
│    }                                                                      │
│  }                                                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER/FRONTEND                                    │
│                                                                           │
│  Profile page displays:                                                  │
│  ╔════════════════════════════════════════════════════════════════════╗  │
│  ║                     BILAL CHAUDHRY                                  ║  │
│  ║          Career Counselor & Life Coach                             ║  │
│  ║          ⭐ 4.7 (89 reviews) • ₨2500/session                       ║  │
│  ║                                                                    ║  │
│  ║ CREDENTIALS:                                                       ║  │
│  ║ MSc Organizational Psychology, LUMS                                ║  │
│  ║                                                                    ║  │
│  ║ ABOUT:                                                             ║  │
│  ║ Bilal Chaudhry has spent 8 years guiding professionals through     ║  │
│  ║ career pivots, job searches, and workplace conflicts. He          ║  │
│  ║ specializes in helping young graduates and mid-career             ║  │
│  ║ professionals find their direction.                                ║  │
│  ║                                                                    ║  │
│  ║ METHODOLOGY:                                                       ║  │
│  ║ Solution-Focused Brief Therapy, Motivational Interviewing,        ║  │
│  ║ Strengths-Based Coaching.                                         ║  │
│  ║                                                                    ║  │
│  ║ SPECIALIZATIONS:                                                   ║  │
│  ║ 🏷️ Career Counseling  🏷️ Life Coaching  🏷️ Workplace Stress      ║  │
│  ║                                                                    ║  │
│  ║ LANGUAGES:                                                         ║  │
│  ║ 🗣️ English  🗣️ Urdu  🗣️ Punjabi                                  ║  │
│  ║                                                                    ║  │
│  ║ [ BOOK SESSION ]                                                   ║  │
│  ╚════════════════════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔹 REQUEST FLOW #4: Error Case (Therapist Not Found)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                           BROWSER/FRONTEND                               │
│                                                                           │
│  fetch('/api/therapists/00000000-0000-0000-0000-000000000000')  ← Bad ID  │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         CONTROLLER                                       │
│                                                                           │
│  getTherapistById(req, res, next) {                                      │
│    try {                                                                 │
│      await therapistService.getTherapistById(                            │
│        '00000000-0000-0000-0000-000000000000'                            │
│      )                                                                    │
│                                                                           │
│      ↓ Service will throw an error ↓                                     │
│                                                                           │
│    } catch (err) {                                                        │
│      next(err)  ← Catches the error and passes to middleware             │
│    }                                                                      │
│  }                                                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          SERVICE                                         │
│                                                                           │
│  getTherapistById(id) {                                                   │
│    const therapist = await prisma.therapist.findUnique({                │
│      where: { id: '00000000-0000-0000-0000-000000000000' }              │
│    })                                                                     │
│                                                                           │
│    ✗ NOT FOUND! therapist = null                                        │
│                                                                           │
│    if (!therapist) {  ✅ TRUE                                            │
│      const error = new Error('Therapist not found.')                    │
│      error.status = 404  ← CUSTOM PROPERTY SET HERE                     │
│      throw error  ← ERROR THROWN                                        │
│    }                                                                     │
│  }                                                                        │
│                                                                           │
│  ↑ This throw is caught by controller's catch block ↑                   │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               │ catch (err) { next(err) }
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                    ERROR HANDLER MIDDLEWARE                              │
│            src/middleware/errorHandler.js (registered last)              │
│                                                                           │
│  function errorHandler(err, req, res, next) {                            │
│    console.error(err.stack)  ← Log for debugging                         │
│                                                                           │
│    const status = err.status || 500                                      │
│            ↑                ↑                                             │
│         404 (set        (default if no)                                  │
│         by service)     .status property)                                │
│                                                                           │
│    const message = err.message  → "Therapist not found."                 │
│                                                                           │
│    res.status(404).json({                                                │
│      error: "Therapist not found.",                                      │
│      ...(                                                                │
│        process.env.NODE_ENV === 'development' &&                         │
│        { stack: err.stack }  ← Only in dev, not in production            │
│      )                                                                    │
│    })                                                                     │
│  }                                                                        │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                         HTTP RESPONSE                                    │
│                                                                           │
│  HTTP/1.1 404 Not Found                                                  │
│  Content-Type: application/json                                          │
│                                                                           │
│  {                                                                        │
│    "error": "Therapist not found.",                                      │
│    "stack": "Error: Therapist not found.\n    at Module.getTherapistById
│              (file:///D:/Sukoon/Backend/src/services/therapist.service.js:54:19)\n
│             at async getTherapistById (...)"                              │
│  }                                                                        │
│                                                                           │
│  (stack trace only shown in DEVELOPMENT)                                 │
└──────────────────────────────┬──────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      BROWSER/FRONTEND                                    │
│                                                                           │
│  if (!response.ok) {  ← HTTP 404 is not ok                               │
│    const error = await response.json()                                   │
│    console.error(error.error)  → "Therapist not found."                  │
│    showNotification('Therapist no longer available')                     │
│  }                                                                        │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📋 Middleware Execution Order

```
CLIENT REQUEST
        │
        ▼
┌─────────────────────────────────────────┐
│ 1. CORS Middleware                      │
│    app.use(cors())                      │
│    Check request origin                 │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 2. JSON Parser Middleware               │
│    app.use(express.json())              │
│    Parse JSON body                      │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 3. Health Check Route                   │
│    app.get('/api/health', ...)          │
│    Return status (if matches)           │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 4. API Routes (in order)                │
│    app.use('/api/auth', ...)            │
│    app.use('/api/therapists', ...)  ← If matches, delegate to therapistRoutes
│    app.use('/api/sessions', ...)    │
│    app.use('/api/payments', ...)    │
│    app.use('/api/admin', ...)       │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 5. 404 Handler                          │
│    app.use((req, res) => {              │
│      res.status(404).json({...})        │
│    })                                    │
│                                         │
│    (Matches if no route found)          │
└─────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────┐
│ 6. Error Handler (MUST BE LAST)         │
│    app.use(errorHandler)                │
│                                         │
│    Catches errors from any route        │
│    or middleware above                  │
└─────────────────────────────────────────┘
        │
        ▼
RESPONSE SENT TO CLIENT
```

---

## 🎯 Summary: Data Flow Overview

```
USER INTERACTION
     │
     ├─ Browses therapists → GET /api/therapists
     │                          └─→ List (all or filtered)
     │
     ├─ Clicks on therapist → GET /api/therapists/:id
     │                         └─→ Full profile
     │
     └─ Views availability → GET /api/therapists/:id/slots
                               └─→ Empty array (Phase 4 will populate)

EACH REQUEST:
  Frontend                    ↓
    └→ HTTP Request
         └→ Express Server
             └→ Router (matches path)
                 └→ Controller (extract params)
                     └→ Service (business logic)
                         └→ Prisma (database translator)
                             └→ PostgreSQL (execute SQL)
                                 └→ Prisma (format results)
                                     └→ Service (transform data)
                                         └→ Controller (send response)
                                             └→ HTTP Response
                                                 └→ Frontend displays

ERROR PATH:
  Error thrown in Service
    └→ Caught by Controller
        └→ next(err)
            └→ Error Handler Middleware
                └→ Formats as JSON
                    └→ HTTP Error Response
```

---

## ✅ Test Results Correlation

```
TEST A: List all therapists
  ✅ GET /api/therapists
  ✅ Returns 4 therapists
  ✅ Sorted by rating (4.9 → 4.8 → 4.7 → 4.6)
  
  Shows: Basic list, rating conversion (Decimal → number), array formatting

TEST B: Filter by track
  ✅ GET /api/therapists?track=CAREER
  ✅ WHERE clause: track = 'CAREER'
  ✅ Returns 1 therapist (Bilal)
  
  Shows: Query parameter parsing, string.toUpperCase(), enum filtering

TEST C: Filter by specialization (case-insensitive)
  ✅ GET /api/therapists?specialization=anxiety
  ✅ WHERE clause: specializations.some({ name ILIKE '%anxiety%' })
  ✅ Returns 1 therapist (Ayesha)
  
  Shows: Relational filtering, case-insensitive search

TEST D: Filter by language
  ✅ GET /api/therapists?language=punjabi
  ✅ WHERE clause: languages.some({ language ILIKE '%punjabi%' })
  ✅ Returns 1 therapist (Bilal)
  
  Shows: Many-to-many filtering

TEST E: Filter by fee range
  ✅ GET /api/therapists?minFee=3000&maxFee=4000
  ✅ WHERE clause: feePkr >= 3000 AND feePkr <= 4000
  ✅ Returns 2 therapists (Ayesha 3500, Zara 3000)
  
  Shows: String-to-number conversion, numeric range queries

TEST F: Get single therapist
  ✅ GET /api/therapists/:id
  ✅ WHERE clause: id = UUID
  ✅ Returns full object with methodology field
  
  Shows: findUnique() by ID, all fields populated

TEST G: Non-existent therapist
  ✅ GET /api/therapists/:id (fake ID)
  ✅ findUnique() returns null
  ✅ Service throws error with status: 404
  ✅ Controller catches, calls next(err)
  ✅ Error handler sends 404 JSON response
  
  Shows: Complete error flow

TEST H: Get slots (empty)
  ✅ GET /api/therapists/:id/slots
  ✅ WHERE clause: isBooked = false
  ✅ Returns empty array (no slots seeded)
  
  Shows: Handling empty results gracefully
```
