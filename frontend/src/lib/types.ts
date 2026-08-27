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

// ── Payroll (Operation Office paysheet runs) ──────────────────────────────────
export type PayrollPeriodStatus = 'draft' | 'imported' | 'finalized' | 'paid'

export interface PayrollPeriod {
  id: string
  number: number
  label: string
  status: PayrollPeriodStatus
  importedAt?: string
  createdAt: string
}

// One roster record per payee for a payroll run — this is deliberately
// separate from Participant (which is the field-operations identity)
// since a payroll roster carries bank/beneficiary detail that not every
// participant profile has yet, and a payroll roster entry may not match
// an existing participant at all until reconciled.
export interface PayrollRosterEntry {
  id: string
  fileNo: string
  name: string
  absaBeneficiaryNumber: string
  payrollCode: string
  department?: string
  glCode?: string
  participantId?: string | null
  createdAt: string
}

// One paysheet line: a person's hours/pay for one task on one day of a period.
export interface PayrollEntry {
  id: string
  periodId: string
  rosterId?: string | null
  name: string
  fileNo: string
  day: string
  task: string
  hours: number
  amount: number
  createdAt: string
}

// A deduction/addition against a person for a period (medical aid, staff
// loan repayment, training fund, etc.) — negative amounts are deductions.
export interface PayrollCorrection {
  id: string
  periodId: string
  rosterId?: string | null
  name: string
  fileNo: string
  detail: string
  amount: number
  journalEntry?: string
  createdAt: string
}

// ── Payment Authorisations (Operation Office expense/payment sign-off) ───────
export type PaymentAuthorisationStatus = 'captured' | 'authorised' | 'paid'

export interface PaymentAuthorisationBank {
  bank: string
  branchCode: string
  accountType: string
  accountNo: string
}

export interface PaymentAuthorisationInvoice {
  pay: number
  transport: number
  material: number
  admin: number
  other: number
  fee: number
}

// One "PA slip" — a payment authorisation for a one-off or recurring
// expense (direct debit, supplier invoice, etc.), separate from
// participant wage Payments.
export interface PaymentAuthorisation {
  id: string
  paNumber: string
  date: string
  compiler: string
  payee: string
  bank: PaymentAuthorisationBank
  amount: number
  details: string
  authorisation: string
  capturedBy?: string
  expenseAccount: string
  expenseColumn: string
  caption: string
  client: string
  invoice: PaymentAuthorisationInvoice
  status: PaymentAuthorisationStatus
  sourceFile?: string
  createdAt: string
}

// ── Weekly Registers (Ops Office / Coaching Leadership / Leave Register /
// Payroll Register cover sheets — all one family of weekly sign-off sheet
// that ties hours/amounts through to OASys invoicing) ──────────────────────
export type WeeklyRegisterType =
  | 'ops_office' | 'coaching_leadership' | 'leave_register' | 'payroll_register' | 'other'

export interface WeeklyRegisterLine {
  clientNo?: string
  label: string
  hoursByDay: (number | null)[]
  amountByDay: (number | null)[]
  total: number
}

export interface WeeklyRegisterOasysLine {
  clientNo?: string
  account: string
  pay: number
  extra: number
  subTotal: number
  adminFeePct?: number
  invoiceValue: number
}

export interface WeeklyRegister {
  id: string
  type: WeeklyRegisterType
  title: string
  periodFrom: string
  periodTo: string
  payrollNo: string
  preparedBy?: string
  checkedBy?: string
  signedOffBy?: string
  days: string[]
  lines: WeeklyRegisterLine[]
  oasys: WeeklyRegisterOasysLine[]
  totalInvoiceValue: number
  sourceFile?: string
  sourceSheet?: string
  createdAt: string
}

// ── OASys Reconciliation Checks (weekly OASys-vs-Registers balancing) ──────
export interface OasysCheckDaily {
  date: string
  a: number | null
  b: number | null
  difference: number
}

