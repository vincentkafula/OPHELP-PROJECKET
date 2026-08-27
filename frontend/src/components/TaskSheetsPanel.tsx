import { useState, useEffect, useCallback } from 'react'
import { TaskSheetApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Badge } from './shared/Badge'
import GrandParadeTaskSheet from './GrandParadeTaskSheet'
import type { TaskSheet, TaskSheetData } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

const STATUS_VARIANTS: Record<TaskSheet['status'], 'gray' | 'green'> = { draft: 'gray', submitted: 'green' }
const STATUS_LABELS: Record<TaskSheet['status'], string> = { draft: 'Draft', submitted: 'Submitted' }

function StatCard({ label, value, color = '#E65100' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
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
  const cls = variant === 'primary' ? 'bg-orange-700 hover:bg-orange-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  return <button onClick={onClick} className={`${cls} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

/** Foreman's real Grand Parade Task Sheet — only ones Day Admin has
 * issued to this person via the Document Library appear here; a foreman
 * cannot create their own. */
export default function TaskSheetsPanel({ currentUserName }: { currentUserName: string }) {
  const all = useLive(() => TaskSheetApi.list())
  const mine = all.filter(t => t.issuedTo === currentUserName)

  const [openId, setOpenId] = useState<string | null>(null)
  const open = openId ? mine.find(t => t.id === openId) : null

  function handleSave(data: TaskSheetData) {
    if (open) TaskSheetApi.saveData(open.id, data)
  }
  function submit(id: string) { TaskSheetApi.submit(id); setOpenId(null) }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Grand Parade Task Sheets</h2>

      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Issued To Me" value={mine.length} />
        <StatCard label="Submitted" value={mine.filter(t => t.status === 'submitted').length} color="#2E7D32" />
      </div>

      <SectionCard title="Task Sheets">
        {mine.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🏛️</div>
            <p className="font-semibold text-gray-600">No Task Sheets yet</p>
            <p className="text-sm text-gray-400 mt-1">Day Admin issues a Task Sheet to you from the Document Library.</p>
          </div>
        ) : (
          <DataTable columns={[
            { key: 'date', header: 'Date', render: (t: TaskSheet) => t.data.meta.date || '—', sortable: true },
            { key: 'senior', header: 'Senior Leader', render: (t: TaskSheet) => t.data.meta.senior || '—' },
            { key: 'junior', header: 'Junior Leader', render: (t: TaskSheet) => t.data.meta.junior || '—' },
            { key: 'status', header: 'Status', render: (t: TaskSheet) => <Badge label={STATUS_LABELS[t.status]} variant={STATUS_VARIANTS[t.status]} dot /> },
          ]} data={mine} pageSize={10}
            actions={(t: TaskSheet) => (
              <div className="flex gap-1">
                <Btn onClick={() => setOpenId(t.id)}>Open</Btn>
                {t.status === 'draft' && <Btn onClick={() => submit(t.id)} variant="primary">Submit</Btn>}
              </div>
            )} />
        )}
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto py-8" onClick={e => { if (e.target === e.currentTarget) setOpenId(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-[95%] p-4">
            <div className="flex items-center justify-between px-2 pb-2">
              <Badge label={STATUS_LABELS[open.status]} variant={STATUS_VARIANTS[open.status]} dot />
              <button onClick={() => setOpenId(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close ✕</button>
            </div>
            <GrandParadeTaskSheet
              initialData={open.data}
              readOnly={open.status === 'submitted'}
              onSave={open.status === 'draft' ? handleSave : undefined}
              footerExtra={open.status === 'draft' && <Btn onClick={() => submit(open.id)} variant="primary">Submit</Btn>}
            />
          </div>
        </div>
      )}
    </div>
  )
}
