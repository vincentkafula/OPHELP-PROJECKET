import { useState, useEffect, useCallback } from 'react'
import { ScheduledJobApi, PartnerShopApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { ScheduledJob, OperationStream, PartnerShop } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }
const STREAM_LABELS: Record<OperationStream, string> = { pre_school: 'Pre-School', school: 'School', technical_services: 'Technical Services' }

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">{title}</h3></div>
      <div className="p-6">{children}</div>
    </div>
  )
}
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  const cls = variant === 'primary' ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  return <button onClick={onClick} className={`${cls} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

export default function SchedulingPanel({ currentUserName }: { currentUserName: string }) {
  const all = useLive(() => ScheduledJobApi.list())
  const partnerShops = useLive(() => PartnerShopApi.list())
  const pending = all.filter(j => j.status === 'pending_schedule')
  const approved = all.filter(j => j.status === 'schedule_approved')

  const [approveModal, setApproveModal] = useState<ScheduledJob | null>(null)
  const [accountName, setAccountName] = useState('')

  function partnerName(id: string) { return partnerShops.find((p: PartnerShop) => p.id === id)?.name ?? id }

  function confirmApprove() {
    if (!approveModal || !accountName.trim()) return
    ScheduledJobApi.approveSchedule(approveModal.id, accountName.trim(), currentUserName)
    setApproveModal(null); setAccountName('')
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Shift Scheduling</h2>

      <SectionCard title="Pending Schedule Approval">
        {pending.length === 0 ? (
          <p className="text-sm text-gray-400">No approved quotations awaiting scheduling.</p>
        ) : (
          <DataTable columns={[
            { key: 'scheduledDate', header: 'Date', render: j => fmtDate(j.scheduledDate), sortable: true },
            { key: 'partner', header: 'Partner', render: j => partnerName(j.partnerShopId) },
            { key: 'stream', header: 'Stream', render: j => <Badge label={STREAM_LABELS[j.stream]} variant="blue" /> },
          ]} data={pending} pageSize={10}
            actions={j => <Btn onClick={() => { setApproveModal(j); setAccountName(j.accountName) }} variant="primary">Confirm Account & Approve</Btn>} />
        )}
      </SectionCard>

      <SectionCard title="Approved Schedules (visible to Teams)">
        {approved.length === 0 ? (
          <p className="text-sm text-gray-400">No approved schedules yet.</p>
        ) : (
          <DataTable columns={[
            { key: 'scheduledDate', header: 'Date', render: j => fmtDate(j.scheduledDate), sortable: true },
            { key: 'partner', header: 'Partner', render: j => partnerName(j.partnerShopId) },
            { key: 'accountName', header: 'Account' },
            { key: 'stream', header: 'Stream', render: j => <Badge label={STREAM_LABELS[j.stream]} variant="green" /> },
          ]} data={approved} pageSize={10} />
        )}
      </SectionCard>

      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title="Confirm Account & Approve Schedule"
        footer={<><Btn onClick={() => setApproveModal(null)}>Cancel</Btn><Btn onClick={confirmApprove} variant="primary">Approve</Btn></>}>
        <Input label="Account Name" required value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="e.g. CIDC, GSCIDC…" hint="Partners can have multiple named accounts" />
      </Modal>
    </div>
  )
}
