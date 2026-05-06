import { Router } from 'express'

const router = Router()

// Stub — Phase 2 will implement: POST /, GET /:id, PATCH /:id/approve, PATCH /:id/reject
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Payment routes not yet implemented' })
})

export default router
