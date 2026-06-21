import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

function generateInitials(name) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .join('')
    .slice(0, 2);
}

// ── Therapist seed data ────────────────────────────────────────────────────
const therapistData = [
  {
    name: 'Dr. Ayesha Raza',
    email: 'ayesha@mindbridge.pk',
    password: 'password123',
    title: 'Clinical Psychologist',
    credentials: 'PhD Clinical Psychology, Aga Khan University',
    about: 'Dr. Ayesha Raza is a licensed clinical psychologist with a doctorate from Aga Khan University. She has helped hundreds of patients overcome anxiety, depression, and trauma using evidence-based CBT techniques.',
    methodology: 'Cognitive Behavioural Therapy (CBT), Mindfulness-Based Stress Reduction, Trauma-Focused therapy.',
    specializations: ['Anxiety', 'Depression', 'CBT', 'Trauma'],
    languages: ['English', 'Urdu'],
    feePkr: 3500,
    track: 'MENTAL_HEALTH',
    rating: 4.9,
    reviewCount: 127,
    color: '#6366F1',
  },
  {
    name: 'Bilal Chaudhry',
    email: 'bilal@mindbridge.pk',
    password: 'password123',
    title: 'Career Counselor & Life Coach',
    credentials: 'MSc Organizational Psychology, LUMS',
    about: 'Bilal Chaudhry has spent 8 years guiding professionals through career pivots, job searches, and workplace conflicts. He specializes in helping young graduates and mid-career professionals find their direction.',
    methodology: 'Solution-Focused Brief Therapy, Motivational Interviewing, Strengths-Based Coaching.',
    specializations: ['Career Counseling', 'Life Coaching', 'Workplace Stress'],
    languages: ['English', 'Urdu', 'Punjabi'],
    feePkr: 2500,
    track: 'CAREER',
    rating: 4.7,
    reviewCount: 89,
    color: '#10B981',
  },
  {
    name: 'Dr. Sara Malik',
    email: 'sara.malik@mindbridge.pk',
    password: 'password123',
    title: 'Child & Adolescent Psychiatrist',
    credentials: 'MBBS, FCPS Psychiatry, CPSP Fellow',
    about: 'Dr. Sara Malik is a board-certified psychiatrist who focuses on children and teenagers. She works closely with families to create supportive environments for young people facing emotional and behavioral challenges.',
    methodology: 'Family Systems Therapy, Play Therapy, Behavioural Interventions, Parental Guidance.',
    specializations: ['Child Psychology', 'Family Therapy', 'Adolescent Mental Health'],
    languages: ['English', 'Urdu'],
    feePkr: 4500,
    track: 'MENTAL_HEALTH',
    rating: 4.8,
    reviewCount: 203,
    color: '#F59E0B',
  },
  {
    name: 'Zara Ahmed',
    email: 'zara@mindbridge.pk',
    password: 'password123',
    title: 'Relationships & Grief Therapist',
    credentials: 'MSc Counselling Psychology, University of Karachi',
    about: 'Zara Ahmed is a certified relationships therapist who has worked with over 150 couples and individuals on issues of communication, trust, grief, and self-worth. She combines Western therapeutic models with cultural sensitivity for Pakistani clients.',
    methodology: 'Emotionally Focused Therapy (EFT), Narrative Therapy, Person-Centred Counselling.',
    specializations: ['Relationships', 'Grief', 'Self-Esteem', 'Couples Therapy'],
    languages: ['English', 'Urdu', 'Sindhi'],
    feePkr: 3000,
    track: 'MENTAL_HEALTH',
    rating: 4.6,
    reviewCount: 74,
    color: '#EC4899',
  },
];

// ── Test accounts (for end-to-end Phase 4 testing) ─────────────────────────
const accountData = [
  {
    name: 'Test Patient',
    email: 'patient@mindbridge.pk',
    password: 'password123',
    role: 'PATIENT',
    phone: '03001234567',
    language: 'English',
  },
  {
    name: 'Admin User',
    email: 'admin@mindbridge.pk',
    password: 'password123',
    role: 'ADMIN',
  },
];

async function seedTherapists() {
  console.log('Seeding therapists...');

  for (const t of therapistData) {
    const passwordHash = await bcrypt.hash(t.password, SALT_ROUNDS);
    const initials = generateInitials(t.name);

    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        name: t.name,
        email: t.email,
        passwordHash,
        initials,
        role: 'THERAPIST',
      },
    });

    const therapist = await prisma.therapist.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        title: t.title,
        credentials: t.credentials,
        about: t.about,
        methodology: t.methodology,
        feePkr: t.feePkr,
        track: t.track,
        rating: t.rating,
        reviewCount: t.reviewCount,
        color: t.color,
        isActive: true,
      },
    });

    for (const spec of t.specializations) {
      const exists = await prisma.therapistSpecialization.findFirst({
        where: { therapistId: therapist.id, name: spec },
      });
      if (!exists) {
        await prisma.therapistSpecialization.create({
          data: { therapistId: therapist.id, name: spec },
        });
      }
    }

    for (const lang of t.languages) {
      const exists = await prisma.therapistLanguage.findFirst({
        where: { therapistId: therapist.id, language: lang },
      });
      if (!exists) {
        await prisma.therapistLanguage.create({
          data: { therapistId: therapist.id, language: lang },
        });
      }
    }

    console.log(`✅ Seeded therapist: ${t.name}`);
  }
}

async function seedAccounts() {
  console.log('Seeding test accounts...');

  for (const a of accountData) {
    const passwordHash = await bcrypt.hash(a.password, SALT_ROUNDS);

    await prisma.user.upsert({
      where: { email: a.email },
      update: {},
      create: {
        name: a.name,
        email: a.email,
        passwordHash,
        initials: generateInitials(a.name),
        role: a.role,
        ...(a.phone && { phone: a.phone }),
        ...(a.language && { language: a.language }),
      },
    });

    console.log(`✅ Seeded ${a.role}: ${a.email}`);
  }
}

async function seedSlots() {
  console.log('Seeding availability slots...');

  // Idempotent: clear only UNBOOKED slots, then regenerate future slots.
  // Booked slots are left untouched (they have Session rows attached).
  await prisma.availabilitySlot.deleteMany({ where: { isBooked: false } });

  const therapists = await prisma.therapist.findMany({ select: { id: true } });
  const hours = [9, 10, 11, 14, 15, 16]; // within 9am–6pm working hours
  const daysAhead = 7;
  const now = new Date();
  let count = 0;

  for (const t of therapists) {
    for (let day = 1; day <= daysAhead; day++) {
      const base = new Date(now);
      base.setDate(now.getDate() + day);
      for (const h of hours) {
        const slotDatetime = new Date(base);
        slotDatetime.setHours(h, 0, 0, 0);
        await prisma.availabilitySlot.create({
          data: { therapistId: t.id, slotDatetime, isBooked: false },
        });
        count++;
      }
    }
  }

  console.log(`✅ Seeded ${count} availability slots (${hours.length}/day × ${daysAhead} days × ${therapists.length} therapists)`);
}

async function main() {
  console.log('🌱 Seeding database...');
  await seedTherapists();
  await seedAccounts();
  await seedSlots();
  console.log('🌿 Seeding complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
