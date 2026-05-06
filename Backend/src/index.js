import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

// Route imports
import authRoutes from './routes/auth.routes.js'
import therapistRoutes from './routes/therapist.routes.js'
import sessionRoutes from './routes/session.routes.js'
import paymentRoutes from './routes/payment.routes.js'
import adminRoutes from './routes/admin.routes.js'

// Middleware imports
import errorHandler from './middleware/errorHandler.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// ── Core Middleware ───────────────────────────────────────────────────────────
app.use(cors()) // is the request from an allowed origin?
app.use(express.json()) // parse JSON bodies into JS objects

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'MindBridge API running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  })
})

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes)
app.use('/api/therapists', therapistRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/admin', adminRoutes)

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found` })
})

// ── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler)

// ── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  MindBridge API running on port ${PORT}`)
  console.log(`🌿  Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`📡  Health check: http://localhost:${PORT}/api/health`)
})

export default app
