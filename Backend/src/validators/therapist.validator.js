import { z } from 'zod';

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:MM" 24h

const toMinutes = (t) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

// PUT /therapists/me/availability — the therapist's full weekly schedule,
// replaced wholesale. One entry per enabled weekday; omitted days = day off.
export const availabilitySchema = z.object({
  rules: z
    .array(
      z.object({
        dayOfWeek: z.number().int().min(0, 'dayOfWeek must be 0–6').max(6, 'dayOfWeek must be 0–6'),
        startTime: z.string().regex(TIME_RE, 'startTime must be HH:MM (24h)'),
        endTime: z.string().regex(TIME_RE, 'endTime must be HH:MM (24h)'),
      })
    )
    .max(7, 'At most one rule per weekday')
    .superRefine((rules, ctx) => {
      const seen = new Set();
      rules.forEach((r, i) => {
        if (seen.has(r.dayOfWeek)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'dayOfWeek'],
            message: 'Duplicate weekday — only one rule per day',
          });
        }
        seen.add(r.dayOfWeek);
        // Sessions are 60 minutes, so a day must contain at least one full hour.
        if (toMinutes(r.endTime) - toMinutes(r.startTime) < 60) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [i, 'endTime'],
            message: 'End time must be at least 1 hour after start time',
          });
        }
      });
    }),
});

// Self-service profile update (PATCH /therapists/me). Every field is optional —
// the therapist completes their profile incrementally in Settings. The service
// flips the profile active once all required fields are present.
export const updateTherapistSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim().optional(),
  title: z.string().trim().max(120).optional(),
  credentials: z.string().trim().max(300).optional(), // shown as "Education"
  about: z.string().trim().max(2000).optional(),
  methodology: z.string().trim().max(2000).optional(),
  licenseNumber: z.string().trim().max(100).optional(),
  track: z.enum(['MENTAL_HEALTH', 'CAREER']).optional(),
  feePkr: z.coerce.number().int('Fee must be a whole number').positive('Fee must be greater than 0').max(1000000).optional(),
  specializations: z.array(z.string().trim().min(1)).optional(),
  languages: z.array(z.string().trim().min(1)).optional(),
});
