import { useState, useEffect, useCallback } from 'react'
import { JobsheetApi, computeJobsheetFinancials } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'

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
function fmtDate(d: string) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' }) }

function StatCard({ label, value, sub, color = '#1565C0' }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
      <p className="text-3xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

export default function AccountingLedgerPanel() {
  const confirmed = useLive(() => JobsheetApi.confirmed())
  const rows = confirmed.map(j => ({ jobsheet: j, f: computeJobsheetFinancials(j) }))

  const totalPay = rows.reduce((s, r) => s + r.f.cashAmount + r.f.eftAmount, 0)
  const totalBalance = rows.reduce((s, r) => s + r.f.adminFee, 0)
  const totalInvoice = rows.reduce((s, r) => s + r.f.invoiceAmount, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">OpHelp Accounting Ledger</h2>
      <p className="text-xs text-gray-400 -mt-4">
        Transport/Material/Admin/Other are tracked as single amounts rather than split by cash/EFT — only team
        labour pay differentiates cash vs EFT per member, since the source spec doesn't define how the other
        categories are paid out.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ledgered Jobsheets" value={rows.length} />
        <StatCard label="Total Pay" value={fmtMoney(totalPay)} color="#2E7D32" />
        <StatCard label="OpHelp Balance (Profit)" value={fmtMoney(totalBalance)} color="#C48A00" />
        <StatCard label="Total Invoice Value" value={fmtMoney(totalInvoice)} color="#1565C0" />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Ledger</h3></div>
        <div className="p-6">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="text-5xl mb-3">📒</div>
              <p className="font-semibold text-gray-600">No confirmed Jobsheets yet</p>
              <p className="text-sm text-gray-400 mt-1">Jobsheets appear here once Operation Office confirms them and assigns a serial number.</p>
            </div>
          ) : (
            <DataTable columns={[
              { key: 'date', header: 'Date', render: (r: typeof rows[0]) => fmtDate(r.jobsheet.date), sortable: true },
              { key: 'jobDetail', header: 'Job Detail', render: (r: typeof rows[0]) => r.jobsheet.jobDetail },
              { key: 'foremen', header: 'Foremen', render: (r: typeof rows[0]) => r.jobsheet.payments.filter(p => p.role === 'foreman').length },
              { key: 'workers', header: 'Workers', render: (r: typeof rows[0]) => r.jobsheet.payments.filter(p => p.role === 'worker').length },
              { key: 'serial', header: 'Serial No.', render: (r: typeof rows[0]) => <span className="font-mono text-xs">{r.jobsheet.serialNumber}</span> },
              { key: 'payCash', header: 'Pay Cash', render: (r: typeof rows[0]) => fmtMoney(r.f.cashAmount) },
              { key: 'payEft', header: 'Pay EFT', render: (r: typeof rows[0]) => fmtMoney(r.f.eftAmount) },
              { key: 'transport', header: 'Transport', render: (r: typeof rows[0]) => fmtMoney(r.jobsheet.transportAmount) },
              { key: 'material', header: 'Material', render: (r: typeof rows[0]) => fmtMoney(r.f.materialAmount) },
              { key: 'admin', header: 'Admin', render: (r: typeof rows[0]) => fmtMoney(r.f.adminFee) },
              { key: 'other', header: 'Other', render: (r: typeof rows[0]) => fmtMoney(r.jobsheet.otherAmount) },
              { key: 'sixX', header: '6X Reward', render: (r: typeof rows[0]) => fmtMoney(r.f.sixXRewardAmount) },
              { key: 'labourTotal', header: 'Labour Total', render: (r: typeof rows[0]) => fmtMoney(r.jobsheet.contractedLabourTotal) },
              { key: 'balance', header: 'OpHelp Balance', render: (r: typeof rows[0]) => <span className="font-semibold text-green-700">{fmtMoney(r.f.adminFee)}</span> },
              { key: 'invoice', header: 'Invoice Amount', render: (r: typeof rows[0]) => <span className="font-semibold">{fmtMoney(r.f.invoiceAmount)}</span> },
            ]} data={rows.map((r, i) => ({ ...r, id: String(i) }))} searchable
              searchFn={(r: typeof rows[0], q: string) => `${r.jobsheet.jobDetail} ${r.jobsheet.serialNumber ?? ''}`.toLowerCase().includes(q)}
              pageSize={12} />
          )}
        </div>
      </div>
    </div>
  )
}
