import prisma from '../config/db.js'

// Platform service fee added on top of the therapist's fee.
// Mirrors the Payment.serviceFee schema default; set explicitly so the
// totalPkr math is never ambiguous.
const SERVICE_FEE = 250

function formatPayment(p) {
  return {
    id: p.id,
    sessionId: p.sessionId,
    patientId: p.patientId,
    amountPkr: p.amountPkr,
    serviceFee: p.serviceFee,
    totalPkr: p.totalPkr,
    txnId: p.txnId,
    screenshotUrl: p.screenshotUrl,
    status: p.status,
    reviewedBy: p.reviewedBy,
    createdAt: p.createdAt,
    approvedAt: p.approvedAt,
  }
}

// Throws 403 unless the requester owns the payment or is an admin.
function assertCanAccessPayment(payment, requester) {
  if (requester.role === 'ADMIN') return
  if (payment.patientId === requester.id) return

  const error = new Error('You do not have permission to view this payment.')
  error.status = 403
  throw error
}

/**
 * Record a payment submission for a session (manual EasyPaisa flow).
 * The charged amount is derived from the therapist's fee — never trusted from
 * the client. A previously REJECTED payment for the same session is reopened
 * (set back to PENDING) so the patient can resubmit.
 */
export const submitPayment = async ({ sessionId, patientId, txnId, screenshotUrl }) => {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { therapist: { select: { feePkr: true } } },
  })

  if (!session) {
    const error = new Error('Session not found.')
    error.status = 404
    throw error
  }
  if (session.patientId !== patientId) {
    const error = new Error('You can only pay for your own sessions.')
    error.status = 403
    throw error
  }
  if (session.status !== 'PENDING_PAYMENT') {
    const error = new Error('This session is not awaiting payment.')
    error.status = 409
    throw error
  }

  const amountPkr = session.therapist.feePkr
  const serviceFee = SERVICE_FEE
  const totalPkr = amountPkr + serviceFee

  const existing = await prisma.payment.findUnique({ where: { sessionId } })

  if (existing) {
    if (existing.status === 'APPROVED') {
      const error = new Error('This session has already been paid for.')
      error.status = 409
      throw error
    }
    if (existing.status === 'PENDING') {
      const error = new Error('A payment for this session is already under review.')
      error.status = 409
      throw error
    }

    // existing.status === 'REJECTED' → reopen for resubmission.
    const reopened = await prisma.payment.update({
      where: { sessionId },
      data: {
        txnId,
        screenshotUrl,
        amountPkr,
        serviceFee,
        totalPkr,
        status: 'PENDING',
        reviewedBy: null,
        approvedAt: null,
      },
    })
    return formatPayment(reopened)
  }

  const payment = await prisma.payment.create({
    data: {
      sessionId,
      patientId,
      amountPkr,
      serviceFee,
      totalPkr,
      txnId,
      screenshotUrl,
      status: 'PENDING',
    },
  })

  return formatPayment(payment)
}

/**
 * Return a single payment by ID. Enforces ownership/role access.
 */
export const getPaymentById = async (id, requester) => {
  const payment = await prisma.payment.findUnique({ where: { id } })

  if (!payment) {
    const error = new Error('Payment not found.')
    error.status = 404
    throw error
  }

  assertCanAccessPayment(payment, requester)

  return formatPayment(payment)
}

/**
 * Approve a payment — sets it APPROVED and confirms the linked session.
 * Both updates run in one transaction so they can't drift apart.
 */
export const approvePayment = async (id, reviewedBy) => {
  const payment = await prisma.payment.findUnique({ where: { id } })

  if (!payment) {
    const error = new Error('Payment not found.')
    error.status = 404
    throw error
  }
  if (payment.status !== 'PENDING') {
    const error = new Error(`Payment is already ${payment.status} and cannot be approved.`)
    error.status = 409
    throw error
  }

  const approved = await prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy,
        approvedAt: new Date(),
      },
    })

    await tx.session.update({
      where: { id: payment.sessionId },
      data: { status: 'CONFIRMED' },
    })

    return updated
  })

  return formatPayment(approved)
}

/**
 * Reject a payment — sets it REJECTED. The session stays PENDING_PAYMENT so the
 * patient can submit a corrected payment.
 */
export const rejectPayment = async (id, reviewedBy) => {
  const payment = await prisma.payment.findUnique({ where: { id } })

  if (!payment) {
    const error = new Error('Payment not found.')
    error.status = 404
    throw error
  }
  if (payment.status !== 'PENDING') {
    const error = new Error(`Payment is already ${payment.status} and cannot be rejected.`)
    error.status = 409
    throw error
  }

  const rejected = await prisma.payment.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy,
    },
  })

  return formatPayment(rejected)
}
