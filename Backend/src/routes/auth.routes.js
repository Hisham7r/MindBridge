import { Router } from 'express'
import auth from '../middleware/auth.js'
import {
  register,
  login,
  googleAuth,
  logout,
  getMe,
  updateMe,
} from '../controllers/auth.controller.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/google', googleAuth)
router.post('/logout', auth, logout)
router.get('/me', auth, getMe)
router.patch('/me', auth, updateMe)

export default router
