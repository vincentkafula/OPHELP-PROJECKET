import { useState, useEffect, useCallback } from 'react'
import { QuotationApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { DataTable } from './shared/DataTable'
import { Modal } from './shared/Modal'
import { Input } from './shared/FormField'
import { Badge } from './shared/Badge'
import type { Quotation, QuotationStatus } from '@/lib/types'

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

const STATUS_VARIANTS: Record<QuotationStatus, 'gray' | 'blue' | 'green' | 'red'> = {
  draft: 'gray', sent: 'blue', approved: 'green', rejected: 'red',
}
const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'Draft', sent: 'Sent', approved: 'Approved', rejected: 'Rejected',
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
function SectionCard({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800">{title}</h3>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}
function Btn({ onClick, children, variant = 'ghost' }: { onClick: () => void; children: React.ReactNode; variant?: 'primary' | 'ghost' | 'success' | 'danger' }) {
  const cls: Record<string, string> = {
    primary: 'bg-blue-700 hover:bg-blue-800 text-white',
    ghost: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  }
  return <button onClick={onClick} className={`${cls[variant]} px-3 py-1.5 text-xs rounded-lg font-medium transition-colors`}>{children}</button>
}

interface QuotationsPanelProps {
  /** Partners get a read-only, client-scoped view; Operation Office gets full management. */
  readOnly?: boolean
  /** When set (Partner role), only quotations whose `client` matches this are shown. */
  clientFilter?: string
}

export default function QuotationsPanel({ readOnly = false, clientFilter }: QuotationsPanelProps) {
  const all = useLive(() => QuotationApi.list())
  const quotations = clientFilter ? all.filter(q => q.client === clientFilter) : all
  const [detail, setDetail] = useState<Quotation | null>(null)
  const [clientDraft, setClientDraft] = useState('')

  const totalValue = quotations.reduce((s, q) => s + q.total, 0)
  const approved = quotations.filter(q => q.status === 'approved')

  function openDetail(q: Quotation) { setDetail(q); setClientDraft(q.client) }
  function saveClient() {
    if (!detail) return
    QuotationApi.setClient(detail.id, clientDraft)
    setDetail(d => (d ? { ...d, client: clientDraft } : d))
  }
  function setStatus(status: QuotationStatus) {
    if (!detail) return
    QuotationApi.setStatus(detail.id, status)
    setDetail(d => (d ? { ...d, status } : d))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-800">Quotations</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Quotations" value={quotations.length} />
        <StatCard label="Total Value" value={fmtMoney(totalValue)} color="#2E7D32" />
        <StatCard label="Approved" value={approved.length} color="#1565C0" />
        <StatCard label="Approved Value" value={fmtMoney(approved.reduce((s, q) => s + q.total, 0))} color="#C48A00" />
      </div>

      <SectionCard title={clientFilter ? `Quotations for ${clientFilter}` : 'All Quotations'}>
        {quotations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-5xl mb-3">📐</div>
            <p className="font-semibold text-gray-600">No quotations yet</p>
            {!readOnly && <p className="text-sm text-gray-400 mt-1">Import one via the backend's quotation importer.</p>}
          </div>
        ) : (
          <DataTable columns={[
            { key: 'title', header: 'Job', sortable: true },
            { key: 'client', header: 'Client', render: q => q.client || <span className="text-gray-400">Unassigned</span> },
            { key: 'lineItems', header: 'Line Items', render: q => q.lineItems.length },
            { key: 'total', header: 'Total', render: q => fmtMoney(q.total) },
            { key: 'status', header: 'Status', render: q => <Badge label={STATUS_LABELS[q.status]} variant={STATUS_VARIANTS[q.status]} dot /> },
          ]} data={quotations} searchable
            searchFn={(q, s) => `${q.title} ${q.client}`.toLowerCase().includes(s)}
            pageSize={12}
            actions={q => <Btn onClick={() => openDetail(q)}>View</Btn>} />
        )}
      </SectionCard>

      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.title ?? ''} size="lg"
        footer={detail && (
          <>
            {!readOnly && detail.status === 'draft' && <Btn onClick={() => setStatus('sent')} variant="primary">Mark Sent</Btn>}
            {!readOnly && detail.status === 'sent' && <><Btn onClick={() => setStatus('approved')} variant="success">Approve</Btn><Btn onClick={() => setStatus('rejected')} variant="danger">Reject</Btn></>}
            <Btn onClick={() => setDetail(null)}>Close</Btn>
          </>
        )}>
        {detail && (
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <Badge label={STATUS_LABELS[detail.status]} variant={STATUS_VARIANTS[detail.status]} dot />
              {readOnly ? (
                <span className="text-gray-500">{detail.client || '—'}</span>
              ) : (
                <div className="flex items-center gap-2">
                  <Input label="" value={clientDraft} onChange={e => setClientDraft(e.target.value)} placeholder="Assign a client…" />
                  <Btn onClick={saveClient} variant="primary">Save</Btn>
                </div>
              )}
            </div>

            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Description</th>
                    <th className="text-right px-3 py-2">Unit Cost</th>
                    <th className="text-right px-3 py-2">Units</th>
                    <th className="text-right px-3 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.lineItems.map((li, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2"><Badge label={li.category} variant="purple" /></td>
                      <td className="px-3 py-2">{li.description || '—'}</td>
                      <td className="text-right px-3 py-2">{li.unitCost != null ? fmtMoney(li.unitCost) : '—'}</td>
                      <td className="text-right px-3 py-2">{li.units ?? '—'}</td>
                      <td className="text-right px-3 py-2 font-medium">{fmtMoney(li.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-1 border-t border-gray-100 pt-3">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{fmtMoney(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Admin Fee</span><span>{fmtMoney(detail.adminFee)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Management Fee</span><span>{fmtMoney(detail.managementFee)}</span></div>
              <div className="flex justify-between font-bold text-base pt-1"><span>Quotation Total</span><span>{fmtMoney(detail.total)}</span></div>
            </div>
            {detail.sourceFile && <p className="text-xs text-gray-400">Source: {detail.sourceFile} ({detail.sourceSheet})</p>}
          </div>
        )}
      </Modal>
    </div>
  )
}
