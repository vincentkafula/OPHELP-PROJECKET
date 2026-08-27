import { useState, useEffect, useCallback } from 'react'
import { MonthlyInvoiceApi, PartnerShopApi, deriveJobsheetTotals } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Select } from './shared/FormField'
import type { PartnerShop } from '@/lib/types'

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
function fmtMonth(m: string) {
  const [y, mo] = m.split('-')
  return new Date(Number(y), Number(mo) - 1, 1).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
}
function currentMonth() { return new Date().toISOString().slice(0, 7) }

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
function Btn({ onClick, children, variant = 'ghost', disabled = false }: {
  onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost'; disabled?: boolean
}) {
  const cls = variant === 'primary' ? 'bg-blue-700 hover:bg-blue-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
  return <button onClick={onClick} disabled={disabled} className={`${cls} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors disabled:opacity-40`}>{children}</button>
}

interface MonthlyInvoicePanelProps {
  mode: 'office' | 'partner'
  partnerShopId?: string // required for mode='partner'
  currentUserName?: string
}

export default function MonthlyInvoicePanel({ mode, partnerShopId, currentUserName }: MonthlyInvoicePanelProps) {
  const partnerShops = useLive(() => PartnerShopApi.list())
  const [selectedPartnerId, setSelectedPartnerId] = useState(partnerShopId ?? '')
  const [month, setMonth] = useState(currentMonth())

  const activePartnerId = mode === 'partner' ? partnerShopId : selectedPartnerId
  const finalizedAll = useLive(() => MonthlyInvoiceApi.list())
  const finalized = activePartnerId ? finalizedAll.filter(m => m.partnerShopId === activePartnerId) : []
  const pending = activePartnerId ? MonthlyInvoiceApi.pendingForMonth(activePartnerId, month) : { jobsheets: [], total: 0 }

  function finalize() {
    if (!activePartnerId) return
    MonthlyInvoiceApi.finalize(activePartnerId, month, currentUserName)
  }

  const partnerOptions = partnerShops.map((p: PartnerShop) => ({ value: p.id, label: p.name }))
  const partnerName = partnerShops.find((p: PartnerShop) => p.id === activePartnerId)?.name

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-800">{mode === 'partner' ? 'My Monthly Invoice' : 'Monthly Invoices'}</h2>
        <div className="flex gap-2">
          {mode === 'office' && (
            <div className="w-56">
              <Select label="" value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)}
                options={partnerOptions} placeholder="Select a partner…" />
            </div>
          )}
          <input type="month" value={month} onChange={e => setMonth(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white outline-none focus:border-blue-500" />
        </div>
      </div>

      {!activePartnerId ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
          <div className="text-5xl mb-3">🧾</div>
          <p className="font-semibold text-gray-600">Select a partner to view their monthly invoice</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard label={`Pending — ${fmtMonth(month)}`} value={fmtMoney(pending.total)} sub={`${pending.jobsheets.length} Jobsheet(s)`} color="#C48A00" />
            <StatCard label="Finalized Invoices" value={finalized.length} color="#1565C0" />
            <StatCard label="Total Finalized Value" value={fmtMoney(finalized.reduce((s, m) => s + m.totalAmount, 0))} color="#2E7D32" />
          </div>

          {mode === 'office' && (
            <SectionCard title={`Pending Jobsheets — ${fmtMonth(month)}${partnerName ? ` — ${partnerName}` : ''}`}>
              {pending.jobsheets.length === 0 ? (
                <p className="text-sm text-gray-400">No confirmed, un-invoiced Jobsheets for this partner in this month.</p>
              ) : (
                <>
                  <ul className="space-y-1 text-sm mb-4">
                    {pending.jobsheets.map(j => (
                      <li key={j.id} className="flex justify-between">
                        <span>{j.data.task || j.data.area} <span className="text-gray-400 font-mono text-xs">{j.serialNumber}</span></span>
                        <span>{fmtMoney(deriveJobsheetTotals(j.data).invoiceAmount)}</span>
                      </li>
                    ))}
                  </ul>
                  <Btn onClick={finalize} variant="primary">Finalize {fmtMonth(month)} Invoice ({fmtMoney(pending.total)})</Btn>
                </>
              )}
            </SectionCard>
          )}

          <SectionCard title="Finalized Monthly Invoices">
            {finalized.length === 0 ? (
              <p className="text-sm text-gray-400">No finalized monthly invoices yet.</p>
            ) : (
              <DataTable columns={[
                { key: 'month', header: 'Month', render: m => fmtMonth(m.month), sortable: true },
                { key: 'jobsheetIds', header: 'Jobsheets', render: m => m.jobsheetIds.length },
                { key: 'totalAmount', header: 'Total', render: m => fmtMoney(m.totalAmount) },
                { key: 'finalizedAt', header: 'Finalized', render: m => new Date(m.finalizedAt).toLocaleDateString('en-ZA') },
              ]} data={finalized} pageSize={12} />
            )}
          </SectionCard>
        </>
      )}
    </div>
  )
}
