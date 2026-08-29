import { useState, useEffect, ReactNode, useCallback } from 'react'
import type { AuthUser, UserRole } from './LoginModal'
import opHelpLogo from '@/imports/Ophelp_Final_Logo.png'
import JobSheet from './JobSheet'
import TaskSheetsPanel from './TaskSheetsPanel'
import OASys from './OASys'
import CityDepotShiftSlip from './CityDepotShiftSlip'
import CashVoucher from './CashVoucher'
import LeaveDaysRegister from './LeaveDaysRegister'
import FieldOperationsLedger from './FieldOperationsLedger'
import IncidentLog from './IncidentLog'
import SheetsLibrary from './SheetsLibrary'
import PayrollPanel from './PayrollPanel'
import PaymentAuthorisationsPanel from './PaymentAuthorisationsPanel'
import WeeklyRegistersPanel from './WeeklyRegistersPanel'
import OasysChecksPanel from './OasysChecksPanel'
import DepotSchedulesPanel from './DepotSchedulesPanel'
import QuotationsPanel from './QuotationsPanel'
import InvoicesPanel from './InvoicesPanel'
import JobsheetsPanel from './JobsheetsPanel'
import SummarySheetsPanel from './SummarySheetsPanel'
import RosterBoard from './RosterBoard'
import MonthlyInvoicePanel from './MonthlyInvoicePanel'
import QuotationRequestPanel from './QuotationRequestPanel'
import RequestApprovalPanel from './RequestApprovalPanel'
import TeamBookingPanel from './TeamBookingPanel'
import RollCallPanel from './RollCallPanel'
import DocumentLibraryPanel from './DocumentLibraryPanel'
import StoreShiftSlipsPanel from './StoreShiftSlipsPanel'
import {
  ReportApi, ParticipantApi, ShiftApi, PaymentApi, CardApi,
  UserApi, SiteApi, PartnerShopApi, ProjectApi, AuditApi,
  IncidentApi, InventoryApi, EquipmentApi, NotificationApi, MessageApi,
  TeamApi, SkillApi,
} from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select, Textarea } from './shared/FormField'
import { ShiftStatusBadge, PaymentStatusBadge, IncidentSeverityBadge, ProjectStatusBadge, CardStatusBadge, Badge } from './shared/Badge'
import type {
  Participant, WorkSite, Shift, OphelpCard, Payment,
  Project, Incident, InventoryItem, Equipment, SystemUser,
} from '@/lib/types'

// ── Role colours ──────────────────────────────────────────────────────────────
const ROLE_COLORS: Record<UserRole, string> = {
  admin: '#7B1FA2', foreman: '#E65100', day_admin: '#00838F',
  operation_office: '#1565C0', operation_management: '#2E7D32',
  ophelp_store: '#F57F17', project_manager: '#AD1457',
  head_office: '#37474F', partner: '#00695C', team: '#283593',
}

const SIDEBAR_ITEMS: Record<UserRole, { icon: string; label: string }[]> = {
  admin: [
    { icon: '🏠', label: 'Overview' }, { icon: '👥', label: 'Users' },
    { icon: '🙋', label: 'Participants' }, { icon: '📊', label: 'Reports' },
    { icon: '📋', label: 'Audit Logs' }, { icon: '⚙️', label: 'Settings' },
  ],
  foreman: [
    { icon: '🏠', label: 'Overview' }, { icon: '📅', label: "Today's Shifts" },
    { icon: '✅', label: 'Approvals' }, { icon: '⚠️', label: 'Incidents' },
    { icon: '👷', label: 'My Team' }, { icon: '📋', label: 'Jobsheet' },
    { icon: '🏛️', label: 'Tasksheet' }, { icon: '🏙️', label: 'Shift Slip' },
    { icon: '💵', label: 'Jobsheets' },
  ],
  day_admin: [
    { icon: '🏠', label: 'Overview' }, { icon: '📅', label: 'Attendance' },
    { icon: '🙋', label: 'Participants' }, { icon: '📄', label: 'Daily Reports' },
    { icon: '🧾', label: 'Cash Voucher' }, { icon: '📒', label: 'Field Ledger' },
    { icon: '⚠️', label: 'Incident Log' }, { icon: '📚', label: 'Sheets Library' },
    { icon: '📢', label: 'Roll Call' }, { icon: '📚', label: 'Document Library' },
    { icon: '🏛️', label: 'Task Sheet' }, { icon: '📋', label: 'Jobsheet' },
    { icon: '🧮', label: 'Summary Sheet' }, { icon: '🧾', label: 'Invoices' },
    { icon: '🗓️', label: 'Shift Deployment Schedule' },
  ],
  operation_office: [
    { icon: '🏠', label: 'Overview' }, { icon: '🏗️', label: 'Sites' },
    { icon: '📦', label: 'Operations' }, { icon: '📊', label: 'Analytics' },
    { icon: '📒', label: 'OASys' }, { icon: '🗓️', label: 'Leave Register' },
    { icon: '💰', label: 'Payroll' }, { icon: '🧾', label: 'Payment Authorisations' },
    { icon: '📋', label: 'Weekly Registers' }, { icon: '🔍', label: 'OASys Reconciliation' },
    { icon: '🗓️', label: 'Depot Schedules' }, { icon: '📐', label: 'Quotations' },
    { icon: '🧾', label: 'Invoices' },
    { icon: '💵', label: 'Jobsheet Review' }, { icon: '📒', label: 'OpHelp Ledger' },
    { icon: '📅', label: 'Monthly Invoices' },
    { icon: '📝', label: 'Quotation Approvals' }, { icon: '🗓️', label: 'Shift Deployment Schedule' },
    { icon: '🧮', label: 'Summary Sheet' },
  ],
  operation_management: [
    { icon: '🏠', label: 'Overview' }, { icon: '🏗️', label: 'Sites' },
    { icon: '👥', label: 'Workforce' }, { icon: '📊', label: 'Performance' },
    { icon: '⚠️', label: 'Incidents' }, { icon: '📝', label: 'Quotation Requests' },
    { icon: '🏛️', label: 'Task Sheet' },
  ],
  ophelp_store: [
    { icon: '🏠', label: 'Overview' }, { icon: '💳', label: 'Cards' },
    { icon: '💰', label: 'Payments' }, { icon: '📦', label: 'Inventory' },
    { icon: '🧤', label: 'Shift Slips' },
  ],
  project_manager: [
    { icon: '🏠', label: 'Overview' }, { icon: '📁', label: 'Projects' },
    { icon: '🏗️', label: 'Sites' }, { icon: '📊', label: 'Progress' },
    { icon: '📒', label: 'OpHelp Ledger' }, { icon: '✅', label: 'Final Approvals' },
    { icon: '🧮', label: 'Summary Sheet' }, { icon: '🧾', label: 'Invoices' },
  ],
  head_office: [
    { icon: '🏠', label: 'Overview' }, { icon: '📊', label: 'Executive KPIs' },
    { icon: '💼', label: 'Financials' }, { icon: '🗂️', label: 'All Projects' },
  ],
  partner: [
    { icon: '🏠', label: 'Overview' }, { icon: '💳', label: 'Transactions' },
    { icon: '📄', label: 'My Contract' }, { icon: '📊', label: 'Reports' },
    { icon: '📐', label: 'Quotations' }, { icon: '🧾', label: 'Invoices' },
    { icon: '💵', label: 'Monthly Invoice' }, { icon: '📝', label: 'Quotation Requests' },
  ],
  team: [
    { icon: '🏠', label: 'Overview' }, { icon: '📅', label: 'My Shifts' },
    { icon: '💳', label: 'My Card' }, { icon: '🏆', label: 'My Skills' },
    { icon: '👷', label: 'Team Booking' },
  ],
}

// ── Shared helpers ─────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#2E7D32' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function SectionCard({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Btn({ onClick, children, variant = 'primary', size = 'sm', disabled = false }: {
  onClick: () => void; children: ReactNode; variant?: 'primary' | 'success' | 'danger' | 'ghost'; size?: 'sm' | 'md'; disabled?: boolean
}) {
  const cls: Record<string, string> = {
    primary: 'bg-green-700 hover:bg-green-800 text-white',
    success: 'bg-blue-600 hover:bg-blue-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${cls[variant]} ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors disabled:opacity-40`}
    >{children}</button>
  )
}

function EmptyState({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <p className="font-semibold text-gray-600">{title}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

function fmt(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtMoney(n: number) { return `R${n.toLocaleString('en-ZA')}` }
function fmtTime(d: string) { if (!d) return '—'; return new Date(d).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' }) }
function initials(name: string) { return name.split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) }

function useDbData<T>(loader: () => T): [T, () => void] {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(() => setData(loader())); return unsub }, [])
  return [data, reload]
}

// ── KPI bar chart (inline) ─────────────────────────────────────────────────────
function MiniBarChart({ data }: { data: { label: string; value: number; color?: string }[] }) {
  const max = Math.max(...data.map(d => d.value), 1)
  return (
    <div className="flex items-end gap-2 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-xs text-gray-500 font-medium">{typeof d.value === 'number' && d.value > 999 ? `${(d.value / 1000).toFixed(1)}k` : d.value}</span>
          <div className="w-full rounded-t transition-all" style={{ height: `${Math.round((d.value / max) * 80)}px`, background: d.color ?? '#4caf50' }} />
          <span className="text-xs text-gray-500 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function KpiRow({ kpi, actual, target }: { kpi: string; actual: number; target: number }) {
  const ok = actual >= target
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-700 font-medium">{kpi}</span>
        <span className={`font-bold ${ok ? 'text-green-700' : 'text-red-600'}`}>{actual}%</span>
      </div>
      <div className="relative h-2 bg-gray-100 rounded-full">
        <div className="absolute h-2 bg-green-100 rounded-full" style={{ width: `${target}%` }} />
        <div className={`absolute h-2 rounded-full ${ok ? 'bg-green-600' : 'bg-red-500'}`} style={{ width: `${actual}%` }} />
      </div>
      <p className="text-xs text-gray-400 mt-0.5">Target {target}%</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE PANEL COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

// ── Participants CRUD panel ───────────────────────────────────────────────────
function ParticipantsPanel({ color = '#7B1FA2' }: { color?: string }) {
  const [participants] = useDbData(() => ParticipantApi.list())
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none')
  const [editing, setEditing] = useState<Participant | null>(null)
  type PForm = { firstName: string; lastName: string; idNumber: string; phone: string; email: string; suburb: string; address: string; city: string; emergencyContact: string; emergencyPhone: string; status: Participant['status'] }
  const blank: PForm = { firstName: '', lastName: '', idNumber: '', phone: '', email: '', suburb: '', address: '', city: 'Cape Town', emergencyContact: '', emergencyPhone: '', status: 'active' }
  const [form, setForm] = useState<PForm>(blank)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  function openAdd() { setForm(blank); setModal('add') }
  function openEdit(p: Participant) {
    setEditing(p)
    setForm({ firstName: p.firstName, lastName: p.lastName, idNumber: p.idNumber, phone: p.phone, email: p.email ?? '', suburb: p.suburb, address: p.address ?? '', city: p.city ?? 'Cape Town', emergencyContact: p.emergencyContact ?? '', emergencyPhone: p.emergencyPhone ?? '', status: p.status })
    setModal('edit')
  }

  function save() {
    if (!form.firstName || !form.lastName || !form.idNumber) return
    if (modal === 'add') ParticipantApi.create({ ...form, skills: [], registeredBy: 'system' })
    else if (editing) ParticipantApi.update(editing.id, form)
    setModal('none'); setEditing(null)
  }
  function confirmDelete() {
    if (deleteId) ParticipantApi.delete(deleteId)
    setDeleteId(null)
  }

  function F(k: keyof PForm, lbl?: string) {
    return <div key={k}><Input label={lbl ?? k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} /></div>
  }

  return (
    <>
      <SectionCard title="Participants" action={<Btn onClick={openAdd} variant="primary" size="sm">+ Add Participant</Btn>}>
        <DataTable
          columns={[
            { key: 'firstName', header: 'Name', render: p => `${p.firstName} ${p.lastName}`, sortable: true },
            { key: 'idNumber', header: 'ID Number' },
            { key: 'phone', header: 'Phone' },
            { key: 'suburb', header: 'Suburb', sortable: true },
            { key: 'status', header: 'Status', render: p => <Badge label={p.status} variant={p.status === 'active' ? 'green' : p.status === 'graduated' ? 'blue' : 'gray'} dot /> },
            { key: 'registeredAt', header: 'Registered', render: p => fmt(p.registeredAt) },
          ]}
          data={participants} searchable
          searchFn={(p, q) => `${p.firstName} ${p.lastName} ${p.idNumber} ${p.suburb}`.toLowerCase().includes(q)}
          actions={p => (
            <div className="flex gap-1">
              <Btn onClick={() => openEdit(p)} variant="ghost" size="sm">Edit</Btn>
              <Btn onClick={() => setDeleteId(p.id)} variant="danger" size="sm">Del</Btn>
            </div>
          )}
          pageSize={12}
        />
      </SectionCard>

      <Modal open={modal !== 'none'} onClose={() => setModal('none')} title={modal === 'add' ? 'Add Participant' : 'Edit Participant'}
        footer={<><Btn onClick={() => setModal('none')} variant="ghost">Cancel</Btn><Btn onClick={save} variant="primary">Save</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          {F('firstName')}{F('lastName')}{F('idNumber')}{F('phone')}{F('email')}{F('suburb')}
          {F('address')}{F('city')}{F('emergencyContact', 'Emergency Contact')}{F('emergencyPhone', 'Emergency Phone')}
          <div className="col-span-2">
            <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Participant['status'] }))}
              options={['active','inactive','graduated','suspended'].map(v => ({ value: v, label: v }))} />
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Participant"
        footer={<><Btn onClick={() => setDeleteId(null)} variant="ghost">Cancel</Btn><Btn onClick={confirmDelete} variant="danger">Delete</Btn></>}>
        <p className="text-gray-600">Permanently delete this participant? This cannot be undone.</p>
      </Modal>
    </>
  )
}

