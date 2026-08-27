import { useState, useEffect, useCallback } from 'react'
import { ScheduledJobApi, TeamBookingApi, PartnerShopApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input, Select } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { ScheduledJob, RollCallSession, PartnerShop } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">{title}</h3></div>
      <div className="p-6">{children}</div>
    </div>
  )
}
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' }) {
  const cls = variant === 'primary' ? 'bg-indigo-700 hover:bg-indigo-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  return <button onClick={onClick} className={`${cls} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

export default function TeamBookingPanel({ teamName }: { teamName: string }) {
  const jobs = useLive(() => ScheduledJobApi.approved())
  const partnerShops = useLive(() => PartnerShopApi.list())
  const myBookings = useLive(() => TeamBookingApi.list().filter(b => b.teamName === teamName))

  const [bookModal, setBookModal] = useState<ScheduledJob | null>(null)
  const [foreman, setForeman] = useState('')
  const [worker1, setWorker1] = useState('')
  const [worker2, setWorker2] = useState('')
  const [session, setSession] = useState<RollCallSession>('07:30')

  function partnerName(id: string) { return partnerShops.find((p: PartnerShop) => p.id === id)?.name ?? id }

  function book() {
    if (!bookModal || !foreman.trim() || !worker1.trim() || !worker2.trim()) return
    TeamBookingApi.book({
      scheduledJobId: bookModal.id, teamName,
      foremanName: foreman.trim(), worker1Name: worker1.trim(), worker2Name: worker2.trim(),
      rollCallSession: session, bookedBy: teamName,
    })
    setBookModal(null); setForeman(''); setWorker1(''); setWorker2('')
  }

  const STATUS_VARIANTS = { booked: 'yellow', deployed: 'blue', completed: 'green' } as const

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Team Booking</h2>

      <SectionCard title="Approved Shifts Available">
        {jobs.length === 0 ? (
          <p className="text-sm text-gray-400">No approved schedules right now.</p>
        ) : (
          <DataTable columns={[
            { key: 'scheduledDate', header: 'Date', render: j => fmtDate(j.scheduledDate), sortable: true },
            { key: 'partner', header: 'Partner', render: j => partnerName(j.partnerShopId) },
            { key: 'accountName', header: 'Account' },
          ]} data={jobs} pageSize={10}
            actions={j => <Btn onClick={() => setBookModal(j)} variant="primary">Book Team</Btn>} />
        )}
      </SectionCard>

      <SectionCard title="My Bookings">
        {myBookings.length === 0 ? (
          <p className="text-sm text-gray-400">No bookings yet.</p>
        ) : (
          <DataTable columns={[
            { key: 'foremanName', header: 'Foreman' },
            { key: 'worker1Name', header: 'Worker 1' },
            { key: 'worker2Name', header: 'Worker 2' },
            { key: 'rollCallSession', header: 'Session' },
            { key: 'status', header: 'Status', render: b => <Badge label={b.status} variant={STATUS_VARIANTS[b.status]} dot /> },
          ]} data={myBookings} pageSize={10} />
        )}
      </SectionCard>

      <Modal open={!!bookModal} onClose={() => setBookModal(null)} title="Book Team (1 Foreman + 2 Workers)"
        footer={<><Btn onClick={() => setBookModal(null)}>Cancel</Btn><Btn onClick={book} variant="primary">Book</Btn></>}>
        <div className="space-y-4">
          <Input label="Foreman" required value={foreman} onChange={e => setForeman(e.target.value)} />
          <Input label="Worker 1" required value={worker1} onChange={e => setWorker1(e.target.value)} />
          <Input label="Worker 2" required value={worker2} onChange={e => setWorker2(e.target.value)} />
          <Select label="Roll Call Session" value={session} onChange={e => setSession(e.target.value as RollCallSession)}
            options={[{ value: '07:30', label: '07:30 AM' }, { value: '12:30', label: '12:30 PM' }]} />
        </div>
      </Modal>
    </div>
  )
}
