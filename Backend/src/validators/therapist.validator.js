import { z } from 'zod';

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
