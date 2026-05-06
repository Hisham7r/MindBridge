import { Router } from 'express'

const router = Router()

// Stub — Phase 2 will implement: POST /register, POST /login, POST /logout, GET /me
router.get('/', (req, res) => {
  res.status(501).json({ message: 'Auth routes not yet implemented' })
})

export default router
