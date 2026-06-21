import { Router } from 'express'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/requireRole.js'
import {
  createSession,
  getSession,
  updateSessionStatus,
  listPatientSessions,
} from '../controllers/session.controller.js'

const router = Router()

// Patient books a session and lists their own sessions.
router.post('/', auth, requireRole('PATIENT'), createSession)
router.get('/my', auth, requireRole('PATIENT'), listPatientSessions)

// Any authenticated party involved in the session (patient, therapist, admin)
// can read it — ownership is enforced in the service layer.
router.get('/:id', auth, getSession)

// Therapists (for their own sessions) and admins can change status.
router.patch('/:id/status', auth, requireRole('THERAPIST', 'ADMIN'), updateSessionStatus)

export default router
