import { useState, useEffect, useCallback } from 'react'
import { DepotScheduleApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Badge } from './shared/Badge'
import type { DepotSchedule } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-ZA', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
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

export default function DepotSchedulesPanel() {
  const schedules = useLive(() => DepotScheduleApi.list())
  const [selectedId, setSelectedId] = useState<string>('')

  useEffect(() => {
    if (!selectedId && schedules.length) setSelectedId(schedules[0].id)
  }, [schedules, selectedId])

  const selected = schedules.find(s => s.id === selectedId)
  const totalWorkers = selected ? selected.shifts.reduce((s, sh) => s + sh.workers.length, 0) : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Depot Schedules</h2>
        {schedules.length > 0 && (
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-blue-500">
            {schedules.map(s => <option key={s.id} value={s.id}>{s.depotName} — {fmtDate(s.date)}</option>)}
          </select>
        )}
      </div>

      {!selected ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">📅</div>
          <p className="font-semibold text-gray-600">No depot schedules yet</p>
          <p className="text-sm text-gray-400 mt-1">Import one via the backend's depot-schedule importer.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Shifts Today" value={selected.shifts.length} />
            <StatCard label="Workers Booked" value={totalWorkers} color="#2E7D32" />
            <StatCard label="Office Roster" value={selected.roster.length} color="#1565C0" />
            <StatCard label="Date" value={fmtDate(selected.date).split(',')[0]} sub={fmtDate(selected.date)} color="#C48A00" />
          </div>

          <SectionCard title={`${selected.depotName}: Shifts Schedule — ${fmtDate(selected.date)}`}>
            <DataTable columns={[
              { key: 'title', header: 'Shift', render: r => <div><div className="font-medium">{r.title}</div><div className="text-xs text-gray-400">{r.hours}</div></div> },
              { key: 'foreman', header: 'Foreman', render: r => r.foreman || '—' },
              { key: 'workers', header: 'Booked Participants', render: r => (
                <div className="flex flex-wrap gap-1">{r.workers.map((w, i) => <Badge key={i} label={w} variant="blue" />)}</div>
              )},
              { key: 'confirmed', header: 'Confirmed', render: r => r.confirmed ? <Badge label="Yes" variant="green" dot /> : <Badge label="Pending" variant="gray" dot /> },
              { key: 'reported', header: 'Reported', render: r => r.reported ? <Badge label="Yes" variant="green" dot /> : <Badge label="Pending" variant="gray" dot /> },
            ]} data={selected.shifts.map((s, i) => ({ ...s, id: String(i) }))} pageSize={10} />
          </SectionCard>

          <SectionCard title="Depot Office Roster">
            <DataTable columns={[
              { key: 'role', header: 'Role' },
              { key: 'morning', header: 'Morning', render: r => r.morning || '—' },
              { key: 'afternoon', header: 'Afternoon', render: r => r.afternoon || '—' },
            ]} data={selected.roster.map((r, i) => ({ ...r, id: String(i) }))} pageSize={10} />
          </SectionCard>

          <SectionCard title="All Imported Schedules">
            <DataTable columns={[
              { key: 'depotName', header: 'Depot', sortable: true },
              { key: 'date', header: 'Date', render: r => fmtDate(r.date) },
              { key: 'shifts', header: 'Shifts', render: r => r.shifts.length },
              { key: 'workers', header: 'Workers', render: r => r.shifts.reduce((s: number, sh) => s + sh.workers.length, 0) },
            ]} data={schedules} pageSize={8}
              actions={r => <Btn onClick={() => setSelectedId(r.id)} variant={r.id === selectedId ? 'primary' : 'ghost'}>View</Btn>} />
          </SectionCard>
        </>
      )}
    </div>
  )
}
