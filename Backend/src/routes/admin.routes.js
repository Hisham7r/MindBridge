import { Router } from 'express'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/requireRole.js'
import {
  getStats,
  listUsers,
  listSessions,
  listPayments,
} from '../controllers/admin.controller.js'

const router = Router()

// Every admin route requires a valid token AND the ADMIN role.
router.get('/stats', auth, requireRole('ADMIN'), getStats)
router.get('/users', auth, requireRole('ADMIN'), listUsers)
router.get('/sessions', auth, requireRole('ADMIN'), listSessions)
router.get('/payments', auth, requireRole('ADMIN'), listPayments)

export default router
