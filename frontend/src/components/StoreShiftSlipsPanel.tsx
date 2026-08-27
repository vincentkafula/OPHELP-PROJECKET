import { useState, useEffect, useCallback } from 'react'
import { JobsheetApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import type { Jobsheet } from '@/lib/types'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

function num(v: string) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0 }

function StatCard({ label, value, color = '#F57F17' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
    </div>
  )
}

/** Read-only view for Store of the bags/gloves issued/returned/used data
 * foremen record on the real Jobsheet's shift-slip section (§3.8/3.11 of
 * the field-ops spec). Reads straight from JobSheet.tsx's own
 * `consumables` fields — the same free-text figures the foreman typed. */
export default function StoreShiftSlipsPanel() {
  const jobsheets = useLive(() => JobsheetApi.list())

  const totals = jobsheets.reduce((acc, j) => {
    const bag = j.data.consumables.bag, glove = j.data.consumables.glove
    return {
      bagsIssued: acc.bagsIssued + num(bag.issued), bagsReturned: acc.bagsReturned + num(bag.returned), bagsUsed: acc.bagsUsed + num(bag.used),
      glovesIssued: acc.glovesIssued + num(glove.issued), glovesReturned: acc.glovesReturned + num(glove.returned), glovesUsed: acc.glovesUsed + num(glove.used),
    }
  }, { bagsIssued: 0, bagsReturned: 0, bagsUsed: 0, glovesIssued: 0, glovesReturned: 0, glovesUsed: 0 })

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
              { key: 'date', header: 'Date', render: (j: Jobsheet) => j.data.meta.date || '—', sortable: true },
              { key: 'task', header: 'Task', render: (j: Jobsheet) => j.data.task || j.data.area || '—' },
              { key: 'foreman', header: 'Foreman', render: (j: Jobsheet) => j.data.participantRows.find(p => p.foreman)?.name || j.data.taonga.foreman || '—' },
              { key: 'bagsIssued', header: 'Bags Issued', render: (j: Jobsheet) => j.data.consumables.bag.issued || '0' },
              { key: 'bagsReturned', header: 'Bags Returned', render: (j: Jobsheet) => j.data.consumables.bag.returned || '0' },
              { key: 'bagsUsed', header: 'Bags Used', render: (j: Jobsheet) => j.data.consumables.bag.used || '0' },
              { key: 'glovesIssued', header: 'Gloves Issued', render: (j: Jobsheet) => j.data.consumables.glove.issued || '0' },
              { key: 'glovesReturned', header: 'Gloves Returned', render: (j: Jobsheet) => j.data.consumables.glove.returned || '0' },
              { key: 'glovesUsed', header: 'Gloves Used', render: (j: Jobsheet) => j.data.consumables.glove.used || '0' },
            ]} data={jobsheets} searchable searchFn={(j: Jobsheet, q: string) => `${j.data.task} ${j.data.area}`.toLowerCase().includes(q)} pageSize={12} />
          )}
        </div>
      </div>
    </div>
  )
}
