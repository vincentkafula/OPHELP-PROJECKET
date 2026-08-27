import { useState, useEffect, useCallback } from 'react'
import { OasysCheckApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Badge } from './shared/Badge'
import type { OasysCheck } from '@/lib/types'

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
function fmtDate(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d
  return dt.toLocaleDateString('en-ZA', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
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

export default function OasysChecksPanel() {
  const checks = useLive(() => OasysCheckApi.list())
  const summary = useLive(() => OasysCheckApi.summary())
  const [showUnbalancedOnly, setShowUnbalancedOnly] = useState(false)
  const [detail, setDetail] = useState<OasysCheck | null>(null)

  const filtered = showUnbalancedOnly ? checks.filter(c => !c.balanced) : checks

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">OASys Reconciliation</h2>
        <div className="flex gap-2">
          <Btn onClick={() => setShowUnbalancedOnly(false)} variant={!showUnbalancedOnly ? 'primary' : 'ghost'}>All Weeks</Btn>
          <Btn onClick={() => setShowUnbalancedOnly(true)} variant={showUnbalancedOnly ? 'primary' : 'ghost'}>Unbalanced Only</Btn>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Weeks Checked" value={summary.totalWeeks} />
        <StatCard label="Balanced" value={summary.balancedWeeks} color="#2E7D32" />
        <StatCard label="Unbalanced" value={summary.unbalancedWeeks} color={summary.unbalancedWeeks ? '#C62828' : '#2E7D32'} />
        <StatCard label="Net Difference" value={fmtMoney(summary.totalDifference)} color="#C48A00" />
      </div>

      <SectionCard title={showUnbalancedOnly ? 'Unbalanced Weeks' : 'Weekly Checks'}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">{showUnbalancedOnly ? '✅' : '📊'}</div>
            <p className="font-semibold text-gray-600">{showUnbalancedOnly ? 'No unbalanced weeks' : 'No checks imported yet'}</p>
            {!showUnbalancedOnly && <p className="text-sm text-gray-400 mt-1">Import a Checking OASys workbook via the backend's importer.</p>}
          </div>
        ) : (
          <DataTable columns={[
            { key: 'weekStart', header: 'Week', render: r => `${fmtDate(r.weekStart)} – ${fmtDate(r.weekEnd)}` },
            { key: 'sourceSheet', header: 'Sheet' },
            { key: 'labelA', header: 'Total A', render: r => `${r.labelA}: ${fmtMoney(r.totalA)}` },
            { key: 'labelB', header: 'Total B', render: r => `${r.labelB}: ${fmtMoney(r.totalB)}` },
            { key: 'balanced', header: 'Status', render: r => r.balanced
              ? <Badge label="Balanced" variant="green" dot />
              : <Badge label="Discrepancy" variant="red" dot /> },
          ]} data={filtered} searchable
            searchFn={(r, q) => `${r.sourceSheet} ${r.labelA} ${r.labelB}`.toLowerCase().includes(q)}
            pageSize={12}
            actions={r => <Btn onClick={() => setDetail(r)}>View</Btn>} />
        )}
      </SectionCard>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Week of ${fmtDate(detail.weekStart)}` : ''} size="lg"
        footer={<Btn onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              {detail.balanced ? <Badge label="Balanced" variant="green" dot /> : <Badge label="Discrepancy" variant="red" dot />}
            </div>
            <div className="flex justify-between"><span className="text-gray-500">Sheet</span><span>{detail.sourceSheet}</span></div>
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2">Day</th>
                    <th className="text-right px-3 py-2">{detail.labelA}</th>
                    <th className="text-right px-3 py-2">{detail.labelB}</th>
                    <th className="text-right px-3 py-2">Difference</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.dailyChecks.map((d, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2">{fmtDate(d.date)}</td>
                      <td className="text-right px-3 py-2">{d.a != null ? fmtMoney(d.a) : '—'}</td>
                      <td className="text-right px-3 py-2">{d.b != null ? fmtMoney(d.b) : '—'}</td>
                      <td className={`text-right px-3 py-2 font-medium ${Math.abs(d.difference) > 0.01 ? 'text-red-600' : 'text-gray-400'}`}>{fmtMoney(d.difference)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200 font-semibold">
                    <td className="px-3 py-2">Total</td>
                    <td className="text-right px-3 py-2">{fmtMoney(detail.totalA)}</td>
                    <td className="text-right px-3 py-2">{fmtMoney(detail.totalB)}</td>
                    <td className="text-right px-3 py-2">{fmtMoney(detail.totalA - detail.totalB)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {detail.sourceFile && <p className="text-xs text-gray-400">Source: {detail.sourceFile}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