export interface OasysCheck {
  id: string
  weekStart: string
  weekEnd: string
  labelA: string
  labelB: string
  totalA: number
  totalB: number
  dailyChecks: OasysCheckDaily[]
  balanced: boolean
  sourceFile?: string
  sourceSheet?: string
  createdAt: string
}

// ── Depot Schedules (daily shift + office roster board, e.g. Maintenance
// Depot Day Schedule) ────────────────────────────────────────────────────
export interface DepotScheduleShift {
  title: string
  hours: string
  at?: string
  foreman?: string
  workers: string[]
  confirmed?: boolean
  reported?: boolean
  sms?: boolean
}

export interface DepotRosterEntry {
  role: string
  morning?: string
  afternoonRole?: string
  afternoon?: string
}

export interface DepotSchedule {
  id: string
  depotName: string
  date: string
  dateLabel: string
  shifts: DepotScheduleShift[]
  roster: DepotRosterEntry[]
  sourceFile?: string
  createdAt: string
}

// ── Quotations (job cost estimates for partners/clients) ────────────────────
export type QuotationStatus = 'draft' | 'sent' | 'approved' | 'rejected'

export interface QuotationLineItem {
  category: string
  description: string
  unitCost: number | null
  units: number | null
  amount: number
}

export interface Quotation {
  id: string
  title: string
  client: string
  status: QuotationStatus
  lineItems: QuotationLineItem[]
  subtotal: number
  adminFee: number
  managementFee: number
  total: number
  sourceFile?: string
  sourceSheet?: string
  createdAt: string
}

// ── Invoices (issued tax invoices to partners/clients) ──────────────────────
export interface InvoiceLineItem {
  code: string
  description: string
  tax: number
  nettPrice: number
}

export interface Invoice {
  id: string
  documentNo: string
  date: string
  account: string
  yourReference: string
  taxExempt: boolean
  taxType: 'Inclusive' | 'Exclusive'
  client: string
  clientAddress: string[]
  deliverTo: string[]
  lineItems: InvoiceLineItem[]
  subtotal: number
  discountPct: number
  discountAmount: number
  amountExclTax: number
  tax: number
  total: number
  sourceFile?: string
  createdAt: string
}

// ── Jobsheets (money engine: shift payout → serial number → OpHelp ledger →
// partner invoice rollup). Field names and formulas follow the "System
// Configuration Prompt — Field Services Operations Platform" spec, §4-7.
//
// FLAGGED ASSUMPTIONS (spec left these ambiguous — defaulting conservatively,
// per the spec's own instruction to flag rather than guess):
//   1. The spec's §4.5 shows two named "accounts" per Jobsheet in the existing
//      print-form UI, but the §4.4 calculation is written as a single set of
//      formulas with no per-account split specified. Rather than invent a
//      split with no basis in the spec, this computes ONE financial result
//      per Jobsheet (cash/eft/extra/6X/transport/material/other/subtotal/
//      admin fee/invoice total) and keeps `accountName` as a single
//      free-text label for record-keeping.
//   2. "Extra" (pay beyond the contracted R365/R385 team total) is a
//      separate manual field, not derived by subtraction — the UI warns if
//      cash+eft+6X-reward doesn't already equal the contracted total.
//   3. "Other" is not in the §4.4 subtotal formula's listed terms, but is a
//      ledger column in §6 with its own cash/EFT split — a real cost with
//      nowhere else to go would make the invoice under-bill, so it's
//      included in the subtotal here.
//   4. Serial number format follows the literal "8-digit, DDMMYY + 2-digit
//      sequence" rule from §5, not the inconsistent "EG260827010" example.
//   5. Admin fee rate defaults to 25% per §4.4 but is editable per Jobsheet,
//      since §6 lists "Fee Rate %" as its own ledger column (implying it can
//      vary by partner/contract).
export type JobsheetStatus = 'draft' | 'submitted' | 'confirmed'
export type PaymentMethod = 'cash' | 'eft'

