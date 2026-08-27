/**
 * One-off fix for databases that were already seeded before the fake demo
 * team names were replaced with the real ones. Renames existing team
 * records in place, and creates the two real teams that didn't exist
 * before (Team Coaching, Team 24) using an already-existing site and
 * foreman from the database — it never invents a new site or foreman.
 * Does NOT reseed or touch anything else, so it's safe to run against a
 * live database with real data already in it.
 *
 * Usage:
 *   railway run node backend/scripts/rename-teams.js
 */
import 'dotenv/config'
import { pool } from '../db.js'
import { listEntity, insertEntity, uid, now } from '../store.js'

const RENAMES = {
  'Road Alpha Team 1': 'Team 20',
  'Parks Green Team': 'Team 13',
  'Diepsloot Clean Crew': 'Team Negotiator',
}
const REAL_TEAM_NAMES = ['Team 20', 'Team 13', 'Team Negotiator', 'Team Coaching', 'Team 24']

async function renameTeams() {
  let teams = await listEntity('teams')
  let renamed = 0
  for (const team of teams) {
    const newName = RENAMES[team.name]
    if (!newName) continue
    await insertEntity('teams', { ...team, name: newName })
    console.log(`[rename-teams] "${team.name}" -> "${newName}"`)
    renamed++
  }
  if (renamed) console.log(`[rename-teams] Renamed ${renamed} team(s).`)
  else console.log('[rename-teams] No matching old team names found — nothing to rename.')

  teams = await listEntity('teams')
  const missing = REAL_TEAM_NAMES.filter((n) => !teams.some((t) => t.name === n))
  if (missing.length) {
    const sites = await listEntity('sites')
    const users = await listEntity('users')
    const foremen = users.filter((u) => u.role === 'foreman')
    if (!sites.length || !foremen.length) {
      console.log(`[rename-teams] Can't create ${missing.join(', ')} — no existing site/foreman found to attach them to. Create those first, or add these teams manually.`)
    } else {
      for (let i = 0; i < missing.length; i++) {
        const site = sites[i % sites.length]
        const foreman = foremen[i % foremen.length]
        await insertEntity('teams', { id: uid(), name: missing[i], siteId: site.id, foremanId: foreman.id, memberIds: [], createdAt: now() })
        console.log(`[rename-teams] Created "${missing[i]}" (site: ${site.name}, foreman: ${foreman.name})`)
      }
    }
  } else {
    console.log('[rename-teams] All 5 real teams already exist.')
  }

  await pool.end()
}

renameTeams().catch((err) => {
  console.error('[rename-teams] Failed:', err)
  process.exit(1)
})
