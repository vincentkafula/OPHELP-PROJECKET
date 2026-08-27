import { useState, useEffect, useCallback } from 'react'
import { PayrollApi, ParticipantApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select, Textarea } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { PayrollPeriod, PayrollRosterEntry, PayrollEntry, PayrollCorrection } from '@/lib/types'

// ── Local data hook (mirrors Dashboard.tsx's useDbData, kept local since
// this component is imported standalone) ────────────────────────────────
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

const emptyEntryForm = { fileNo: '', name: '', day: '', task: '', hours: '8', amount: '' }
const emptyCorrectionForm = { fileNo: '', name: '', detail: '', amount: '', journalEntry: '' }
const emptyPeriodForm = { number: '', label: '' }

export default function PayrollPanel() {
  const periods = useLive(() => PayrollApi.periods())
  const roster = useLive(() => PayrollApi.roster())
  const participants = useLive(() => ParticipantApi.list())

  const [periodId, setPeriodId] = useState<string>('')
  useEffect(() => {
    if (!periodId && periods.length) setPeriodId(periods[0].id)
  }, [periods, periodId])

  const entries = useLive(() => (periodId ? PayrollApi.entriesByPeriod(periodId) : []))
  const corrections = useLive(() => (periodId ? PayrollApi.correctionsByPeriod(periodId) : []))
  const summary = useLive(() => (periodId ? PayrollApi.summaryByPeriod(periodId) : []))
  const totals = useLive(() => (periodId ? PayrollApi.periodTotals(periodId) : { people: 0, hours: 0, gross: 0, corrections: 0, net: 0 }))

  const activePeriod = periods.find(p => p.id === periodId)

  const [periodModal, setPeriodModal] = useState(false)
  const [periodForm, setPeriodForm] = useState(emptyPeriodForm)
  const [entryModal, setEntryModal] = useState(false)
  const [entryForm, setEntryForm] = useState(emptyEntryForm)
  const [correctionModal, setCorrectionModal] = useState(false)
  const [correctionForm, setCorrectionForm] = useState(emptyCorrectionForm)

  function createPeriod() {
    if (!periodForm.number || !periodForm.label) return
    const res = PayrollApi.createPeriod({ number: Number(periodForm.number), label: periodForm.label })
    if (res.success && res.data) {
      setPeriodId(res.data.id)
      setPeriodModal(false)
      setPeriodForm(emptyPeriodForm)
    }
  }

  function addEntry() {
    if (!activePeriod || !entryForm.fileNo || !entryForm.name || !entryForm.hours || !entryForm.amount) return
    PayrollApi.addEntry({
      periodId: activePeriod.id,
      rosterId: roster.find(r => r.fileNo === entryForm.fileNo)?.id ?? null,
      fileNo: entryForm.fileNo,
      name: entryForm.name,
      day: entryForm.day,
      task: entryForm.task,
      hours: Number(entryForm.hours),
      amount: Number(entryForm.amount),
    })
    setEntryModal(false)
    setEntryForm(emptyEntryForm)
  }

  function addCorrection() {
    if (!activePeriod || !correctionForm.fileNo || !correctionForm.name || !correctionForm.detail || !correctionForm.amount) return
    PayrollApi.addCorrection({
      periodId: activePeriod.id,
      rosterId: roster.find(r => r.fileNo === correctionForm.fileNo)?.id ?? null,
      fileNo: correctionForm.fileNo,
      name: correctionForm.name,
      detail: correctionForm.detail,
      amount: Number(correctionForm.amount),
      journalEntry: correctionForm.journalEntry,
    })
    setCorrectionModal(false)
    setCorrectionForm(emptyCorrectionForm)
  }

  function exportSummaryCsv() {
    if (!activePeriod) return
    const header = ['File No', 'Name', 'ABSA Beneficiary Number', 'Hours', 'Gross', 'Corrections', 'Net Payable']
    const rosterByFileNo = new Map(roster.map(r => [r.fileNo, r]))
    const rows = summary.map(s => [
      s.fileNo, s.name, rosterByFileNo.get(s.fileNo)?.absaBeneficiaryNumber ?? '',
      s.hours, s.gross.toFixed(2), s.corrections.toFixed(2), s.net.toFixed(2),
    ])
    downloadCsv(`payroll-${activePeriod.number}-summary.csv`, [header, ...rows])
  }

  const rosterOptions = roster.map(r => ({ value: r.fileNo, label: `${r.name} (${r.fileNo})` }))

  function pickPerson(fileNo: string, setter: (patch: Record<string, string>) => void) {
    const r = roster.find(x => x.fileNo === fileNo)
    setter({ fileNo, name: r?.name ?? '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-end gap-3">
          <div className="w-72">
            <Select label="Payroll Period" value={periodId} onChange={e => setPeriodId(e.target.value)}
              options={periods.map(p => ({ value: p.id, label: `Payroll ${p.number} — ${p.label}` }))}
              placeholder={periods.length ? undefined : 'No payroll periods yet'} />
          </div>
          {activePeriod && <Badge label={activePeriod.status} variant={activePeriod.status === 'paid' ? 'green' : activePeriod.status === 'finalized' ? 'blue' : activePeriod.status === 'imported' ? 'purple' : 'gray'} dot />}
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => setPeriodModal(true)} variant="ghost">+ New Period</Btn>
          {activePeriod && <Btn onClick={() => setEntryModal(true)} variant="ghost">+ Add Entry</Btn>}
          {activePeriod && <Btn onClick={() => setCorrectionModal(true)} variant="ghost">+ Add Correction</Btn>}
          {activePeriod && <Btn onClick={exportSummaryCsv} variant="primary">Export Payslip Summary (CSV)</Btn>}
        </div>
      </div>

      {!activePeriod ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">💰</div>
          <p className="font-semibold text-gray-600">No payroll periods yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a period, or import a Paybook export via the backend's payroll importer.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label="People Paid" value={totals.people} />
            <StatCard label="Total Hours" value={totals.hours.toLocaleString('en-ZA')} />
            <StatCard label="Gross Pay" value={fmtMoney(totals.gross)} color="#2E7D32" />
            <StatCard label="Corrections" value={fmtMoney(totals.corrections)} color="#C62828" />
            <StatCard label="Net Payable" value={fmtMoney(totals.net)} color="#1565C0" />
          </div>

          <SectionCard title={`Payslip Summary — Payroll ${activePeriod.number}`}>
            <DataTable columns={[
              { key: 'name', header: 'Name', sortable: true },
              { key: 'fileNo', header: 'File No' },
              { key: 'hours', header: 'Hours', render: r => r.hours.toLocaleString('en-ZA') },
              { key: 'gross', header: 'Gross', render: r => fmtMoney(r.gross) },
              { key: 'corrections', header: 'Corrections', render: r => <span className={r.corrections < 0 ? 'text-red-600' : ''}>{fmtMoney(r.corrections)}</span> },
              { key: 'net', header: 'Net Payable', render: r => <span className="font-semibold">{fmtMoney(r.net)}</span> },
              { key: 'participantId', header: 'Profile', render: r => r.participantId
                ? <Badge label="Linked" variant="green" dot />
                : <Badge label="Unmatched" variant="gray" dot /> },
            ]} data={summary.map(s => ({ ...s, id: s.fileNo }))} searchable
              searchFn={(r, q) => `${r.name} ${r.fileNo}`.toLowerCase().includes(q)} pageSize={12} />
          </SectionCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SectionCard title="Paysheet (daily lines)">
              <DataTable columns={[
                { key: 'name', header: 'Name', sortable: true },
                { key: 'day', header: 'Day' },
                { key: 'task', header: 'Task' },
                { key: 'hours', header: 'Hrs' },
                { key: 'amount', header: 'Amount', render: e => fmtMoney(e.amount) },
              ]} data={entries} searchable
                searchFn={(e, q) => `${e.name} ${e.task} ${e.day}`.toLowerCase().includes(q)} pageSize={10}
                actions={e => <Btn onClick={() => PayrollApi.deleteEntry(e.id)} variant="danger">Remove</Btn>} />
            </SectionCard>

            <SectionCard title="Corrections & Deductions">
              <DataTable columns={[
                { key: 'name', header: 'Name', sortable: true },
                { key: 'detail', header: 'Detail' },
                { key: 'journalEntry', header: 'JE #' },
                { key: 'amount', header: 'Amount', render: c => <span className={c.amount < 0 ? 'text-red-600' : 'text-green-700'}>{fmtMoney(c.amount)}</span> },
              ]} data={corrections} searchable
                searchFn={(c, q) => `${c.name} ${c.detail}`.toLowerCase().includes(q)} pageSize={10}
                actions={c => <Btn onClick={() => PayrollApi.deleteCorrection(c.id)} variant="danger">Remove</Btn>} />
            </SectionCard>
          </div>

          <SectionCard title="Payroll Roster">
            <DataTable columns={[
              { key: 'name', header: 'Name', sortable: true },
              { key: 'fileNo', header: 'File No' },
              { key: 'absaBeneficiaryNumber', header: 'ABSA Beneficiary #' },
              { key: 'payrollCode', header: 'Payroll Code' },
              { key: 'department', header: 'Department', render: (r: PayrollRosterEntry) => r.department ? <Badge label={r.department} variant="blue" /> : '—' },
              { key: 'glCode', header: 'GL Code', render: (r: PayrollRosterEntry) => r.glCode || '—' },
              { key: 'participantId', header: 'Profile', render: (r: PayrollRosterEntry) => r.participantId
                ? <Badge label="Linked" variant="green" dot />
                : <Badge label="Unmatched" variant="gray" dot /> },
            ]} data={roster} searchable
              searchFn={(r, q) => `${r.name} ${r.fileNo}`.toLowerCase().includes(q)} pageSize={10} />
          </SectionCard>
        </>
      )}

      {/* ── New Period ── */}
      <Modal open={periodModal} onClose={() => setPeriodModal(false)} title="New Payroll Period"
        footer={<><Btn onClick={() => setPeriodModal(false)} variant="ghost">Cancel</Btn><Btn onClick={createPeriod} variant="primary">Create Period</Btn></>}>
        <div className="space-y-4">
          <Input label="Payroll Number" type="number" required value={periodForm.number} onChange={e => setPeriodForm(f => ({ ...f, number: e.target.value }))} placeholder="e.g. 72" />
          <Input label="Period Label" required value={periodForm.label} onChange={e => setPeriodForm(f => ({ ...f, label: e.target.value }))} placeholder="e.g. 04 Mar - 10 Mar 2026" />
        </div>
      </Modal>

      {/* ── Add Entry ── */}
      <Modal open={entryModal} onClose={() => setEntryModal(false)} title="Add Paysheet Entry"
        footer={<><Btn onClick={() => setEntryModal(false)} variant="ghost">Cancel</Btn><Btn onClick={addEntry} variant="primary">Add Entry</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Select label="Person" required value={entryForm.fileNo}
              onChange={e => pickPerson(e.target.value, patch => setEntryForm(f => ({ ...f, ...patch })))}
              options={rosterOptions} placeholder="Select from roster…" />
          </div>
          <Input label="Day" required value={entryForm.day} onChange={e => setEntryForm(f => ({ ...f, day: e.target.value }))} placeholder="e.g. 4.Wednesday, 04 March 2026" />
          <Input label="Hours" type="number" step="0.5" required value={entryForm.hours} onChange={e => setEntryForm(f => ({ ...f, hours: e.target.value }))} />
          <div className="col-span-2">
            <Input label="Task" required value={entryForm.task} onChange={e => setEntryForm(f => ({ ...f, task: e.target.value }))} placeholder="e.g. Grand Parade cleaning" />
          </div>
          <Input label="Amount (R)" type="number" step="0.01" required value={entryForm.amount} onChange={e => setEntryForm(f => ({ ...f, amount: e.target.value }))} />
        </div>
      </Modal>

      {/* ── Add Correction ── */}
      <Modal open={correctionModal} onClose={() => setCorrectionModal(false)} title="Add Correction / Deduction"
        footer={<><Btn onClick={() => setCorrectionModal(false)} variant="ghost">Cancel</Btn><Btn onClick={addCorrection} variant="primary">Add Correction</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Select label="Person" required value={correctionForm.fileNo}
              onChange={e => pickPerson(e.target.value, patch => setCorrectionForm(f => ({ ...f, ...patch })))}
              options={rosterOptions} placeholder="Select from roster…" />
          </div>
          <div className="col-span-2">
            <Textarea label="Detail" required value={correctionForm.detail} onChange={e => setCorrectionForm(f => ({ ...f, detail: e.target.value }))} placeholder="e.g. Medical Aid" />
          </div>
          <Input label="Amount (R)" type="number" step="0.01" required value={correctionForm.amount} onChange={e => setCorrectionForm(f => ({ ...f, amount: e.target.value }))} hint="Negative for deductions" />
          <Input label="Journal Entry #" value={correctionForm.journalEntry} onChange={e => setCorrectionForm(f => ({ ...f, journalEntry: e.target.value }))} placeholder="e.g. JE 01 038.1" />
        </div>
      </Modal>
    </div>
  )
}
