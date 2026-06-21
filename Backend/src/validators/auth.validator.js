import { z } from 'zod'

export const registerSchema = z.object({
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
