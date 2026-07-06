import { z } from 'zod'

// Rejecting a therapist application requires a human-readable reason —
// it is stored on the profile and emailed to the applicant.
export const rejectTherapistSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, 'Please provide a rejection reason (at least 3 characters)')
    .max(500, 'Reason must be under 500 characters'),
})
