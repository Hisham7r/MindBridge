import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  const patient = await prisma.user.findUnique({ where: { email: 'patient@mindbridge.pk' } });
  if (!patient) throw new Error('patient@mindbridge.pk not found — run npm run seed first');

  const slot = await prisma.availabilitySlot.findFirst({
    where: {
      slotDatetime: { gte: new Date('2026-06-25T00:00:00.000Z'), lt: new Date('2026-06-26T00:00:00.000Z') },
    },
    include: { session: true },
  });
  if (!slot) throw new Error('No slot found for 2026-06-25 — did you update one in Prisma Studio?');
  if (slot.session) throw new Error(`Slot already has session ${slot.session.id} — delete it first or pick another slot`);

  const session = await prisma.session.create({
    data: {
      patientId:     patient.id,
      therapistId:   slot.therapistId,
      slotId:        slot.id,
      status:        'CONFIRMED',
      sessionType:   'VIDEO',
      sessionNumber: 1,
      durationMins:  60,
    },
  });

  await prisma.availabilitySlot.update({ where: { id: slot.id }, data: { isBooked: true } });

  console.log('\n✅ Session created successfully!');
  console.log('   Session ID :', session.id);
  console.log('   Patient    :', patient.name, `(${patient.email})`);
  console.log('   Slot time  :', slot.slotDatetime.toISOString());
  console.log('   Status     : CONFIRMED');
  console.log('\nNext step: log in as the therapist who owns this slot and click "✓ Mark Complete".');
}

main().catch(e => { console.error('❌', e.message); process.exit(1); }).finally(() => prisma.$disconnect());
