import { createContext, useContext, useEffect, useReducer, useRef, ReactNode } from 'react'
import { dbBus } from '@/lib/events'
import {
  ParticipantApi, ShiftApi, PaymentApi, CardApi, UserApi, SiteApi,
  PartnerShopApi, AtmApi, ProjectApi, IncidentApi, InventoryApi,
  EquipmentApi, NotificationApi, MessageApi, ReportApi, AuditApi,
} from '@/lib/api'
import type {
  Participant, WorkSite, Shift, OphelpCard, Payment, PartnerShop,
  AtmLocation, Project, Equipment, InventoryItem, Incident, Notification,
  Message, AuditLog, DashboardStats, SystemUser,
} from '@/lib/types'

// ── State shape ───────────────────────────────────────────────────────────────
interface AppState {
  participants: Participant[]
  sites: WorkSite[]
  shifts: Shift[]
  cards: OphelpCard[]
  payments: Payment[]
  partnerShops: PartnerShop[]
  atms: AtmLocation[]
  projects: Project[]
  equipment: Equipment[]
  inventory: InventoryItem[]
  incidents: Incident[]
  notifications: Notification[]
  messages: Message[]
  auditLogs: AuditLog[]
  users: Omit<SystemUser, 'passwordHash'>[]
  stats: DashboardStats | null
  version: number
}

type Action = { type: 'RELOAD'; entity?: string }

function loadAll(userId?: string): Omit<AppState, 'version'> {
  return {
    participants: ParticipantApi.list(),
    sites: SiteApi.list(),
    shifts: ShiftApi.list(),
    cards: CardApi.list(),
    payments: PaymentApi.list(),
    partnerShops: PartnerShopApi.list(),
    atms: AtmApi.list(),
    projects: ProjectApi.list(),
    equipment: EquipmentApi.list(),
    inventory: InventoryApi.list(),
    incidents: IncidentApi.list(),
    notifications: userId ? NotificationApi.forUser(userId) : [],
    messages: userId ? MessageApi.inbox(userId) : [],
    auditLogs: AuditApi.recent(50),
    users: UserApi.list(),
    stats: ReportApi.dashboardStats(),
  }
}

function reducer(state: AppState, action: Action): AppState {
  return { ...loadAll(), version: state.version + 1 }
}

const initialState: AppState = { ...loadAll(), version: 0 }

// ── Context ───────────────────────────────────────────────────────────────────
interface AppContextValue {
  state: AppState
  refresh: () => void
}

const AppContext = createContext<AppContextValue>({ state: initialState, refresh: () => {} })

export function AppProvider({ children, userId }: { children: ReactNode; userId?: string }) {
  const [state, dispatch] = useReducer(reducer, { ...loadAll(userId), version: 0 })
  const userIdRef = useRef(userId)
  userIdRef.current = userId

  useEffect(() => {
    const unsub = dbBus.subscribe(() => {
      dispatch({ type: 'RELOAD' })
    })
    return unsub
  }, [])

  function refresh() { dispatch({ type: 'RELOAD' }) }

  return <AppContext.Provider value={{ state, refresh }}>{children}</AppContext.Provider>
}

export function useAppContext() { return useContext(AppContext) }
export function useParticipants() { return useAppContext().state.participants }
export function useSites() { return useAppContext().state.sites }
export function useShifts() { return useAppContext().state.shifts }
export function useCards() { return useAppContext().state.cards }
export function usePayments() { return useAppContext().state.payments }
export function useProjects() { return useAppContext().state.projects }
export function useIncidents() { return useAppContext().state.incidents }
export function useInventory() { return useAppContext().state.inventory }
export function useEquipment() { return useAppContext().state.equipment }
export function usePartnerShops() { return useAppContext().state.partnerShops }
export function useNotifications(userId: string) {
  return useAppContext().state.notifications.filter(n => n.userId === userId)
}
export function useStats() { return useAppContext().state.stats }
export function useUsers() { return useAppContext().state.users }
