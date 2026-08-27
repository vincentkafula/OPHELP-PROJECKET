import { useState, useEffect, useCallback } from 'react'
import { InvoiceApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Badge } from './shared/Badge'
import type { Invoice } from '@/lib/types'

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

interface InvoicesPanelProps {
  /** When set (Partner role), only invoices whose `client` matches this are shown. */
  clientFilter?: string
}

export default function InvoicesPanel({ clientFilter }: InvoicesPanelProps) {
  const all = useLive(() => InvoiceApi.list())
  const invoices = clientFilter ? all.filter(i => i.client === clientFilter) : all
  const [detail, setDetail] = useState<Invoice | null>(null)

  const totals = InvoiceApi.totals(invoices)

  function exportCsv() {
    const header = ['Document No', 'Date', 'Account', 'Client', 'Reference', 'Subtotal', 'Discount', 'Tax', 'Total']
    const rows = invoices.map(i => [i.documentNo, i.date, i.account, i.client, i.yourReference, i.subtotal.toFixed(2), i.discountAmount.toFixed(2), i.tax.toFixed(2), i.total.toFixed(2)])
    downloadCsv(clientFilter ? `invoices-${clientFilter}.csv` : 'invoices.csv', [header, ...rows])
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">{clientFilter ? `Invoices — ${clientFilter}` : 'Invoices'}</h2>
        <Btn onClick={exportCsv}>Export CSV</Btn>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Invoices" value={totals.count} />
        <StatCard label="Total Value" value={fmtMoney(totals.total)} color="#2E7D32" />
        <StatCard label="Clients" value={totals.clients} color="#1565C0" />
        <StatCard label="This Month" value={fmtMoney(InvoiceApi.monthlyTotal())} color="#C48A00" />
      </div>

      <SectionCard title="Invoice Register">
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">🧾</div>
            <p className="font-semibold text-gray-600">No invoices yet</p>
            <p className="text-sm text-gray-400 mt-1">Import an invoice register via the backend's importer.</p>
          </div>
        ) : (
          <DataTable columns={[
            { key: 'documentNo', header: 'Doc No', sortable: true },
            { key: 'date', header: 'Date', render: i => fmtDate(i.date) },
            { key: 'client', header: 'Client' },
            { key: 'account', header: 'Account' },
            { key: 'lineItems', header: 'Lines', render: i => i.lineItems.length },
            { key: 'total', header: 'Total', render: i => fmtMoney(i.total) },
            { key: 'taxType', header: 'Type', render: i => <Badge label={i.taxType} variant="purple" /> },
          ]} data={invoices} searchable
            searchFn={(i, q) => `${i.documentNo} ${i.client} ${i.account} ${i.yourReference}`.toLowerCase().includes(q)}
            pageSize={12}
            actions={i => <Btn onClick={() => setDetail(i)}>View</Btn>} />
        )}
      </SectionCard>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Invoice ${detail.documentNo}` : ''} size="lg"
        footer={<Btn onClick={() => setDetail(null)}>Close</Btn>}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div><span className="text-gray-500">Date</span><div className="font-medium">{fmtDate(detail.date)}</div></div>
              <div><span className="text-gray-500">Account</span><div className="font-medium">{detail.account}</div></div>
              <div><span className="text-gray-500">Client</span><div className="font-medium">{detail.client}</div></div>
              <div><span className="text-gray-500">Reference</span><div>{detail.yourReference || '—'}</div></div>
            </div>
            <div>
              <span className="text-gray-500 text-xs uppercase tracking-wide">Client Address</span>
              <p>{detail.clientAddress.join(', ') || '—'}</p>
            </div>
            {detail.deliverTo.length > 0 && (
              <div>
                <span className="text-gray-500 text-xs uppercase tracking-wide">Deliver To</span>
                <p>{detail.deliverTo.join(', ')}</p>
              </div>
            )}

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2">Code</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-right px-3 py-2">Tax</th>
                    <th className="text-right px-3 py-2">Nett Price</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lineItems.map((li, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-400">{li.code}</td>
                      <td className="px-3 py-2">{li.description}</td>
                      <td className="text-right px-3 py-2">{fmtMoney(li.tax)}</td>
                      <td className="text-right px-3 py-2 font-medium">{fmtMoney(li.nettPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-t border-gray-100 pt-3">
              <div className="flex justify-between"><span className="text-gray-500">Sub Total</span><span>{fmtMoney(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Discount ({detail.discountPct}%)</span><span>{fmtMoney(detail.discountAmount)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount Excl Tax</span><span>{fmtMoney(detail.amountExclTax)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>{fmtMoney(detail.tax)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1"><span>Total ({detail.taxType})</span><span>{fmtMoney(detail.total)}</span></div>
            </div>
            {detail.sourceFile && <p className="text-xs text-gray-400">Source: {detail.sourceFile}</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
