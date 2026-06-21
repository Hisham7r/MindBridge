// admin.controller.js
// Handles: getStats, listUsers, listSessions, listPayments
// All routes are admin-only (enforced via requireRole in admin.routes.js).

import * as adminService from '../services/admin.service.js'

const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

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
