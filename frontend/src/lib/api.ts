/**
 * OPHELP API service — all CRUD and business logic.
 * Swap localStorage Collection calls for fetch() to connect a real backend.
 */

import {
  Users, Participants, Teams, Skills, SkillAssessments, Sites, Shifts,
  Cards, Payments, Transactions, PartnerShops, AtmLocations, Projects,
  Equipments, Inventory, Incidents, Notifications, Messages, AuditLogs,
  PayrollPeriods, PayrollRoster, PayrollEntries, PayrollCorrections,
  PaymentAuthorisations, WeeklyRegisters, OasysChecks, DepotSchedules, Quotations,
  now, uid,
} from './db'
import type {
  SystemUser, Participant, Team, Skill, SkillAssessment, WorkSite, Shift,
  OphelpCard, Payment, CardTransaction, PartnerShop, AtmLocation, Project,
  Equipment, InventoryItem, Incident, Notification, Message, AuditLog,
  DashboardStats, ApiResult, PayrollPeriod, PayrollRosterEntry, PayrollEntry,
  PayrollCorrection, PaymentAuthorisation, WeeklyRegister, OasysCheck,
  DepotSchedule, Quotation,
} from './types'

// ── Participants ──────────────────────────────────────────────────────────────
export const ParticipantApi = {
  list(): Participant[] { return Participants.all() },
  get(id: string): Participant | undefined { return Participants.findById(id) },
  create(data: Omit<Participant, 'id' | 'registeredAt'>): ApiResult<Participant> {
    const p = Participants.insert({ ...data, registeredAt: now() })
    return { success: true, data: p }
  },
  update(id: string, patch: Partial<Participant>): ApiResult<Participant> {
    const p = Participants.update(id, patch)
    return p ? { success: true, data: p } : { success: false, error: 'Participant not found' }
  },
  delete(id: string): ApiResult {
    const ok = Participants.delete(id)
    return ok ? { success: true } : { success: false, error: 'Participant not found' }
  },
  activeCount(): number { return Participants.count(p => p.status === 'active') },
  withCard(): Participant[] { return Participants.where(p => !!p.cardId) },
  byTeam(teamId: string): Participant[] { return Participants.where(p => p.teamId === teamId) },
  search(q: string): Participant[] {
    const lq = q.toLowerCase()
    return Participants.where(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(lq) ||
      p.idNumber.includes(lq) || p.phone.includes(lq)
    )
  },
}

// ── Teams ─────────────────────────────────────────────────────────────────────
export const TeamApi = {
  list(): Team[] { return Teams.all() },
  get(id: string): Team | undefined { return Teams.findById(id) },
  bySite(siteId: string): Team[] { return Teams.where(t => t.siteId === siteId) },
  create(data: Omit<Team, 'id' | 'createdAt'>): ApiResult<Team> {
    const t = Teams.insert({ ...data, createdAt: now() })
    return { success: true, data: t }
  },
  update(id: string, patch: Partial<Team>): ApiResult<Team> {
    const t = Teams.update(id, patch)
    return t ? { success: true, data: t } : { success: false, error: 'Team not found' }
  },
  addMember(teamId: string, participantId: string): ApiResult {
    const team = Teams.findById(teamId)
    if (!team) return { success: false, error: 'Team not found' }
    if (!team.memberIds.includes(participantId)) {
      Teams.update(teamId, { memberIds: [...team.memberIds, participantId] })
      Participants.update(participantId, { teamId })
    }
    return { success: true }
  },
  removeMember(teamId: string, participantId: string): ApiResult {
    const team = Teams.findById(teamId)
    if (!team) return { success: false, error: 'Team not found' }
    Teams.update(teamId, { memberIds: team.memberIds.filter(id => id !== participantId) })
    Participants.update(participantId, { teamId: undefined })
    return { success: true }
  },
}

// ── Skills ────────────────────────────────────────────────────────────────────
export const SkillApi = {
  list(): Skill[] { return Skills.all() },
  assessments(participantId: string): SkillAssessment[] {
    return SkillAssessments.where(a => a.participantId === participantId)
  },
  assess(data: Omit<SkillAssessment, 'id' | 'assessedAt'>): ApiResult<SkillAssessment> {
    const existing = SkillAssessments.findOne(a => a.participantId === data.participantId && a.skillId === data.skillId)
    let result: SkillAssessment
    if (existing) {
      result = SkillAssessments.update(existing.id, { ...data, assessedAt: now() })!
    } else {
      result = SkillAssessments.insert({ ...data, assessedAt: now() })
    }
    return { success: true, data: result }
  },
}

