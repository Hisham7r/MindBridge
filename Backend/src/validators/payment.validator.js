import { z } from 'zod'

export const submitPaymentSchema = z.object({
  sessionId: z
    .string()
    .uuid('A valid session id is required'),

  txnId: z
    .string()
    .min(1, 'Transaction ID is required')
    .max(100, 'Transaction ID must be under 100 characters')
    .trim(),

  screenshotUrl: z
    .string()
    .min(1, 'A payment screenshot is required')
    .max(500, 'Screenshot reference must be under 500 characters')
    .trim(),
})
