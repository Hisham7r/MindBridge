import { Router } from 'express'

const router = Router()

// Stub — Phase 2 will implement: POST /, GET /:id, PATCH /:id/status
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Session routes not yet implemented' })
})

export default router