// ── Shifts ────────────────────────────────────────────────────────────────────
export const ShiftApi = {
  list(filter?: Partial<Pick<Shift, 'date' | 'siteId' | 'foremanId' | 'status'>>): Shift[] {
    let shifts = Shifts.all()
    if (filter?.date) shifts = shifts.filter(s => s.date === filter.date)
    if (filter?.siteId) shifts = shifts.filter(s => s.siteId === filter.siteId)
    if (filter?.foremanId) shifts = shifts.filter(s => s.foremanId === filter.foremanId)
    if (filter?.status) shifts = shifts.filter(s => s.status === filter.status)
    return shifts.sort((a, b) => b.date.localeCompare(a.date))
  },
  get(id: string): Shift | undefined { return Shifts.findById(id) },
  todayCount(): number {
    const today = new Date().toISOString().slice(0, 10)
    return Shifts.count(s => s.date === today)
  },
  pendingApprovals(): Shift[] { return Shifts.where(s => s.status === 'completed') },
  create(data: Omit<Shift, 'id'>): ApiResult<Shift> {
    const shift = Shifts.insert(data)
    NotificationApi.create({
      userId: data.foremanId,
      type: 'shift_scheduled',
      title: 'New shift scheduled',
      message: `A shift was scheduled for ${data.date} at site.`,
      read: false,
      entityId: shift.id,
      entityType: 'shift',
    })
    return { success: true, data: shift }
  },
  approve(id: string, approvedBy: string): ApiResult<Shift> {
    const shift = Shifts.update(id, { status: 'approved', approvedBy, approvedAt: now() })
    if (!shift) return { success: false, error: 'Shift not found' }

    const participant = Participants.findById(shift.participantId)
    if (participant?.cardId) {
      Payments.insert({
        participantId: shift.participantId,
        cardId: participant.cardId,
        shiftId: id,
        amount: 80,
        status: 'pending',
        createdAt: now(),
      })
    }

    NotificationApi.create({
      userId: shift.participantId,
      type: 'shift_approved',
      title: 'Your shift was approved',
      message: `Your shift on ${shift.date} was approved. R80 will be loaded to your OPHELP Card.`,
      read: false,
      entityId: shift.id,
      entityType: 'shift',
    })

    AuditApi.log(approvedBy, 'Shift approved', 'shift', id, `Shift approved for participant ${shift.participantId}`)
    return { success: true, data: shift }
  },
  reject(id: string, rejectedBy: string, reason: string): ApiResult<Shift> {
    const shift = Shifts.update(id, { status: 'rejected', rejectionReason: reason })
    if (!shift) return { success: false, error: 'Shift not found' }

    NotificationApi.create({
      userId: shift.participantId,
      type: 'shift_rejected',
      title: 'Your shift was not approved',
      message: `Your shift on ${shift.date} was not approved. Reason: ${reason}`,
      read: false,
      entityId: shift.id,
      entityType: 'shift',
    })
    return { success: true, data: shift }
  },
  update(id: string, patch: Partial<Shift>): ApiResult<Shift> {
    const s = Shifts.update(id, patch)
    return s ? { success: true, data: s } : { success: false, error: 'Shift not found' }
  },
  delete(id: string): ApiResult {
    return Shifts.delete(id) ? { success: true } : { success: false, error: 'Shift not found' }
  },
}

// ── Payments ──────────────────────────────────────────────────────────────────
export const PaymentApi = {
  list(): Payment[] { return Payments.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) },
  pending(): Payment[] { return Payments.where(p => p.status === 'pending') },
  process(id: string, processedBy: string): ApiResult<Payment> {
    const payment = Payments.findById(id)
    if (!payment || payment.status !== 'pending') return { success: false, error: 'Payment not found or already processed' }

    const updated = Payments.update(id, { status: 'processed', processedAt: now(), processedBy })!
    const card = Cards.findById(payment.cardId)
    if (card) {
      const newBalance = card.balance + payment.amount
      Cards.update(card.id, {
        balance: newBalance,
        totalLoaded: card.totalLoaded + payment.amount,
        lastUsed: now(),
      })
      Transactions.insert({
        cardId: card.id,
        participantId: payment.participantId,
        amount: payment.amount,
        type: 'credit',
        description: `Shift payment — ${new Date().toLocaleDateString('en-ZA')}`,
        category: 'payment',
        balanceBefore: card.balance,
        balanceAfter: newBalance,
        createdAt: now(),
      })

      NotificationApi.create({
        userId: payment.participantId,
        type: 'payment_processed',
        title: 'R80 loaded onto your card',
        message: `R${payment.amount} has been loaded onto your OPHELP Card ${card.cardNumber}. New balance: R${newBalance}.`,
        read: false,
        entityId: payment.id,
        entityType: 'payment',
      })
    }
    AuditApi.log(processedBy, 'Payment processed', 'payment', id, `R${payment.amount} loaded onto card ${card?.cardNumber ?? payment.cardId}`)
    return { success: true, data: updated }
  },
  monthlyTotal(): number { return Payments.where(p => p.status === 'processed').reduce((s, p) => s + p.amount, 0) },
}

