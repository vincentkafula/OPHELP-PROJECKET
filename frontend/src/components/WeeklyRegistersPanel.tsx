import { useState, useEffect, useCallback } from 'react'
import { WeeklyRegisterApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Badge } from './shared/Badge'
import type { WeeklyRegister, WeeklyRegisterType } from '@/lib/types'

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
function fmtDay(d: string) {
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return d // plain weekday-name strings (no date) pass through as-is
  return dt.toLocaleDateString('en-ZA', { weekday: 'short', day: '2-digit', month: 'short' })
}

const TYPE_LABELS: Record<WeeklyRegisterType, string> = {
  ops_office: 'Operations Office',
  coaching_leadership: 'Coaching Leadership',
  leave_register: 'Leave Register',
  payroll_register: 'Payroll Register',
  other: 'Other',
}
const TYPE_VARIANTS: Record<WeeklyRegisterType, 'blue' | 'purple' | 'yellow' | 'green' | 'gray'> = {
  ops_office: 'blue', coaching_leadership: 'purple', leave_register: 'yellow',
  payroll_register: 'green', other: 'gray',
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
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'danger' }) {
  const cls: Record<string, string> = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(r => r.map(v => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function WeeklyRegistersPanel() {
  const registers = useLive(() => WeeklyRegisterApi.list())
  const [typeFilter, setTypeFilter] = useState<WeeklyRegisterType | 'all'>('all')
  const [detail, setDetail] = useState<WeeklyRegister | null>(null)

  const filtered = typeFilter === 'all' ? registers : registers.filter(r => r.type === typeFilter)
  const totalInvoiceValue = filtered.reduce((s, r) => s + r.totalInvoiceValue, 0)

  function exportRegisterCsv(r: WeeklyRegister) {
    const header = ['Client No', 'Label', ...r.days.map(fmtDay), 'Total']
    const rows = r.lines.map(l => [l.clientNo ?? '', l.label, ...l.amountByDay.map(v => v ?? ''), l.total.toFixed(2)])
    downloadCsv(`${r.type}-${r.payrollNo || r.id}.csv`, [header, ...rows])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">Weekly Registers</h2>
        <div className="flex flex-wrap gap-2">
          <Btn onClick={() => setTypeFilter('all')} variant={typeFilter === 'all' ? 'primary' : 'ghost'}>All</Btn>
          {(Object.keys(TYPE_LABELS) as WeeklyRegisterType[]).map(t => (
            <Btn key={t} onClick={() => setTypeFilter(t)} variant={typeFilter === t ? 'primary' : 'ghost'}>{TYPE_LABELS[t]}</Btn>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Registers" value={filtered.length} />
        <StatCard label="Total Invoice Value" value={fmtMoney(totalInvoiceValue)} color="#2E7D32" />
        <StatCard label="Latest Payroll No" value={filtered[0]?.payrollNo || '—'} color="#1565C0" />
      </div>

      <SectionCard title="Registers">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📋</div>
            <p className="font-semibold text-gray-600">No registers yet</p>
            <p className="text-sm text-gray-400 mt-1">Import one via the backend's weekly-register importer.</p>
          </div>
        ) : (
          <DataTable columns={[
            { key: 'type', header: 'Type', render: r => <Badge label={TYPE_LABELS[r.type]} variant={TYPE_VARIANTS[r.type]} dot /> },
            { key: 'title', header: 'Title' },
            { key: 'payrollNo', header: 'Payroll No' },
            { key: 'period', header: 'Period', render: r => r.periodFrom || r.periodTo ? `${r.periodFrom} – ${r.periodTo}` : '—' },
            { key: 'lines', header: 'Lines', render: r => r.lines.length },
            { key: 'totalInvoiceValue', header: 'Invoice Value', render: r => fmtMoney(r.totalInvoiceValue) },
          ]} data={registers.filter(r => typeFilter === 'all' || r.type === typeFilter)} searchable
            searchFn={(r, q) => `${r.title} ${r.payrollNo} ${TYPE_LABELS[r.type]}`.toLowerCase().includes(q)}
            pageSize={10}
            actions={r => <Btn onClick={() => setDetail(r)}>View</Btn>} />
        )}
      </SectionCard>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ''} size="xl"
        footer={detail && (
          <>
            <Btn onClick={() => exportRegisterCsv(detail)}>Export CSV</Btn>
            <Btn onClick={() => setDetail(null)}>Close</Btn>
          </>
        )}>
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Type</span><div><Badge label={TYPE_LABELS[detail.type]} variant={TYPE_VARIANTS[detail.type]} dot /></div></div>
              <div><span className="text-gray-500">Payroll No</span><div className="font-medium">{detail.payrollNo || '—'}</div></div>
              <div><span className="text-gray-500">Period</span><div>{detail.periodFrom} – {detail.periodTo}</div></div>
              <div><span className="text-gray-500">Prepared / Checked / Signed off</span>
                <div>{[detail.preparedBy, detail.checkedBy, detail.signedOffBy].filter(Boolean).join(' · ') || '—'}</div></div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-700 mb-2">Lines</h4>
              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50 text-gray-500">
                    <tr>
                      <th className="text-left px-3 py-2">Function / Category</th>
                      {detail.days.map((d, i) => <th key={i} className="text-right px-3 py-2 whitespace-nowrap">{fmtDay(d)}</th>)}
                      <th className="text-right px-3 py-2">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.lines.map((l, i) => (
                      <tr key={i} className="border-t border-gray-100">
                        <td className="px-3 py-2">{l.label}</td>
                        {l.amountByDay.map((v, j) => <td key={j} className="text-right px-3 py-2 text-gray-500">{v != null ? fmtMoney(v) : '—'}</td>)}
                        <td className="text-right px-3 py-2 font-semibold">{fmtMoney(l.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {detail.oasys.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">OASys Details</h4>
                <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500">
                      <tr>
                        <th className="text-left px-3 py-2">Account</th>
                        <th className="text-right px-3 py-2">Pay</th>
                        <th className="text-right px-3 py-2">Extra</th>
                        <th className="text-right px-3 py-2">Sub-Total</th>
                        <th className="text-right px-3 py-2">Admin Fee</th>
                        <th className="text-right px-3 py-2">Invoice Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detail.oasys.map((o, i) => (
                        <tr key={i} className="border-t border-gray-100">
                          <td className="px-3 py-2">{o.account}</td>
                          <td className="text-right px-3 py-2">{fmtMoney(o.pay)}</td>
                          <td className="text-right px-3 py-2">{fmtMoney(o.extra)}</td>
                          <td className="text-right px-3 py-2">{fmtMoney(o.subTotal)}</td>
                          <td className="text-right px-3 py-2">{o.adminFeePct != null ? `${o.adminFeePct}%` : '—'}</td>
                          <td className="text-right px-3 py-2 font-semibold">{fmtMoney(o.invoiceValue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-between border-t border-gray-100 pt-3">
              <span className="text-gray-500">Total Invoice Value</span>
              <span className="font-bold text-lg">{fmtMoney(detail.totalInvoiceValue)}</span>
            </div>
            {detail.sourceFile && <p className="text-xs text-gray-400">Source: {detail.sourceFile} ({detail.sourceSheet})</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
