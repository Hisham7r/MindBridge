import prisma from '../config/db.js'

const PAYMENT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED']

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