export interface JobsheetPayment {
  name: string
  role: 'foreman' | 'worker'
  method: PaymentMethod
  amount: number
}

export interface Jobsheet {
  id: string
  date: string
  jobDetail: string
  partnerShopId?: string
  teamBookingId?: string
  accountName: string
  qualified: boolean
  shiftHours: 4 | 8
  contractedLabourTotal: 365 | 385
  payments: JobsheetPayment[]
  extraAmount: number
  transportAmount: number
  bagsChargeEnabled: boolean
  bagsIssued: number
  bagsReturned: number
  bagsUsed: number
  glovesIssued: number
  glovesReturned: number
  glovesUsed: number
  otherAmount: number
  adminFeeRatePct: number
  status: JobsheetStatus
  serialNumber?: string
  createdBy?: string
  confirmedBy?: string
  confirmedAt?: string
  createdAt: string
}

export interface MonthlyInvoice {
  id: string
  partnerShopId: string
  month: string // 'YYYY-MM'
  jobsheetIds: string[]
  totalAmount: number
  finalizedAt: string
  finalizedBy?: string
  createdAt: string
}

// ── Quotation Requests (Partner → Operation Management → Operation Office →
// Manager approval chain). Per the spec, "operation management" has three
// streams (Pre-School / School / Technical Services) — rather than build
// three separate roles, this uses a `stream` field so the single existing
// `operation_management` role can filter to the stream it owns, flagged
// here as a scoping simplification. ────────────────────────────────────────
export type OperationStream = 'pre_school' | 'school' | 'technical_services'
export type PaymentTerms = 'upfront' | 'monthly'
export type QuotationRequestStatus =
  | 'submitted' | 'management_approved' | 'office_approved' | 'approved' | 'declined'
export type MonthlyTermsDecision = 'pending' | 'approved' | 'declined'

export interface QuotationRequest {
  id: string
  partnerShopId: string
  requestedBy: string
  numWorkers: number
  numForemen: number
  numSupervisors: number
  workerRate: number
  foremanRate: number
  supervisorRate: number
  taskDetails: string
  locationLat?: number
  locationLng?: number
  locationAddress: string
  stream: OperationStream
  quotedAmount: number
  paymentTerms: PaymentTerms
  status: QuotationRequestStatus
  managementApprovedBy?: string
  managementApprovedAt?: string
  managementNotes?: string
  officeApprovedAmount?: number
  officeApprovedBy?: string
  officeApprovedAt?: string
  officeNotes?: string
  managerApprovedBy?: string
  managerApprovedAt?: string
  managerAssignedStream?: OperationStream
  managerNotes?: string
  declinedBy?: string
  declinedAt?: string
  declinedReason?: string
  monthlyTermsDecision?: MonthlyTermsDecision
  monthlyTermsDecisionBy?: string
  monthlyTermsDecisionAt?: string
  createdAt: string
}

// ── Scheduling & Team Booking (field ops flow) ──────────────────────────────
export type ScheduledJobStatus = 'pending_schedule' | 'schedule_approved'

export interface ScheduledJob {
  id: string
  quotationRequestId: string
  partnerShopId: string
  stream: OperationStream
  accountName: string
  scheduledDate: string
  status: ScheduledJobStatus
  approvedBy?: string
  approvedAt?: string
  createdAt: string
}

export type RollCallSession = '07:30' | '12:30'
export type TeamBookingStatus = 'booked' | 'deployed' | 'completed'

export interface TeamBookingReplacement {
  originalName: string
  replacementName: string
  reason: string
  at: string
}

export interface TeamBooking {
  id: string
  scheduledJobId: string
  teamId?: string
  teamName: string
  foremanName: string
  worker1Name: string
  worker2Name: string
  rollCallSession: RollCallSession
  status: TeamBookingStatus
  noShowNames: string[]
  replacements: TeamBookingReplacement[]
  deployedBy?: string
  deployedAt?: string
  bookedBy?: string
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
