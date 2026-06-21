import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SALT_ROUNDS = 10
const JWT_EXPIRES_IN = '7d'

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

export const registerUser = async ({ name, email, password, role }) => {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    const error = new Error('An account with this email already exists.')
    error.status = 409
    throw error
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const initials = generateInitials(name)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      initials,
    },
  })

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
