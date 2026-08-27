/**
 * OPHELP data layer — backed by the real Express + PostgreSQL API.
 *
 * The public interface (Collection<T>.all/where/findById/insert/update/...)
 * is unchanged from the original localStorage version, so lib/api.ts,
 * AppContext.tsx, and every component that reads through them work
 * completely unmodified.
 *
 * How it works: `bootstrap()` fetches every entity once from
 * GET /api/bootstrap and populates an in-memory cache. Reads
 * (all/where/findById/findOne/count) are synchronous against that cache.
 * Writes (insert/update/delete/upsert) update the cache synchronously
 * (so the UI feels instant) and fire the matching request to the backend
 * in the background. If a write fails, it's logged to the console and the
 * cache is re-synced from the server on the next bootstrap/page load.
 */

import { dbBus } from './events'
import { api } from './apiClient'
import type {
  SystemUser, Participant, WorkSite, Shift, OphelpCard, Payment,
  CardTransaction, PartnerShop, AtmLocation, Project, AuditLog,
  Team, Skill, SkillAssessment, Equipment, InventoryItem, Incident,
  Notification, Message, PayrollPeriod, PayrollRosterEntry, PayrollEntry,
  PayrollCorrection,
} from './types'

// -- Helpers ------------------------------------------------------------
export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6)
}
export function now(): string {
  return new Date().toISOString()
}
/** Kept for compatibility with any leftover callers; the backend hashes
 * real passwords with bcrypt. This is only used by legacy code paths that
 * still write a plain value into `passwordHash` (see AGENTS.md notes). */
