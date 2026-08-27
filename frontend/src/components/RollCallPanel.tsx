import { useState, useEffect, useCallback } from 'react'
import { TeamBookingApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select, Textarea } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { TeamBooking, RollCallSession } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">{title}</h3></div>
      <div className="p-6">{children}</div>
    </div>
  )
}
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'danger' }) {
  const cls: Record<string, string> = {
    primary: 'bg-cyan-700 hover:bg-cyan-800 text-white', ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

const STATUS_VARIANTS = { booked: 'yellow', deployed: 'blue', completed: 'green' } as const

function SessionTable({ session, bookings, onDeploy, onReplace }: {
  session: RollCallSession; bookings: TeamBooking[]; onDeploy: (id: string) => void; onReplace: (b: TeamBooking) => void
}) {
  const sessionBookings = bookings.filter(b => b.rollCallSession === session)
  return (
    <SectionCard title={`${session === '07:30' ? '07:30 AM' : '12:30 PM'} Roll Call`}>
      {sessionBookings.length === 0 ? (
        <p className="text-sm text-gray-400">No bookings for this session.</p>
      ) : (
        <DataTable columns={[
          { key: 'teamName', header: 'Team' },
          { key: 'foremanName', header: 'Foreman' },
          { key: 'worker1Name', header: 'Worker 1' },
          { key: 'worker2Name', header: 'Worker 2' },
          { key: 'status', header: 'Status', render: b => <Badge label={b.status} variant={STATUS_VARIANTS[b.status]} dot /> },
        ]} data={sessionBookings} pageSize={10}
          actions={b => (
            <div className="flex gap-1">
              {b.status === 'booked' && <Btn onClick={() => onDeploy(b.id)} variant="primary">Deploy</Btn>}
              {b.status !== 'completed' && <Btn onClick={() => onReplace(b)} variant="danger">No-Show / Replace</Btn>}
            </div>
          )} />
      )}
    </SectionCard>
  )
}

export default function RollCallPanel({ currentUserName }: { currentUserName: string }) {
  const bookings = useLive(() => TeamBookingApi.list())
  const [replaceModal, setReplaceModal] = useState<TeamBooking | null>(null)
  const [originalName, setOriginalName] = useState('')
  const [replacementName, setReplacementName] = useState('')
  const [reason, setReason] = useState('')

  function deploy(id: string) { TeamBookingApi.deploy(id, currentUserName) }
  function openReplace(b: TeamBooking) { setReplaceModal(b); setOriginalName(b.foremanName); setReplacementName(''); setReason('') }
  function confirmReplace() {
    if (!replaceModal || !replacementName.trim()) return
    TeamBookingApi.replaceMember(replaceModal.id, originalName, replacementName.trim(), reason || 'No-show')
    setReplaceModal(null)
  }

  const memberOptions = replaceModal ? [
    { value: replaceModal.foremanName, label: `Foreman: ${replaceModal.foremanName}` },
    { value: replaceModal.worker1Name, label: `Worker 1: ${replaceModal.worker1Name}` },
    { value: replaceModal.worker2Name, label: `Worker 2: ${replaceModal.worker2Name}` },
  ] : []

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Roll Call & Deployment</h2>
      <SessionTable session="07:30" bookings={bookings} onDeploy={deploy} onReplace={openReplace} />
      <SessionTable session="12:30" bookings={bookings} onDeploy={deploy} onReplace={openReplace} />

      <Modal open={!!replaceModal} onClose={() => setReplaceModal(null)} title="Replace No-Show Team Member"
        footer={<><Btn onClick={() => setReplaceModal(null)}>Cancel</Btn><Btn onClick={confirmReplace} variant="primary">Replace</Btn></>}>
        <div className="space-y-4">
          <Select label="Member to Replace" value={originalName} onChange={e => setOriginalName(e.target.value)} options={memberOptions} />
          <Input label="Replacement Name" required value={replacementName} onChange={e => setReplacementName(e.target.value)} />
          <Textarea label="Reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. No-show, replaced via team queue" />
        </div>
      </Modal>
    </div>
  )
}
