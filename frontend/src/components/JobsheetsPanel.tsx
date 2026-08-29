import { useState, useEffect, useCallback } from 'react'
import { JobsheetApi, deriveJobsheetTotals } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Badge } from './shared/Badge'
import JobSheet from './JobSheet'
import type { Jobsheet, JobSheetData } from '@/lib/types'

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

const STATUS_VARIANTS: Record<Jobsheet['status'], 'gray' | 'yellow' | 'green'> = { draft: 'gray', submitted: 'yellow', confirmed: 'green' }
const STATUS_LABELS: Record<Jobsheet['status'], string> = { draft: 'Draft', submitted: 'Submitted', confirmed: 'Confirmed' }

function StatCard({ label, value, color = '#1565C0' }: { label: string; value: string | number; color?: string }) {
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
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'success' }) {
  const cls: Record<string, string> = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
  }
  return <button onClick={onClick} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

interface JobsheetsPanelProps {
  /** 'foreman': only Jobsheets Day Admin has issued to this person, no
   * creation. 'office': every Jobsheet, for review/confirm — also no
   * creation, Jobsheets always originate from the Document Library.
   * 'view': every Jobsheet, read-only tracking (Day Admin) — confirming
   * a Jobsheet is Operation Office's job, not Day Admin's. */
  mode: 'foreman' | 'office' | 'view'
  currentUserName: string
}

export default function JobsheetsPanel({ mode, currentUserName }: JobsheetsPanelProps) {
  const all = useLive(() => JobsheetApi.list())
  const jobsheets = mode === 'foreman' ? all.filter(j => j.issuedTo === currentUserName) : all

  const [openId, setOpenId] = useState<string | null>(null)
  const open = openId ? all.find(j => j.id === openId) : null

  function handleSave(data: JobSheetData) {
    if (open) JobsheetApi.saveData(open.id, data)
  }

  function submit(id: string) { JobsheetApi.submit(id); setOpenId(null) }
  function confirm(id: string) { JobsheetApi.confirm(id, currentUserName); setOpenId(null) }

  const totalInvoiceValue = jobsheets.filter(j => j.status === 'confirmed').reduce((s, j) => s + deriveJobsheetTotals(j.data).invoiceAmount, 0)

  const title = mode === 'foreman' ? 'My Jobsheets' : mode === 'office' ? 'Jobsheet Review' : 'Jobsheets'

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">{title}</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={mode === 'foreman' ? 'Issued To Me' : 'Total Jobsheets'} value={jobsheets.length} />
        <StatCard label="Awaiting Review" value={jobsheets.filter(j => j.status === 'submitted').length} color="#C48A00" />
        <StatCard label="Confirmed" value={jobsheets.filter(j => j.status === 'confirmed').length} color="#2E7D32" />
        <StatCard label="Total Invoice Value" value={fmtMoney(totalInvoiceValue)} color="#1565C0" />
      </div>

      <SectionCard title="Jobsheets">
        {jobsheets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-600">No Jobsheets yet</p>
            {mode === 'foreman' && <p className="text-sm text-gray-400 mt-1">Day Admin issues a Jobsheet to you from the Document Library before a shift.</p>}
          </div>
        ) : (
          <DataTable columns={[
            { key: 'date', header: 'Date', render: (j: Jobsheet) => j.data.meta.date || '—', sortable: true },
            { key: 'task', header: 'Task', render: (j: Jobsheet) => j.data.task || j.data.area || '—' },
            { key: 'issuedTo', header: 'Issued To', render: (j: Jobsheet) => j.issuedTo || '—' },
            { key: 'account', header: 'Accounts', render: (j: Jobsheet) => [j.data.accounts.acc1.total, j.data.accounts.acc2.total].filter(Boolean).join(' / ') || '—' },
            { key: 'invoice', header: 'Invoice Amount', render: (j: Jobsheet) => fmtMoney(deriveJobsheetTotals(j.data).invoiceAmount) },
            { key: 'serialNumber', header: 'Serial No.', render: (j: Jobsheet) => j.serialNumber || '—' },
            { key: 'status', header: 'Status', render: (j: Jobsheet) => <Badge label={STATUS_LABELS[j.status]} variant={STATUS_VARIANTS[j.status]} dot /> },
          ]} data={jobsheets} searchable
            searchFn={(j: Jobsheet, q: string) => `${j.data.task} ${j.data.area} ${j.issuedTo ?? ''} ${j.serialNumber ?? ''}`.toLowerCase().includes(q)}
            pageSize={10}
            actions={(j: Jobsheet) => (
              <div className="flex gap-1">
                <Btn onClick={() => setOpenId(j.id)}>Open</Btn>
                {mode === 'foreman' && j.status === 'draft' && <Btn onClick={() => submit(j.id)} variant="primary">Submit</Btn>}
                {mode === 'office' && j.status === 'submitted' && <Btn onClick={() => confirm(j.id)} variant="success">Confirm</Btn>}
              </div>
            )} />
        )}
      </SectionCard>

      {/* ── Open an issued Jobsheet: real form, read-only once confirmed ── */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-start justify-center overflow-y-auto py-8" onClick={e => { if (e.target === e.currentTarget) setOpenId(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-[95%] p-4">
            <div className="flex items-center justify-between px-2 pb-2">
              <div className="flex items-center gap-2">
                <Badge label={STATUS_LABELS[open.status]} variant={STATUS_VARIANTS[open.status]} dot />
                {open.issuedTo && <span className="text-xs text-gray-400">Issued to {open.issuedTo}</span>}
              </div>
              <button onClick={() => setOpenId(null)} className="text-gray-400 hover:text-gray-600 text-sm">Close ✕</button>
            </div>
            <JobSheet
              initialData={open.data}
              readOnly={open.status === 'confirmed' || mode === 'view'}
              onSave={mode === 'foreman' && open.status === 'draft' ? handleSave : undefined}
              footerExtra={<>
                {mode === 'foreman' && open.status === 'draft' && <Btn onClick={() => submit(open.id)} variant="primary">Submit to Operation Office</Btn>}
                {mode === 'office' && open.status === 'submitted' && <Btn onClick={() => confirm(open.id)} variant="success">Confirm & Assign Serial No.</Btn>}
              </>}
            />
          </div>
        </div>
      )}
    </div>
  )
}
