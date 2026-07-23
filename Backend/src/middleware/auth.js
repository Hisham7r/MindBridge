import jwt from 'jsonwebtoken'

/**
 * Protects routes by verifying the JWT Bearer token in the Authorization header.
 * On success, attaches the decoded payload to req.user and calls next().
 * On failure, responds with 401 Unauthorized.
 */
export default function auth(req, res, next) {
  const authHeader = req.headers['authorization']

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided. Access denied.' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded   // { id, email, role }
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}
