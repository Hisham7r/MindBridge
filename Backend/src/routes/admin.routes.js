import { Router } from 'express'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/requireRole.js'
import {
  getStats,
  listUsers,
  listSessions,
  listPayments,
  listTherapists,
  getUserDetail,
  listTherapistApplications,
  approveTherapist,
  rejectTherapist,
  suspendTherapist,
  reactivateTherapist,
} from '../controllers/admin.controller.js'

const router = Router()

// Every admin route requires a valid token AND the ADMIN role.
router.get('/stats', auth, requireRole('ADMIN'), getStats)
router.get('/users', auth, requireRole('ADMIN'), listUsers)
router.get('/users/:id', auth, requireRole('ADMIN'), getUserDetail)
router.get('/sessions', auth, requireRole('ADMIN'), listSessions)
router.get('/payments', auth, requireRole('ADMIN'), listPayments)

// Therapist roster (all statuses) + suspend / reactivate
router.get('/therapists', auth, requireRole('ADMIN'), listTherapists)
router.patch('/therapists/:id/suspend', auth, requireRole('ADMIN'), suspendTherapist)
router.patch('/therapists/:id/reactivate', auth, requireRole('ADMIN'), reactivateTherapist)

// Therapist application review queue
router.get('/therapist-applications', auth, requireRole('ADMIN'), listTherapistApplications)
router.patch('/therapists/:id/approve', auth, requireRole('ADMIN'), approveTherapist)
router.patch('/therapists/:id/reject', auth, requireRole('ADMIN'), rejectTherapist)

export default router
