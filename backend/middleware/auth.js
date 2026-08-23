import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

export function signToken(user) {
  return jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: '8h' }
  )
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' })

  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.auth = payload
    next()
  } catch {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' })
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth) return res.status(401).json({ success: false, error: 'Not authenticated' })
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' })
    }
    next()
  }
}

export { JWT_SECRET }
