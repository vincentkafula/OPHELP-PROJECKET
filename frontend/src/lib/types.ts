// ── Full entity types for the OPHELP system ───────────────────────────────────

export type UserRole =
  | 'admin'
  | 'foreman'
  | 'day_admin'
  | 'operation_office'
  | 'operation_management'
  | 'ophelp_store'
  | 'project_manager'
  | 'head_office'
  | 'partner'
  | 'team'

// ── System Users ──────────────────────────────────────────────────────────────
export interface SystemUser {
  id: string
  name: string
  email: string
  passwordHash: string
  role: UserRole
  roleLabel: string
  avatar: string
  active: boolean
  phone?: string
  department?: string
  createdAt: string
  lastLogin?: string
}

// ── Participants ──────────────────────────────────────────────────────────────
export type ParticipantStatus = 'active' | 'inactive' | 'graduated' | 'suspended'

export interface Participant {
  id: string
  firstName: string
  lastName: string
  idNumber: string
  phone: string
  email?: string
  address: string
  suburb: string
  city: string
  emergencyContact: string
  emergencyPhone: string
  skills: string[]
  cardId?: string
  teamId?: string
  status: ParticipantStatus
  notes?: string
  registeredAt: string
  registeredBy: string
}

// ── Teams ────────────────────────────────────────────────────────────────────
export interface Team {
  id: string
  name: string
  siteId: string
  foremanId: string
  memberIds: string[]
  createdAt: string
}

// ── Skills ───────────────────────────────────────────────────────────────────
export interface Skill {
  id: string
  name: string
  category: 'technical' | 'safety' | 'administrative' | 'leadership'
  description: string
}

export interface SkillAssessment {
  id: string
  participantId: string
  skillId: string
  level: number // 0–100
  assessedBy: string
  assessedAt: string
  notes?: string
}

// ── Work Sites ────────────────────────────────────────────────────────────────
export type SiteType = 'road_maintenance' | 'parks' | 'cleaning' | 'construction' | 'school' | 'admin'
export type SiteStatus = 'active' | 'inactive' | 'on_hold' | 'completed'

export interface WorkSite {
  id: string
  name: string
  address: string
  suburb: string
  type: SiteType
  foremanId: string
  status: SiteStatus
  teamSize: number
  progressPct: number
  budget: number
  spent: number
  startDate: string
  endDate: string
  description?: string
}

// ── Shifts ────────────────────────────────────────────────────────────────────
export type ShiftStatus = 'scheduled' | 'in_progress' | 'completed' | 'approved' | 'rejected' | 'absent'

export interface Shift {
  id: string
  participantId: string
  siteId: string
  teamId?: string
  date: string
  startTime: string
  endTime: string
  task: string
  foremanId: string
  status: ShiftStatus
  hoursWorked?: number
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
  checkInTime?: string
  checkOutTime?: string
  notes?: string
  createdAt: string
}

// ── OPHELP Cards ──────────────────────────────────────────────────────────────
export type CardStatus = 'active' | 'suspended' | 'lost' | 'cancelled'

export interface OphelpCard {
  id: string
  cardNumber: string
  participantId: string
  balance: number
  totalLoaded: number
  totalSpent: number
  status: CardStatus
  issuedAt: string
  issuedBy: string
  lastUsed?: string
  suspendedAt?: string
  suspendReason?: string
}

// ── Payments ──────────────────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'processing' | 'processed' | 'failed' | 'reversed'

export interface Payment {
  id: string
  participantId: string
  cardId: string
  shiftId: string
  amount: number
  status: PaymentStatus
  processedAt?: string
  processedBy?: string
  failureReason?: string
  createdAt: string
}

// ── Card Transactions ─────────────────────────────────────────────────────────
export type TransactionType = 'credit' | 'debit' | 'reversal'

export interface CardTransaction {
  id: string
  cardId: string
  participantId: string
  amount: number
  type: TransactionType
  description: string
  category?: 'groceries' | 'clothing' | 'healthcare' | 'atm' | 'payment' | 'other'
  merchantId?: string
  merchantName?: string
  atmId?: string
  balanceBefore: number
  balanceAfter: number
  createdAt: string
}

