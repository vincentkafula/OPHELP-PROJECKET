import { useState, useEffect, useCallback } from 'react'
import { PaymentAuthorisationApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select, Textarea } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { PaymentAuthorisation, PaymentAuthorisationStatus } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtMoney(n: number) {
  const sign = n < 0 ? '-' : ''
  return `${sign}R${Math.abs(n).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

function StatCard({ label, value, sub, color = '#1565C0' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
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
  onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'success' | 'danger' | 'ghost'; size?: 'sm' | 'md'; disabled?: boolean
}) {
  const cls: Record<string, string> = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${cls[variant]} ${size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-lg font-medium transition-colors disabled:opacity-40`}
    >{children}</button>
  )
}
function StatusBadge({ status }: { status: PaymentAuthorisationStatus }) {
  const map: Record<PaymentAuthorisationStatus, ['green' | 'yellow' | 'blue', string]> = {
    captured: ['yellow', 'Captured'],
    authorised: ['blue', 'Authorised'],
    paid: ['green', 'Paid'],
  }
  const [variant, label] = map[status] ?? ['yellow', status]
  return <Badge label={label} variant={variant} dot />
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const emptyForm = {
  paNumber: '', date: new Date().toISOString().slice(0, 10), compiler: '', payee: '',
  bank: '', branchCode: '', accountType: '', accountNo: '',
  amount: '', details: '', authorisation: '', expenseAccount: '', expenseColumn: 'Other',
  caption: '', client: '',
}

const EXPENSE_COLUMNS = ['Transport', 'Material', 'Admin', 'Other', 'Fee']

export default function PaymentAuthorisationsPanel() {
  const authorisations = useLive(() => PaymentAuthorisationApi.list())
  const monthlyTotal = useLive(() => PaymentAuthorisationApi.monthlyTotal())

  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [detail, setDetail] = useState<PaymentAuthorisation | null>(null)
  const [error, setError] = useState('')

  const totalCaptured = authorisations.filter(a => a.status !== 'paid').reduce((s, a) => s + a.amount, 0)
  const totalPaid = authorisations.filter(a => a.status === 'paid').reduce((s, a) => s + a.amount, 0)

  function create() {
    if (!form.paNumber || !form.payee || !form.amount || !form.caption) return
    const res = PaymentAuthorisationApi.create({
      paNumber: form.paNumber,
      date: form.date,
      compiler: form.compiler,
      payee: form.payee,
      bank: { bank: form.bank, branchCode: form.branchCode, accountType: form.accountType, accountNo: form.accountNo },
      amount: Number(form.amount),
      details: form.details,
      authorisation: form.authorisation,
      expenseAccount: form.expenseAccount,
      expenseColumn: form.expenseColumn,
      caption: form.caption,
      client: form.client,
      invoice: { pay: 0, transport: 0, material: 0, admin: 0, other: 0, fee: 0 },
    })
    if (res.success) {
      setCreateModal(false)
      setForm(emptyForm)
      setError('')
    } else {
      setError(res.error ?? 'Could not create authorisation')
    }
  }

  function setStatus(id: string, status: PaymentAuthorisationStatus) {
    PaymentAuthorisationApi.update(id, { status })
    setDetail(d => (d && d.id === id ? { ...d, status } : d))
  }

  function exportCsv() {
    const header = ['PA No', 'Date', 'Payee', 'Amount', 'Expense Account', 'Column', 'Client', 'Status', 'Caption']
    const rows = authorisations.map(a => [a.paNumber, a.date, a.payee, a.amount.toFixed(2), a.expenseAccount, a.expenseColumn, a.client, a.status, a.caption])
    downloadCsv('payment-authorisations.csv', [header, ...rows])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Payment Authorisations</h2>
        <div className="flex gap-2">
          <Btn onClick={exportCsv} variant="ghost">Export CSV</Btn>
          <Btn onClick={() => setCreateModal(true)} variant="primary">+ New Authorisation</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Authorisations" value={authorisations.length} />
        <StatCard label="This Month" value={fmtMoney(monthlyTotal)} color="#2E7D32" />
        <StatCard label="Awaiting Payment" value={fmtMoney(totalCaptured)} color="#C48A00" />
        <StatCard label="Paid" value={fmtMoney(totalPaid)} color="#1565C0" />
      </div>

      <SectionCard title="Payment Authorisations">
        {authorisations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🧾</div>
            <p className="font-semibold text-gray-600">No payment authorisations yet</p>
            <p className="text-sm text-gray-400 mt-1">Create one, or import a PA slip via the backend's importer.</p>
          </div>
        ) : (
          <DataTable columns={[
            { key: 'paNumber', header: 'PA No', sortable: true },
            { key: 'date', header: 'Date', render: a => fmtDate(a.date) },
            { key: 'payee', header: 'To' },
            { key: 'caption', header: 'Caption' },
            { key: 'amount', header: 'Amount', render: a => fmtMoney(a.amount) },
            { key: 'expenseColumn', header: 'Column', render: a => <Badge label={a.expenseColumn} variant="purple" /> },
            { key: 'status', header: 'Status', render: a => <StatusBadge status={a.status} /> },
          ]} data={authorisations} searchable
            searchFn={(a, q) => `${a.paNumber} ${a.payee} ${a.caption} ${a.client}`.toLowerCase().includes(q)}
            pageSize={12}
            actions={a => <Btn onClick={() => setDetail(a)} variant="ghost">View</Btn>} />
        )}
      </SectionCard>

      {/* ── New Authorisation ── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Payment Authorisation" size="lg"
        footer={<><Btn onClick={() => setCreateModal(false)} variant="ghost">Cancel</Btn><Btn onClick={create} variant="primary">Create</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          {error && <div className="col-span-2 text-xs text-red-600 font-medium">{error}</div>}
          <Input label="PA Number" required value={form.paNumber} onChange={e => setForm(f => ({ ...f, paNumber: e.target.value }))} placeholder="e.g. 01 002" />
          <Input label="Date" type="date" required value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <Input label="Compiler" value={form.compiler} onChange={e => setForm(f => ({ ...f, compiler: e.target.value }))} />
          <Input label="To (Payee)" required value={form.payee} onChange={e => setForm(f => ({ ...f, payee: e.target.value }))} />
          <Input label="Bank" value={form.bank} onChange={e => setForm(f => ({ ...f, bank: e.target.value }))} placeholder="e.g. Direct Debit, FNB, ABSA…" />
          <Input label="Branch Code" value={form.branchCode} onChange={e => setForm(f => ({ ...f, branchCode: e.target.value }))} />
          <Input label="Account Type" value={form.accountType} onChange={e => setForm(f => ({ ...f, accountType: e.target.value }))} />
          <Input label="Account No" value={form.accountNo} onChange={e => setForm(f => ({ ...f, accountNo: e.target.value }))} />
          <Input label="Amount (R)" type="number" step="0.01" required value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
          <Select label="Expense Column" value={form.expenseColumn} onChange={e => setForm(f => ({ ...f, expenseColumn: e.target.value }))}
            options={EXPENSE_COLUMNS.map(c => ({ value: c, label: c }))} />
          <Input label="Expense Account" value={form.expenseAccount} onChange={e => setForm(f => ({ ...f, expenseAccount: e.target.value }))} placeholder="e.g. OPHELP Medical" />
          <Input label="Client" value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} />
          <div className="col-span-2">
            <Input label="Caption" required value={form.caption} onChange={e => setForm(f => ({ ...f, caption: e.target.value }))} placeholder="e.g. HEALTH4ME Payment March 2026" />
          </div>
          <div className="col-span-2">
            <Textarea label="Details" value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Textarea label="Authorisation" value={form.authorisation} onChange={e => setForm(f => ({ ...f, authorisation: e.target.value }))} placeholder="e.g. Monthly Direct debit" />
          </div>
        </div>
      </Modal>

      {/* ── Detail view ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `PA ${detail.paNumber}` : ''} size="md"
        footer={detail && (
          <>
            {detail.status !== 'authorised' && detail.status !== 'paid' && <Btn onClick={() => setStatus(detail.id, 'authorised')} variant="success">Mark Authorised</Btn>}
            {detail.status !== 'paid' && <Btn onClick={() => setStatus(detail.id, 'paid')} variant="primary">Mark Paid</Btn>}
            <Btn onClick={() => setDetail(null)} variant="ghost">Close</Btn>
          </>
        )}>
        {detail && (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Status</span><StatusBadge status={detail.status} /></div>
            <div className="flex justify-between"><span className="text-gray-500">Date</span><span>{fmtDate(detail.date)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">To</span><span className="font-medium">{detail.payee}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Compiler</span><span>{detail.compiler || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Bank</span><span>{detail.bank.bank || '—'}</span></div>
            {(detail.bank.branchCode || detail.bank.accountType || detail.bank.accountNo) && (
              <div className="flex justify-between"><span className="text-gray-500">Account</span>
                <span>{[detail.bank.accountType, detail.bank.accountNo, detail.bank.branchCode].filter(Boolean).join(' · ')}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Amount</span><span className="font-semibold">{fmtMoney(detail.amount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Details</span><span className="text-right max-w-[60%]">{detail.details || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Authorisation</span><span className="text-right max-w-[60%]">{detail.authorisation || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Expense Account</span><span>{detail.expenseAccount || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Column</span><Badge label={detail.expenseColumn} variant="purple" /></div>
            <div className="flex justify-between"><span className="text-gray-500">Client</span><span>{detail.client || '—'}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Caption</span><span className="text-right max-w-[60%]">{detail.caption}</span></div>
            {detail.sourceFile && <div className="flex justify-between"><span className="text-gray-500">Source</span><span className="text-xs text-gray-400">{detail.sourceFile}</span></div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
