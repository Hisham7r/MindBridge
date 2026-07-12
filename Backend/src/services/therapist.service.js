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

// ── Availability (recurring weekly hours → generated slots) ─────────────────

// How far ahead concrete bookable slots are generated from the weekly rules.
const AVAILABILITY_WINDOW_DAYS = 14;
const SLOT_DURATION_MINS = 60; // sessions are 1 hour (Session.durationMins default)

// Build every slot start-Date implied by the weekly rules over the rolling
// window, skipping times already in the past.
function buildSlotDatetimes(rules, now = new Date()) {
  const byDay = new Map(rules.map(r => [r.dayOfWeek, r]));
  const datetimes = [];

  for (let d = 0; d < AVAILABILITY_WINDOW_DAYS; d++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d);
    const rule = byDay.get(day.getDay());
    if (!rule) continue;

    const [sh, sm] = rule.startTime.split(':').map(Number);
    const [eh, em] = rule.endTime.split(':').map(Number);
    const dayEnd = new Date(day); dayEnd.setHours(eh, em, 0, 0);

    const t = new Date(day); t.setHours(sh, sm, 0, 0);
    while (t.getTime() + SLOT_DURATION_MINS * 60000 <= dayEnd.getTime()) {
      if (t > now) datetimes.push(new Date(t));
      t.setMinutes(t.getMinutes() + SLOT_DURATION_MINS);
    }
  }

  return datetimes;
}

// Idempotent top-up: create any slot the rules imply that doesn't already
// exist (booked or free) in the window. Never deletes anything — safe to run
// on every read, which is what keeps a therapist's calendar from ever going
// stale (the old seed-only slots expired silently).
async function ensureSlotWindow(db, therapistId) {
  const rules = await db.therapistAvailability.findMany({ where: { therapistId } });
  if (rules.length === 0) return;

  const now = new Date();
  const wanted = buildSlotDatetimes(rules, now);
  if (wanted.length === 0) return;

  const existing = await db.availabilitySlot.findMany({
    where: { therapistId, slotDatetime: { gte: now } },
    select: { slotDatetime: true },
  });
  const taken = new Set(existing.map(s => s.slotDatetime.getTime()));

  const missing = wanted.filter(dt => !taken.has(dt.getTime()));
  if (missing.length) {
    await db.availabilitySlot.createMany({
      data: missing.map(slotDatetime => ({ therapistId, slotDatetime })),
    });
  }
}

// GET /therapists/me/availability — the therapist's weekly rules for Settings.
export async function getMyAvailability(userId) {
  const therapist = await prisma.therapist.findUnique({ where: { userId } });
  if (!therapist) {
    const error = new Error('Therapist profile not found.');
    error.status = 404;
    throw error;
  }

  const rules = await prisma.therapistAvailability.findMany({
    where: { therapistId: therapist.id },
    orderBy: { dayOfWeek: 'asc' },
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });

  return rules;
}

// PUT /therapists/me/availability — replace the weekly schedule wholesale,
// then rebuild the therapist's future calendar from it:
//   · rules rows are swapped (delete + recreate)
//   · future UNBOOKED slots are deleted (booked ones are untouched — changing
//     your hours can never destroy an existing appointment)
//   · fresh slots are generated for the window, skipping any datetime still
//     occupied by a surviving booked slot
export async function updateMyAvailability(userId, rules) {
  const therapist = await prisma.therapist.findUnique({ where: { userId } });
  if (!therapist) {
    const error = new Error('Therapist profile not found.');
    error.status = 404;
    throw error;
  }

  await prisma.$transaction(async (tx) => {
    const now = new Date();

    await tx.therapistAvailability.deleteMany({ where: { therapistId: therapist.id } });
    if (rules.length) {
      await tx.therapistAvailability.createMany({
        data: rules.map(r => ({ therapistId: therapist.id, ...r })),
      });
    }

    await tx.availabilitySlot.deleteMany({
      where: { therapistId: therapist.id, isBooked: false, slotDatetime: { gte: now } },
    });

    if (rules.length) {
      const wanted = buildSlotDatetimes(rules, now);
      const booked = await tx.availabilitySlot.findMany({
        where: { therapistId: therapist.id, slotDatetime: { gte: now } },
        select: { slotDatetime: true },
      });
      const taken = new Set(booked.map(s => s.slotDatetime.getTime()));
      const fresh = wanted.filter(dt => !taken.has(dt.getTime()));
      if (fresh.length) {
        await tx.availabilitySlot.createMany({
          data: fresh.map(slotDatetime => ({ therapistId: therapist.id, slotDatetime })),
        });
      }
    }
  });

  return getMyAvailability(userId);
}

export async function getTherapistSlots(therapistId, date) {
  // Self-healing calendar: top up the rolling window from the weekly rules
  // before answering, so availability never silently expires.
  await ensureSlotWindow(prisma, therapistId);

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
      // Already vetted — edits keep the profile live, but PRESERVE an admin
      // suspension (isActive=false) so a therapist can't un-suspend themselves
      // by re-saving their profile.
      review = { status: 'APPROVED', isActive: fresh.isActive };
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
