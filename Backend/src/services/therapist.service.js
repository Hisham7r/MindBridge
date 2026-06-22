import prisma from '../config/db.js';

const therapistInclude = {
  user: { select: { name: true, email: true, initials: true } },
  specializations: { select: { name: true } },
  languages: { select: { language: true } },
};

export async function getTherapists(filters) {
  const where = { isActive: true };

  if (filters.track) {
    where.track = filters.track.toUpperCase();
  }

  if (filters.specialization) {
    where.specializations = {
      some: {
        name: { contains: filters.specialization, mode: 'insensitive' },
      },
    };
  }

  if (filters.language) {
    where.languages = {
      some: {
        language: { contains: filters.language, mode: 'insensitive' },
      },
    };
  }

  if (filters.minFee || filters.maxFee) {
    where.feePkr = {};
    if (filters.minFee) where.feePkr.gte = Number(filters.minFee);
    if (filters.maxFee) where.feePkr.lte = Number(filters.maxFee);
  }

  const therapists = await prisma.therapist.findMany({
    where,
    include: therapistInclude,
    orderBy: { rating: 'desc' },
  });

  return therapists.map(formatTherapist);
}

export async function getTherapistById(id) {
  const therapist = await prisma.therapist.findUnique({
    where: { id },
    include: therapistInclude,
  });

  if (!therapist) {
    const error = new Error('Therapist not found.');
    error.status = 404;
    throw error;
  }

  return formatTherapist(therapist);
}

export async function getTherapistSlots(therapistId, date) {
  const now = new Date();

  const where = {
    therapistId,
    isBooked: false,
  };

  if (date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    // For today, don't offer times that have already passed.
    where.slotDatetime = { gte: start > now ? start : now, lte: end };
  } else {
    // No date filter: only ever offer upcoming slots.
    where.slotDatetime = { gte: now };
  }

  const slots = await prisma.availabilitySlot.findMany({
    where,
    orderBy: { slotDatetime: 'asc' },
  });

  return slots;
}

function formatTherapist(t) {
  return {
    id: t.id,
    name: t.user.name,
    email: t.user.email,
    initials: t.user.initials,
    title: t.title,
    credentials: t.credentials,
    about: t.about,
    methodology: t.methodology,
    feePkr: t.feePkr,
    track: t.track,
    rating: Number(t.rating),
    reviewCount: t.reviewCount,
    sessionsCount: t.sessionsCount,
    color: t.color,
    isActive: t.isActive,
    specializations: t.specializations.map(s => s.name),
    languages: t.languages.map(l => l.language),
  };
}
