import prisma from '../config/db.js'

/**
 * Record a new payment submission (screenshot URL + txn ID).
 * Status defaults to PENDING — admin must approve.
 * Phase 2 implementation stub.
 */
export const submitPayment = async ({ sessionId, patientId, amountPkr, serviceFee, txnId, screenshotUrl }) => {
  throw new Error('submitPayment service not yet implemented')
}

/**
 * Return a single payment record by ID.
 * Phase 2 implementation stub.
 */
export const getPaymentById = async (id) => {
  throw new Error('getPaymentById service not yet implemented')
}

/**
 * Approve a payment — sets status to APPROVED, updates session to CONFIRMED.
 * Phase 2 implementation stub.
 */
export const approvePayment = async (id, reviewedBy) => {
  throw new Error('approvePayment service not yet implemented')
}

/**
 * Reject a payment — sets status to REJECTED, keeps session as PENDING_PAYMENT.
 * Phase 2 implementation stub.
 */
export const rejectPayment = async (id, reviewedBy) => {
  throw new Error('rejectPayment service not yet implemented')
}
