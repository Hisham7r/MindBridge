import { z } from 'zod'

export const createSessionSchema = z.object({
  therapistId: z
    .string()
    .uuid('A valid therapist id is required'),

  slotId: z
    .string()
    .uuid('A valid slot id is required'),

  sessionType: z
    .string()
    .min(1, 'Session type is required')
    .max(50, 'Session type must be under 50 characters')
    .trim(),
})

export const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING_PAYMENT',
    'CONFIRMED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED',
  ]),
})
