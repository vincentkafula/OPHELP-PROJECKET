import { useState, useEffect, useCallback } from 'react'
import { JobsheetApi, TaskSheetApi, UserApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Select } from './shared/FormField'
import { Badge } from './shared/Badge'
import { blankJobSheetData } from './JobSheet'
import { blankState as blankTaskSheetData } from './GrandParadeTaskSheet'
import type { Jobsheet, TaskSheet } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function fmtDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

const JS_STATUS_VARIANTS: Record<Jobsheet['status'], 'gray' | 'yellow' | 'green'> = { draft: 'gray', submitted: 'yellow', confirmed: 'green' }
const TS_STATUS_VARIANTS: Record<TaskSheet['status'], 'gray' | 'green'> = { draft: 'gray', submitted: 'green' }

function StatCard({ label, value, color = '#00838F' }: { label: string; value: string | number; color?: string }) {
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
  const cls = variant === 'primary' ? 'bg-cyan-700 hover:bg-cyan-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  return <button onClick={onClick} className={`${cls} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

/** Day Admin issues blank Jobsheets and Task Sheets to real foreman
 * accounts already registered in the system (never a typed-in / invented
 * name) — foremen only fill in what's issued to them, they can't create
 * their own from scratch. */
export default function DocumentLibraryPanel({ currentUserName }: { currentUserName: string }) {
  const jobsheets = useLive(() => JobsheetApi.list())
  const taskSheets = useLive(() => TaskSheetApi.list())
  const foremen = useLive(() => UserApi.list().filter(u => u.role === 'foreman' && u.active))

  const [issueJobsheetModal, setIssueJobsheetModal] = useState(false)
  const [issueTaskSheetModal, setIssueTaskSheetModal] = useState(false)
  const [selectedForeman, setSelectedForeman] = useState('')

  const foremanOptions = foremen.map(f => ({ value: f.name, label: f.name }))

  function issueJobsheet() {
    if (!selectedForeman) return
    JobsheetApi.create({ data: blankJobSheetData(), issuedTo: selectedForeman, issuedBy: currentUserName })
    setIssueJobsheetModal(false); setSelectedForeman('')
  }
  function issueTaskSheet() {
    if (!selectedForeman) return
    TaskSheetApi.create({ data: blankTaskSheetData(), issuedTo: selectedForeman, issuedBy: currentUserName })
    setIssueTaskSheetModal(false); setSelectedForeman('')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Document Library</h2>
        <div className="flex gap-2">
          <Btn onClick={() => setIssueJobsheetModal(true)} variant="primary">Issue Jobsheet</Btn>
          <Btn onClick={() => setIssueTaskSheetModal(true)} variant="primary">Issue Task Sheet</Btn>
        </div>
      </div>

      {foremen.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
          No active foreman accounts found in the system — add a foreman user before issuing documents.
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Jobsheets Issued" value={jobsheets.length} />
        <StatCard label="Task Sheets Issued" value={taskSheets.length} />
        <StatCard label="Awaiting Foreman" value={jobsheets.filter(j => j.status === 'draft').length + taskSheets.filter(t => t.status === 'draft').length} color="#C48A00" />
        <StatCard label="Active Foremen" value={foremen.length} color="#2E7D32" />
      </div>

      <SectionCard title="Jobsheets">
        {jobsheets.length === 0 ? (
          <p className="text-sm text-gray-400">No Jobsheets issued yet.</p>
        ) : (
          <DataTable columns={[
            { key: 'issuedTo', header: 'Issued To', render: (j: Jobsheet) => j.issuedTo || '—' },
            { key: 'date', header: 'Date', render: (j: Jobsheet) => j.data.meta.date || '—', sortable: true },
            { key: 'task', header: 'Task', render: (j: Jobsheet) => j.data.task || j.data.area || '—' },
            { key: 'serialNumber', header: 'Serial No.', render: (j: Jobsheet) => j.serialNumber || '—' },
            { key: 'status', header: 'Status', render: (j: Jobsheet) => <Badge label={j.status} variant={JS_STATUS_VARIANTS[j.status]} dot /> },
          ]} data={jobsheets} searchable searchFn={(j: Jobsheet, q: string) => `${j.issuedTo ?? ''} ${j.data.task}`.toLowerCase().includes(q)} pageSize={10} />
        )}
      </SectionCard>

      <SectionCard title="Task Sheets">
        {taskSheets.length === 0 ? (
          <p className="text-sm text-gray-400">No Task Sheets issued yet.</p>
        ) : (
          <DataTable columns={[
            { key: 'issuedTo', header: 'Issued To', render: (t: TaskSheet) => t.issuedTo || '—' },
            { key: 'date', header: 'Date', render: (t: TaskSheet) => t.data.meta.date || '—', sortable: true },
            { key: 'senior', header: 'Senior Leader', render: (t: TaskSheet) => t.data.meta.senior || '—' },
            { key: 'status', header: 'Status', render: (t: TaskSheet) => <Badge label={t.status} variant={TS_STATUS_VARIANTS[t.status]} dot /> },
          ]} data={taskSheets} searchable searchFn={(t: TaskSheet, q: string) => `${t.issuedTo ?? ''}`.toLowerCase().includes(q)} pageSize={10} />
        )}
      </SectionCard>

      <Modal open={issueJobsheetModal} onClose={() => setIssueJobsheetModal(false)} title="Issue Jobsheet"
        footer={<><Btn onClick={() => setIssueJobsheetModal(false)}>Cancel</Btn><Btn onClick={issueJobsheet} variant="primary">Issue</Btn></>}>
        <Select label="Foreman" required value={selectedForeman} onChange={e => setSelectedForeman(e.target.value)} options={foremanOptions} placeholder="Select a foreman…" />
      </Modal>
      <Modal open={issueTaskSheetModal} onClose={() => setIssueTaskSheetModal(false)} title="Issue Task Sheet"
        footer={<><Btn onClick={() => setIssueTaskSheetModal(false)}>Cancel</Btn><Btn onClick={issueTaskSheet} variant="primary">Issue</Btn></>}>
        <Select label="Foreman" required value={selectedForeman} onChange={e => setSelectedForeman(e.target.value)} options={foremanOptions} placeholder="Select a foreman…" />
      </Modal>
    </div>
  )
}
