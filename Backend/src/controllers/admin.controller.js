// admin.controller.js
// Handles: getStats, listUsers, listSessions, listPayments
// All routes are admin-only (enforced via requireRole in admin.routes.js).

import * as adminService from '../services/admin.service.js'
import { rejectTherapistSchema } from '../validators/admin.validator.js'

const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']
const THERAPIST_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']

export const getStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats()
    return res.status(200).json({ stats })
  } catch (err) {
    next(err)
  }
}

export const listUsers = async (req, res, next) => {
  try {
    const users = await adminService.listUsers()
    return res.status(200).json({ users })
  } catch (err) {
    next(err)
  }
}

export const listSessions = async (req, res, next) => {
  try {
    const sessions = await adminService.listSessions()
    return res.status(200).json({ sessions })
  } catch (err) {
    next(err)
  }
}

export const listTherapistApplications = async (req, res, next) => {
  try {
    const { status } = req.query
    if (status && !THERAPIST_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status filter. Use DRAFT, PENDING, APPROVED, or REJECTED.',
      })
    }

    const applications = await adminService.listTherapistApplications(status)
    return res.status(200).json({ applications })
  } catch (err) {
    next(err)
  }
}

export const approveTherapist = async (req, res, next) => {
  try {
    const therapist = await adminService.approveTherapist(req.params.id, req.user.id)
    return res.status(200).json({
      message: 'Therapist approved — profile is now live.',
      therapist,
    })
  } catch (err) {
    next(err)
  }
}

export const rejectTherapist = async (req, res, next) => {
  try {
    const parsed = rejectTherapistSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const therapist = await adminService.rejectTherapist(
      req.params.id,
      req.user.id,
      parsed.data.reason
    )
    return res.status(200).json({
      message: 'Therapist application rejected.',
      therapist,
    })
  } catch (err) {
    next(err)
  }
}

export const listPayments = async (req, res, next) => {
  try {
    const { status } = req.query
    if (status && !PAYMENT_STATUSES.includes(status)) {
      return res.status(400).json({
        error: 'Invalid status filter. Use PENDING, APPROVED, or REJECTED.',
      })
    }

    const payments = await adminService.listPayments(status)
    return res.status(200).json({ payments })
  } catch (err) {
    next(err)
  }
}
