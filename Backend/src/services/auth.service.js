import prisma from '../config/db.js'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

// NOTE: bcryptjs and jsonwebtoken will be installed in Phase 2
// npm install bcryptjs jsonwebtoken

/**
 * Register a new user.
 * Phase 2 implementation stub.
 */
export const registerUser = async ({ name, email, password, role }) => {
  throw new Error('registerUser service not yet implemented')
}

/**
 * Validate credentials and return a signed JWT.
 * Phase 2 implementation stub.
 */
export const loginUser = async ({ email, password }) => {
  throw new Error('loginUser service not yet implemented')
}

/**
 * Return the authenticated user's profile from the DB.
 * Phase 2 implementation stub.
 */
export const getUserById = async (id) => {
  throw new Error('getUserById service not yet implemented')
}
