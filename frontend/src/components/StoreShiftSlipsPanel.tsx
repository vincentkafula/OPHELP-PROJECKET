import { useState, useEffect, useCallback } from 'react'
import { JobsheetApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

function StatCard({ label, value, color = '#F57F17' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

/** Read-only view for Store of the bags/gloves issued/returned/used data
 * foremen record on each Jobsheet's shift slip (§3.8/3.11 of the field-ops spec). */
export default function StoreShiftSlipsPanel() {
  const jobsheets = useLive(() => JobsheetApi.list())

  const totals = jobsheets.reduce((acc, j) => ({
    bagsIssued: acc.bagsIssued + j.bagsIssued, bagsReturned: acc.bagsReturned + j.bagsReturned, bagsUsed: acc.bagsUsed + j.bagsUsed,
    glovesIssued: acc.glovesIssued + j.glovesIssued, glovesReturned: acc.glovesReturned + j.glovesReturned, glovesUsed: acc.glovesUsed + j.glovesUsed,
  }), { bagsIssued: 0, bagsReturned: 0, bagsUsed: 0, glovesIssued: 0, glovesReturned: 0, glovesUsed: 0 })

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Shift Slips — Bags & Gloves</h2>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard label="Bags Issued" value={totals.bagsIssued} />
        <StatCard label="Bags Returned" value={totals.bagsReturned} />
        <StatCard label="Bags Used" value={totals.bagsUsed} />
        <StatCard label="Gloves Issued" value={totals.glovesIssued} />
        <StatCard label="Gloves Returned" value={totals.glovesReturned} />
        <StatCard label="Gloves Used" value={totals.glovesUsed} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Shift Slips</h3></div>
        <div className="p-6">
          {jobsheets.length === 0 ? (
            <p className="text-sm text-gray-400">No shift slips recorded yet.</p>
          ) : (
            <DataTable columns={[
              { key: 'date', header: 'Date', render: j => fmtDate(j.date), sortable: true },
              { key: 'jobDetail', header: 'Job Detail' },
              { key: 'foreman', header: 'Foreman', render: j => j.payments.find(p => p.role === 'foreman')?.name ?? '—' },
              { key: 'bagsIssued', header: 'Bags Issued' },
              { key: 'bagsReturned', header: 'Bags Returned' },
              { key: 'bagsUsed', header: 'Bags Used' },
              { key: 'glovesIssued', header: 'Gloves Issued' },
              { key: 'glovesReturned', header: 'Gloves Returned' },
              { key: 'glovesUsed', header: 'Gloves Used' },
            ]} data={jobsheets} searchable searchFn={(j, q) => j.jobDetail.toLowerCase().includes(q)} pageSize={12} />
          )}
        </div>
      </div>
    </div>
  )
}
