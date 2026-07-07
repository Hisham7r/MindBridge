
// auth.controller.js
// This layer handles:
// request parsing
// validation
// response formatting
// calling services


import * as authService from '../services/auth.service.js'
import { registerSchema, loginSchema, updateProfileSchema, googleAuthSchema }
  from '../validators/auth.validator.js'

export const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const { user, token } = await authService.registerUser(parsed.data)

    return res.status(201).json({
      message: 'Account created successfully.',
      user,
      token,
    })
  } catch (err) {
    next(err)
  }
}

export const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const { user, token } = await authService.loginUser(parsed.data)

    return res.status(200).json({
      message: 'Login successful.',
      user,
      token,
    })
  } catch (err) {
    next(err)
  }
}

export const googleAuth = async (req, res, next) => {
  try {
    const parsed = googleAuthSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const { user, token } = await authService.googleAuth(parsed.data)

    return res.status(200).json({
      message: 'Signed in with Google.',
      user,
      token,
    })
  } catch (err) {
    next(err)
  }
}

export const logout = async (req, res, next) => {
  try {
    return res.status(200).json({
      message: 'Logged out successfully. Please delete the token client-side.',
    })
  } catch (err) {
    next(err)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id)
    return res.status(200).json({ user })
  } catch (err) {
    next(err)
  }
}

export const updateMe = async (req, res, next) => {
  try {
    const parsed = updateProfileSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      })
    }

    const user = await authService.updateUserProfile(req.user.id, parsed.data)
    return res.status(200).json({
      message: 'Profile updated successfully.',
      user,
    })
  } catch (err) {
    next(err)
  }
}
