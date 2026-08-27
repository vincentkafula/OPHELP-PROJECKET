import { Router } from 'express'
import { listMany } from '../store.js'

const router = Router()

const ENTITIES = [
  'users', 'participants', 'teams', 'skills', 'skill_assessments', 'sites',
  'shifts', 'cards', 'payments', 'transactions', 'partner_shops',
  'atm_locations', 'projects', 'equipment', 'inventory', 'incidents',
  'notifications', 'messages', 'audit_logs',
  'payroll_periods', 'payroll_roster', 'payroll_entries', 'payroll_corrections',
]

// The whole app (marketing pages + dashboard) reads through one in-memory
// cache on the frontend that's hydrated from this single call at boot, then
// kept in sync by write-through mutations from the CRUD/business routes.
// Passwords are never included. This mirrors the localStorage dataset the
// UI originally shipped with (all of it was readable client-side anyway),
// so nothing sensitive is newly exposed by making this endpoint public.
router.get('/', async (req, res) => {
  const data = await listMany(ENTITIES)
  data.users = data.users.map(({ passwordHash, ...rest }) => rest)
  res.json({ success: true, data })
})

export default router
