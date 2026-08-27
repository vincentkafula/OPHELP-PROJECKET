import { useState, useEffect, useCallback } from 'react'
import { QuotationRequestApi, PartnerShopApi, ScheduledJobApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select, Textarea } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { QuotationRequest, OperationStream, PartnerShop } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtMoney(n: number) { return `R${n.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

const STREAM_LABELS: Record<OperationStream, string> = { pre_school: 'Pre-School', school: 'School', technical_services: 'Technical Services' }
const STATUS_LABELS: Record<QuotationRequest['status'], string> = {
  submitted: 'Awaiting Operation Management', management_approved: 'Awaiting Operation Office',
  office_approved: 'Awaiting Manager', approved: 'Approved', declined: 'Declined',
}
const STATUS_VARIANTS: Record<QuotationRequest['status'], 'yellow' | 'blue' | 'purple' | 'green' | 'red'> = {
  submitted: 'yellow', management_approved: 'blue', office_approved: 'purple', approved: 'green', declined: 'red',
}

function StatCard({ label, value, sub, color = '#2E7D32' }: { label: string; value: string | number; sub?: string; color?: string }) {
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
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'success' | 'danger' }) {
  const cls: Record<string, string> = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white', ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white', danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

interface RequestApprovalPanelProps {
  stage: 'management' | 'office' | 'manager'
  currentUserName: string
}

export default function RequestApprovalPanel({ stage, currentUserName }: RequestApprovalPanelProps) {
  const all = useLive(() => QuotationRequestApi.list())
  const partnerShops = useLive(() => PartnerShopApi.list())
  const pending = stage === 'management' ? all.filter(q => q.status === 'submitted')
    : stage === 'office' ? all.filter(q => q.status === 'management_approved')
    : all.filter(q => q.status === 'office_approved')

  const [detail, setDetail] = useState<QuotationRequest | null>(null)
  const [notes, setNotes] = useState('')
  const [officeAmount, setOfficeAmount] = useState('')
  const [assignedStream, setAssignedStream] = useState<OperationStream>('school')
  const [declineModal, setDeclineModal] = useState<QuotationRequest | null>(null)
  const [declineReason, setDeclineReason] = useState('')
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().slice(0, 10))

  function partnerName(id: string) { return partnerShops.find((p: PartnerShop) => p.id === id)?.name ?? id }

  function openDetail(q: QuotationRequest) {
    setDetail(q); setNotes(''); setOfficeAmount(String(q.quotedAmount)); setAssignedStream(q.stream)
  }

  function approve() {
    if (!detail) return
    if (stage === 'management') QuotationRequestApi.approveManagement(detail.id, currentUserName, notes)
    else if (stage === 'office') QuotationRequestApi.approveOffice(detail.id, currentUserName, Number(officeAmount) || detail.quotedAmount, notes)
    else {
      QuotationRequestApi.approveManager(detail.id, currentUserName, assignedStream, notes)
      ScheduledJobApi.createFromRequest({ ...detail, status: 'approved', managerAssignedStream: assignedStream }, scheduleDate)
    }
    setDetail(null)
  }
  function decline() {
    if (!declineModal) return
    QuotationRequestApi.decline(declineModal.id, currentUserName, declineReason || 'Declined')
    setDeclineModal(null); setDeclineReason('')
  }
  function decideMonthlyTerms(q: QuotationRequest, decision: 'approved' | 'declined') {
    QuotationRequestApi.decideMonthlyTerms(q.id, currentUserName, decision)
  }

  const stageTitle = { management: 'Operational Feasibility Review', office: 'Quotation Amount Approval', manager: 'Final Approval' }[stage]

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">{stageTitle}</h2>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Awaiting Your Review" value={pending.length} color="#C48A00" />
        <StatCard label="Total Requests" value={all.length} />
        <StatCard label="Approved (All Stages)" value={all.filter(q => q.status === 'approved').length} />
      </div>

      {stage === 'manager' && (
        <SectionCard title="Monthly Payment Terms — Pending Decisions">
          {all.filter(q => q.paymentTerms === 'monthly' && q.monthlyTermsDecision === 'pending' && q.status !== 'declined').length === 0 ? (
            <p className="text-sm text-gray-400">No monthly-terms decisions pending.</p>
          ) : (
            <div className="space-y-2">
              {all.filter(q => q.paymentTerms === 'monthly' && q.monthlyTermsDecision === 'pending' && q.status !== 'declined').map(q => (
                <div key={q.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl text-sm">
                  <span>{partnerName(q.partnerShopId)} — {q.taskDetails} — {fmtMoney(q.quotedAmount)}</span>
                  <div className="flex gap-2">
                    <Btn onClick={() => decideMonthlyTerms(q, 'approved')} variant="success">Approve Monthly Terms</Btn>
                    <Btn onClick={() => decideMonthlyTerms(q, 'declined')} variant="danger">Decline</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      <SectionCard title={`Requests Awaiting ${stageTitle}`}>
        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">✅</div>
            <p className="font-semibold text-gray-600">Nothing pending at this stage</p>
          </div>
        ) : (
          <DataTable columns={[
            { key: 'createdAt', header: 'Submitted', render: q => fmtDate(q.createdAt), sortable: true },
            { key: 'partner', header: 'Partner', render: q => partnerName(q.partnerShopId) },
            { key: 'taskDetails', header: 'Task' },
            { key: 'stream', header: 'Stream', render: q => STREAM_LABELS[q.stream] },
            { key: 'quotedAmount', header: 'Amount', render: q => fmtMoney(q.quotedAmount) },
            { key: 'paymentTerms', header: 'Terms', render: q => <Badge label={q.paymentTerms} variant={q.paymentTerms === 'upfront' ? 'blue' : 'purple'} /> },
          ]} data={pending} pageSize={10}
            actions={q => (
              <div className="flex gap-1">
                <Btn onClick={() => openDetail(q)}>Review</Btn>
                <Btn onClick={() => setDeclineModal(q)} variant="danger">Decline</Btn>
              </div>
            )} />
        )}
      </SectionCard>

      <SectionCard title="All Requests">
        <DataTable columns={[
          { key: 'createdAt', header: 'Submitted', render: q => fmtDate(q.createdAt), sortable: true },
          { key: 'partner', header: 'Partner', render: q => partnerName(q.partnerShopId) },
          { key: 'taskDetails', header: 'Task' },
          { key: 'status', header: 'Status', render: q => <Badge label={STATUS_LABELS[q.status]} variant={STATUS_VARIANTS[q.status]} dot /> },
        ]} data={all} searchable searchFn={(q, s) => `${partnerName(q.partnerShopId)} ${q.taskDetails}`.toLowerCase().includes(s)} pageSize={10}
          actions={q => <Btn onClick={() => setDetail(q)}>View</Btn>} />
      </SectionCard>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Quotation Request" size="lg"
        footer={detail && pending.some(p => p.id === detail.id) && (
          <><Btn onClick={() => setDetail(null)}>Cancel</Btn><Btn onClick={approve} variant="success">Approve</Btn></>
        )}>
        {detail && (
          <div className="space-y-4 text-sm">
            <Badge label={STATUS_LABELS[detail.status]} variant={STATUS_VARIANTS[detail.status]} dot />
            <div className="flex justify-between"><span className="text-gray-500">Partner</span><span className="font-medium">{partnerName(detail.partnerShopId)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Task</span><span className="text-right max-w-[60%]">{detail.taskDetails}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Location</span><span className="text-right max-w-[60%]">{detail.locationAddress}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Team</span><span>{detail.numForemen} Foreman × R{detail.foremanRate}, {detail.numWorkers} Workers × R{detail.workerRate}, {detail.numSupervisors} Supervisors × R{detail.supervisorRate}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Quoted Amount</span><span className="font-semibold">{fmtMoney(detail.quotedAmount)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Payment Terms</span><span className="capitalize">{detail.paymentTerms}</span></div>

            {stage === 'office' && (
              <Input label="Approved Amount (R)" type="number" value={officeAmount} onChange={e => setOfficeAmount(e.target.value)} />
            )}
            {stage === 'manager' && (
              <>
                <Select label="Assign to Stream" value={assignedStream} onChange={e => setAssignedStream(e.target.value as OperationStream)}
                  options={Object.entries(STREAM_LABELS).map(([value, label]) => ({ value, label }))} />
                <Input label="Schedule Date" type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
              </>
            )}
            <Textarea label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
        )}
      </Modal>

      <Modal open={!!declineModal} onClose={() => setDeclineModal(null)} title="Decline Request"
        footer={<><Btn onClick={() => setDeclineModal(null)}>Cancel</Btn><Btn onClick={decline} variant="danger">Decline Request</Btn></>}>
        <Textarea label="Reason" required value={declineReason} onChange={e => setDeclineReason(e.target.value)} />
      </Modal>
    </div>
  )
}