// ── Partner Shops ─────────────────────────────────────────────────────────────
export type ShopStatus = 'active' | 'suspended' | 'pending' | 'terminated'

export interface PartnerShop {
  id: string
  name: string
  address: string
  suburb: string
  ownerName: string
  ownerEmail: string
  phone: string
  category: 'grocery' | 'pharmacy' | 'clothing' | 'hardware' | 'general'
  acceptedSince: string
  contractExpiry: string
  status: ShopStatus
  monthlyTransactionCount: number
  monthlyTransactionValue: number
  userId?: string // linked partner user
}

// ── ATM Locations ─────────────────────────────────────────────────────────────
export interface AtmLocation {
  id: string
  name: string
  address: string
  suburb: string
  latitude: number
  longitude: number
  status: 'operational' | 'offline' | 'maintenance'
  lastChecked: string
}

// ── Projects ──────────────────────────────────────────────────────────────────
export type ProjectStatus = 'planning' | 'on_track' | 'at_risk' | 'delayed' | 'completed' | 'cancelled'

export interface Project {
  id: string
  name: string
  description: string
  siteId: string
  managerId: string
  foremanId: string
  deadline: string
  startDate: string
  progressPct: number
  status: ProjectStatus
  teamSize: number
  budget: number
  spent: number
  milestones: Milestone[]
  tags: string[]
}

export interface Milestone {
  id: string
  title: string
  dueDate: string
  completedAt?: string
  status: 'pending' | 'in_progress' | 'completed' | 'overdue'
}

// ── Equipment ─────────────────────────────────────────────────────────────────
export type EquipmentCondition = 'excellent' | 'good' | 'fair' | 'poor' | 'broken'

export interface Equipment {
  id: string
  name: string
  serialNumber: string
  category: 'vehicle' | 'tool' | 'ppe' | 'machinery' | 'it'
  siteId?: string
  assignedTo?: string
  condition: EquipmentCondition
  purchasedAt: string
  purchaseValue: number
  nextServiceDate?: string
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
}

// ── Inventory (OPHELP Store) ──────────────────────────────────────────────────
export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: 'ppe' | 'card' | 'uniform' | 'stationery' | 'cleaning' | 'tools'
  quantity: number
  minQuantity: number
  unitCost: number
  supplier: string
  lastRestocked: string
  location: string
}

// ── Incidents ─────────────────────────────────────────────────────────────────
export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed'

export interface Incident {
  id: string
  siteId: string
  reportedBy: string
  participantId?: string
  title: string
  description: string
  severity: IncidentSeverity
  status: IncidentStatus
  actionTaken?: string
  resolvedBy?: string
  resolvedAt?: string
  createdAt: string
}

// ── Notifications ─────────────────────────────────────────────────────────────
export type NotificationType =
  | 'shift_approved'
  | 'shift_rejected'
  | 'payment_processed'
  | 'card_low_balance'
  | 'incident_reported'
  | 'payment_pending'
  | 'shift_scheduled'
  | 'system'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  read: boolean
  entityId?: string
  entityType?: string
  createdAt: string
}

// ── Messages ──────────────────────────────────────────────────────────────────
export interface Message {
  id: string
  fromUserId: string
  toUserId: string
  subject: string
  body: string
  read: boolean
  createdAt: string
}

// ── Audit Logs ────────────────────────────────────────────────────────────────
export interface AuditLog {
  id: string
  userId: string
  action: string
  entity: string
  entityId: string
  detail: string
  ipAddress?: string
  createdAt: string
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface AuthToken {
  token: string
  userId: string
  role: UserRole
  expiresAt: string
}

export interface LoginResult {
  success: boolean
  user?: Omit<SystemUser, 'passwordHash'>
  token?: string
  error?: string
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardStats {
  activeParticipants: number
  todaysShifts: number
  approvedShifts: number
  pendingApprovals: number
  partnerShops: number
  atmLocations: number
  monthlyPaymentsTotal: number
  totalTransactions: number
  openIncidents: number
  activeProjects: number
  totalCards: number
  pendingPayments: number
}

// ── Form result ───────────────────────────────────────────────────────────────
export interface ApiResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: Record<string, string>
}
