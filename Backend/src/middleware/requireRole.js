/**
 * Role-based access control middleware factory.
 * Usage: router.get('/admin-only', auth, requireRole('ADMIN'), handler)
 *        router.get('/therapist', auth, requireRole('THERAPIST', 'ADMIN'), handler)
 *
 * Must be used AFTER the auth middleware (req.user must be set).
 */
export default function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Required role: ${allowedRoles.join(' or ')}.`,
      })
    }

    next()
  }
}
