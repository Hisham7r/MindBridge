import prisma from '../config/db.js'
import { sendTherapistApproved, sendTherapistRejected } from './email.service.js'

const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']
const THERAPIST_STATUSES = ['DRAFT', 'PENDING', 'APPROVED', 'REJECTED']

/**
 * Platform-wide counts and revenue for the admin dashboard.
 * Revenue = sum of totalPkr across APPROVED payments only.
 */
export const getDashboardStats = async () => {
  const [
    totalUsers,
    totalPatients,
    totalTherapists,
    totalAdmins,
    totalSessions,
    totalPayments,
    pendingPayments,
    approvedPayments,
    rejectedPayments,
    sessionStatusGroups,
    revenueAgg,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.user.count({ where: { role: 'THERAPIST' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.session.count(),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'APPROVED' } }),
    prisma.payment.count({ where: { status: 'REJECTED' } }),
    prisma.session.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.payment.aggregate({
      _sum: { totalPkr: true },
      where: { status: 'APPROVED' },
    }),
  ])

  const sessionsByStatus = sessionStatusGroups.reduce((acc, g) => {
    acc[g.status] = g._count._all
    return acc
  }, {})

  return {
    users: {
      total: totalUsers,
      patients: totalPatients,
      therapists: totalTherapists,
      admins: totalAdmins,
    },
    sessions: {
      total: totalSessions,
      byStatus: sessionsByStatus,
    },
    payments: {
      total: totalPayments,
      pending: pendingPayments,
      approved: approvedPayments,
      rejected: rejectedPayments,
    },
    revenuePkr: revenueAgg._sum.totalPkr || 0,
  }
}

/**
 * All users, newest first, with password hashes excluded via select.
 */
export const listUsers = async () => {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      initials: true,
      phone: true,
      language: true,
      isVerified: true,
      createdAt: true,
    },
  })
}

/**
 * All sessions, newest first, with a lean oversight shape.
 */
export const listSessions = async () => {
  const sessions = await prisma.session.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      therapist: {
        select: { id: true, title: true, user: { select: { name: true } } },
      },
      slot: { select: { slotDatetime: true } },
      payment: { select: { id: true, status: true, totalPkr: true } },
    },
  })

  return sessions.map(s => ({
    id: s.id,
    status: s.status,
    sessionNumber: s.sessionNumber,
    sessionType: s.sessionType,
    createdAt: s.createdAt,
    slotDatetime: s.slot ? s.slot.slotDatetime : null,
    patient: s.patient,
    therapist: s.therapist
      ? { id: s.therapist.id, name: s.therapist.user.name, title: s.therapist.title }
      : null,
    payment: s.payment || null,
  }))
}

/**
 * Therapist applications for the admin review queue, filtered by review
 * status (default PENDING). Returns the full application shape the admin
 * needs to make a decision.
 */
export const listTherapistApplications = async (status = 'PENDING') => {
  const where = {}
  if (status && THERAPIST_STATUSES.includes(status)) {
    where.status = status
  }

  const therapists = await prisma.therapist.findMany({
    where,
    include: {
      user: { select: { name: true, email: true, initials: true, createdAt: true } },
      specializations: { select: { name: true } },
      languages: { select: { language: true } },
    },
  })

  return therapists.map(t => ({
    id: t.id,
    name: t.user.name,
    email: t.user.email,
    initials: t.user.initials,
    registeredAt: t.user.createdAt,
    title: t.title,
    licenseNumber: t.licenseNumber,
    credentials: t.credentials,
    about: t.about,
    methodology: t.methodology,
    feePkr: t.feePkr,
    track: t.track,
    status: t.status,
    rejectionReason: t.rejectionReason,
    reviewedAt: t.reviewedAt,
    specializations: t.specializations.map(s => s.name),
    languages: t.languages.map(l => l.language),
  }))
}

/**
 * Load a PENDING therapist application (with the user attached) or throw.
 * Only PENDING applications can be approved/rejected — keeps the review
 * flow predictable and prevents double-decisions.
 */
const getPendingTherapist = async (id) => {
  const therapist = await prisma.therapist.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true } } },
  })

  if (!therapist) {
    const error = new Error('Therapist application not found.')
    error.status = 404
    throw error
  }

  if (therapist.status !== 'PENDING') {
    const error = new Error(`This application is not pending review (current status: ${therapist.status}).`)
    error.status = 409
    throw error
  }

  return therapist
}

/**
 * Approve a pending therapist: goes live (isActive), user marked verified.
 * The notification email is best-effort — the approval commits regardless.
 */
export const approveTherapist = async (id, adminId) => {
  const therapist = await getPendingTherapist(id)

  const [updated] = await prisma.$transaction([
    prisma.therapist.update({
      where: { id },
      data: {
        status: 'APPROVED',
        isActive: true,
        rejectionReason: null,
        reviewedAt: new Date(),
        reviewedBy: adminId,
      },
    }),
    prisma.user.update({
      where: { id: therapist.user.id },
      data: { isVerified: true },
    }),
  ])

  try {
    await sendTherapistApproved({ name: therapist.user.name, email: therapist.user.email })
  } catch (err) {
    console.warn('[admin] approval email failed (approval still saved):', err.message)
  }

  return updated
}