// ── Cards ─────────────────────────────────────────────────────────────────────
export const CardApi = {
  list(): OphelpCard[] { return Cards.all() },
  get(id: string): OphelpCard | undefined { return Cards.findById(id) },
  getByParticipant(participantId: string): OphelpCard | undefined { return Cards.findOne(c => c.participantId === participantId) },
  issue(participantId: string, issuedBy: string): ApiResult<OphelpCard> {
    const existing = Cards.findOne(c => c.participantId === participantId && c.status === 'active')
    if (existing) return { success: false, error: 'Participant already has an active card' }
    const count = Cards.all().length + 1
    const card = Cards.insert({
      cardNumber: `OPH-${String(1000 + count).padStart(4, '0')}`,
      participantId,
      balance: 0,
      totalLoaded: 0,
      totalSpent: 0,
      status: 'active',
      issuedAt: now(),
      issuedBy,
    })
    Participants.update(participantId, { cardId: card.id })
    AuditApi.log(issuedBy, 'Card issued', 'card', card.id, `Card ${card.cardNumber} issued to participant ${participantId}`)
    return { success: true, data: card }
  },
  suspend(id: string, reason: string): ApiResult<OphelpCard> {
    const card = Cards.update(id, { status: 'suspended', suspendedAt: now(), suspendReason: reason })
    return card ? { success: true, data: card } : { success: false, error: 'Card not found' }
  },
  reactivate(id: string): ApiResult<OphelpCard> {
    const card = Cards.update(id, { status: 'active', suspendedAt: undefined, suspendReason: undefined })
    return card ? { success: true, data: card } : { success: false, error: 'Card not found' }
  },
  transactions(cardId: string): CardTransaction[] {
    return Transactions.where(t => t.cardId === cardId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  debit(cardId: string, amount: number, description: string, category?: CardTransaction['category'], merchantId?: string, atmId?: string): ApiResult<CardTransaction> {
    const card = Cards.findById(cardId)
    if (!card) return { success: false, error: 'Card not found' }
    if (card.status !== 'active') return { success: false, error: 'Card is not active' }
    if (card.balance < amount) return { success: false, error: 'Insufficient balance' }
    const newBalance = card.balance - amount
    Cards.update(cardId, { balance: newBalance, totalSpent: card.totalSpent + amount, lastUsed: now() })
    const tx = Transactions.insert({
      cardId, participantId: card.participantId, amount, type: 'debit',
      description, category, merchantId, atmId,
      balanceBefore: card.balance, balanceAfter: newBalance, createdAt: now(),
    })
    if (newBalance < 40) {
      NotificationApi.create({
        userId: card.participantId,
        type: 'card_low_balance',
        title: 'Low card balance',
        message: `Your OPHELP Card balance is R${newBalance}. Ensure your shifts are approved to receive more.`,
        read: false,
        entityId: card.id,
        entityType: 'card',
      })
    }
    return { success: true, data: tx }
  },
  allTransactions(): CardTransaction[] { return Transactions.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) },
}

// ── Users ─────────────────────────────────────────────────────────────────────
export const UserApi = {
  list(): Omit<SystemUser, 'passwordHash'>[] { return Users.all().map(({ passwordHash: _, ...u }) => u) },
  get(id: string): Omit<SystemUser, 'passwordHash'> | undefined {
    const u = Users.findById(id)
    if (!u) return undefined
    const { passwordHash: _, ...safe } = u
    return safe
  },
  create(data: Omit<SystemUser, 'id' | 'createdAt'>): ApiResult<Omit<SystemUser, 'passwordHash'>> {
    const user = Users.insert({ ...data, createdAt: now() })
    const { passwordHash: _, ...safe } = user
    return { success: true, data: safe }
  },
  update(id: string, patch: Partial<Omit<SystemUser, 'passwordHash'>>): ApiResult<Omit<SystemUser, 'passwordHash'>> {
    const u = Users.update(id, patch as Partial<SystemUser>)
    if (!u) return { success: false, error: 'User not found' }
    const { passwordHash: _, ...safe } = u
    return { success: true, data: safe }
  },
  deactivate(id: string) { Users.update(id, { active: false }) },
  activate(id: string) { Users.update(id, { active: true }) },
}

// ── Sites ─────────────────────────────────────────────────────────────────────
export const SiteApi = {
  list(): WorkSite[] { return Sites.all() },
  get(id: string): WorkSite | undefined { return Sites.findById(id) },
  active(): WorkSite[] { return Sites.where(s => s.status === 'active') },
  create(data: Omit<WorkSite, 'id'>): ApiResult<WorkSite> {
    const site = Sites.insert(data)
    return { success: true, data: site }
  },
  update(id: string, patch: Partial<WorkSite>): ApiResult<WorkSite> {
    const s = Sites.update(id, patch)
    return s ? { success: true, data: s } : { success: false, error: 'Site not found' }
  },
}

// ── Partner Shops ─────────────────────────────────────────────────────────────
export const PartnerShopApi = {
  list(): PartnerShop[] { return PartnerShops.all() },
  get(id: string): PartnerShop | undefined { return PartnerShops.findById(id) },
  activeCount(): number { return PartnerShops.count(s => s.status === 'active') },
  create(data: Omit<PartnerShop, 'id'>): ApiResult<PartnerShop> {
    const shop = PartnerShops.insert(data)
    return { success: true, data: shop }
  },
  update(id: string, patch: Partial<PartnerShop>): ApiResult<PartnerShop> {
    const s = PartnerShops.update(id, patch)
    return s ? { success: true, data: s } : { success: false, error: 'Partner shop not found' }
  },
  myShop(userId: string): PartnerShop | undefined { return PartnerShops.findOne(s => s.userId === userId) },
}

// ── ATM Locations ─────────────────────────────────────────────────────────────
export const AtmApi = {
  list(): AtmLocation[] { return AtmLocations.all() },
  operationalCount(): number { return AtmLocations.count(a => a.status === 'operational') },
  update(id: string, patch: Partial<AtmLocation>): ApiResult<AtmLocation> {
    const a = AtmLocations.update(id, patch)
    return a ? { success: true, data: a } : { success: false, error: 'ATM not found' }
  },
}

// ── Projects ──────────────────────────────────────────────────────────────────
export const ProjectApi = {
  list(): Project[] { return Projects.all() },
  get(id: string): Project | undefined { return Projects.findById(id) },
  byManager(managerId: string): Project[] { return Projects.where(p => p.managerId === managerId) },
  create(data: Omit<Project, 'id'>): ApiResult<Project> {
    const project = Projects.insert(data)
    return { success: true, data: project }
  },
  update(id: string, patch: Partial<Project>): ApiResult<Project> {
    const p = Projects.update(id, patch)
    return p ? { success: true, data: p } : { success: false, error: 'Project not found' }
  },
  addMilestone(projectId: string, title: string, dueDate: string): ApiResult<Project> {
    const project = Projects.findById(projectId)
    if (!project) return { success: false, error: 'Project not found' }
    const milestone = { id: uid(), title, dueDate, status: 'pending' as const }
    const updated = Projects.update(projectId, { milestones: [...project.milestones, milestone] })
    return updated ? { success: true, data: updated } : { success: false, error: 'Update failed' }
  },
  completeMilestone(projectId: string, milestoneId: string): ApiResult<Project> {
    const project = Projects.findById(projectId)
    if (!project) return { success: false, error: 'Project not found' }
    const milestones = project.milestones.map(m =>
      m.id === milestoneId ? { ...m, status: 'completed' as const, completedAt: now() } : m
    )
    const completed = milestones.filter(m => m.status === 'completed').length
    const progressPct = Math.round((completed / milestones.length) * 100)
    const updated = Projects.update(projectId, { milestones, progressPct })
    return updated ? { success: true, data: updated } : { success: false, error: 'Update failed' }
  },
}

// ── Equipment ─────────────────────────────────────────────────────────────────
export const EquipmentApi = {
  list(): Equipment[] { return Equipments.all() },
  get(id: string): Equipment | undefined { return Equipments.findById(id) },
  bySite(siteId: string): Equipment[] { return Equipments.where(e => e.siteId === siteId) },
  create(data: Omit<Equipment, 'id'>): ApiResult<Equipment> {
    const e = Equipments.insert(data)
    return { success: true, data: e }
  },
  update(id: string, patch: Partial<Equipment>): ApiResult<Equipment> {
    const e = Equipments.update(id, patch)
    return e ? { success: true, data: e } : { success: false, error: 'Equipment not found' }
  },
  retire(id: string): ApiResult {
    Equipments.update(id, { status: 'retired' })
    return { success: true }
  },
}

// ── Inventory ─────────────────────────────────────────────────────────────────
export const InventoryApi = {
  list(): InventoryItem[] { return Inventory.all() },
  lowStock(): InventoryItem[] { return Inventory.where(i => i.quantity <= i.minQuantity) },
  create(data: Omit<InventoryItem, 'id'>): ApiResult<InventoryItem> {
    const item = Inventory.insert(data)
    return { success: true, data: item }
  },
  update(id: string, patch: Partial<InventoryItem>): ApiResult<InventoryItem> {
    const i = Inventory.update(id, patch)
    return i ? { success: true, data: i } : { success: false, error: 'Item not found' }
  },
  restock(id: string, quantity: number): ApiResult<InventoryItem> {
    const item = Inventory.findById(id)
    if (!item) return { success: false, error: 'Item not found' }
    const updated = Inventory.update(id, { quantity: item.quantity + quantity, lastRestocked: now() })
    return updated ? { success: true, data: updated } : { success: false, error: 'Update failed' }
  },
  issue(id: string, quantity: number): ApiResult<InventoryItem> {
    const item = Inventory.findById(id)
    if (!item) return { success: false, error: 'Item not found' }
    if (item.quantity < quantity) return { success: false, error: 'Insufficient stock' }
    const updated = Inventory.update(id, { quantity: item.quantity - quantity })
    return updated ? { success: true, data: updated } : { success: false, error: 'Update failed' }
  },
}

// ── Incidents ─────────────────────────────────────────────────────────────────
export const IncidentApi = {
  list(): Incident[] { return Incidents.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt)) },
  get(id: string): Incident | undefined { return Incidents.findById(id) },
  bySite(siteId: string): Incident[] { return Incidents.where(i => i.siteId === siteId) },
  open(): Incident[] { return Incidents.where(i => i.status === 'open' || i.status === 'investigating') },
  create(data: Omit<Incident, 'id' | 'createdAt'>): ApiResult<Incident> {
    const incident = Incidents.insert({ ...data, createdAt: now() })
    NotificationApi.create({
      userId: data.reportedBy,
      type: 'incident_reported',
      title: `Incident reported: ${data.title}`,
      message: `A ${data.severity} severity incident was reported at site.`,
      read: false,
      entityId: incident.id,
      entityType: 'incident',
    })
    AuditApi.log(data.reportedBy, 'Incident reported', 'incident', incident.id, `${data.severity} incident: ${data.title}`)
    return { success: true, data: incident }
  },
  update(id: string, patch: Partial<Incident>): ApiResult<Incident> {
    const i = Incidents.update(id, patch)
    return i ? { success: true, data: i } : { success: false, error: 'Incident not found' }
  },
  resolve(id: string, resolvedBy: string, actionTaken: string): ApiResult<Incident> {
    const i = Incidents.update(id, { status: 'resolved', resolvedBy, resolvedAt: now(), actionTaken })
    AuditApi.log(resolvedBy, 'Incident resolved', 'incident', id, actionTaken)
    return i ? { success: true, data: i } : { success: false, error: 'Incident not found' }
  },
}