// ── Sites management panel ────────────────────────────────────────────────────
function SitesMgmtPanel({ color = '#1565C0' }: { color?: string }) {
  const [sites] = useDbData(() => SiteApi.list())
  const [users] = useDbData(() => UserApi.list())
  const foremen = users.filter(u => u.role === 'foreman')
  const today = new Date().toISOString().slice(0, 10)
  const blank = { name: '', address: '', suburb: '', type: 'cleaning' as WorkSite['type'], budget: 50000, foremanId: '' }
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none')
  const [editing, setEditing] = useState<WorkSite | null>(null)
  const [form, setForm] = useState(blank)

  function openAdd() { setForm(blank); setModal('add') }
  function openEdit(s: WorkSite) { setEditing(s); setForm({ name: s.name, address: s.address, suburb: s.suburb, type: s.type, budget: s.budget, foremanId: s.foremanId ?? '' }); setModal('edit') }

  function save() {
    if (!form.name || !form.suburb) return
    if (modal === 'add') SiteApi.create({ ...form, spent: 0, teamSize: 0, progressPct: 0, status: 'active', startDate: today, endDate: today })
    else if (editing) SiteApi.update(editing.id, form)
    setModal('none'); setEditing(null)
  }

  return (
    <>
      <SectionCard title="Work Sites" action={<Btn onClick={openAdd} variant="primary" size="sm">+ Add Site</Btn>}>
        <DataTable
          columns={[
            { key: 'name', header: 'Site', sortable: true },
            { key: 'suburb', header: 'Area', sortable: true },
            { key: 'type', header: 'Type', render: s => <Badge label={s.type.replace('_', ' ')} variant="blue" /> },
            { key: 'teamSize', header: 'Team', render: s => `${s.teamSize} workers` },
            { key: 'budget', header: 'Budget', render: s => fmtMoney(s.budget) },
            { key: 'progressPct', header: 'Progress', render: s => (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-12"><div className="bg-green-600 rounded-full h-1.5" style={{ width: `${s.progressPct}%` }} /></div>
                <span className="text-xs text-gray-600">{s.progressPct}%</span>
              </div>
            )},
            { key: 'status', header: 'Status', render: s => <Badge label={s.status} variant={s.status === 'active' ? 'green' : s.status === 'on_hold' ? 'yellow' : 'gray'} dot /> },
          ]}
          data={sites} searchable searchFn={(s, q) => `${s.name} ${s.suburb}`.toLowerCase().includes(q)}
          actions={s => <Btn onClick={() => openEdit(s)} variant="ghost" size="sm">Edit</Btn>}
          pageSize={10}
        />
      </SectionCard>

      <Modal open={modal !== 'none'} onClose={() => setModal('none')} title={modal === 'add' ? 'Add Site' : 'Edit Site'}
        footer={<><Btn onClick={() => setModal('none')} variant="ghost">Cancel</Btn><Btn onClick={save} variant="primary">Save</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Site Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="col-span-2"><Input label="Address" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
          <Input label="Suburb" required value={form.suburb} onChange={e => setForm(f => ({ ...f, suburb: e.target.value }))} />
          <Select label="Type" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as WorkSite['type'] }))}
            options={['road_maintenance','parks','cleaning','construction','school','admin'].map(v => ({ value: v, label: v.replace('_', ' ') }))} />
          <Input label="Budget (R)" type="number" value={String(form.budget)} onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) || 0 }))} />
          <div className="col-span-2">
            <Select label="Foreman" value={form.foremanId} onChange={e => setForm(f => ({ ...f, foremanId: e.target.value }))}
              options={foremen.map(u => ({ value: u.id, label: u.name }))} placeholder="Assign foreman…" />
          </div>
        </div>
      </Modal>
    </>
  )
}

// ── Shifts management panel ───────────────────────────────────────────────────
function ShiftsMgmtPanel({ foremanId, userId }: { foremanId?: string; userId?: string }) {
  const [dateFilter, setDateFilter] = useState('')
  const [shifts] = useDbData(() => ShiftApi.list(foremanId ? { foremanId } : {}))
  const [participants] = useDbData(() => ParticipantApi.list())
  const [sites] = useDbData(() => SiteApi.active())
  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' })
  const [rejectReason, setRejectReason] = useState('')
  const getName = (id: string) => { const p = participants.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName}` : id.slice(0, 8) }
  const getSite = (id: string) => sites.find(s => s.id === id)?.name ?? id.slice(0, 8)

  const filtered = dateFilter ? shifts.filter(s => s.date === dateFilter) : shifts

  function approve(id: string) { ShiftApi.approve(id, userId ?? '') }
  function confirmReject() { if (rejectModal.id) ShiftApi.reject(rejectModal.id, userId ?? '', rejectReason || 'Rejected'); setRejectModal({ open: false, id: '' }); setRejectReason('') }

  return (
    <>
      <SectionCard title="Shifts"
        action={
          <div className="flex items-center gap-2">
            <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5" />
            {dateFilter && <Btn onClick={() => setDateFilter('')} variant="ghost" size="sm">Clear</Btn>}
          </div>
        }
      >
        <DataTable
          columns={[
            { key: 'participantId', header: 'Participant', render: s => getName(s.participantId), sortable: true },
            { key: 'date', header: 'Date', render: s => fmt(s.date), sortable: true },
            { key: 'startTime', header: 'Start' },
            { key: 'siteId', header: 'Site', render: s => getSite(s.siteId) },
            { key: 'task', header: 'Task' },
            { key: 'hoursWorked', header: 'Hrs', render: s => `${s.hoursWorked ?? 4}h` },
            { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
          ]}
          data={filtered} searchable
          searchFn={(s, q) => `${getName(s.participantId)} ${s.task} ${getSite(s.siteId)}`.toLowerCase().includes(q)}
          actions={s => s.status === 'completed' ? (
            <div className="flex gap-1">
              <Btn onClick={() => approve(s.id)} variant="primary" size="sm">✓</Btn>
              <Btn onClick={() => setRejectModal({ open: true, id: s.id })} variant="danger" size="sm">✗</Btn>
            </div>
          ) : null}
          pageSize={12}
        />
      </SectionCard>

      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, id: '' })} title="Reject Shift"
        footer={<><Btn onClick={() => setRejectModal({ open: false, id: '' })} variant="ghost">Cancel</Btn><Btn onClick={confirmReject} variant="danger">Reject</Btn></>}>
        <Textarea label="Reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason for rejection…" />
      </Modal>
    </>
  )
}

// ── Analytics / Reports panel ─────────────────────────────────────────────────
function AnalyticsPanel({ color = '#1565C0' }: { color?: string }) {
  const [kpis] = useDbData(() => ReportApi.kpiScores())
  const [trend] = useDbData(() => ReportApi.monthlyTrend())
  const [sitePerf] = useDbData(() => SiteApi.active())
  const [stats] = useDbData(() => ReportApi.dashboardStats())

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Participants" value={stats.activeParticipants} color={color} />
        <StatCard label="Approved Shifts" value={stats.approvedShifts} color={color} />
        <StatCard label="Monthly Payments" value={fmtMoney(stats.monthlyPaymentsTotal)} color={color} />
        <StatCard label="Open Incidents" value={stats.openIncidents} color={color} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Monthly Payment Trend">
          <MiniBarChart data={trend.map(t => ({ label: t.month, value: t.payments, color }))} />
        </SectionCard>
        <SectionCard title="KPI Scorecard">
          <div className="space-y-4">{kpis.map(k => <KpiRow key={k.kpi} {...k} />)}</div>
        </SectionCard>
      </div>

      <SectionCard title="Site Performance">
        <DataTable
          columns={[
            { key: 'name', header: 'Site', sortable: true },
            { key: 'teamSize', header: 'Team', render: s => `${s.teamSize} workers` },
            { key: 'budget', header: 'Budget', render: s => fmtMoney(s.budget) },
            { key: 'spent', header: 'Spent', render: s => `${fmtMoney(s.spent)} (${Math.round(s.spent / Math.max(s.budget, 1) * 100)}%)` },
            { key: 'progressPct', header: 'Progress', render: s => (
              <div className="flex items-center gap-2">
                <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="bg-green-600 rounded-full h-1.5" style={{ width: `${s.progressPct}%` }} /></div>
                <span className="text-xs">{s.progressPct}%</span>
              </div>
            )},
            { key: 'status', header: 'Status', render: s => <Badge label={s.status} variant={s.status === 'active' ? 'green' : 'yellow'} dot /> },
          ]}
          data={sitePerf} pageSize={8}
        />
      </SectionCard>
    </div>
  )
}

// ── Cards management panel ────────────────────────────────────────────────────
function CardsPanel({ userId }: { userId: string }) {
  const [cards] = useDbData(() => CardApi.list())
  const [participants] = useDbData(() => ParticipantApi.list())
  const getName = (id: string) => { const p = participants.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName}` : id }
  const [issueModal, setIssueModal] = useState(false)
  const [issuePId, setIssuePId] = useState('')
  const [txCard, setTxCard] = useState<OphelpCard | null>(null)
  const [txs] = useDbData(() => txCard ? CardApi.transactions(txCard.id) : [])

  function issueCard() { if (!issuePId) return; CardApi.issue(issuePId, userId); setIssueModal(false); setIssuePId('') }
  function suspend(id: string) { CardApi.suspend(id, 'Suspended by admin') }
  function reactivate(id: string) { CardApi.reactivate(id) }

  return (
    <div className="space-y-6">
      <SectionCard title="OPHELP Cards" action={<Btn onClick={() => setIssueModal(true)} variant="primary" size="sm">Issue Card</Btn>}>
        <DataTable
          columns={[
            { key: 'cardNumber', header: 'Card No.', sortable: true },
            { key: 'participantId', header: 'Holder', render: c => getName(c.participantId) },
            { key: 'balance', header: 'Balance', render: c => fmtMoney(c.balance) },
            { key: 'totalLoaded', header: 'Total Loaded', render: c => fmtMoney(c.totalLoaded) },
            { key: 'totalSpent', header: 'Total Spent', render: c => fmtMoney(c.totalSpent) },
            { key: 'status', header: 'Status', render: c => <CardStatusBadge status={c.status} /> },
          ]}
          data={cards} searchable
          searchFn={(c, q) => `${c.cardNumber} ${getName(c.participantId)}`.toLowerCase().includes(q)}
          actions={c => (
            <div className="flex gap-1">
              <Btn onClick={() => setTxCard(c)} variant="ghost" size="sm">Txns</Btn>
              {c.status === 'active' ? <Btn onClick={() => suspend(c.id)} variant="danger" size="sm">Suspend</Btn>
                : <Btn onClick={() => reactivate(c.id)} variant="success" size="sm">Activate</Btn>}
            </div>
          )}
          pageSize={10}
        />
      </SectionCard>

      {txCard && (
        <SectionCard title={`Transactions — ${txCard.cardNumber}`} action={<Btn onClick={() => setTxCard(null)} variant="ghost" size="sm">Close</Btn>}>
          <DataTable
            columns={[
              { key: 'description', header: 'Description' },
              { key: 'amount', header: 'Amount', render: t => <span className={t.type === 'credit' ? 'text-green-700 font-semibold' : 'text-gray-700'}>{t.type === 'credit' ? '+' : '-'}{fmtMoney(t.amount)}</span> },
              { key: 'balanceAfter', header: 'Balance After', render: t => fmtMoney(t.balanceAfter) },
              { key: 'createdAt', header: 'Date', render: t => fmt(t.createdAt), sortable: true },
            ]}
            data={txs} emptyMessage="No transactions yet." pageSize={8}
          />
        </SectionCard>
      )}

      <Modal open={issueModal} onClose={() => setIssueModal(false)} title="Issue OPHELP Card"
        footer={<><Btn onClick={() => setIssueModal(false)} variant="ghost">Cancel</Btn><Btn onClick={issueCard} variant="primary">Issue Card</Btn></>}>
        <Select label="Participant" required value={issuePId} onChange={e => setIssuePId(e.target.value)}
          options={participants.filter(p => p.status === 'active' && !p.cardId).map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName}` }))}
          placeholder="Select participant (no card yet)…" />
      </Modal>
    </div>
  )
}

// ── Payments panel ────────────────────────────────────────────────────────────
function PaymentsPanel({ userId }: { userId: string }) {
  const [pending] = useDbData(() => PaymentApi.pending())
  const [all] = useDbData(() => PaymentApi.list())
  const [participants] = useDbData(() => ParticipantApi.list())
  const [cards] = useDbData(() => CardApi.list())
  const getName = (id: string) => { const p = participants.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName}` : id }

  function process(id: string) { PaymentApi.process(id, userId) }

  return (
    <div className="space-y-6">
      <SectionCard title={`Payments to Process (${pending.length})`}>
        <DataTable
          columns={[
            { key: 'participantId', header: 'Participant', render: p => getName(p.participantId) },
            { key: 'cardId', header: 'Card', render: p => { const c = cards.find(c => c.id === p.cardId); return c?.cardNumber ?? '—' } },
            { key: 'amount', header: 'Amount', render: p => fmtMoney(p.amount) },
            { key: 'description', header: 'Description' },
            { key: 'createdAt', header: 'Created', render: p => fmt(p.createdAt) },
            { key: 'status', header: 'Status', render: p => <PaymentStatusBadge status={p.status} /> },
          ]}
          data={pending} emptyMessage="No pending payments."
          actions={p => <Btn onClick={() => process(p.id)} variant="success">Load Card</Btn>}
          pageSize={10}
        />
      </SectionCard>

      <SectionCard title="All Payments">
        <DataTable
          columns={[
            { key: 'participantId', header: 'Participant', render: p => getName(p.participantId) },
            { key: 'amount', header: 'Amount', render: p => fmtMoney(p.amount) },
            { key: 'description', header: 'Description' },
            { key: 'processedAt', header: 'Processed', render: p => p.processedAt ? fmt(p.processedAt) : '—', sortable: true },
            { key: 'status', header: 'Status', render: p => <PaymentStatusBadge status={p.status} /> },
          ]}
          data={all} searchable searchFn={(p, q) => getName(p.participantId).toLowerCase().includes(q)}
          pageSize={12}
        />
      </SectionCard>
    </div>
  )
}

