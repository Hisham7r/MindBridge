import { Router } from 'express'

const router = Router()

// Stub — Phase 2 will implement: GET /, GET /:id, GET /:id/slots, PATCH /:id
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Therapist routes not yet implemented' })
})

export default router
