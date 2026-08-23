import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { findOneEntity, insertEntity, updateEntity, uid, now } from '../store.js'
import { signToken, requireAuth } from '../middleware/auth.js'

const router = Router()

function safeUser(user) {
  const { passwordHash, ...rest } = user
  return rest
}

router.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {}
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' })
  }

  const user = await findOneEntity('users', (u) => u.email === String(email).trim().toLowerCase())
  if (!user) return res.status(401).json({ success: false, error: 'No account found with that email address.' })
  if (!user.active) return res.status(403).json({ success: false, error: 'This account has been deactivated. Contact your administrator.' })

  // Seeded accounts have a real bcrypt hash ($2a/$2b prefix). Accounts
  // created through the admin "Add User" screen store a plain value in
  // passwordHash (a pre-existing quirk of that form) — fall back to a
  // direct comparison for those so the account still logs in, and upgrade
  // it to a proper bcrypt hash on successful login.
  const looksHashed = /^\$2[aby]\$/.test(user.passwordHash || '')
  const valid = looksHashed
    ? await bcrypt.compare(password, user.passwordHash)
    : password === user.passwordHash

  if (!valid) return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' })
  if (!looksHashed) {
    await updateEntity('users', user.id, { passwordHash: await bcrypt.hash(password, 10) })
  }

  await updateEntity('users', user.id, { lastLogin: now() })

  await insertEntity('audit_logs', {
    id: uid(),
    userId: user.id,
    action: 'User login',
    entity: 'session',
    entityId: user.id,
    detail: `${user.name} logged in`,
    createdAt: now(),
  })

  const token = signToken(user)
  res.json({ success: true, user: safeUser(user), token })
})

router.post('/logout', requireAuth, async (req, res) => {
  await insertEntity('audit_logs', {
    id: uid(),
    userId: req.auth.userId,
    action: 'User logout',
    entity: 'session',
    entityId: req.auth.userId,
    detail: 'User signed out',
    createdAt: now(),
  })
  res.json({ success: true })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await findOneEntity('users', (u) => u.id === req.auth.userId)
  if (!user) return res.status(404).json({ success: false, error: 'User not found' })
  res.json({ success: true, user: safeUser(user) })
})

export default router