/**
 * Reject a pending therapist with a reason. Profile stays hidden; the
 * therapist sees the reason in Settings and can edit + resubmit.
 * The notification email is best-effort — the rejection commits regardless.
 */
export const rejectTherapist = async (id, adminId, reason) => {
  const therapist = await getPendingTherapist(id)

  const updated = await prisma.therapist.update({
    where: { id },
    data: {
      status: 'REJECTED',
      isActive: false,
      rejectionReason: reason,
      reviewedAt: new Date(),
      reviewedBy: adminId,
    },
  })

  try {
    await sendTherapistRejected({ name: therapist.user.name, email: therapist.user.email, reason })
  } catch (err) {
    console.warn('[admin] rejection email failed (rejection still saved):', err.message)
  }

  return updated
}

/**
 * Full therapist roster for the admin dashboard — every therapist, any status,
 * with profile fields and REAL stats derived from their sessions. "Patients"
 * counts are DISTINCT patients who actually have a session with the therapist,
 * so a brand-new therapist correctly shows 0 and the number grows as patients book.
 */
export const listTherapists = async () => {
  const therapists = await prisma.therapist.findMany({
    include: {
      user: { select: { name: true, email: true, initials: true, createdAt: true } },
      specializations: { select: { name: true } },
      languages: { select: { language: true } },
      sessions: { select: { patientId: true, slot: { select: { slotDatetime: true } } } },
    },
    orderBy: { rating: 'desc' },
  })

  const now = new Date()
  const startToday = new Date(now); startToday.setHours(0, 0, 0, 0)
  const endToday = new Date(startToday); endToday.setDate(endToday.getDate() + 1)
  // Monday-based start of the current week.
  const weekStart = new Date(startToday)
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7))
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 7)

  const distinct = (rows) => new Set(rows.map(s => s.patientId)).size

  return therapists.map(t => {
    const dated = t.sessions
      .filter(s => s.slot)
      .map(s => ({ patientId: s.patientId, dt: new Date(s.slot.slotDatetime) }))

    return {
      id: t.id,
      name: t.user.name,
      email: t.user.email,
      initials: t.user.initials,
      registeredAt: t.user.createdAt,
      title: t.title,
      licenseNumber: t.licenseNumber,
      credentials: t.credentials,
      about: t.about,
      methodology: t.methodology,
      feePkr: t.feePkr,
      track: t.track,
      status: t.status,
      isActive: t.isActive,
      rejectionReason: t.rejectionReason,
      specializations: t.specializations.map(s => s.name),
      languages: t.languages.map(l => l.language),
      // Real, session-derived stats (distinct patients; 0 for a new therapist).
      patientsAllTime: distinct(dated),
      patientsToday: distinct(dated.filter(s => s.dt >= startToday && s.dt < endToday)),
      patientsWeek: distinct(dated.filter(s => s.dt >= weekStart && s.dt < weekEnd)),
      upcomingSessions: dated.filter(s => s.dt >= now).length,
    }
  })
}

/**
 * Suspend (isActive=false) or reactivate (isActive=true) an APPROVED therapist.
 * Suspending removes them from the public listing and makes them unbookable
 * while preserving their APPROVED status, so reactivating is a clean flip.
 */
export const setTherapistActive = async (id, isActive) => {
  const therapist = await prisma.therapist.findUnique({ where: { id } })

  if (!therapist) {
    const error = new Error('Therapist not found.')
    error.status = 404
    throw error
  }

  if (therapist.status !== 'APPROVED') {
    const error = new Error(`Only approved therapists can be suspended or reactivated (current status: ${therapist.status}).`)
    error.status = 409
    throw error
  }

  return prisma.therapist.update({ where: { id }, data: { isActive } })
}

/**
 * One user's account detail for the admin — identity plus their patient-side
 * activity (sessions booked + payments made). Read-only; powers the Patients
 * table's "View" action.
 */
export const getUserDetail = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, phone: true, language: true,
      role: true, isVerified: true, createdAt: true, initials: true,
      patientSessions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, status: true, sessionNumber: true, sessionType: true, createdAt: true,
          slot: { select: { slotDatetime: true } },
          therapist: { select: { title: true, user: { select: { name: true } } } },
          payment: { select: { status: true } },
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        select: { id: true, totalPkr: true, status: true, txnId: true, createdAt: true },
      },
    },
  })

  if (!user) {
    const error = new Error('User not found.')
    error.status = 404
    throw error
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    language: user.language,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt,
    initials: user.initials,
    sessions: user.patientSessions.map(s => ({
      id: s.id,
      status: s.status,
      sessionNumber: s.sessionNumber,
      type: s.sessionType,
      slotDatetime: s.slot ? s.slot.slotDatetime : null,
      therapistName: s.therapist ? s.therapist.user.name : null,
      paymentStatus: s.payment ? s.payment.status : null,
    })),
    payments: user.payments.map(p => ({
      id: p.id,
      totalPkr: p.totalPkr,
      status: p.status,
      txnId: p.txnId,
      createdAt: p.createdAt,
    })),
  }
}

/**
 * All payments, newest first. Optionally filtered by status.
 */
export const listPayments = async (status) => {
  const where = {}
  if (status && PAYMENT_STATUSES.includes(status)) {
    where.status = status
  }

  return prisma.payment.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      patient: { select: { id: true, name: true, email: true } },
      session: { select: { id: true, sessionType: true, status: true } },
    },
  })
}
