import { useState, useEffect, useCallback } from 'react'
import { JobsheetApi, computeJobsheetFinancials, PartnerShopApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { Jobsheet, JobsheetPayment, PartnerShop } from '@/lib/types'

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

const STATUS_VARIANTS: Record<Jobsheet['status'], 'gray' | 'yellow' | 'green'> = { draft: 'gray', submitted: 'yellow', confirmed: 'green' }
const STATUS_LABELS: Record<Jobsheet['status'], string> = { draft: 'Draft', submitted: 'Submitted', confirmed: 'Confirmed' }

function StatCard({ label, value, sub, color = '#1565C0' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">{title}</h3></div>
      <div className="p-6">{children}</div>
    </div>
  )
}
function Btn({ onClick, children, variant = 'ghost', disabled = false }: {
  onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'success' | 'danger'; disabled?: boolean
}) {
  const cls: Record<string, string> = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} disabled={disabled} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-40`}>{children}</button>
}

const emptyForm = {
  date: new Date().toISOString().slice(0, 10),
  jobDetail: '', partnerShopId: '', accountName: '',
  qualified: true, shiftHours: '8', contractedLabourTotal: '385',
  foreman: '', foremanMethod: 'cash', foremanAmount: '165',
  worker1: '', worker1Method: 'cash', worker1Amount: '110',
  worker2: '', worker2Method: 'cash', worker2Amount: '110',
  extraAmount: '0', transportAmount: '0', otherAmount: '0',
  bagsChargeEnabled: true, bagsIssued: '0', bagsReturned: '0', bagsUsed: '0',
  glovesIssued: '0', glovesReturned: '0', glovesUsed: '0',
  adminFeeRatePct: '25',
}
type FormState = typeof emptyForm

interface JobsheetsPanelProps {
  mode: 'foreman' | 'office'
  currentUserName: string
}

export default function JobsheetsPanel({ mode, currentUserName }: JobsheetsPanelProps) {
  const all = useLive(() => JobsheetApi.list())
  const partnerShops = useLive(() => PartnerShopApi.list())
  const jobsheets = mode === 'foreman' ? all.filter(j => j.createdBy === currentUserName) : all

  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [detail, setDetail] = useState<Jobsheet | null>(null)

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Live-updating rate defaults when qualified toggles, matching §4.1/4.2 base rates.
  function toggleQualified(qualified: boolean) {
    setForm(f => ({
      ...f, qualified,
      foremanAmount: qualified ? '165' : '120',
      worker1Amount: qualified ? '110' : '80',
      worker2Amount: qualified ? '110' : '70',
    }))
  }

  function buildPayments(): JobsheetPayment[] {
    const rows: [string, 'foreman' | 'worker', string, string][] = [
      [form.foreman, 'foreman', form.foremanMethod, form.foremanAmount],
      [form.worker1, 'worker', form.worker1Method, form.worker1Amount],
      [form.worker2, 'worker', form.worker2Method, form.worker2Amount],
    ]
    return rows.filter(([name]) => name.trim()).map(([name, role, method, amount]) => ({
      name: name.trim(), role, method: method as 'cash' | 'eft', amount: Number(amount) || 0,
    }))
  }

  const livePreview = computeJobsheetFinancials({
    payments: buildPayments(),
    qualified: form.qualified,
    shiftHours: Number(form.shiftHours) as 4 | 8,
    contractedLabourTotal: Number(form.contractedLabourTotal) as 365 | 385,
    extraAmount: Number(form.extraAmount) || 0,
    transportAmount: Number(form.transportAmount) || 0,
    bagsChargeEnabled: form.bagsChargeEnabled,
    bagsUsed: Number(form.bagsUsed) || 0,
    glovesUsed: Number(form.glovesUsed) || 0,
    otherAmount: Number(form.otherAmount) || 0,
    adminFeeRatePct: Number(form.adminFeeRatePct) || 25,
  })

  function createJobsheet() {
    if (!form.jobDetail || !form.foreman) return
    const res = JobsheetApi.create({
      date: form.date, jobDetail: form.jobDetail,
      partnerShopId: form.partnerShopId || undefined, accountName: form.accountName,
      qualified: form.qualified, shiftHours: Number(form.shiftHours) as 4 | 8,
      contractedLabourTotal: Number(form.contractedLabourTotal) as 365 | 385,
      payments: buildPayments(),
      extraAmount: Number(form.extraAmount) || 0,
      transportAmount: Number(form.transportAmount) || 0,
      bagsChargeEnabled: form.bagsChargeEnabled,
      bagsIssued: Number(form.bagsIssued) || 0, bagsReturned: Number(form.bagsReturned) || 0, bagsUsed: Number(form.bagsUsed) || 0,
      glovesIssued: Number(form.glovesIssued) || 0, glovesReturned: Number(form.glovesReturned) || 0, glovesUsed: Number(form.glovesUsed) || 0,
      otherAmount: Number(form.otherAmount) || 0,
      adminFeeRatePct: Number(form.adminFeeRatePct) || 25,
      createdBy: currentUserName,
    })
    if (res.success) { setCreateModal(false); setForm(emptyForm) }
  }

  function submit(id: string) { JobsheetApi.submit(id) }
  function confirm(id: string) {
    const res = JobsheetApi.confirm(id, currentUserName)
    if (res.success && res.data) setDetail(res.data)
  }

  const partnerOptions = partnerShops.map((p: PartnerShop) => ({ value: p.id, label: p.name }))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">{mode === 'foreman' ? 'My Jobsheets' : 'Jobsheet Review'}</h2>
        {mode === 'foreman' && <Btn onClick={() => setCreateModal(true)} variant="primary">+ New Jobsheet</Btn>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={mode === 'foreman' ? 'My Jobsheets' : 'Total Jobsheets'} value={jobsheets.length} />
        <StatCard label="Awaiting Review" value={jobsheets.filter(j => j.status === 'submitted').length} color="#C48A00" />
        <StatCard label="Confirmed" value={jobsheets.filter(j => j.status === 'confirmed').length} color="#2E7D32" />
        <StatCard label="Total Invoice Value" value={fmtMoney(jobsheets.filter(j => j.status === 'confirmed').reduce((s, j) => s + computeJobsheetFinancials(j).invoiceAmount, 0))} color="#1565C0" />
      </div>

      <SectionCard title="Jobsheets">
        {jobsheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-600">No Jobsheets yet</p>
            {mode === 'foreman' && <p className="text-sm text-gray-400 mt-1">Create one after a shift is complete.</p>}
          </div>
        ) : (
          <DataTable columns={[
            { key: 'date', header: 'Date', render: j => fmtDate(j.date), sortable: true },
            { key: 'jobDetail', header: 'Job Detail' },
            { key: 'accountName', header: 'Account' },
            { key: 'payments', header: 'Team', render: j => `${j.payments.length} member(s)` },
            { key: 'invoice', header: 'Invoice Amount', render: j => fmtMoney(computeJobsheetFinancials(j).invoiceAmount) },
            { key: 'serialNumber', header: 'Serial No.', render: j => j.serialNumber || '—' },
            { key: 'status', header: 'Status', render: j => <Badge label={STATUS_LABELS[j.status]} variant={STATUS_VARIANTS[j.status]} dot /> },
          ]} data={jobsheets} searchable
            searchFn={(j, q) => `${j.jobDetail} ${j.accountName} ${j.serialNumber ?? ''}`.toLowerCase().includes(q)}
            pageSize={10}
            actions={j => (
              <div className="flex gap-1">
                <Btn onClick={() => setDetail(j)}>View</Btn>
                {mode === 'foreman' && j.status === 'draft' && <Btn onClick={() => submit(j.id)} variant="primary">Submit</Btn>}
                {mode === 'office' && j.status === 'submitted' && <Btn onClick={() => confirm(j.id)} variant="success">Confirm</Btn>}
              </div>
            )} />
        )}
      </SectionCard>

      {/* ── New Jobsheet ── */}
      <Modal open={createModal} onClose={() => setCreateModal(false)} title="New Jobsheet" size="xl"
        footer={<><Btn onClick={() => setCreateModal(false)}>Cancel</Btn><Btn onClick={createJobsheet} variant="primary">Create Jobsheet</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Date" type="date" required value={form.date} onChange={e => set('date', e.target.value)} />
          <Select label="Client Account" value={form.partnerShopId} onChange={e => set('partnerShopId', e.target.value)}
            options={partnerOptions} placeholder="Select a partner…" />
          <div className="col-span-2">
            <Input label="Job Detail" required value={form.jobDetail} onChange={e => set('jobDetail', e.target.value)} placeholder="e.g. Road Maintenance P3&P4" />
          </div>
          <Input label="Account Name" value={form.accountName} onChange={e => set('accountName', e.target.value)} placeholder="e.g. OPHELP Salaries" />
          <Select label="Shift Hours" value={form.shiftHours} onChange={e => set('shiftHours', e.target.value)}
            options={[{ value: '4', label: '4 hours' }, { value: '8', label: '8 hours' }]} />
          <Select label="Team Qualified?" value={form.qualified ? 'yes' : 'no'} onChange={e => toggleQualified(e.target.value === 'yes')}
            options={[{ value: 'yes', label: 'Qualified' }, { value: 'no', label: 'Unqualified (6X Reward applies)' }]} />
          <Select label="Contracted Labour Total" value={form.contractedLabourTotal} onChange={e => set('contractedLabourTotal', e.target.value)}
            options={[{ value: '385', label: 'R385' }, { value: '365', label: 'R365' }]} hint="Per partner agreement" />

          <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Team & Pay</h4>
          </div>
          {([
            ['foreman', 'foremanMethod', 'foremanAmount', 'Foreman', form.foreman, form.foremanMethod, form.foremanAmount],
            ['worker1', 'worker1Method', 'worker1Amount', 'Worker 1', form.worker1, form.worker1Method, form.worker1Amount],
            ['worker2', 'worker2Method', 'worker2Amount', 'Worker 2', form.worker2, form.worker2Method, form.worker2Amount],
          ] as [keyof FormState, keyof FormState, keyof FormState, string, string, string, string][]).map(([nameKey, methodKey, amountKey, label, name, method, amount]) => (
            <div key={String(nameKey)} className="col-span-2 grid grid-cols-3 gap-3 items-end">
              <Input label={label} value={name} onChange={e => set(nameKey, e.target.value)} placeholder="Name" />
              <Select label="Method" value={method} onChange={e => set(methodKey, e.target.value)}
                options={[{ value: 'cash', label: 'Cash' }, { value: 'eft', label: 'EFT' }]} />
              <Input label="Amount (R)" type="number" value={amount} onChange={e => set(amountKey, e.target.value)} />
            </div>
          ))}

          <div className="col-span-2 border-t border-gray-100 pt-3 mt-1">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">Extra Costs</h4>
          </div>
          <Input label="Extra (R)" type="number" value={form.extraAmount} onChange={e => set('extraAmount', e.target.value)} hint="Pay beyond the contracted total" />
          <Input label="Transport (R)" type="number" value={form.transportAmount} onChange={e => set('transportAmount', e.target.value)} />
          <Input label="Other (R)" type="number" value={form.otherAmount} onChange={e => set('otherAmount', e.target.value)} />
          <Input label="Admin Fee Rate (%)" type="number" value={form.adminFeeRatePct} onChange={e => set('adminFeeRatePct', e.target.value)} />

          <div className="col-span-2 border-t border-gray-100 pt-3 mt-1 flex items-center justify-between">
            <h4 className="font-semibold text-sm text-gray-700">Bags & Gloves</h4>
            <label className="flex items-center gap-2 text-xs text-gray-600">
              <input type="checkbox" checked={form.bagsChargeEnabled} onChange={e => set('bagsChargeEnabled', e.target.checked)} />
              Charge for bags/gloves (unchecked if client pays direct)
            </label>
          </div>
          <Input label="Bags Issued" type="number" value={form.bagsIssued} onChange={e => set('bagsIssued', e.target.value)} />
          <Input label="Bags Returned" type="number" value={form.bagsReturned} onChange={e => set('bagsReturned', e.target.value)} />
          <Input label="Bags Used" type="number" value={form.bagsUsed} onChange={e => set('bagsUsed', e.target.value)} hint="R1.94 each" />
          <div />
          <Input label="Gloves Issued" type="number" value={form.glovesIssued} onChange={e => set('glovesIssued', e.target.value)} />
          <Input label="Gloves Returned" type="number" value={form.glovesReturned} onChange={e => set('glovesReturned', e.target.value)} />
          <Input label="Gloves Used" type="number" value={form.glovesUsed} onChange={e => set('glovesUsed', e.target.value)} hint="R7.50 each" />

          <div className="col-span-2 bg-gray-50 rounded-xl p-4 mt-2 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Pay Amount (Cash + EFT + 6X Reward)</span>
              <span className={livePreview.payMismatch ? 'text-red-600 font-semibold' : ''}>{fmtMoney(livePreview.payAmount)}</span></div>
            {livePreview.payMismatch && <p className="text-xs text-red-600">⚠ Pay Amount doesn't match the contracted labour total (R{form.contractedLabourTotal}) — check the payment amounts.</p>}
            <div className="flex justify-between"><span className="text-gray-500">6X Reward</span><span>{fmtMoney(livePreview.sixXRewardAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Material (bags + gloves)</span><span>{fmtMoney(livePreview.materialAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmtMoney(livePreview.subtotal)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Admin Fee ({form.adminFeeRatePct}%)</span><span>{fmtMoney(livePreview.adminFee)}</span></div>
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-200"><span>Invoice Amount</span><span>{fmtMoney(livePreview.invoiceAmount)}</span></div>
          </div>
        </div>
      </Modal>

      {/* ── Detail ── */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Jobsheet — ${detail.jobDetail}` : ''} size="lg"
        footer={detail && (
          <>
            {mode === 'office' && detail.status === 'submitted' && <Btn onClick={() => confirm(detail.id)} variant="success">Confirm & Assign Serial No.</Btn>}
            <Btn onClick={() => setDetail(null)}>Close</Btn>
          </>
        )}>
        {detail && (() => {
          const f = computeJobsheetFinancials(detail)
          return (
            <div className="space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <Badge label={STATUS_LABELS[detail.status]} variant={STATUS_VARIANTS[detail.status]} dot />
                {detail.serialNumber && <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{detail.serialNumber}</span>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-gray-500">Date</span><div className="font-medium">{fmtDate(detail.date)}</div></div>
                <div><span className="text-gray-500">Account</span><div className="font-medium">{detail.accountName || '—'}</div></div>
                <div><span className="text-gray-500">Shift</span><div>{detail.shiftHours}h · {detail.qualified ? 'Qualified' : 'Unqualified'}</div></div>
                <div><span className="text-gray-500">Contracted Total</span><div>{fmtMoney(detail.contractedLabourTotal)}</div></div>
              </div>
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Team</span>
                <div className="space-y-1 mt-1">
                  {detail.payments.map((p, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{p.name} <Badge label={p.role} variant="gray" /></span>
                      <span>{fmtMoney(p.amount)} <span className="text-gray-400 text-xs">({p.method.toUpperCase()})</span></span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-1 border-t border-gray-100 pt-3">
                <div className="flex justify-between"><span className="text-gray-500">Cash</span><span>{fmtMoney(f.cashAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">EFT</span><span>{fmtMoney(f.eftAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Extra</span><span>{fmtMoney(detail.extraAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">6X Reward</span><span>{fmtMoney(f.sixXRewardAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Transport</span><span>{fmtMoney(detail.transportAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Material (bags {detail.bagsUsed} + gloves {detail.glovesUsed})</span><span>{fmtMoney(f.materialAmount)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Other</span><span>{fmtMoney(detail.otherAmount)}</span></div>
                <div className="flex justify-between font-medium pt-1 border-t border-gray-100"><span>Subtotal</span><span>{fmtMoney(f.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Admin Fee ({detail.adminFeeRatePct}%)</span><span>{fmtMoney(f.adminFee)}</span></div>
                <div className="flex justify-between font-bold text-base pt-1"><span>Invoice Amount</span><span>{fmtMoney(f.invoiceAmount)}</span></div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
