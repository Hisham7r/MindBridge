import prisma from '../config/db.js';

const therapistInclude = {
  user: { select: { name: true, email: true, initials: true } },
  specializations: { select: { name: true } },
  languages: { select: { language: true } },
};

function generateInitials(name) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
}

// A profile is listed/bookable only once every required field is filled.
function isProfileComplete(t) {
  return Boolean(
    t.title &&
    t.credentials &&
    t.about &&
    t.methodology &&
    t.feePkr && t.feePkr > 0 &&
    t.specializations.length > 0 &&
    t.languages.length > 0
  );
}

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

  // Hidden (incomplete / not-yet-activated) profiles are not publicly viewable.
  if (!therapist || !therapist.isActive) {
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

// Like formatTherapist but includes the therapist's own private fields
// (licenseNumber, review status) — used for the Settings form, never for
// public listings.
function formatOwnProfile(t) {
  return {
    ...formatTherapist(t),
    licenseNumber: t.licenseNumber,
    status: t.status,
    rejectionReason: t.rejectionReason,
  };
}

// GET /therapists/me — the logged-in therapist's own profile (by userId),
// regardless of isActive, so they can view/complete it in Settings.
export async function getMyProfile(userId) {
  const therapist = await prisma.therapist.findUnique({
    where: { userId },
    include: therapistInclude,
  });

  if (!therapist) {
    const error = new Error('Therapist profile not found.');
    error.status = 404;
    throw error;
  }

  return formatOwnProfile(therapist);
}

// PATCH /therapists/me — update the logged-in therapist's profile, then move
// it through the review state machine. Specializations/languages are replaced
// wholesale (delete + recreate) since they are simple child rows.
//
// State machine (admin approval gate — completing a profile does NOT publish):
//   incomplete                    → DRAFT    (hidden)
//   complete, not yet APPROVED    → PENDING  (hidden, lands in admin queue;
//                                             clears any old rejection reason)
//   complete, already APPROVED    → APPROVED (stays live — trusted edits)
//   was APPROVED, now incomplete  → DRAFT    (auto-unlisted)
export async function updateMyProfile(userId, data) {
  const therapist = await prisma.therapist.findUnique({ where: { userId } });

  if (!therapist) {
    const error = new Error('Therapist profile not found.');
    error.status = 404;
    throw error;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.name) {
      await tx.user.update({
        where: { id: userId },
        data: { name: data.name, initials: generateInitials(data.name) },
      });
    }

    if (data.specializations) {
      await tx.therapistSpecialization.deleteMany({ where: { therapistId: therapist.id } });
      if (data.specializations.length) {
        await tx.therapistSpecialization.createMany({
          data: data.specializations.map(name => ({ therapistId: therapist.id, name })),
        });
      }
    }

    if (data.languages) {
      await tx.therapistLanguage.deleteMany({ where: { therapistId: therapist.id } });
      if (data.languages.length) {
        await tx.therapistLanguage.createMany({
          data: data.languages.map(language => ({ therapistId: therapist.id, language })),
        });
      }
    }

    const scalars = {};
    if (data.title !== undefined) scalars.title = data.title;
    if (data.credentials !== undefined) scalars.credentials = data.credentials;
    if (data.about !== undefined) scalars.about = data.about;
    if (data.methodology !== undefined) scalars.methodology = data.methodology;
    if (data.licenseNumber !== undefined) scalars.licenseNumber = data.licenseNumber;
    if (data.feePkr !== undefined) scalars.feePkr = data.feePkr;
    if (data.track !== undefined) scalars.track = data.track;

    await tx.therapist.update({ where: { id: therapist.id }, data: scalars });

    // Re-read with relations, then advance the review state machine.
    const fresh = await tx.therapist.findUnique({
      where: { id: therapist.id },
      include: therapistInclude,
    });

    const complete = isProfileComplete(fresh);
    let review;
    if (!complete) {
      // Incomplete profiles are never listed, whatever their prior status.
      review = { status: 'DRAFT', isActive: false };
    } else if (fresh.status === 'APPROVED') {
      // Already vetted — edits keep the profile live.
      review = { status: 'APPROVED', isActive: true };
    } else {
      // Complete but unvetted (DRAFT or resubmitted REJECTED) → admin queue.
      review = { status: 'PENDING', isActive: false, rejectionReason: null };
    }

    return tx.therapist.update({
      where: { id: therapist.id },
      data: review,
      include: therapistInclude,
    });
  });

  return formatOwnProfile(updated);
}