// ── Inventory panel ───────────────────────────────────────────────────────────
function InventoryPanel() {
  const [inventory] = useDbData(() => InventoryApi.list())
  const [equipment] = useDbData(() => EquipmentApi.list())
  const [restockModal, setRestockModal] = useState<InventoryItem | null>(null)
  const [restockQty, setRestockQty] = useState('')
  const [addModal, setAddModal] = useState(false)
  const blankItem = { name: '', category: 'stationery' as InventoryItem['category'], quantity: 0, minQuantity: 5, location: '', sku: '', unitCost: 0, supplier: '', lastRestocked: new Date().toISOString().slice(0, 10) }
  const [newItem, setNewItem] = useState(blankItem)

  function restock() { if (restockModal) { InventoryApi.restock(restockModal.id, parseInt(restockQty) || 0); setRestockModal(null); setRestockQty('') } }
  function addItem() { if (!newItem.name) return; InventoryApi.create(newItem); setAddModal(false); setNewItem(blankItem) }

  const lowStock = inventory.filter(i => i.quantity <= i.minQuantity)

  return (
    <div className="space-y-6">
      {lowStock.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-sm font-semibold text-red-700 mb-2">⚠️ {lowStock.length} item{lowStock.length > 1 ? 's' : ''} below minimum stock level</p>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(i => <Badge key={i.id} label={`${i.name}: ${i.quantity}`} variant="red" />)}
          </div>
        </div>
      )}

      <SectionCard title="Inventory" action={<Btn onClick={() => setAddModal(true)} variant="primary" size="sm">+ Add Item</Btn>}>
        <DataTable
          columns={[
            { key: 'name', header: 'Item', sortable: true },
            { key: 'quantity', header: 'Qty', render: i => <span className={i.quantity <= i.minQuantity ? 'text-red-600 font-bold' : 'text-gray-700'}>{i.quantity}</span> },
            { key: 'minQuantity', header: 'Min' },
            { key: 'category', header: 'Category', render: i => <Badge label={i.category} variant="gray" /> },
            { key: 'location', header: 'Location' },
          ]}
          data={inventory} searchable searchFn={(i, q) => `${i.name} ${i.category}`.toLowerCase().includes(q)}
          actions={i => <Btn onClick={() => { setRestockModal(i); setRestockQty('') }} variant="success" size="sm">Restock</Btn>}
          pageSize={12}
        />
      </SectionCard>

      <SectionCard title="Equipment">
        <DataTable
          columns={[
            { key: 'name', header: 'Equipment', sortable: true },
            { key: 'category', header: 'Category', render: e => <Badge label={e.category} variant="blue" /> },
            { key: 'serialNumber', header: 'Serial' },
            { key: 'condition', header: 'Condition', render: e => <Badge label={e.condition} variant={e.condition === 'excellent' || e.condition === 'good' ? 'green' : e.condition === 'fair' ? 'yellow' : 'red'} /> },
            { key: 'status', header: 'Status', render: e => <Badge label={e.status} variant={e.status === 'available' ? 'green' : e.status === 'in_use' ? 'blue' : 'yellow'} dot /> },
          ]}
          data={equipment} searchable searchFn={(e, q) => `${e.name} ${e.category}`.toLowerCase().includes(q)}
          pageSize={10}
        />
      </SectionCard>

      <Modal open={!!restockModal} onClose={() => setRestockModal(null)} title={`Restock: ${restockModal?.name}`}
        footer={<><Btn onClick={() => setRestockModal(null)} variant="ghost">Cancel</Btn><Btn onClick={restock} variant="primary">Restock</Btn></>}>
        <Input label="Quantity to Add" type="number" value={restockQty} onChange={e => setRestockQty(e.target.value)} />
      </Modal>

      <Modal open={addModal} onClose={() => setAddModal(false)} title="Add Inventory Item"
        footer={<><Btn onClick={() => setAddModal(false)} variant="ghost">Cancel</Btn><Btn onClick={addItem} variant="primary">Add</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Item Name" required value={newItem.name} onChange={e => setNewItem(f => ({ ...f, name: e.target.value }))} /></div>
          <Select label="Category" value={newItem.category} onChange={e => setNewItem(f => ({ ...f, category: e.target.value as InventoryItem['category'] }))}
            options={['ppe','card','uniform','stationery','cleaning','tools'].map(v => ({ value: v, label: v }))} />
          <Input label="Location" value={newItem.location} onChange={e => setNewItem(f => ({ ...f, location: e.target.value }))} />
          <Input label="Supplier" value={newItem.supplier} onChange={e => setNewItem(f => ({ ...f, supplier: e.target.value }))} />
          <Input label="SKU" value={newItem.sku} onChange={e => setNewItem(f => ({ ...f, sku: e.target.value }))} />
          <Input label="Initial Qty" type="number" value={String(newItem.quantity)} onChange={e => setNewItem(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))} />
          <Input label="Min Qty" type="number" value={String(newItem.minQuantity)} onChange={e => setNewItem(f => ({ ...f, minQuantity: parseInt(e.target.value) || 0 }))} />
        </div>
      </Modal>
    </div>
  )
}

