import { z } from 'zod'

export const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be under 100 characters')
      .trim(),

    email: z
      .string()
      .email('Please provide a valid email address')
      .trim()
      .transform(val => val.toLowerCase()),

    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(100, 'Password must be under 100 characters'),

    role: z
      .enum(['PATIENT', 'THERAPIST'])
      .default('PATIENT'),

    // Therapist-only fields (required when role === 'THERAPIST', see refine below)
    licenseNumber: z
      .string()
      .trim()
      .max(100, 'License number is too long')
      .optional(),

    specializations: z
      .array(z.string().trim().min(1))
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.role === 'THERAPIST') {
      if (!data.licenseNumber || data.licenseNumber.length < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['licenseNumber'],
          message: 'License number is required for therapists',
        })
      }
      if (!data.specializations || data.specializations.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['specializations'],
          message: 'At least one specialization is required',
        })
      }
    }
  })

// "Continue with Google": the browser sends Google's signed ID token
// (called `credential` by Google Identity Services). Verification happens
// server-side in auth.service — this only checks the field is present.
export const googleAuthSchema = z.object({
  credential: z
    .string()
    .min(1, 'Google credential is required'),
})

export const loginSchema = z.object({
  email: z
    .string()
    .email('Please provide a valid email address')
    .trim()
    .transform(val => val.toLowerCase()),

  password: z
    .string()
    .min(1, 'Password is required'),
})

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100)
    .trim()
    .optional(),

  phone: z
    .string()
    .max(20)
    .trim()
    .optional(),

  language: z
    .enum(['English', 'Urdu', 'Punjabi'])
    .optional(),
})
