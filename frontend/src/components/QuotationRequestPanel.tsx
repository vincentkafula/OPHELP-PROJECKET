import { useState, useEffect, useCallback } from 'react'
import { QuotationRequestApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select, Textarea } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { QuotationRequest, OperationStream, PaymentTerms } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtMoney(n: number) {
  return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

const STREAM_LABELS: Record<OperationStream, string> = { pre_school: 'Pre-School', school: 'School', technical_services: 'Technical Services' }
const STATUS_LABELS: Record<QuotationRequest['status'], string> = {
  submitted: 'Awaiting Operation Management', management_approved: 'Awaiting Operation Office',
  office_approved: 'Awaiting Manager', approved: 'Approved', declined: 'Declined',
}
const STATUS_VARIANTS: Record<QuotationRequest['status'], 'yellow' | 'blue' | 'purple' | 'green' | 'red'> = {
  submitted: 'yellow', management_approved: 'blue', office_approved: 'purple', approved: 'green', declined: 'red',
}

function StatCard({ label, value, sub, color = '#00695C' }: { label: string; value: string | number; sub?: string; color?: string }) {
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
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  const cls = variant === 'primary' ? 'bg-teal-700 hover:bg-teal-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  return <button onClick={onClick} className={`${cls} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

const emptyForm = {
  numWorkers: '', numForemen: '', numSupervisors: '',
  workerRate: '', foremanRate: '', supervisorRate: '',
  taskDetails: '', locationAddress: '', locationLat: '', locationLng: '',
  stream: 'school' as OperationStream, paymentTerms: 'upfront' as PaymentTerms,
}

interface QuotationRequestPanelProps { partnerShopId?: string; requestedBy: string }

export default function QuotationRequestPanel({ partnerShopId, requestedBy }: QuotationRequestPanelProps) {
  const all = useLive(() => partnerShopId ? QuotationRequestApi.byPartner(partnerShopId) : [])
  const [createModal, setCreateModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [detail, setDetail] = useState<QuotationRequest | null>(null)

  const quotedPreview =
    Number(form.numWorkers || 0) * Number(form.workerRate || 0) +
    Number(form.numForemen || 0) * Number(form.foremanRate || 0) +
    Number(form.numSupervisors || 0) * Number(form.supervisorRate || 0)

  function submitRequest() {
    if (!partnerShopId || !form.taskDetails || !form.locationAddress) return
    QuotationRequestApi.create({
      partnerShopId, requestedBy,
      numWorkers: Number(form.numWorkers) || 0, numForemen: Number(form.numForemen) || 0, numSupervisors: Number(form.numSupervisors) || 0,
      workerRate: Number(form.workerRate) || 0, foremanRate: Number(form.foremanRate) || 0, supervisorRate: Number(form.supervisorRate) || 0,
      taskDetails: form.taskDetails, locationAddress: form.locationAddress,
      locationLat: form.locationLat ? Number(form.locationLat) : undefined,
      locationLng: form.locationLng ? Number(form.locationLng) : undefined,
      stream: form.stream, paymentTerms: form.paymentTerms,
    })
    setCreateModal(false)
    setForm(emptyForm)
  }

  if (!partnerShopId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
        <div className="text-5xl mb-3">🏢</div>
        <p className="font-semibold text-gray-600">No linked partner shop found for this account</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Quotation Requests</h2>
        <Btn onClick={() => setCreateModal(true)} variant="primary">+ Request a Quotation</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={all.length} />
        <StatCard label="Pending" value={all.filter(q => !['approved', 'declined'].includes(q.status)).length} color="#C48A00" />
        <StatCard label="Approved" value={all.filter(q => q.status === 'approved').length} color="#2E7D32" />
        <StatCard label="Declined" value={all.filter(q => q.status === 'declined').length} color="#C62828" />
      </div>

      <SectionCard title="My Requests">
        {all.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📝</div>
            <p className="font-semibold text-gray-600">No quotation requests yet</p>
          </div>
        ) : (
          <DataTable columns={[
            { key: 'createdAt', header: 'Submitted', render: q => fmtDate(q.createdAt), sortable: true },
            { key: 'taskDetails', header: 'Task' },
            { key: 'stream', header: 'Stream', render: q => STREAM_LABELS[q.stream] },
            { key: 'team', header: 'Team', render: q => `${q.numForemen}F + ${q.numWorkers}W${q.numSupervisors ? ` + ${q.numSupervisors}S` : ''}` },
            { key: 'quotedAmount', header: 'Quoted Amount', render: q => fmtMoney(q.officeApprovedAmount ?? q.quotedAmount) },
            { key: 'status', header: 'Status', render: q => <Badge label={STATUS_LABELS[q.status]} variant={STATUS_VARIANTS[q.status]} dot /> },
          ]} data={all} pageSize={10}
            actions={q => <Btn onClick={() => setDetail(q)}>View</Btn>} />
        )}
      </SectionCard>

      <Modal open={createModal} onClose={() => setCreateModal(false)} title="Request a Quotation" size="lg"
        footer={<><Btn onClick={() => setCreateModal(false)}>Cancel</Btn><Btn onClick={submitRequest} variant="primary">Submit Request</Btn></>}>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Workers" type="number" value={form.numWorkers} onChange={e => setForm(f => ({ ...f, numWorkers: e.target.value }))} />
          <Input label="Worker Rate (R)" type="number" value={form.workerRate} onChange={e => setForm(f => ({ ...f, workerRate: e.target.value }))} placeholder="Rate per worker" />
          <Input label="Foremen" type="number" value={form.numForemen} onChange={e => setForm(f => ({ ...f, numForemen: e.target.value }))} />
          <Input label="Foreman Rate (R)" type="number" value={form.foremanRate} onChange={e => setForm(f => ({ ...f, foremanRate: e.target.value }))} placeholder="Rate per foreman" />
          <Input label="Operation Supervisors" type="number" value={form.numSupervisors} onChange={e => setForm(f => ({ ...f, numSupervisors: e.target.value }))} />
          <Input label="Supervisor Rate (R)" type="number" value={form.supervisorRate} onChange={e => setForm(f => ({ ...f, supervisorRate: e.target.value }))} placeholder="Rate per supervisor" />
          <Select label="Stream" value={form.stream} onChange={e => setForm(f => ({ ...f, stream: e.target.value as OperationStream }))}
            options={Object.entries(STREAM_LABELS).map(([value, label]) => ({ value, label }))} />
          <div className="col-span-2">
            <Textarea label="Task Sheet Details" required value={form.taskDetails} onChange={e => setForm(f => ({ ...f, taskDetails: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <Input label="Location Address" required value={form.locationAddress} onChange={e => setForm(f => ({ ...f, locationAddress: e.target.value }))} placeholder="Site address" />
          </div>
          <Input label="Latitude (optional)" value={form.locationLat} onChange={e => setForm(f => ({ ...f, locationLat: e.target.value }))} placeholder="Pin on map" />
          <Input label="Longitude (optional)" value={form.locationLng} onChange={e => setForm(f => ({ ...f, locationLng: e.target.value }))} />
          <Select label="Payment Terms" value={form.paymentTerms} onChange={e => setForm(f => ({ ...f, paymentTerms: e.target.value as PaymentTerms }))}
            options={[{ value: 'upfront', label: 'Upfront' }, { value: 'monthly', label: 'Monthly' }]} />
          <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
            <span className="text-sm text-gray-500">Estimated Quote</span>
            <span className="font-bold text-lg">{fmtMoney(quotedPreview)}</span>
          </div>
        </div>
      </Modal>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? 'Quotation Request' : ''} size="lg" footer={<Btn onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (
          <div className="space-y-3 text-sm">
            <Badge label={STATUS_LABELS[detail.status]} variant={STATUS_VARIANTS[detail.status]} dot />
            <div className="flex justify-between"><span className="text-gray-500">Task</span><span className="text-right max-w-[60%]">{detail.taskDetails}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-right max-w-[60%]">{detail.locationAddress}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Team</span><span>{detail.numForemen} Foreman, {detail.numWorkers} Workers, {detail.numSupervisors} Supervisors</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Quoted Amount</span><span className="font-semibold">{fmtMoney(detail.quotedAmount)}</span></div>
            {detail.officeApprovedAmount != null && <div className="flex justify-between"><span className="text-gray-500">Office-Approved Amount</span><span className="font-semibold">{fmtMoney(detail.officeApprovedAmount)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">Payment Terms</span><span className="capitalize">{detail.paymentTerms}</span></div>
            {detail.paymentTerms === 'monthly' && <div className="flex justify-between"><span className="text-gray-500">Monthly Terms</span><span className="capitalize">{detail.monthlyTermsDecision}</span></div>}
            {detail.status === 'declined' && <div className="flex justify-between"><span className="text-gray-500">Declined Reason</span><span>{detail.declinedReason}</span></div>}
          </div>
        )}
      </Modal>
    </div>
  )
}
