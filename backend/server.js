import express from 'express'
import cors from 'cors'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import 'dotenv/config'

import authRoutes from './routes/auth.js'
import bootstrapRoutes from './routes/bootstrap.js'
import { makeCrudRouter } from './routes/generic.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()

// Express 4 doesn't catch rejected promises thrown inside async route
// handlers — an unhandled one would otherwise crash the whole process.
// Log it and keep serving instead.
process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled promise rejection:', err)
})

app.use(cors())
app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (req, res) => res.json({ ok: true, ts: new Date().toISOString() }))

app.use('/api/auth', authRoutes)
app.use('/api/bootstrap', bootstrapRoutes)

// Every OPHELP entity is a generic JSONB document behind CRUD routes. All
// business logic (shift approval, card issuing, payment processing, ...)
// lives in the frontend's lib/api.ts and runs against these same
// operations -- see frontend/src/lib/db.ts for how Collection<T>
// write-through keeps local state in sync with these endpoints.
const ENTITY_ROUTES = {
  users: 'users',
  participants: 'participants',
  teams: 'teams',
  skills: 'skills',
  'skill-assessments': 'skill_assessments',
  sites: 'sites',
  shifts: 'shifts',
  cards: 'cards',
  payments: 'payments',
  transactions: 'transactions',
  'partner-shops': 'partner_shops',
  'atm-locations': 'atm_locations',
  projects: 'projects',
  equipment: 'equipment',
  inventory: 'inventory',
  incidents: 'incidents',
  notifications: 'notifications',
  messages: 'messages',
  'audit-logs': 'audit_logs',
  'payroll-periods': 'payroll_periods',
  'payroll-roster': 'payroll_roster',
  'payroll-entries': 'payroll_entries',
  'payroll-corrections': 'payroll_corrections',
  'payment-authorisations': 'payment_authorisations',
  'weekly-registers': 'weekly_registers',
  'oasys-checks': 'oasys_checks',
  'depot-schedules': 'depot_schedules',
  quotations: 'quotations',
}

for (const [urlSegment, entityName] of Object.entries(ENTITY_ROUTES)) {
  app.use(`/api/${urlSegment}`, makeCrudRouter(entityName))
}

// -- Serve the built frontend (Vite `dist/`) --------------------------------
// Railway builds both frontend and backend in one deploy (see root
// package.json), so by the time this process starts, ../frontend/dist
// exists and can be served as static assets with an SPA fallback.
const frontendDist = path.resolve(__dirname, '../frontend/dist')
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next()
    res.sendFile(path.join(frontendDist, 'index.html'))
  })
} else {
  console.warn(`[server] Frontend build not found at ${frontendDist} -- API-only mode.`)
}

app.use((err, req, res, next) => {
  console.error('[server] Unhandled error:', err)
  res.status(500).json({ success: false, error: 'Internal server error' })
})

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`[server] OPHELP backend listening on port ${PORT}`)
})