// ── Notifications ─────────────────────────────────────────────────────────────
export const NotificationApi = {
  forUser(userId: string): Notification[] {
    return Notifications.where(n => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  unreadCount(userId: string): number { return Notifications.count(n => n.userId === userId && !n.read) },
  markRead(id: string): void { Notifications.update(id, { read: true }) },
  markAllRead(userId: string): void {
    Notifications.where(n => n.userId === userId && !n.read).forEach(n => Notifications.update(n.id, { read: true }))
  },
  create(data: Omit<Notification, 'id' | 'createdAt'>): Notification {
    return Notifications.insert({ ...data, createdAt: now() })
  },
}

// ── Messages ──────────────────────────────────────────────────────────────────
export const MessageApi = {
  inbox(userId: string): Message[] {
    return Messages.where(m => m.toUserId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  sent(userId: string): Message[] {
    return Messages.where(m => m.fromUserId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  unreadCount(userId: string): number { return Messages.count(m => m.toUserId === userId && !m.read) },
  send(fromUserId: string, toUserId: string, subject: string, body: string): Message {
    return Messages.insert({ fromUserId, toUserId, subject, body, read: false, createdAt: now() })
  },
  markRead(id: string): void { Messages.update(id, { read: true }) },
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
export const AuditApi = {
  recent(limit = 50): AuditLog[] {
    return AuditLogs.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit)
  },
  byEntity(entity: string, entityId: string): AuditLog[] {
    return AuditLogs.where(l => l.entity === entity && l.entityId === entityId)
  },
  log(userId: string, action: string, entity: string, entityId: string, detail: string) {
    AuditLogs.insert({ userId, action, entity, entityId, detail, createdAt: now() })
  },
}

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const ReportApi = {
  dashboardStats(): DashboardStats {
    return {
      activeParticipants: ParticipantApi.activeCount(),
      todaysShifts: ShiftApi.todayCount(),
      approvedShifts: Shifts.count(s => s.status === 'approved'),
      pendingApprovals: ShiftApi.pendingApprovals().length,
      partnerShops: PartnerShopApi.activeCount(),
      atmLocations: AtmApi.operationalCount(),
      monthlyPaymentsTotal: PaymentApi.monthlyTotal(),
      totalTransactions: Transactions.count(),
      openIncidents: IncidentApi.open().length,
      activeProjects: Projects.count(p => p.status === 'on_track' || p.status === 'at_risk' || p.status === 'planning'),
      totalCards: Cards.count(c => c.status === 'active'),
      pendingPayments: Payments.count(p => p.status === 'pending'),
    }
  },

  monthlyTrend(): { month: string; participants: number; payments: number }[] {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const currentMonth = new Date().getMonth()
    return Array.from({ length: 6 }, (_, i) => {
      const mIdx = (currentMonth - 5 + i + 12) % 12
      const base = 580 + i * 12
      return {
        month: months[mIdx],
        participants: i === 5 ? ParticipantApi.activeCount() : base + (mIdx % 3) * 5,
        payments: i === 5 ? PaymentApi.monthlyTotal() || 89200 : (base * 140) + (i * 2000),
      }
    })
  },

  kpiScores(): { kpi: string; target: number; actual: number }[] {
    const approved = Shifts.where(s => s.status === 'approved').length
    const total = Shifts.count() || 1
    return [
      { kpi: 'Participant Completion Rate', target: 90, actual: Math.min(99, Math.round((approved / total) * 100) || 87) },
      { kpi: 'Shift Approval Turnaround', target: 95, actual: 96 },
      { kpi: 'Payment Processing Time', target: 80, actual: 74 },
      { kpi: 'Community Satisfaction', target: 85, actual: 91 },
      { kpi: 'Safety Incident Rate', target: 98, actual: 99 },
    ]
  },

  sitePerformance(): { name: string; progress: number; budget: number; spent: number }[] {
    return Sites.where(s => s.status === 'active').map(s => ({
      name: s.name,
      progress: s.progressPct,
      budget: s.budget,
      spent: s.spent,
    }))
  },
}

// ── Payroll (Operation Office paysheet runs) ────────────────────────────────────
export interface PayrollPersonSummary {
  fileNo: string
  name: string
  participantId?: string | null
  hours: number
  gross: number
  corrections: number
  net: number
}

export interface PayrollTotals {
  people: number
  hours: number
  gross: number
  corrections: number
  net: number
}

export const PayrollApi = {
  periods(): PayrollPeriod[] {
    return PayrollPeriods.all().sort((a, b) => b.number - a.number)
  },
  latestPeriod(): PayrollPeriod | undefined {
    return this.periods()[0]
  },
  createPeriod(data: Omit<PayrollPeriod, 'id' | 'createdAt' | 'status'> & { status?: PayrollPeriod['status'] }): ApiResult<PayrollPeriod> {
    if (PayrollPeriods.findOne(p => p.number === data.number)) {
      return { success: false, error: `Period ${data.number} already exists` }
    }
    const p = PayrollPeriods.insert({ ...data, status: data.status ?? 'draft', createdAt: now() })
    return { success: true, data: p }
  },
  updatePeriod(id: string, patch: Partial<PayrollPeriod>): ApiResult<PayrollPeriod> {
    const p = PayrollPeriods.update(id, patch)
    return p ? { success: true, data: p } : { success: false, error: 'Payroll period not found' }
  },

  roster(): PayrollRosterEntry[] { return PayrollRoster.all() },

  entriesByPeriod(periodId: string): PayrollEntry[] {
    return PayrollEntries.where(e => e.periodId === periodId)
  },
  addEntry(data: Omit<PayrollEntry, 'id' | 'createdAt'>): ApiResult<PayrollEntry> {
    const e = PayrollEntries.insert({ ...data, createdAt: now() })
    return { success: true, data: e }
  },
  deleteEntry(id: string): ApiResult {
    return PayrollEntries.delete(id) ? { success: true } : { success: false, error: 'Entry not found' }
  },

  correctionsByPeriod(periodId: string): PayrollCorrection[] {
    return PayrollCorrections.where(c => c.periodId === periodId)
  },
  addCorrection(data: Omit<PayrollCorrection, 'id' | 'createdAt'>): ApiResult<PayrollCorrection> {
    const c = PayrollCorrections.insert({ ...data, createdAt: now() })
    return { success: true, data: c }
  },
  deleteCorrection(id: string): ApiResult {
    return PayrollCorrections.delete(id) ? { success: true } : { success: false, error: 'Correction not found' }
  },

  /** Per-person payslip summary for a period: hours worked, gross pay,
   * corrections (deductions are negative), and net payable. */
  summaryByPeriod(periodId: string): PayrollPersonSummary[] {
    const entries = this.entriesByPeriod(periodId)
    const corrections = this.correctionsByPeriod(periodId)
    const rosterByFileNo = new Map(PayrollRoster.all().map(r => [r.fileNo, r]))
    const byFileNo = new Map<string, PayrollPersonSummary>()

    for (const e of entries) {
      const row = byFileNo.get(e.fileNo) ?? {
        fileNo: e.fileNo, name: e.name,
        participantId: rosterByFileNo.get(e.fileNo)?.participantId ?? null,
        hours: 0, gross: 0, corrections: 0, net: 0,
      }
      row.hours += e.hours
      row.gross += e.amount
      byFileNo.set(e.fileNo, row)
    }
    for (const c of corrections) {
      const row = byFileNo.get(c.fileNo) ?? {
        fileNo: c.fileNo, name: c.name,
        participantId: rosterByFileNo.get(c.fileNo)?.participantId ?? null,
        hours: 0, gross: 0, corrections: 0, net: 0,
      }
      row.corrections += c.amount
      byFileNo.set(c.fileNo, row)
    }
    for (const row of byFileNo.values()) row.net = row.gross + row.corrections

    return [...byFileNo.values()].sort((a, b) => a.name.localeCompare(b.name))
  },

  periodTotals(periodId: string): PayrollTotals {
    const summary = this.summaryByPeriod(periodId)
    return summary.reduce((acc, r) => ({
      people: acc.people + 1,
      hours: acc.hours + r.hours,
      gross: acc.gross + r.gross,
      corrections: acc.corrections + r.corrections,
      net: acc.net + r.net,
    }), { people: 0, hours: 0, gross: 0, corrections: 0, net: 0 })
  },
}

// ── Payment Authorisations (Operation Office expense sign-off) ─────────────────
export const PaymentAuthorisationApi = {
  list(): PaymentAuthorisation[] {
    return PaymentAuthorisations.all().sort((a, b) => b.date.localeCompare(a.date))
  },
  get(id: string): PaymentAuthorisation | undefined { return PaymentAuthorisations.findById(id) },
  create(data: Omit<PaymentAuthorisation, 'id' | 'createdAt' | 'status'> & { status?: PaymentAuthorisation['status'] }): ApiResult<PaymentAuthorisation> {
    if (PaymentAuthorisations.findOne(p => p.paNumber === data.paNumber)) {
      return { success: false, error: `PA ${data.paNumber} already exists` }
    }
    const p = PaymentAuthorisations.insert({ ...data, status: data.status ?? 'captured', createdAt: now() })
    return { success: true, data: p }
  },
  update(id: string, patch: Partial<PaymentAuthorisation>): ApiResult<PaymentAuthorisation> {
    const p = PaymentAuthorisations.update(id, patch)
    return p ? { success: true, data: p } : { success: false, error: 'Payment authorisation not found' }
  },
  delete(id: string): ApiResult {
    return PaymentAuthorisations.delete(id) ? { success: true } : { success: false, error: 'Payment authorisation not found' }
  },
  byClient(client: string): PaymentAuthorisation[] {
    return PaymentAuthorisations.where(p => p.client === client)
  },
  monthlyTotal(): number {
    const now_ = new Date()
    return PaymentAuthorisations.where(p => {
      const d = new Date(p.date)
      return d.getMonth() === now_.getMonth() && d.getFullYear() === now_.getFullYear()
    }).reduce((sum, p) => sum + p.amount, 0)
  },
}

// ── Weekly Registers (OPS Office / Coaching Leadership / Leave Register /
// Payroll Register cover sheets) ────────────────────────────────────────────
export const WeeklyRegisterApi = {
  list(): WeeklyRegister[] {
    return WeeklyRegisters.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  get(id: string): WeeklyRegister | undefined { return WeeklyRegisters.findById(id) },
  byType(type: WeeklyRegister['type']): WeeklyRegister[] {
    return WeeklyRegisters.where(r => r.type === type)
  },
  delete(id: string): ApiResult {
    return WeeklyRegisters.delete(id) ? { success: true } : { success: false, error: 'Register not found' }
  },
}

// ── OASys Reconciliation Checks ─────────────────────────────────────────────
export const OasysCheckApi = {
  list(): OasysCheck[] {
    return OasysChecks.all().sort((a, b) => b.weekStart.localeCompare(a.weekStart))
  },
  unbalanced(): OasysCheck[] { return OasysChecks.where(c => !c.balanced) },
  byMonth(sourceSheet: string): OasysCheck[] { return OasysChecks.where(c => c.sourceSheet === sourceSheet) },
  summary(): { totalWeeks: number; balancedWeeks: number; unbalancedWeeks: number; totalDifference: number } {
    const all = OasysChecks.all()
    const unbalanced = all.filter(c => !c.balanced)
    return {
      totalWeeks: all.length,
      balancedWeeks: all.length - unbalanced.length,
      unbalancedWeeks: unbalanced.length,
      totalDifference: unbalanced.reduce((s, c) => s + c.dailyChecks.reduce((s2, d) => s2 + d.difference, 0), 0),
    }
  },
}

// ── Depot Schedules (daily shift + office roster board) ─────────────────────
export const DepotScheduleApi = {
  list(): DepotSchedule[] {
    return DepotSchedules.all().sort((a, b) => b.date.localeCompare(a.date))
  },
  get(id: string): DepotSchedule | undefined { return DepotSchedules.findById(id) },
  latest(): DepotSchedule | undefined { return this.list()[0] },
  byDepot(depotName: string): DepotSchedule[] { return DepotSchedules.where(s => s.depotName === depotName) },
  delete(id: string): ApiResult {
    return DepotSchedules.delete(id) ? { success: true } : { success: false, error: 'Schedule not found' }
  },
}

// ── Quotations (job cost estimates for partners/clients) ────────────────────
export const QuotationApi = {
  list(): Quotation[] {
    return Quotations.all().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  get(id: string): Quotation | undefined { return Quotations.findById(id) },
  byStatus(status: Quotation['status']): Quotation[] { return Quotations.where(q => q.status === status) },
  byClient(client: string): Quotation[] { return Quotations.where(q => q.client === client) },
  create(data: Omit<Quotation, 'id' | 'createdAt' | 'status'> & { status?: Quotation['status'] }): ApiResult<Quotation> {
    const q = Quotations.insert({ ...data, status: data.status ?? 'draft', createdAt: now() })
    return { success: true, data: q }
  },
  update(id: string, patch: Partial<Quotation>): ApiResult<Quotation> {
    const q = Quotations.update(id, patch)
    return q ? { success: true, data: q } : { success: false, error: 'Quotation not found' }
  },
  setClient(id: string, client: string): ApiResult<Quotation> { return this.update(id, { client }) },
  setStatus(id: string, status: Quotation['status']): ApiResult<Quotation> { return this.update(id, { status }) },
  delete(id: string): ApiResult {
    return Quotations.delete(id) ? { success: true } : { success: false, error: 'Quotation not found' }
  },
}