// ── Messages / Inbox panel ─────────────────────────────────────────────────────
function MessagesPanel({ userId }: { userId: string }) {
  const [messages] = useDbData(() => MessageApi.inbox(userId))
  const [users] = useDbData(() => UserApi.list())
  const [composeModal, setComposeModal] = useState(false)
  const [form, setForm] = useState({ toUserId: '', subject: '', body: '' })
  const [reading, setReading] = useState<typeof messages[0] | null>(null)

  function getSender(id: string) { return users.find(u => u.id === id)?.name ?? id }
  function send() { if (!form.toUserId || !form.subject || !form.body) return; MessageApi.send(userId, form.toUserId, form.subject, form.body); setComposeModal(false); setForm({ toUserId: '', subject: '', body: '' }) }
  function markRead(msg: typeof messages[0]) { if (!msg.read) MessageApi.markRead(msg.id); setReading(msg) }

  return (
    <div className="space-y-6">
      <SectionCard title="Inbox" action={<Btn onClick={() => setComposeModal(true)} variant="primary" size="sm">Compose</Btn>}>
        {messages.length === 0 ? <EmptyState icon="✉️" title="No messages" sub="Your inbox is empty." /> : (
          <div className="divide-y divide-gray-100">
            {messages.map(m => (
              <button key={m.id} onClick={() => markRead(m)} className="w-full text-left px-2 py-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {!m.read && <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0 mt-1" />}
                    <div>
                      <p className={`text-sm ${m.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>{m.subject}</p>
                      <p className="text-xs text-gray-400">From: {getSender(m.fromUserId)}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{fmtTime(m.createdAt)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </SectionCard>

      {reading && (
        <SectionCard title={reading.subject} action={<Btn onClick={() => setReading(null)} variant="ghost" size="sm">Close</Btn>}>
          <p className="text-xs text-gray-400 mb-4">From: {getSender(reading.fromUserId)} · {fmt(reading.createdAt)}</p>
          <p className="text-gray-700 whitespace-pre-wrap">{reading.body}</p>
        </SectionCard>
      )}

      <Modal open={composeModal} onClose={() => setComposeModal(false)} title="New Message"
        footer={<><Btn onClick={() => setComposeModal(false)} variant="ghost">Cancel</Btn><Btn onClick={send} variant="primary">Send</Btn></>}>
        <div className="space-y-4">
          <Select label="To" required value={form.toUserId} onChange={e => setForm(f => ({ ...f, toUserId: e.target.value }))}
            options={users.filter(u => u.id !== userId).map(u => ({ value: u.id, label: `${u.name} (${u.roleLabel})` }))} placeholder="Select recipient…" />
          <Input label="Subject" required value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
          <Textarea label="Message" required value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} />
        </div>
      </Modal>
    </div>
  )
}

// ── Notifications panel ────────────────────────────────────────────────────────
function NotificationsPanel({ userId }: { userId: string }) {
  const [notifs] = useDbData(() => NotificationApi.forUser(userId))
  function markRead(id: string) { NotificationApi.markRead(id) }
  function markAll() { NotificationApi.markAllRead(userId) }

  const icons: Record<string, string> = { shift_scheduled: '📅', payment_processed: '💳', shift_approved: '✅', shift_rejected: '❌', card_low_balance: '⚠️', incident_reported: '🚨', payment_pending: '💰', system: 'ℹ️' }

  return (
    <SectionCard title="Notifications" action={<Btn onClick={markAll} variant="ghost" size="sm">Mark all read</Btn>}>
      {notifs.length === 0 ? <EmptyState icon="🔔" title="All caught up" sub="No notifications." /> : (
        <div className="divide-y divide-gray-100">
          {notifs.map(n => (
            <div key={n.id} className={`flex gap-3 py-3 px-2 rounded-lg ${n.read ? '' : 'bg-blue-50'}`}>
              <span className="text-xl">{icons[n.type] ?? 'ℹ️'}</span>
              <div className="flex-1">
                <p className={`text-sm ${n.read ? 'text-gray-600' : 'font-semibold text-gray-900'}`}>{n.title}</p>
                <p className="text-xs text-gray-500">{n.message}</p>
                <p className="text-xs text-gray-400 mt-0.5">{fmt(n.createdAt)}</p>
              </div>
              {!n.read && <Btn onClick={() => markRead(n.id)} variant="ghost" size="sm">Read</Btn>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── Incidents management panel ────────────────────────────────────────────────
function IncidentsMgmtPanel({ userId }: { userId: string }) {
  const [incidents] = useDbData(() => IncidentApi.list())
  const [sites] = useDbData(() => SiteApi.list())
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ siteId: '', title: '', description: '', severity: 'medium' as Incident['severity'] })

  function report() {
    if (!form.siteId || !form.title || !form.description) return
    IncidentApi.create({ ...form, reportedBy: userId, status: 'open' })
    setModal(false); setForm({ siteId: '', title: '', description: '', severity: 'medium' })
  }
  function resolve(id: string) { IncidentApi.resolve(id, userId, 'Resolved') }

  return (
    <>
      <SectionCard title="Incidents" action={<Btn onClick={() => setModal(true)} variant="danger" size="sm">Report Incident</Btn>}>
        <DataTable
          columns={[
            { key: 'title', header: 'Title', sortable: true },
            { key: 'severity', header: 'Severity', render: i => <IncidentSeverityBadge severity={i.severity} /> },
            { key: 'status', header: 'Status', render: i => <Badge label={i.status} variant={i.status === 'open' ? 'red' : i.status === 'investigating' ? 'yellow' : 'green'} dot /> },
            { key: 'createdAt', header: 'Date', render: i => fmt(i.createdAt), sortable: true },
          ]}
          data={incidents} searchable searchFn={(i, q) => `${i.title} ${i.description}`.toLowerCase().includes(q)}
          actions={i => i.status !== 'resolved' && i.status !== 'closed'
            ? <Btn onClick={() => resolve(i.id)} variant="success" size="sm">Resolve</Btn>
            : null}
          pageSize={10}
        />
      </SectionCard>

      <Modal open={modal} onClose={() => setModal(false)} title="Report Incident"
        footer={<><Btn onClick={() => setModal(false)} variant="ghost">Cancel</Btn><Btn onClick={report} variant="danger">Submit</Btn></>}>
        <div className="space-y-4">
          <Select label="Site" required value={form.siteId} onChange={e => setForm(f => ({ ...f, siteId: e.target.value }))}
            options={sites.map(s => ({ value: s.id, label: s.name }))} placeholder="Select site…" />
          <Input label="Title" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <Select label="Severity" required value={form.severity} onChange={e => setForm(f => ({ ...f, severity: e.target.value as Incident['severity'] }))}
            options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
          <Textarea label="Description" required value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
        </div>
      </Modal>
    </>
  )
}

// ── Projects panel ────────────────────────────────────────────────────────────
function ProjectsPanel({ userId }: { userId: string }) {
  const [projects] = useDbData(() => { const mine = ProjectApi.byManager(userId); return mine.length > 0 ? mine : ProjectApi.list() })
  const [selected, setSelected] = useState<Project | null>(null)
  const [modal, setModal] = useState(false)
  const today0 = new Date().toISOString().slice(0, 10)
  const blankP = { name: '', description: '', managerId: userId, foremanId: '', siteId: '', teamSize: 10, budget: 100000, deadline: '', startDate: today0, status: 'on_track' as Project['status'] }
  const [form, setForm] = useState(blankP)

  function createProject() {
    if (!form.name || !form.deadline) return
    ProjectApi.create({ ...form, spent: 0, progressPct: 0, milestones: [], tags: [] })
    setModal(false); setForm(blankP)
  }
  function completeMilestone(pid: string, mid: string) { ProjectApi.completeMilestone(pid, mid) }

  const stColor: Record<string, string> = { completed: 'bg-green-100 text-green-800', in_progress: 'bg-blue-100 text-blue-800', pending: 'bg-gray-100 text-gray-600', overdue: 'bg-red-100 text-red-800' }

  return (
    <div className="space-y-6">
      <SectionCard title="Projects" action={<Btn onClick={() => setModal(true)} variant="primary" size="sm">+ New Project</Btn>}>
        <DataTable
          columns={[
            { key: 'name', header: 'Project', sortable: true },
            { key: 'teamSize', header: 'Team', render: p => `${p.teamSize}` },
            { key: 'budget', header: 'Budget', render: p => fmtMoney(p.budget) },
            { key: 'progressPct', header: 'Progress', render: p => (
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-100 rounded-full h-2"><div className="bg-pink-600 rounded-full h-2" style={{ width: `${p.progressPct}%` }} /></div>
                <span className="text-xs">{p.progressPct}%</span>
              </div>
            )},
            { key: 'deadline', header: 'Deadline', render: p => fmt(p.deadline) },
            { key: 'status', header: 'Status', render: p => <ProjectStatusBadge status={p.status} /> },
          ]}
          data={projects}
          actions={p => <Btn onClick={() => setSelected(p)} variant="ghost" size="sm">Milestones</Btn>}
          pageSize={8}
        />
      </SectionCard>

      {selected && (
        <SectionCard title={`Milestones — ${selected.name}`} action={<Btn onClick={() => setSelected(null)} variant="ghost" size="sm">Close</Btn>}>
          {selected.milestones.length === 0 ? <EmptyState icon="📌" title="No milestones yet" /> : (
            <div className="space-y-3">
              {selected.milestones.map(m => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                  <div>
                    <p className="font-medium text-sm">{m.title}</p>
                    <p className="text-xs text-gray-400">Due: {fmt(m.dueDate)}{m.completedAt ? ` · Done: ${fmt(m.completedAt)}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stColor[m.status]}`}>{m.status.replace('_', ' ')}</span>
                    {m.status !== 'completed' && <Btn onClick={() => completeMilestone(selected.id, m.id)} variant="primary" size="sm">Complete</Btn>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="New Project"
        footer={<><Btn onClick={() => setModal(false)} variant="ghost">Cancel</Btn><Btn onClick={createProject} variant="primary">Create</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Project Name" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="col-span-2"><Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          <Input label="Team Size" type="number" value={String(form.teamSize)} onChange={e => setForm(f => ({ ...f, teamSize: parseInt(e.target.value) || 0 }))} />
          <Input label="Budget (R)" type="number" value={String(form.budget)} onChange={e => setForm(f => ({ ...f, budget: parseInt(e.target.value) || 0 }))} />
          <Input label="Deadline" type="date" required value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
          <Select label="Status" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Project['status'] }))}
            options={['on_track','at_risk','delayed','completed'].map(v => ({ value: v, label: v.replace('_', ' ') }))} />
        </div>
      </Modal>
    </div>
  )
}

// ── Settings panel ────────────────────────────────────────────────────────────
function SettingsPanel({ user }: { user: AuthUser }) {
  const allParticipants = ParticipantApi.list()
  const allShifts = ShiftApi.list()
  const allCards = CardApi.list()

  function exportJSON() {
    const data = { participants: allParticipants, shifts: allShifts, cards: allCards, exportedAt: new Date().toISOString() }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = 'ophelp-export.json'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <SectionCard title="System Information">
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Total Participants', allParticipants.length],
            ['Total Shifts', allShifts.length],
            ['Total Cards', allCards.length],
            ['Logged In As', user.name],
            ['Role', user.roleLabel],
            ['Email', user.email],
          ].map(([k, v]) => (
            <div key={String(k)} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{k}</p>
              <p className="font-semibold text-gray-800">{v}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Data Management">
        <div className="flex flex-wrap gap-3">
          <Btn onClick={exportJSON} variant="success" size="md">Export All Data (JSON)</Btn>
        </div>
        <p className="text-xs text-gray-400 mt-4">All data is stored locally in your browser. Exporting creates a full backup JSON file.</p>
      </SectionCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE DASHBOARDS
// ─────────────────────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════════════════════
// Admin Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function AdminPanel({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const [stats] = useDbData(() => ReportApi.dashboardStats())
  const [participants] = useDbData(() => ParticipantApi.list())
  const [users] = useDbData(() => UserApi.list())
  const [auditLogs] = useDbData(() => AuditApi.recent(50))
  type SafeUser = Omit<SystemUser, 'passwordHash'>
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none')
  const [editUser, setEditUser] = useState<SafeUser | null>(null)
  const blankUser = { name: '', email: '', password: 'ophelp2024', role: 'day_admin' as SystemUser['role'], roleLabel: 'Day Admin', active: true }
  const [uForm, setUForm] = useState(blankUser)

  function openEdit(u: SafeUser) { setEditUser(u); setUForm({ name: u.name, email: u.email, password: '', role: u.role, roleLabel: u.roleLabel, active: u.active }); setModal('edit') }
  function saveUser() {
    if (!uForm.name || !uForm.email) return
    if (modal === 'add') UserApi.create({ name: uForm.name, email: uForm.email, passwordHash: uForm.password, role: uForm.role, roleLabel: uForm.roleLabel, active: uForm.active, avatar: '' })
    else if (editUser) UserApi.update(editUser.id, { name: uForm.name, role: uForm.role, roleLabel: uForm.roleLabel, active: uForm.active })
    setModal('none'); setEditUser(null)
  }
  function deactivate(id: string) { UserApi.update(id, { active: false }) }

  if (activeIdx === 1) return (
    <>
      <SectionCard title="System Users" action={<Btn onClick={() => { setUForm(blankUser); setModal('add') }} variant="primary" size="sm">+ Add User</Btn>}>
        <DataTable
          columns={[
            { key: 'name', header: 'Name', sortable: true },
            { key: 'email', header: 'Email' },
            { key: 'roleLabel', header: 'Role' },
            { key: 'active', header: 'Status', render: u => <Badge label={u.active ? 'Active' : 'Inactive'} variant={u.active ? 'green' : 'gray'} dot /> },
            { key: 'lastLogin', header: 'Last Login', render: u => u.lastLogin ? fmt(u.lastLogin) : '—' },
          ]}
          data={users} searchable searchFn={(u, q) => `${u.name} ${u.email} ${u.roleLabel}`.toLowerCase().includes(q)}
          actions={u => (
            <div className="flex gap-1">
              <Btn onClick={() => openEdit(u)} variant="ghost" size="sm">Edit</Btn>
              {u.active && <Btn onClick={() => deactivate(u.id)} variant="danger" size="sm">Deactivate</Btn>}
            </div>
          )}
          pageSize={12}
        />
      </SectionCard>
      <Modal open={modal !== 'none'} onClose={() => setModal('none')} title={modal === 'add' ? 'Add User' : 'Edit User'}
        footer={<><Btn onClick={() => setModal('none')} variant="ghost">Cancel</Btn><Btn onClick={saveUser} variant="primary">Save</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2"><Input label="Full Name" required value={uForm.name} onChange={e => setUForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="col-span-2"><Input label="Email" type="email" required value={uForm.email} onChange={e => setUForm(f => ({ ...f, email: e.target.value }))} /></div>
          {modal === 'add' && <div className="col-span-2"><Input label="Password" type="password" value={uForm.password} onChange={e => setUForm(f => ({ ...f, password: e.target.value }))} /></div>}
          <Select label="Role" value={uForm.role} onChange={e => setUForm(f => ({ ...f, role: e.target.value as SystemUser['role'] }))}
            options={[['admin','Admin'],['foreman','Foreman'],['day_admin','Day Admin'],['operation_office','Operation Office'],['operation_management','Operation Management'],['ophelp_store','Store'],['project_manager','Project Manager'],['head_office','Head Office'],['partner','Partner'],['team','Team']].map(([v, l]) => ({ value: v, label: l }))} />
          <Select label="Status" value={uForm.active ? 'active' : 'inactive'} onChange={e => setUForm(f => ({ ...f, active: e.target.value === 'active' }))}
            options={[{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }]} />
        </div>
      </Modal>
    </>
  )

  if (activeIdx === 2) return <ParticipantsPanel color="#7B1FA2" />

  if (activeIdx === 3) return <AnalyticsPanel color="#7B1FA2" />

  if (activeIdx === 4) return (
    <SectionCard title="Audit Log">
      <DataTable
        columns={[
          { key: 'action', header: 'Action', sortable: true },
          { key: 'entity', header: 'Entity', render: l => <Badge label={l.entity} variant="blue" /> },
          { key: 'detail', header: 'Detail' },
          { key: 'userId', header: 'User', render: l => { const u = users.find(x => x.id === l.userId); return u?.name ?? l.userId.slice(0, 8) } },
          { key: 'createdAt', header: 'Time', render: l => fmt(l.createdAt), sortable: true },
        ]}
        data={auditLogs} searchable searchFn={(l, q) => `${l.action} ${l.entity} ${l.detail}`.toLowerCase().includes(q)}
        pageSize={15}
      />
    </SectionCard>
  )

  if (activeIdx === 5) return <SettingsPanel user={user} />

  // Overview (idx 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Participants" value={stats.activeParticipants} color="#7B1FA2" />
        <StatCard label="Today's Shifts" value={stats.todaysShifts} color="#7B1FA2" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} color="#7B1FA2" />
        <StatCard label="Open Incidents" value={stats.openIncidents} color="#7B1FA2" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Participants">
          <DataTable columns={[
            { key: 'name', header: 'Name', render: p => `${p.firstName} ${p.lastName}`, sortable: true },
            { key: 'suburb', header: 'Suburb', sortable: true },
            { key: 'status', header: 'Status', render: p => <Badge label={p.status} variant={p.status === 'active' ? 'green' : p.status === 'graduated' ? 'blue' : 'gray'} dot /> },
          ]} data={participants} searchable searchFn={(p, q) => `${p.firstName} ${p.lastName} ${p.idNumber}`.toLowerCase().includes(q)} pageSize={8} />
        </SectionCard>
        <SectionCard title="System Users">
          <DataTable columns={[
            { key: 'name', header: 'Name', sortable: true },
            { key: 'roleLabel', header: 'Role' },
            { key: 'active', header: 'Status', render: u => <Badge label={u.active ? 'Active' : 'Inactive'} variant={u.active ? 'green' : 'gray'} dot /> },
            { key: 'lastLogin', header: 'Last Login', render: u => u.lastLogin ? fmt(u.lastLogin) : '—' },
          ]} data={users} pageSize={8} />
        </SectionCard>
      </div>
      <SectionCard title="Recent Audit Log">
        <DataTable columns={[
          { key: 'action', header: 'Action', sortable: true },
          { key: 'entity', header: 'Entity', render: l => <Badge label={l.entity} variant="blue" /> },
          { key: 'detail', header: 'Detail' },
          { key: 'createdAt', header: 'Time', render: l => fmt(l.createdAt) },
        ]} data={auditLogs.slice(0, 10)} pageSize={10} />
      </SectionCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Foreman Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function ForemanDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const today = new Date().toISOString().slice(0, 10)
  const [todayShifts] = useDbData(() => ShiftApi.list({ foremanId: user.id, date: today }))
  const [pending] = useDbData(() => ShiftApi.pendingApprovals().filter(s => s.foremanId === user.id))
  const [incidents] = useDbData(() => IncidentApi.list().filter(i => !['resolved', 'closed'].includes(i.status)))
  const [stats] = useDbData(() => ReportApi.dashboardStats())
  const [teams] = useDbData(() => TeamApi.list())
  const [participants] = useDbData(() => ParticipantApi.list())
  const [rejectModal, setRejectModal] = useState<{ open: boolean; shiftId: string }>({ open: false, shiftId: '' })
  const [rejectReason, setRejectReason] = useState('')

  const getName = (id: string) => { const p = participants.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName}` : id.slice(0, 8) }
  function approve(id: string) { ShiftApi.approve(id, user.id) }
  function reject(id: string) { setRejectModal({ open: true, shiftId: id }) }
  function confirmReject() { if (rejectModal.shiftId) ShiftApi.reject(rejectModal.shiftId, user.id, rejectReason || 'Not approved'); setRejectModal({ open: false, shiftId: '' }); setRejectReason('') }

  if (activeIdx === 5) {
    const mySite = SiteApi.list().find(s => s.foremanId === user.id)
    return <JobSheet defaultSite={mySite?.name ?? ''} defaultDate={today} defaultTimeSlot="07:00-11:00" />
  }
  if (activeIdx === 6) return <TaskSheetsPanel currentUserName={user.name} />
  if (activeIdx === 7) return <CityDepotShiftSlip />
  if (activeIdx === 8) return <JobsheetsPanel mode="foreman" currentUserName={user.name} />

  if (activeIdx === 1) return (
    <SectionCard title={`Today's Shifts — ${today}`}>
      <DataTable
        columns={[
          { key: 'participantId', header: 'Participant', render: s => getName(s.participantId), sortable: true },
          { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' },
          { key: 'task', header: 'Task' },
          { key: 'hoursWorked', header: 'Hours', render: s => `${s.hoursWorked ?? 4}h` },
          { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
        ]}
        data={todayShifts} searchable searchFn={(s, q) => `${getName(s.participantId)} ${s.task}`.toLowerCase().includes(q)}
        emptyMessage="No shifts today." pageSize={15}
      />
    </SectionCard>
  )

  if (activeIdx === 2) return (
    <>
      <SectionCard title="Awaiting Approval">
        <DataTable
          columns={[
            { key: 'participantId', header: 'Participant', render: s => getName(s.participantId) },
            { key: 'date', header: 'Date', render: s => fmt(s.date), sortable: true },
            { key: 'task', header: 'Task' },
            { key: 'hoursWorked', header: 'Hours', render: s => `${s.hoursWorked ?? 4}h` },
          ]}
          data={pending} emptyMessage="No shifts awaiting approval."
          actions={s => (
            <div className="flex gap-2">
              <Btn onClick={() => approve(s.id)} variant="primary">Approve</Btn>
              <Btn onClick={() => reject(s.id)} variant="danger">Reject</Btn>
            </div>
          )}
        />
      </SectionCard>
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, shiftId: '' })} title="Reject Shift"
        footer={<><Btn onClick={() => setRejectModal({ open: false, shiftId: '' })} variant="ghost">Cancel</Btn><Btn onClick={confirmReject} variant="danger">Reject</Btn></>}>
        <Textarea label="Rejection Reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Reason…" />
      </Modal>
    </>
  )

  if (activeIdx === 3) return <IncidentsMgmtPanel userId={user.id} />

  if (activeIdx === 4) {
    const myTeam = teams.find(t => t.foremanId === user.id)
    const members = myTeam ? participants.filter(p => myTeam.memberIds.includes(p.id)) : []
    return (
      <SectionCard title={myTeam ? `Team: ${myTeam.name}` : 'My Team'}>
        {!myTeam ? <EmptyState icon="👷" title="No team assigned" sub="Contact admin to assign a team." /> : (
          <DataTable
            columns={[
              { key: 'name', header: 'Name', render: p => `${p.firstName} ${p.lastName}`, sortable: true },
              { key: 'suburb', header: 'Suburb' },
              { key: 'phone', header: 'Phone' },
              { key: 'status', header: 'Status', render: p => <Badge label={p.status} variant={p.status === 'active' ? 'green' : 'gray'} dot /> },
            ]}
            data={members} emptyMessage="No members in this team yet." pageSize={12}
          />
        )}
      </SectionCard>
    )
  }

  // Overview (idx 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Shifts" value={todayShifts.length} color="#E65100" />
        <StatCard label="Awaiting Approval" value={pending.length} color="#E65100" />
        <StatCard label="Open Incidents" value={incidents.length} color="#E65100" />
        <StatCard label="Active Participants" value={stats.activeParticipants} color="#E65100" />
      </div>
      <SectionCard title="Awaiting Approval">
        <DataTable columns={[
          { key: 'participantId', header: 'Participant', render: s => getName(s.participantId) },
          { key: 'date', header: 'Date', render: s => fmt(s.date), sortable: true },
          { key: 'task', header: 'Task' },
          { key: 'hoursWorked', header: 'Hours', render: s => `${s.hoursWorked ?? 4}h` },
        ]} data={pending} emptyMessage="No shifts awaiting approval."
          actions={s => <div className="flex gap-2"><Btn onClick={() => approve(s.id)} variant="primary">Approve</Btn><Btn onClick={() => reject(s.id)} variant="danger">Reject</Btn></div>}
        />
      </SectionCard>
      <SectionCard title={`Today's Shifts — ${today}`}>
        <DataTable columns={[
          { key: 'participantId', header: 'Participant', render: s => getName(s.participantId) },
          { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' },
          { key: 'task', header: 'Task' },
          { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
        ]} data={todayShifts} searchable searchFn={(s, q) => getName(s.participantId).toLowerCase().includes(q)} pageSize={10} />
      </SectionCard>
      <SectionCard title="Open Incidents">
        <DataTable columns={[
          { key: 'title', header: 'Title', sortable: true },
          { key: 'severity', header: 'Severity', render: i => <IncidentSeverityBadge severity={i.severity} /> },
          { key: 'status', header: 'Status', render: i => <Badge label={i.status} variant={i.status === 'open' ? 'red' : 'yellow'} dot /> },
          { key: 'createdAt', header: 'Reported', render: i => fmt(i.createdAt) },
        ]} data={incidents} emptyMessage="No open incidents." />
      </SectionCard>
      <Modal open={rejectModal.open} onClose={() => setRejectModal({ open: false, shiftId: '' })} title="Reject Shift"
        footer={<><Btn onClick={() => setRejectModal({ open: false, shiftId: '' })} variant="ghost">Cancel</Btn><Btn onClick={confirmReject} variant="danger">Reject Shift</Btn></>}>
        <Textarea label="Rejection Reason" value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Explain why this shift is being rejected…" />
      </Modal>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Day Admin Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function DayAdminDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const today = new Date().toISOString().slice(0, 10)
  const [participants] = useDbData(() => ParticipantApi.list())
  const [todayShifts] = useDbData(() => ShiftApi.list({ date: today }))
  const [sites] = useDbData(() => SiteApi.active())

  const activeParticipants = participants.filter(p => p.status === 'active')
  const getName = (id: string) => { const p = participants.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName}` : id }

  if (activeIdx === 4) return <CashVoucher />
  if (activeIdx === 5) return <FieldOperationsLedger />
  if (activeIdx === 6) return <IncidentLog />
  if (activeIdx === 7) return <SheetsLibrary />
  if (activeIdx === 8) return <RollCallPanel currentUserName={user.name} />
  if (activeIdx === 9) return <DocumentLibraryPanel currentUserName={user.name} />
  if (activeIdx === 10) return <TaskSheetsPanel mode="review" currentUserName={user.name} />
  if (activeIdx === 11) return <JobsheetsPanel mode="view" currentUserName={user.name} />
  if (activeIdx === 12) return <SummarySheetsPanel mode="day_admin" currentUserName={user.name} />
  if (activeIdx === 13) return <InvoicesPanel />
  if (activeIdx === 14) return <RosterBoard />

  if (activeIdx === 1) return (
    <SectionCard title="Today's Attendance">
      <DataTable
        columns={[
          { key: 'participantId', header: 'Participant', render: s => getName(s.participantId), sortable: true },
          { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' },
          { key: 'task', header: 'Task' },
          { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
        ]}
        data={todayShifts} searchable searchFn={(s, q) => `${getName(s.participantId)} ${s.task}`.toLowerCase().includes(q)}
        emptyMessage="No shifts today." pageSize={15}
      />
    </SectionCard>
  )

  if (activeIdx === 2) return <ParticipantsPanel color="#00838F" />

  if (activeIdx === 3) {
    const completed = todayShifts.filter(s => s.status === 'completed' || s.status === 'approved').length
    const pending = todayShifts.filter(s => s.status === 'scheduled' || s.status === 'in_progress').length
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Shifts" value={todayShifts.length} color="#00838F" />
          <StatCard label="Completed" value={completed} color="#00838F" />
          <StatCard label="In Progress" value={pending} color="#00838F" />
          <StatCard label="Active Sites" value={sites.length} color="#00838F" />
        </div>
        <SectionCard title={`Daily Report — ${today}`}>
          <DataTable
            columns={[
              { key: 'participantId', header: 'Participant', render: s => getName(s.participantId), sortable: true },
              { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' },
              { key: 'task', header: 'Task' },
              { key: 'hoursWorked', header: 'Hours', render: s => `${s.hoursWorked ?? 4}h` },
              { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
            ]}
            data={todayShifts} emptyMessage="No shifts recorded today." pageSize={20}
          />
        </SectionCard>
      </div>
    )
  }

  // Overview
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Participants" value={activeParticipants.length} color="#00838F" />
        <StatCard label="Today's Shifts" value={todayShifts.length} color="#00838F" />
        <StatCard label="Active Sites" value={sites.length} color="#00838F" />
        <StatCard label="Completed Today" value={todayShifts.filter(s => s.status === 'completed' || s.status === 'approved').length} color="#00838F" />
      </div>
      <SectionCard title="Today's Attendance">
        <DataTable columns={[
          { key: 'participantId', header: 'Participant', render: s => getName(s.participantId), sortable: true },
          { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' },
          { key: 'task', header: 'Task' },
          { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
        ]} data={todayShifts} searchable searchFn={(s, q) => `${getName(s.participantId)} ${s.task}`.toLowerCase().includes(q)} emptyMessage="No shifts recorded today." pageSize={12} />
      </SectionCard>
      <SectionCard title="Participants">
        <DataTable columns={[
          { key: 'name', header: 'Name', render: p => `${p.firstName} ${p.lastName}`, sortable: true },
          { key: 'idNumber', header: 'ID Number' }, { key: 'suburb', header: 'Suburb', sortable: true },
          { key: 'phone', header: 'Phone' },
          { key: 'status', header: 'Status', render: p => <Badge label={p.status} variant={p.status === 'active' ? 'green' : 'gray'} dot /> },
        ]} data={participants} searchable searchFn={(p, q) => `${p.firstName} ${p.lastName} ${p.idNumber} ${p.suburb}`.toLowerCase().includes(q)} pageSize={10} />
      </SectionCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Operation Office Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function OperationOfficeDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const [sites] = useDbData(() => SiteApi.list())
  const [shifts] = useDbData(() => ShiftApi.list())
  const [stats] = useDbData(() => ReportApi.dashboardStats())
  const [kpis] = useDbData(() => ReportApi.kpiScores())

  if (activeIdx === 4) return <OASys />
  if (activeIdx === 5) return <LeaveDaysRegister />
  if (activeIdx === 6) return <PayrollPanel />
  if (activeIdx === 7) return <PaymentAuthorisationsPanel />
  if (activeIdx === 8) return <WeeklyRegistersPanel />
  if (activeIdx === 9) return <OasysChecksPanel />
  if (activeIdx === 10) return <DepotSchedulesPanel />
  if (activeIdx === 11) return <QuotationsPanel />
  if (activeIdx === 12) return <InvoicesPanel />
  if (activeIdx === 13) return <JobsheetsPanel mode="office" currentUserName={user.name} />
  if (activeIdx === 14) return <OASys />
  if (activeIdx === 15) return <MonthlyInvoicePanel mode="office" currentUserName={user.name} />
  if (activeIdx === 16) return <RequestApprovalPanel stage="office" currentUserName={user.name} />
  if (activeIdx === 17) return <RosterBoard />
  if (activeIdx === 18) return <SummarySheetsPanel mode="office" currentUserName={user.name} />

  if (activeIdx === 1) return <SitesMgmtPanel color="#1565C0" />
  if (activeIdx === 2) return <ShiftsMgmtPanel userId={user.id} />
  if (activeIdx === 3) return <AnalyticsPanel color="#1565C0" />

  // Overview
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Sites" value={sites.filter(s => s.status === 'active').length} color="#1565C0" />
        <StatCard label="Total Shifts" value={shifts.length} color="#1565C0" />
        <StatCard label="Approved Shifts" value={stats.approvedShifts} color="#1565C0" />
        <StatCard label="Pending Approvals" value={stats.pendingApprovals} color="#1565C0" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Work Sites">
          <DataTable columns={[
            { key: 'name', header: 'Site', sortable: true },
            { key: 'suburb', header: 'Area' },
            { key: 'type', header: 'Type', render: s => <Badge label={s.type.replace('_', ' ')} variant="blue" /> },
            { key: 'progressPct', header: 'Progress', render: s => (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-100 rounded-full h-1.5"><div className="bg-green-600 rounded-full h-1.5" style={{ width: `${s.progressPct}%` }} /></div>
                <span className="text-xs text-gray-600">{s.progressPct}%</span>
              </div>
            )},
            { key: 'status', header: 'Status', render: s => <Badge label={s.status} variant={s.status === 'active' ? 'green' : s.status === 'on_hold' ? 'yellow' : 'gray'} dot /> },
          ]} data={sites} pageSize={8} />
        </SectionCard>
        <SectionCard title="KPI Scorecard">
          <div className="space-y-4">{kpis.map(k => <KpiRow key={k.kpi} {...k} />)}</div>
        </SectionCard>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Operation Management Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function OperationManagementDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const [sites] = useDbData(() => SiteApi.list())
  const [participants] = useDbData(() => ParticipantApi.list())
  const [stats] = useDbData(() => ReportApi.dashboardStats())

  if (activeIdx === 1) return <SitesMgmtPanel color="#2E7D32" />
  if (activeIdx === 2) return <ParticipantsPanel color="#2E7D32" />
  if (activeIdx === 3) return <AnalyticsPanel color="#2E7D32" />
  if (activeIdx === 4) return <IncidentsMgmtPanel userId={user.id} />
  if (activeIdx === 5) return <RequestApprovalPanel stage="management" currentUserName={user.name} />
  if (activeIdx === 6) return <TaskSheetsPanel mode="review" currentUserName={user.name} />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Sites" value={sites.filter(s => s.status === 'active').length} color="#2E7D32" />
        <StatCard label="Workforce" value={participants.filter(p => p.status === 'active').length} color="#2E7D32" />
        <StatCard label="Open Incidents" value={stats.openIncidents} color="#2E7D32" />
        <StatCard label="Active Projects" value={stats.activeProjects} color="#2E7D32" />
      </div>
      <SectionCard title="Site Performance">
        <DataTable columns={[
          { key: 'name', header: 'Site', sortable: true },
          { key: 'teamSize', header: 'Team', render: s => `${s.teamSize} workers` },
          { key: 'budget', header: 'Budget', render: s => fmtMoney(s.budget) },
          { key: 'spent', header: 'Spent', render: s => `${fmtMoney(s.spent)} (${Math.round(s.spent / Math.max(s.budget, 1) * 100)}%)` },
          { key: 'progressPct', header: 'Progress', render: s => (
            <div className="flex items-center gap-2">
              <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="bg-green-600 rounded-full h-1.5" style={{ width: `${s.progressPct}%` }} /></div>
              <span className="text-xs">{s.progressPct}%</span>
            </div>
          )},
          { key: 'status', header: 'Status', render: s => <Badge label={s.status} variant={s.status === 'active' ? 'green' : 'yellow'} dot /> },
        ]} data={sites} pageSize={8} />
      </SectionCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// OPHELP Store Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function OphelpStoreDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const [cards] = useDbData(() => CardApi.list())
  const [pending] = useDbData(() => PaymentApi.pending())
  const [inventory] = useDbData(() => InventoryApi.list())
  const [stats] = useDbData(() => ReportApi.dashboardStats())
  const lowStock = inventory.filter(i => i.quantity <= i.minQuantity)
  const participants = ParticipantApi.list()
  const getName = (id: string) => { const p = participants.find(x => x.id === id); return p ? `${p.firstName} ${p.lastName}` : id }

  if (activeIdx === 1) return <CardsPanel userId={user.id} />
  if (activeIdx === 2) return <PaymentsPanel userId={user.id} />
  if (activeIdx === 3) return <InventoryPanel />
  if (activeIdx === 4) return <StoreShiftSlipsPanel />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Cards" value={stats.totalCards} color="#F57F17" />
        <StatCard label="Pending Payments" value={stats.pendingPayments} color="#F57F17" />
        <StatCard label="Monthly Loaded" value={fmtMoney(stats.monthlyPaymentsTotal)} color="#F57F17" />
        <StatCard label="Low Stock Items" value={lowStock.length} color="#F57F17" />
      </div>
      <SectionCard title="Payments to Process" action={<span className="text-xs text-gray-400">{pending.length} pending</span>}>
        <DataTable columns={[
          { key: 'participantId', header: 'Participant', render: p => getName(p.participantId) },
          { key: 'cardId', header: 'Card', render: p => { const c = cards.find(c => c.id === p.cardId); return c?.cardNumber ?? '—' } },
          { key: 'amount', header: 'Amount', render: p => fmtMoney(p.amount) },
          { key: 'createdAt', header: 'Created', render: p => fmt(p.createdAt) },
          { key: 'status', header: 'Status', render: p => <PaymentStatusBadge status={p.status} /> },
        ]} data={pending} emptyMessage="No pending payments."
          actions={p => <Btn onClick={() => PaymentApi.process(p.id, user.id)} variant="success">Load Card</Btn>} />
      </SectionCard>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="OPHELP Cards">
          <DataTable columns={[
            { key: 'cardNumber', header: 'Card No.', sortable: true },
            { key: 'participantId', header: 'Holder', render: c => getName(c.participantId) },
            { key: 'balance', header: 'Balance', render: c => fmtMoney(c.balance) },
            { key: 'status', header: 'Status', render: c => <CardStatusBadge status={c.status} /> },
          ]} data={cards} searchable searchFn={(c, q) => `${c.cardNumber} ${getName(c.participantId)}`.toLowerCase().includes(q)} pageSize={8} />
        </SectionCard>
        <SectionCard title="Inventory">
          <DataTable columns={[
            { key: 'name', header: 'Item', sortable: true },
            { key: 'quantity', header: 'Qty', render: i => <span className={i.quantity <= i.minQuantity ? 'text-red-600 font-bold' : 'text-gray-700'}>{i.quantity}</span> },
            { key: 'minQuantity', header: 'Min' },
            { key: 'category', header: 'Category', render: i => <Badge label={i.category} variant="gray" /> },
            { key: 'location', header: 'Location' },
          ]} data={inventory} pageSize={8} />
        </SectionCard>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Project Manager Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function ProjectManagerDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const [projects] = useDbData(() => { const mine = ProjectApi.byManager(user.id); return mine.length > 0 ? mine : ProjectApi.list() })
  const [kpis] = useDbData(() => ReportApi.kpiScores())
  const [trend] = useDbData(() => ReportApi.monthlyTrend())

  if (activeIdx === 1) return <ProjectsPanel userId={user.id} />
  if (activeIdx === 2) return <SitesMgmtPanel color="#AD1457" />
  if (activeIdx === 4) return <OASys />
  if (activeIdx === 5) return <RequestApprovalPanel stage="manager" currentUserName={user.name} />
  if (activeIdx === 6) return <SummarySheetsPanel mode="manager" currentUserName={user.name} />
  if (activeIdx === 7) return <InvoicesPanel />

  if (activeIdx === 3) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} color="#AD1457" />
        <StatCard label="On Track" value={projects.filter(p => p.status === 'on_track').length} color="#AD1457" />
        <StatCard label="At Risk" value={projects.filter(p => p.status === 'at_risk').length} color="#AD1457" />
        <StatCard label="Completed" value={projects.filter(p => p.status === 'completed').length} color="#AD1457" />
      </div>
      <SectionCard title="Project Progress">
        <div className="space-y-4">
          {projects.map(p => (
            <div key={p.id} className="p-3 bg-gray-50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-sm">{p.name}</p>
                <ProjectStatusBadge status={p.status} />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div className="bg-pink-600 rounded-full h-2 transition-all" style={{ width: `${p.progressPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-gray-600 w-10">{p.progressPct}%</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Budget: {fmtMoney(p.budget)}</span>
                <span>Spent: {fmtMoney(p.spent)}</span>
                <span>Due: {fmt(p.deadline)}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Monthly Trend">
        <MiniBarChart data={trend.map(t => ({ label: t.month, value: t.payments, color: '#AD1457' }))} />
      </SectionCard>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Projects" value={projects.length} color="#AD1457" />
        <StatCard label="On Track" value={projects.filter(p => p.status === 'on_track').length} color="#AD1457" />
        <StatCard label="At Risk" value={projects.filter(p => p.status === 'at_risk').length} color="#AD1457" />
        <StatCard label="Completed" value={projects.filter(p => p.status === 'completed').length} color="#AD1457" />
      </div>
      <ProjectsPanel userId={user.id} />
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Head Office Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function HeadOfficeDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const [stats] = useDbData(() => ReportApi.dashboardStats())
  const [kpis] = useDbData(() => ReportApi.kpiScores())
  const [trend] = useDbData(() => ReportApi.monthlyTrend())
  const [projects] = useDbData(() => ProjectApi.list())

  const totalBudget = projects.reduce((s, p) => s + p.budget, 0)
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0)

  if (activeIdx === 1) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Participants" value={stats.activeParticipants} color="#37474F" />
        <StatCard label="Approved Shifts" value={stats.approvedShifts} color="#37474F" />
        <StatCard label="Open Incidents" value={stats.openIncidents} color="#37474F" />
        <StatCard label="Partner Shops" value={stats.partnerShops} color="#37474F" />
      </div>
      <SectionCard title="KPI Scorecard (Full Detail)">
        <div className="space-y-5">{kpis.map(k => <KpiRow key={k.kpi} {...k} />)}</div>
      </SectionCard>
      <SectionCard title="Monthly Payment Trend">
        <MiniBarChart data={trend.map(t => ({ label: t.month, value: t.payments, color: '#37474F' }))} />
      </SectionCard>
    </div>
  )

  if (activeIdx === 2) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Budget" value={fmtMoney(totalBudget)} color="#37474F" />
        <StatCard label="Total Spent" value={fmtMoney(totalSpent)} color="#37474F" />
        <StatCard label="Remaining" value={fmtMoney(totalBudget - totalSpent)} color="#37474F" />
        <StatCard label="Monthly Payments" value={fmtMoney(stats.monthlyPaymentsTotal)} color="#37474F" />
      </div>
      <SectionCard title="Budget Utilisation">
        <div className="space-y-4">
          <div className="flex justify-between items-end">
            <div><p className="text-sm text-gray-500">Total Project Budget</p><p className="text-3xl font-bold">{fmtMoney(totalBudget)}</p></div>
            <div className="text-right"><p className="text-sm text-gray-500">Total Spent</p><p className="text-3xl font-bold">{fmtMoney(totalSpent)}</p></div>
          </div>
          <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
            <div className="absolute h-4 bg-blue-600 rounded-full" style={{ width: `${Math.min((totalSpent / Math.max(totalBudget, 1)) * 100, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 text-center">{Math.round(totalSpent / Math.max(totalBudget, 1) * 100)}% of total budget utilised</p>
        </div>
      </SectionCard>
      <SectionCard title="Monthly Payment Trend">
        <MiniBarChart data={trend.map(t => ({ label: t.month, value: t.payments, color: '#37474F' }))} />
      </SectionCard>
    </div>
  )

  if (activeIdx === 3) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={projects.length} color="#37474F" />
        <StatCard label="On Track" value={projects.filter(p => p.status === 'on_track').length} color="#37474F" />
        <StatCard label="At Risk / Delayed" value={projects.filter(p => p.status === 'at_risk' || p.status === 'delayed').length} color="#37474F" />
        <StatCard label="Completed" value={projects.filter(p => p.status === 'completed').length} color="#37474F" />
      </div>
      <SectionCard title="All Projects">
        <DataTable columns={[
          { key: 'name', header: 'Project', sortable: true },
          { key: 'teamSize', header: 'Team' },
          { key: 'budget', header: 'Budget', render: p => fmtMoney(p.budget) },
          { key: 'spent', header: 'Spent', render: p => fmtMoney(p.spent) },
          { key: 'progressPct', header: 'Progress', render: p => `${p.progressPct}%` },
          { key: 'status', header: 'Status', render: p => <ProjectStatusBadge status={p.status} /> },
          { key: 'deadline', header: 'Deadline', render: p => fmt(p.deadline) },
        ]} data={projects} searchable searchFn={(p, q) => p.name.toLowerCase().includes(q)} pageSize={10} />
      </SectionCard>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Participants" value={stats.activeParticipants} color="#37474F" />
        <StatCard label="Monthly Payments" value={fmtMoney(stats.monthlyPaymentsTotal)} color="#37474F" />
        <StatCard label="Partner Shops" value={stats.partnerShops} color="#37474F" />
        <StatCard label="Active Projects" value={stats.activeProjects} color="#37474F" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Financial Overview">
          <div className="space-y-4">
            <div className="flex justify-between">
              <div><p className="text-sm text-gray-500">Total Budget</p><p className="text-2xl font-bold">{fmtMoney(totalBudget)}</p></div>
              <div className="text-right"><p className="text-sm text-gray-500">Total Spent</p><p className="text-2xl font-bold">{fmtMoney(totalSpent)}</p></div>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <div className="absolute h-3 bg-blue-600 rounded-full" style={{ width: `${Math.min((totalSpent / Math.max(totalBudget, 1)) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400 text-center">{Math.round(totalSpent / Math.max(totalBudget, 1) * 100)}% utilised</p>
          </div>
        </SectionCard>
        <SectionCard title="KPI Scorecard">
          <div className="space-y-3">{kpis.map(k => <KpiRow key={k.kpi} {...k} />)}</div>
        </SectionCard>
      </div>
      <SectionCard title="Monthly Trend">
        <MiniBarChart data={trend.map(t => ({ label: t.month, value: t.payments, color: '#37474F' }))} />
      </SectionCard>
      <SectionCard title="All Projects">
        <DataTable columns={[
          { key: 'name', header: 'Project', sortable: true },
          { key: 'teamSize', header: 'Team' },
          { key: 'budget', header: 'Budget', render: p => fmtMoney(p.budget) },
          { key: 'progressPct', header: 'Progress', render: p => `${p.progressPct}%` },
          { key: 'status', header: 'Status', render: p => <ProjectStatusBadge status={p.status} /> },
          { key: 'deadline', header: 'Deadline', render: p => fmt(p.deadline) },
        ]} data={projects} pageSize={8} />
      </SectionCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Partner Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function PartnerDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const myShop = PartnerShopApi.myShop(user.id)
  const allShops = PartnerShopApi.list()
  const [transactions] = useDbData(() => CardApi.allTransactions().filter(t => t.merchantId === myShop?.id || t.type === 'debit').slice(0, 100))
  const [kpis] = useDbData(() => ReportApi.kpiScores())

  if (activeIdx === 1) return (
    <SectionCard title="All Transactions">
      <DataTable columns={[
        { key: 'cardId', header: 'Card' },
        { key: 'amount', header: 'Amount', render: t => fmtMoney(t.amount) },
        { key: 'description', header: 'Description' },
        { key: 'type', header: 'Type', render: t => <Badge label={t.type} variant={t.type === 'credit' ? 'green' : 'blue'} /> },
        { key: 'createdAt', header: 'Date', render: t => fmt(t.createdAt), sortable: true },
      ]} data={transactions} emptyMessage="No transactions." searchable searchFn={(t, q) => t.description.toLowerCase().includes(q)} pageSize={15} />
    </SectionCard>
  )

  if (activeIdx === 4) return <QuotationsPanel readOnly clientFilter={myShop?.name} />
  if (activeIdx === 5) return <InvoicesPanel clientFilter={myShop?.name} />
  if (activeIdx === 6) return <MonthlyInvoicePanel mode="partner" partnerShopId={myShop?.id} />
  if (activeIdx === 7) return <QuotationRequestPanel partnerShopId={myShop?.id} requestedBy={user.name} />

  if (activeIdx === 2 && myShop) return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
        <h2 className="text-xl font-bold mb-4">{myShop.name} — Contract Details</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {[
            ['Owner', myShop.ownerName],
            ['Phone', myShop.phone],
            ['Address', `${myShop.address}, ${myShop.suburb}`],
            ['Category', myShop.category],
            ['Status', myShop.status],
            ['Contract Expiry', fmt(myShop.contractExpiry)],
            ['Monthly Transactions', myShop.monthlyTransactionCount],
            ['Monthly Value', fmtMoney(myShop.monthlyTransactionValue)],
          ].map(([k, v]) => (
            <div key={String(k)} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{k}</p>
              <p className="font-semibold text-gray-800">{v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  if (activeIdx === 3) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Monthly Transactions" value={myShop?.monthlyTransactionCount ?? 0} color="#00695C" />
        <StatCard label="Monthly Value" value={fmtMoney(myShop?.monthlyTransactionValue ?? 0)} color="#00695C" />
      </div>
      <SectionCard title="Partner Shop Network">
        <DataTable columns={[
          { key: 'name', header: 'Shop', sortable: true },
          { key: 'suburb', header: 'Area' },
          { key: 'category', header: 'Category', render: s => <Badge label={s.category} variant="blue" /> },
          { key: 'monthlyTransactionCount', header: 'Monthly Txns' },
          { key: 'status', header: 'Status', render: s => <Badge label={s.status} variant={s.status === 'active' ? 'green' : 'yellow'} dot /> },
        ]} data={allShops} pageSize={10} />
      </SectionCard>
    </div>
  )

  return (
    <div className="space-y-6">
      {myShop ? (
        <>
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold">{myShop.name}</h2>
                <p className="text-sm text-gray-500">{myShop.address}, {myShop.suburb}</p>
                <p className="text-sm text-gray-500 mt-1">{myShop.ownerName} · {myShop.phone}</p>
              </div>
              <Badge label={myShop.status} variant={myShop.status === 'active' ? 'green' : 'yellow'} size="md" dot />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-xs text-teal-600 font-semibold uppercase">Monthly Transactions</p>
                <p className="text-2xl font-bold text-teal-800">{myShop.monthlyTransactionCount}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-xs text-teal-600 font-semibold uppercase">Monthly Value</p>
                <p className="text-2xl font-bold text-teal-800">{fmtMoney(myShop.monthlyTransactionValue)}</p>
              </div>
              <div className="bg-teal-50 rounded-xl p-4 text-center">
                <p className="text-xs text-teal-600 font-semibold uppercase">Contract Expiry</p>
                <p className="text-lg font-bold text-teal-800">{fmt(myShop.contractExpiry)}</p>
              </div>
            </div>
          </div>
          <SectionCard title="Recent Transactions">
            <DataTable columns={[
              { key: 'cardId', header: 'Card' },
              { key: 'amount', header: 'Amount', render: t => fmtMoney(t.amount) },
              { key: 'description', header: 'Description' },
              { key: 'createdAt', header: 'Date', render: t => fmt(t.createdAt), sortable: true },
            ]} data={transactions.slice(0, 20)} emptyMessage="No transactions recorded yet." pageSize={10} />
          </SectionCard>
        </>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SectionCard title="Partner Shops">
            <DataTable columns={[
              { key: 'name', header: 'Shop', sortable: true },
              { key: 'suburb', header: 'Area' },
              { key: 'category', header: 'Category', render: s => <Badge label={s.category} variant="blue" /> },
              { key: 'monthlyTransactionCount', header: 'Transactions' },
              { key: 'status', header: 'Status', render: s => <Badge label={s.status} variant={s.status === 'active' ? 'green' : 'yellow'} dot /> },
            ]} data={allShops} pageSize={8} />
          </SectionCard>
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 flex items-center justify-center">
            <EmptyState icon="🏪" title="Your shop is being linked" sub="Contact admin to associate your partner shop." />
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Team Dashboard
// ═══════════════════════════════════════════════════════════════════════════════
function TeamDashboard({ user, activeIdx }: { user: AuthUser; activeIdx: number }) {
  const participants = ParticipantApi.list()
  const myParticipant = participants.find(p => p.email?.toLowerCase() === user.email.toLowerCase())
  const [myShifts] = useDbData(() => myParticipant ? ShiftApi.list().filter(s => s.participantId === myParticipant.id) : [])
  const [myCard] = useDbData(() => myParticipant?.cardId ? CardApi.get(myParticipant.cardId) : undefined)
  const [myTransactions] = useDbData(() => myCard ? CardApi.transactions(myCard.id) : [])
  const [skills] = useDbData(() => myParticipant ? SkillApi.assessments(myParticipant.id) : [])
  const allSkills = SkillApi.list()

  if (activeIdx === 4) return <TeamBookingPanel teamName={user.name} />

  const approved = myShifts.filter(s => s.status === 'approved').length
  const thisWeekShifts = myShifts.filter(s => { const d = new Date(s.date); const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); return d >= weekStart })

  if (activeIdx === 1) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Shifts" value={myShifts.length} color="#283593" />
        <StatCard label="Approved" value={approved} color="#283593" />
        <StatCard label="This Week" value={thisWeekShifts.length} color="#283593" />
        <StatCard label="Pending" value={myShifts.filter(s => s.status === 'scheduled').length} color="#283593" />
      </div>
      <SectionCard title="All My Shifts">
        <DataTable columns={[
          { key: 'date', header: 'Date', render: s => fmt(s.date), sortable: true },
          { key: 'startTime', header: 'Start' }, { key: 'endTime', header: 'End' },
          { key: 'task', header: 'Task' },
          { key: 'hoursWorked', header: 'Hours', render: s => `${s.hoursWorked ?? 4}h` },
          { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
        ]} data={myShifts} emptyMessage="No shifts recorded." pageSize={15} />
      </SectionCard>
    </div>
  )

  if (activeIdx === 2) return (
    <div className="space-y-6">
      {myCard ? (
        <>
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">OPHELP Card</p>
                <p className="text-2xl font-bold mt-1">{myCard.cardNumber}</p>
                <p className="text-blue-200 text-sm mt-2">{myParticipant?.firstName} {myParticipant?.lastName}</p>
              </div>
              <div className="text-right">
                <p className="text-blue-200 text-xs uppercase">Balance</p>
                <p className="text-3xl font-black">{fmtMoney(myCard.balance)}</p>
                <p className="text-blue-200 text-xs mt-1">Total loaded: {fmtMoney(myCard.totalLoaded)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-blue-600 flex gap-4 text-xs text-blue-200">
              <span>Total spent: {fmtMoney(myCard.totalSpent)}</span>
              <span>Status: <span className={myCard.status === 'active' ? 'text-green-300' : 'text-red-300'}>{myCard.status}</span></span>
            </div>
          </div>
          <SectionCard title="Card Transactions">
            <DataTable columns={[
              { key: 'description', header: 'Description' },
              { key: 'amount', header: 'Amount', render: t => <span className={t.type === 'credit' ? 'text-green-700 font-semibold' : 'text-gray-700'}>{t.type === 'credit' ? '+' : '-'}{fmtMoney(t.amount)}</span> },
              { key: 'balanceAfter', header: 'Balance', render: t => fmtMoney(t.balanceAfter) },
              { key: 'createdAt', header: 'Date', render: t => fmt(t.createdAt), sortable: true },
            ]} data={myTransactions} emptyMessage="No transactions yet." pageSize={12} />
          </SectionCard>
        </>
      ) : <EmptyState icon="💳" title="No card issued yet" sub="Contact your administrator to get an OPHELP card." /> }
    </div>
  )

  if (activeIdx === 3) return (
    <SectionCard title="My Skills">
      {skills.length === 0 ? <EmptyState icon="🏆" title="No skills assessed yet" sub="Your foreman will assess your skills." /> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {skills.map(a => {
            const skill = allSkills.find(s => s.id === a.skillId)
            return (
              <div key={a.id} className="bg-gray-50 rounded-xl p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-semibold text-gray-800">{skill?.name ?? 'Unknown skill'}</span>
                  <span className="text-blue-700 font-bold text-lg">{a.level}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className="h-2 bg-blue-600 rounded-full" style={{ width: `${a.level}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-2">Assessed {fmt(a.assessedAt)}</p>
                {skill?.description && <p className="text-xs text-gray-500 mt-1">{skill.description}</p>}
              </div>
            )
          })}
        </div>
      )}
    </SectionCard>
  )

  // Overview
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Shifts" value={myShifts.length} color="#283593" />
        <StatCard label="Approved" value={approved} color="#283593" />
        <StatCard label="This Week" value={thisWeekShifts.length} color="#283593" />
        <StatCard label="Card Balance" value={myCard ? fmtMoney(myCard.balance) : 'No card'} color="#283593" />
      </div>
      {myCard && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">OPHELP Card</p>
              <p className="text-2xl font-bold mt-1">{myCard.cardNumber}</p>
              <p className="text-blue-200 text-sm mt-2">{myParticipant?.firstName} {myParticipant?.lastName}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-xs uppercase">Balance</p>
              <p className="text-3xl font-black">{fmtMoney(myCard.balance)}</p>
            </div>
          </div>
        </div>
      )}
      <SectionCard title="Recent Shifts">
        <DataTable columns={[
          { key: 'date', header: 'Date', render: s => fmt(s.date), sortable: true },
          { key: 'task', header: 'Task' },
          { key: 'hoursWorked', header: 'Hours', render: s => `${s.hoursWorked ?? 4}h` },
          { key: 'status', header: 'Status', render: s => <ShiftStatusBadge status={s.status} /> },
        ]} data={myShifts.slice(0, 10)} emptyMessage="No shifts recorded." pageSize={10} />
      </SectionCard>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Dashboard Shell
// ═══════════════════════════════════════════════════════════════════════════════
interface DashboardProps { user: AuthUser; onLogout: () => void }

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const [showMessages, setShowMessages] = useState(false)
  const [notifCount] = useDbData(() => NotificationApi.unreadCount(user.id))
  const [msgCount] = useDbData(() => MessageApi.unreadCount(user.id))
  const roleColor = ROLE_COLORS[user.role as UserRole] ?? '#2E7D32'
  const items = SIDEBAR_ITEMS[user.role as UserRole] ?? []

  const panels: Record<UserRole, ReactNode> = {
    admin: <AdminPanel user={user} activeIdx={activeIdx} />,
    foreman: <ForemanDashboard user={user} activeIdx={activeIdx} />,
    day_admin: <DayAdminDashboard user={user} activeIdx={activeIdx} />,
    operation_office: <OperationOfficeDashboard user={user} activeIdx={activeIdx} />,
    operation_management: <OperationManagementDashboard user={user} activeIdx={activeIdx} />,
    ophelp_store: <OphelpStoreDashboard user={user} activeIdx={activeIdx} />,
    project_manager: <ProjectManagerDashboard user={user} activeIdx={activeIdx} />,
    head_office: <HeadOfficeDashboard user={user} activeIdx={activeIdx} />,
    partner: <PartnerDashboard user={user} activeIdx={activeIdx} />,
    team: <TeamDashboard user={user} activeIdx={activeIdx} />,
  }

  const currentPanel = panels[user.role as UserRole] ?? <div className="p-8 text-gray-400">Dashboard coming soon…</div>

  function navTo(i: number) { setActiveIdx(i); setShowNotifs(false); setShowMessages(false) }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-[Poppins,sans-serif]">
      {/* Sidebar */}
      <div className="flex flex-col transition-all duration-300 shrink-0" style={{ width: sidebarCollapsed ? 64 : 220, background: '#0F2027' }}>
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <img src={opHelpLogo} alt="OPHELP" className="w-8 h-8 object-contain shrink-0" />
          {!sidebarCollapsed && <span className="text-white font-bold text-sm truncate">OPHELP</span>}
        </div>
        <nav className="flex-1 py-3 overflow-y-auto">
          {items.map((item, i) => (
            <button key={i} onClick={() => navTo(i)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-all ${activeIdx === i ? 'text-white font-semibold' : 'text-white/50 hover:text-white/80'}`}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base transition-all"
                style={{ background: activeIdx === i ? roleColor : 'transparent' }}>
                {item.icon}
              </span>
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          ))}
        </nav>
        <button onClick={() => setSidebarCollapsed(c => !c)}
          className="mx-4 mb-4 py-2 rounded-lg text-white/40 hover:text-white/70 text-xs flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 transition-all">
          {sidebarCollapsed ? '→' : '← Collapse'}
        </button>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-100 px-6 py-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="font-bold text-gray-900">{items[activeIdx]?.label ?? 'Dashboard'}</h1>
            <p className="text-xs text-gray-400">{user.roleLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => { setShowNotifs(v => !v); setShowMessages(false) }} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-gray-500 text-lg">🔔</span>
              {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: roleColor, fontSize: 9 }}>{notifCount}</span>}
            </button>
            <button onClick={() => { setShowMessages(v => !v); setShowNotifs(false) }} className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <span className="text-gray-500 text-lg">✉️</span>
              {msgCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: roleColor, fontSize: 9 }}>{msgCount}</span>}
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ background: roleColor }}>
                {user.avatar || initials(user.name)}
              </div>
              {!sidebarCollapsed && (
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</p>
                  <p className="text-xs text-gray-400">{user.email}</p>
                </div>
              )}
            </div>
            <button onClick={onLogout} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800 border border-gray-200 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
        <div className="h-0.5 w-full shrink-0" style={{ background: roleColor }} />

        {/* Notifications slide-in */}
        {showNotifs && (
          <div className="absolute right-4 top-16 z-50 w-96 shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-800 text-sm">Notifications</span>
              <button onClick={() => setShowNotifs(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <NotificationsPanel userId={user.id} />
            </div>
          </div>
        )}

        {/* Messages slide-in */}
        {showMessages && (
          <div className="absolute right-4 top-16 z-50 w-96 shadow-xl rounded-2xl overflow-hidden bg-white border border-gray-100">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <span className="font-semibold text-gray-800 text-sm">Messages</span>
              <button onClick={() => setShowMessages(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
            </div>
            <div className="p-4 max-h-96 overflow-y-auto">
              <MessagesPanel userId={user.id} />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentPanel}
        </div>
      </div>
    </div>
  )
}
