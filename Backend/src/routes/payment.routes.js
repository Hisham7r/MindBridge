import { Router } from 'express'
import auth from '../middleware/auth.js'
import requireRole from '../middleware/requireRole.js'
import {
  submitPayment,
  getPayment,
  approvePayment,
  rejectPayment,
} from '../controllers/payment.controller.js'

const router = Router()

// Patient submits a payment for one of their sessions.
router.post('/', auth, requireRole('PATIENT'), submitPayment)

// Owner patient or admin can read a payment.
router.get('/:id', auth, getPayment)

// Admin reviews payments.
router.patch('/:id/approve', auth, requireRole('ADMIN'), approvePayment)
router.patch('/:id/reject', auth, requireRole('ADMIN'), rejectPayment)

export default router