export function hashPassword(pw: string): string {
  let h = 0
  for (let i = 0; i < pw.length; i++) {
    h = (h * 31 + pw.charCodeAt(i)) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

// -- Entity -> REST path map (mirrors backend/server.js) -----------------
const ENDPOINTS: Record<string, string> = {
  users: 'users',
  participants: 'participants',
  teams: 'teams',
  skills: 'skills',
  skill_assessments: 'skill-assessments',
  sites: 'sites',
  shifts: 'shifts',
  cards: 'cards',
  payments: 'payments',
  transactions: 'transactions',
  partner_shops: 'partner-shops',
  atm_locations: 'atm-locations',
  projects: 'projects',
  equipment: 'equipment',
  inventory: 'inventory',
  incidents: 'incidents',
  notifications: 'notifications',
  messages: 'messages',
  audit_logs: 'audit-logs',
  payroll_periods: 'payroll-periods',
  payroll_roster: 'payroll-roster',
  payroll_entries: 'payroll-entries',
  payroll_corrections: 'payroll-corrections',
}

// -- In-memory cache, hydrated once by bootstrap() ------------------------
const cache: Record<string, any[]> = {}
let bootstrapped = false
let bootstrapPromise: Promise<void> | null = null

export async function bootstrap(): Promise<void> {
  if (bootstrapped) return
  if (bootstrapPromise) return bootstrapPromise

  bootstrapPromise = (async () => {
    try {
      const res = await api.get<{ success: boolean; data: Record<string, any[]> }>('/bootstrap')
      Object.assign(cache, res.data)
    } catch (err) {
      console.error('[db] Bootstrap failed — starting with an empty dataset.', err)
      for (const key of Object.keys(ENDPOINTS)) cache[key] = cache[key] ?? []
    } finally {
      bootstrapped = true
    }
  })()

  return bootstrapPromise
}

export function isBootstrapped(): boolean {
  return bootstrapped
}

// -- Collection ------------------------------------------------------------
export class Collection<T extends { id: string }> {
  private entity: string

  constructor(_localStorageKeyUnused: string, entity: string) {
    this.entity = entity
    if (!cache[entity]) cache[entity] = []
  }

  private path(): string {
    return `/${ENDPOINTS[this.entity] ?? this.entity}`
  }

  all(): T[] {
    return cache[this.entity] ?? []
  }

  findById(id: string): T | undefined {
    return this.all().find((item) => item.id === id)
  }

  findOne(pred: (item: T) => boolean): T | undefined {
    return this.all().find(pred)
  }

  where(pred: (item: T) => boolean): T[] {
    return this.all().filter(pred)
  }

  count(pred?: (item: T) => boolean): number {
    const items = this.all()
    return pred ? items.filter(pred).length : items.length
  }

  insert(data: Omit<T, 'id'>): T {
    const item = { ...data, id: uid() } as T
    cache[this.entity] = [...this.all(), item]
    dbBus.emit(this.entity)
    api.post(this.path(), item).catch((err) => {
      console.error(`[db] Failed to persist new ${this.entity}:`, err)
    })
    return item
  }

  insertWithId(data: T): T {
    cache[this.entity] = [...this.all(), data]
    dbBus.emit(this.entity)
    api.post(this.path(), data).catch((err) => {
      console.error(`[db] Failed to persist new ${this.entity}:`, err)
    })
    return data
  }

  update(id: string, patch: Partial<T>): T | undefined {
    const items = this.all()
    const idx = items.findIndex((item) => item.id === id)
    if (idx === -1) return undefined
    const updated = { ...items[idx], ...patch }
    const next = [...items]
    next[idx] = updated
    cache[this.entity] = next
    dbBus.emit(this.entity)
    api.put(`${this.path()}/${id}`, patch).catch((err) => {
      console.error(`[db] Failed to persist update to ${this.entity}/${id}:`, err)
    })
    return updated
  }

  upsert(item: T): T {
    const items = this.all()
    const idx = items.findIndex((i) => i.id === item.id)
    const next = [...items]
    if (idx === -1) next.push(item)
    else next[idx] = item
    cache[this.entity] = next
    dbBus.emit(this.entity)
    api.post(this.path(), item).catch((err) => {
      console.error(`[db] Failed to persist upsert to ${this.entity}:`, err)
    })
    return item
  }

  delete(id: string): boolean {
    const items = this.all()
    const filtered = items.filter((item) => item.id !== id)
    if (filtered.length === items.length) return false
    cache[this.entity] = filtered
    dbBus.emit(this.entity)
    api.delete(`${this.path()}/${id}`).catch((err) => {
      console.error(`[db] Failed to persist delete of ${this.entity}/${id}:`, err)
    })
    return true
  }

  clear() {
    cache[this.entity] = []
    dbBus.emit(this.entity)
  }
}

// -- Collections -------------------------------------------------------
export const Users = new Collection<SystemUser>('ophelp_users', 'users')
export const Participants = new Collection<Participant>('ophelp_participants', 'participants')
export const Teams = new Collection<Team>('ophelp_teams', 'teams')
export const Skills = new Collection<Skill>('ophelp_skills', 'skills')
export const SkillAssessments = new Collection<SkillAssessment>('ophelp_skill_assessments', 'skill_assessments')
export const Sites = new Collection<WorkSite>('ophelp_sites', 'sites')
export const Shifts = new Collection<Shift>('ophelp_shifts', 'shifts')
export const Cards = new Collection<OphelpCard>('ophelp_cards', 'cards')
export const Payments = new Collection<Payment>('ophelp_payments', 'payments')
export const Transactions = new Collection<CardTransaction>('ophelp_transactions', 'transactions')
export const PartnerShops = new Collection<PartnerShop>('ophelp_partner_shops', 'partner_shops')
export const AtmLocations = new Collection<AtmLocation>('ophelp_atm_locations', 'atm_locations')
export const Projects = new Collection<Project>('ophelp_projects', 'projects')
export const Equipments = new Collection<Equipment>('ophelp_equipment', 'equipment')
export const Inventory = new Collection<InventoryItem>('ophelp_inventory', 'inventory')
export const Incidents = new Collection<Incident>('ophelp_incidents', 'incidents')
export const Notifications = new Collection<Notification>('ophelp_notifications', 'notifications')
export const Messages = new Collection<Message>('ophelp_messages', 'messages')
export const AuditLogs = new Collection<AuditLog>('ophelp_audit_logs', 'audit_logs')
export const PayrollPeriods = new Collection<PayrollPeriod>('ophelp_payroll_periods', 'payroll_periods')
export const PayrollRoster = new Collection<PayrollRosterEntry>('ophelp_payroll_roster', 'payroll_roster')
export const PayrollEntries = new Collection<PayrollEntry>('ophelp_payroll_entries', 'payroll_entries')
export const PayrollCorrections = new Collection<PayrollCorrection>('ophelp_payroll_corrections', 'payroll_corrections')

/**
 * The original app called this synchronously at module load to seed
 * localStorage on first run. Seeding now happens once, server-side, via
 * `npm run seed` in /backend (see backend/seed.js). This is kept as a
 * no-op export purely so App.tsx's existing `seedDatabase()` call site
 * doesn't need to change.
 */
export function seedDatabase(): void {
  // no-op — see backend/seed.js
}
