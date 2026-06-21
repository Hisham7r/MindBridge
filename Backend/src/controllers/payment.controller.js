// payment.controller.js
// Handles: submitPayment, getPayment, approvePayment, rejectPayment

import * as paymentService from '../services/payment.service.js'
import { submitPaymentSchema } from '../validators/payment.validator.js'

export const submitPayment = async (req, res, next) => {
  try {
    const parsed = submitPaymentSchema.safeParse(req.body)
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
    const payment = await paymentService.submitPayment({
      patientId: req.user.id,
      ...parsed.data,
    })

    return res.status(201).json({
      message: 'Payment submitted. An admin will review it shortly.',
      payment,
    })
  } catch (err) {
    next(err)
  }
}

export const getPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.getPaymentById(req.params.id, req.user)
    return res.status(200).json({ payment })
  } catch (err) {
    next(err)
  }
}

export const approvePayment = async (req, res, next) => {
  try {
    const payment = await paymentService.approvePayment(req.params.id, req.user.id)
    return res.status(200).json({
      message: 'Payment approved. Session confirmed.',
      payment,
    })
  } catch (err) {
    next(err)
  }
}

export const rejectPayment = async (req, res, next) => {
  try {
    const payment = await paymentService.rejectPayment(req.params.id, req.user.id)
    return res.status(200).json({
      message: 'Payment rejected.',
      payment,
    })
  } catch (err) {
    next(err)
  }
}
