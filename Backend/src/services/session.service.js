import prisma from '../config/db.js'

// Shared shape for every session response — pulls just the related fields the
// client needs, never the patient/therapist password hashes.
const sessionInclude = {
  patient: {
    select: { id: true, name: true, email: true, initials: true },
  },
  therapist: {
    select: {
      id: true,
      userId: true,
      title: true,
      feePkr: true,
      track: true,
      user: { select: { name: true, email: true, initials: true } },
    },
  },
  slot: { select: { id: true, slotDatetime: true } },
  payment: { select: { id: true, status: true, totalPkr: true } },
}

// Flattens the nested Prisma result into a clean client-facing object.
// Note: therapist.userId is intentionally dropped here (used only for authz).
function formatSession(s) {
  return {
    id: s.id,
    status: s.status,
    sessionNumber: s.sessionNumber,
    sessionType: s.sessionType,
    durationMins: s.durationMins,
    zoomLink: s.zoomLink,
    notes: s.notes,
    createdAt: s.createdAt,
    slot: s.slot
      ? { id: s.slot.id, datetime: s.slot.slotDatetime }
      : null,
    patient: s.patient
      ? {
          id: s.patient.id,
          name: s.patient.name,
          email: s.patient.email,
          initials: s.patient.initials,
        }
      : null,
    therapist: s.therapist
      ? {
          id: s.therapist.id,
          name: s.therapist.user.name,
          title: s.therapist.title,
          feePkr: s.therapist.feePkr,
          track: s.therapist.track,
          initials: s.therapist.user.initials,
        }
      : null,
    payment: s.payment || null,
  }
}

// Throws 403 unless the requester owns the session (as patient or therapist) or is an admin.
function assertCanAccessSession(session, requester) {
  if (requester.role === 'ADMIN') return
  if (session.patientId === requester.id) return
  if (session.therapist && session.therapist.userId === requester.id) return

  const error = new Error('You do not have permission to view this session.')
  error.status = 403
  throw error
}

/**
 * Book a session for a patient with a specific therapist slot.
 * Atomically claims the slot (prevents double-booking) and creates the Session.
 */
export const createSession = async ({ patientId, therapistId, slotId, sessionType }) => {
  const therapist = await prisma.therapist.findUnique({ where: { id: therapistId } })
  if (!therapist) {
    const error = new Error('Therapist not found.')
    error.status = 404
    throw error
  }
  if (!therapist.isActive) {
    const error = new Error('This therapist is not currently accepting bookings.')
    error.status = 409
    throw error
  }

  const session = await prisma.$transaction(async (tx) => {
    const slot = await tx.availabilitySlot.findUnique({ where: { id: slotId } })

    if (!slot) {
      const error = new Error('Time slot not found.')
      error.status = 404
      throw error
    }
    if (slot.therapistId !== therapistId) {
      const error = new Error('This slot does not belong to the selected therapist.')
      error.status = 400
      throw error
    }
    if (slot.slotDatetime < new Date()) {
      const error = new Error('Cannot book a slot in the past.')
      error.status = 400
      throw error
    }

    // Atomically claim the slot — only flips if it is still unbooked.
    // If a concurrent request already booked it, count is 0 and we reject.
    const claimed = await tx.availabilitySlot.updateMany({
      where: { id: slotId, isBooked: false },
      data: { isBooked: true },
    })
    if (claimed.count === 0) {
      const error = new Error('This slot has already been booked.')
      error.status = 409
      throw error
    }

    // sessionNumber = this patient's Nth session with this therapist.
    const priorCount = await tx.session.count({ where: { patientId, therapistId } })

    return tx.session.create({
      data: {
        patientId,
        therapistId,
        slotId,
        sessionType,
        sessionNumber: priorCount + 1,
        status: 'PENDING_PAYMENT',
      },
      include: sessionInclude,
    })
  })

  return formatSession(session)
}

/**
 * Return a single session by ID. Enforces ownership/role access.
 */
export const getSessionById = async (id, requester) => {
  const session = await prisma.session.findUnique({
    where: { id },
    include: sessionInclude,
  })

  if (!session) {
    const error = new Error('Session not found.')
    error.status = 404
    throw error
  }

  assertCanAccessSession(session, requester)

  return formatSession(session)
}

/**
 * Update a session's status. Only the session's therapist or an admin may do this.
 * Terminal states (COMPLETED / CANCELLED) cannot be changed.
 */
export const updateStatus = async (id, status, requester) => {
  const session = await prisma.session.findUnique({
    where: { id },
    include: sessionInclude,
  })

  if (!session) {
    const error = new Error('Session not found.')
    error.status = 404
    throw error
  }

  if (requester.role !== 'ADMIN' && session.therapist.userId !== requester.id) {
    const error = new Error('You can only update your own sessions.')
    error.status = 403
    throw error
  }

  if (['COMPLETED', 'CANCELLED'].includes(session.status)) {
    const error = new Error(`This session is already ${session.status} and cannot be updated.`)
    error.status = 409
    throw error
  }

  const updated = await prisma.session.update({
    where: { id },
    data: { status },
    include: sessionInclude,
  })

  return formatSession(updated)
}

/**
 * Return all sessions for a given patient, newest first.
 */
export const getSessionsByPatient = async (patientId) => {
  const sessions = await prisma.session.findMany({
    where: { patientId },
    include: sessionInclude,
    orderBy: { createdAt: 'desc' },
  })

  return sessions.map(formatSession)
}
