import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const SALT_ROUNDS = 10
const JWT_EXPIRES_IN = '7d'

const googleClient = process.env.GOOGLE_CLIENT_ID
  ? new OAuth2Client(process.env.GOOGLE_CLIENT_ID)
  : null

function generateInitials(name) {
  return name
    .trim()
    .split(' ')
    .filter(Boolean)
    .map(word => word[0].toUpperCase())
    .join('')
    .slice(0, 2)
}

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  })
}

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user
  return safe
}

export const registerUser = async ({ name, email, password, role, licenseNumber, specializations }) => {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const error = new Error('An account with this email already exists.')
    error.status = 409
    throw error
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const initials = generateInitials(name)

  // Therapists get a profile created alongside the user. It starts INACTIVE
  // (hidden from browse/booking) with only licence + specializations filled;
  // the rest of the profile is completed later in Settings, which flips it
  // active once everything required is present.
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        initials,
      },
    })

    if (role === 'THERAPIST') {
      await tx.therapist.create({
        data: {
          userId: created.id,
          licenseNumber: licenseNumber || null,
          isActive: false,
          specializations: specializations?.length
            ? { create: specializations.map(name => ({ name })) }
            : undefined,
        },
      })
    }

    return created
  })

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  return { user: sanitizeUser(user), token }
}

// "Continue with Google" — verify Google's signed ID token, then find or
// create the matching user and issue our own app JWT (same envelope as
// login/register). Google sign-ups are always PATIENTs: therapists need
// licence + specializations, which only the therapist form collects.
export const googleAuth = async ({ credential }) => {
  if (!googleClient) {
    const error = new Error('Google sign-in is not configured on the server.')
    error.status = 503
    throw error
  }

  // Cryptographic check: token really signed by Google, for OUR client id,
  // and not expired. Throws on any mismatch.
  let payload
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })
    payload = ticket.getPayload() // { sub, email, email_verified, name, picture }
  } catch {
    const error = new Error('Google sign-in could not be verified. Please try again.')
    error.status = 401
    throw error
  }

  const { sub: googleId, email, name, picture } = payload
  const emailVerified = Boolean(payload.email_verified)

  // 1. Returning Google user — matched by Google's stable account id.
  let user = await prisma.user.findUnique({ where: { googleId } })

  if (!user) {
    // 2. Existing password account with the same email — link Google to it
    //    so both sign-in methods reach the one account.
    const byEmail = await prisma.user.findUnique({ where: { email } })
    if (byEmail) {
      user = await prisma.user.update({
        where: { id: byEmail.id },
        data: {
          googleId,
          ...(emailVerified && !byEmail.isVerified && { isVerified: true }),
          ...(picture && !byEmail.avatarUrl && { avatarUrl: picture }),
        },
      })
    } else {
      // 3. Brand-new user — created as PATIENT, no password.
      const displayName = name || email.split('@')[0]
      user = await prisma.user.create({
        data: {
          name: displayName,
          email,
          googleId,
          passwordHash: null,
          role: 'PATIENT',
          initials: generateInitials(displayName),
          isVerified: emailVerified,
          ...(picture && { avatarUrl: picture }),
        },
      })
    }
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  return { user: sanitizeUser(user), token }
}

export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } })

  if (!user) {
    const error = new Error('Invalid email or password.')
    error.status = 401
    throw error
  }

  // Google-created accounts have no password to compare against.
  if (!user.passwordHash) {
    const error = new Error('This account uses Google sign-in. Please use "Continue with Google".')
    error.status = 400
    throw error
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash)

  if (!isMatch) {
    const error = new Error('Invalid email or password.')
    error.status = 401
    throw error
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role })

  return { user: sanitizeUser(user), token }
}

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({ where: { id } })

  if (!user) {
    const error = new Error('User not found.')
    error.status = 404
    throw error
  }

  return sanitizeUser(user)
}

export const updateUserProfile = async (id, data) => {
  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(data.name && {
        name: data.name,
        initials: generateInitials(data.name),
      }),
      ...(data.phone && { phone: data.phone }),
      ...(data.language && { language: data.language }),
    },
  })

  return sanitizeUser(user)
}
