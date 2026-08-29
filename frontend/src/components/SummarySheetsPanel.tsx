import { useState, useEffect, useCallback } from 'react'
import { SummarySheetApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Badge } from './shared/Badge'
import SummarySheet, { blankSummarySheetData } from './SummarySheet'
import type { SummarySheet as SummarySheetRecord } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

const STATUS_VARIANTS: Record<SummarySheetRecord['status'], 'gray' | 'yellow' | 'green'> = { draft: 'gray', submitted: 'yellow', confirmed: 'green' }
const STATUS_LABELS: Record<SummarySheetRecord['status'], string> = { draft: 'Draft', submitted: 'Submitted', confirmed: 'Confirmed' }

function StatCard({ label, value, color = '#00838F' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'success' }) {
  const cls: Record<string, string> = {
    primary: 'bg-teal-700 hover:bg-teal-800 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }
  return <button onClick={onClick} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

interface SummarySheetsPanelProps {
  /** 'day_admin': can create, edit drafts and submit — Day Admin is the Day
   * Supervisor who fills this in directly.
   * 'office': every Summary Sheet, can confirm a submitted one.
   * 'manager': every Summary Sheet, read-only. */
  mode: 'day_admin' | 'office' | 'manager'
  currentUserName: string
}

export default function SummarySheetsPanel({ mode, currentUserName }: SummarySheetsPanelProps) {
  const sheets = useLive(() => SummarySheetApi.list())
  const [openId, setOpenId] = useState<string | null>(null)
  const open = openId ? sheets.find(s => s.id === openId) : null

  function createNew() {
    const res = SummarySheetApi.create({ data: blankSummarySheetData(), createdBy: currentUserName })
    if (res.data) setOpenId(res.data.id)
  }
  function handleSave(data: SummarySheetRecord['data']) { if (open) SummarySheetApi.saveData(open.id, data) }
  function submit(id: string) { SummarySheetApi.submit(id); setOpenId(null) }
  function confirm(id: string) { SummarySheetApi.confirm(id, currentUserName); setOpenId(null) }

  const title = mode === 'day_admin' ? 'Summary Sheets' : mode === 'office' ? 'Summary Sheet Review' : 'Summary Sheets'

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        {mode === 'day_admin' && <Btn onClick={createNew} variant="primary">+ New Summary Sheet</Btn>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total" value={sheets.length} />
        <StatCard label="Submitted" value={sheets.filter(s => s.status === 'submitted').length} color="#C48A00" />
        <StatCard label="Confirmed" value={sheets.filter(s => s.status === 'confirmed').length} color="#2E7D32" />
      </div>

      <SectionCard title="Summary Sheets">
        {sheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🧮</div>
            <p className="font-semibold text-gray-600">No Summary Sheets yet</p>
            {mode !== 'day_admin' && <p className="text-sm text-gray-400 mt-1">Day Admin creates a Summary Sheet at the end of each day.</p>}
          </div>
        ) : (
          <DataTable columns={[
            { key: 'day', header: 'Day', render: (s: SummarySheetRecord) => s.data.day || '—', sortable: true },
            { key: 'createdBy', header: 'Created By', render: (s: SummarySheetRecord) => s.createdBy },
            { key: 'safeNo', header: 'Safe No.', render: (s: SummarySheetRecord) => s.data.safeNo || '—' },
            { key: 'status', header: 'Status', render: (s: SummarySheetRecord) => <Badge label={STATUS_LABELS[s.status]} variant={STATUS_VARIANTS[s.status]} dot /> },
          ]} data={sheets} pageSize={10}
            actions={(s: SummarySheetRecord) => (
              <div className="flex gap-1">
                <Btn onClick={() => setOpenId(s.id)}>Open</Btn>
                {mode === 'day_admin' && s.status === 'draft' && <Btn onClick={() => submit(s.id)} variant="primary">Submit</Btn>}
                {mode === 'office' && s.status === 'submitted' && <Btn onClick={() => confirm(s.id)} variant="success">Confirm</Btn>}
              </div>
            )} />
        )}
      </SectionCard>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto py-8" onClick={e => { if (e.target === e.currentTarget) setOpenId(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-[95%] p-4">
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-2">
                <Badge label={STATUS_LABELS[open.status]} variant={STATUS_VARIANTS[open.status]} dot />
                <span className="text-xs text-gray-400">Created by {open.createdBy}</span>
              </div>
              <button onClick={() => setOpenId(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close ✕</button>
            </div>
            <SummarySheet
              initialData={open.data}
              readOnly={mode !== 'day_admin' || open.status !== 'draft'}
              onSave={mode === 'day_admin' && open.status === 'draft' ? handleSave : undefined}
              footerExtra={<>
                {mode === 'day_admin' && open.status === 'draft' && <Btn onClick={() => submit(open.id)} variant="primary">Submit to Operation Office</Btn>}
                {mode === 'office' && open.status === 'submitted' && <Btn onClick={() => confirm(open.id)} variant="success">Confirm</Btn>}
              </>}
            />
          </div>
        </div>
      )}
    </div>
  )
}
