// session.controller.js
// Handles: createSession, getSession, updateSessionStatus, listPatientSessions

import * as sessionService from '../services/session.service.js'
import { createSessionSchema, updateStatusSchema }
  from '../validators/session.validator.js'

export const createSession = async (req, res, next) => {
  try {
    const parsed = createSessionSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    // patientId is taken from the authenticated token, never the request body.
    const session = await sessionService.createSession({
      patientId: req.user.id,
      ...parsed.data,
    })

    return res.status(201).json({
      message: 'Session booked. Please complete payment to confirm.',
      session,
    })
  } catch (err) {
    next(err)
  }
}

export const getSession = async (req, res, next) => {
  try {
    const session = await sessionService.getSessionById(req.params.id, req.user)
    return res.status(200).json({ session })
  } catch (err) {
    next(err)
  }
}

export const updateSessionStatus = async (req, res, next) => {
  try {
    const parsed = updateStatusSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const session = await sessionService.updateStatus(
      req.params.id,
      parsed.data.status,
      req.user
    )

    return res.status(200).json({
      message: 'Session status updated.',
      session,
    })
  } catch (err) {
    next(err)
  }
}

export const listPatientSessions = async (req, res, next) => {
  try {
    const sessions = await sessionService.getSessionsByPatient(req.user.id)
    return res.status(200).json({ sessions })
  } catch (err) {
    next(err)
  }
}
