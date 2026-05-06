import { Router } from 'express'

const router = Router()

// Stub — Phase 2 will implement: GET /users, GET /stats, PATCH /payments/:id/review
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Admin routes not yet implemented' })
})

export default router
