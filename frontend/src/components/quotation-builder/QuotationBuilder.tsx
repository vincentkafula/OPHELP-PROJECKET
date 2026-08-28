import { useMemo, useState } from 'react'
import TaskSheetModal, { emptyTaskSheet, type TaskSheetFormData } from './TaskSheetModal'
import JobsheetModal from './JobsheetModal'
import SummarySheetModal from './SummarySheetModal'
import InvoiceModal from './InvoiceModal'
import type { OperationStream, PaymentTerms } from '@/lib/types'

const STREAM_LABELS: Record<OperationStream, string> = { pre_school: 'Pre-School', school: 'School', technical_services: 'Technical Services' }

const fmt = (n: number) => 'R ' + (isFinite(n) ? n : 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const todayDisplay = () => new Date().toLocaleDateString('en-ZA', { day: '2-digit', month: 'short', year: 'numeric' })

export interface QuotationBuilderSubmitPayload {
  numWorkers: number; numForemen: number; numSupervisors: number
  workerRate: number; foremanRate: number; supervisorRate: number
  taskDetails: string; locationAddress: string; locationLat?: number; locationLng?: number
  stream: OperationStream; paymentTerms: PaymentTerms
}

interface Props {
  fromName: string
  onSubmit: (payload: QuotationBuilderSubmitPayload) => void
  onCancel: () => void
  submitting?: boolean
}

const emptyForm = {
  numWorkers: '2', numForemen: '1', numSupervisors: '0',
  workerRate: '', foremanRate: '', supervisorRate: '',
  considerations: '', locationAddress: '', locationLat: '', locationLng: '',
  stream: 'school' as OperationStream, paymentTerms: 'upfront' as PaymentTerms,
}

const fieldCls = 'w-full text-sm px-2.5 py-2 border rounded-[2px]'
const fieldStyle = { fontFamily: "'IBM Plex Sans', sans-serif", background: '#FBF9F3', borderColor: '#CFC7AF', color: '#1C2A28' }
const labelStyle = { fontSize: '0.74rem', fontWeight: 500, color: '#48605B', marginBottom: '5px', display: 'block' as const }

export default function QuotationBuilder({ fromName, onSubmit, onCancel, submitting }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [taskSheetOpen, setTaskSheetOpen] = useState(false)
  const [docModal, setDocModal] = useState<'jobsheet' | 'summary' | 'invoice' | null>(null)
  const [taskSheetComplete, setTaskSheetComplete] = useState(false)
  const [taskSheetSummary, setTaskSheetSummary] = useState('')
  const [taskSheetData, setTaskSheetData] = useState<TaskSheetFormData>(emptyTaskSheet())
  const [attention, setAttention] = useState(false)

  const change = (field: keyof typeof form, value: string) => setForm(f => ({ ...f, [field]: value }))

  const foremen = Number(form.numForemen) || 0
  const workers = Number(form.numWorkers) || 0
  const supervisors = Number(form.numSupervisors) || 0
  const foremanRate = Number(form.foremanRate) || 0
  const workerRate = Number(form.workerRate) || 0
  const supervisorRate = Number(form.supervisorRate) || 0

  const rows = useMemo(() => {
    const r: { role: string; rate: number; qty: number; total: number }[] = []
    if (foremen > 0) r.push({ role: 'Foreman', rate: foremanRate, qty: foremen, total: foremanRate * foremen })
    if (workers > 0) r.push({ role: 'Workers', rate: workerRate, qty: workers, total: workerRate * workers })
    if (supervisors > 0) r.push({ role: 'Operation Supervisors', rate: supervisorRate, qty: supervisors, total: supervisorRate * supervisors })
    return r
  }, [foremen, workers, supervisors, foremanRate, workerRate, supervisorRate])

  const subtotal = rows.reduce((s, r) => s + r.total, 0)
  const admin = subtotal * 0.20
  const vat = (subtotal + admin) * 0.14
  const total = subtotal + admin + vat

  const openTaskSheet = () => setTaskSheetOpen(true)
  const saveTaskSheet = (summary: string, data: TaskSheetFormData) => {
    setTaskSheetSummary(summary)
    setTaskSheetData(data)
    setTaskSheetComplete(true)
    setTaskSheetOpen(false)
  }

  const reset = () => {
    setForm(emptyForm)
    setTaskSheetComplete(false)
    setTaskSheetSummary('')
    setTaskSheetData(emptyTaskSheet())
  }

  const handleSubmit = () => {
    if (!taskSheetComplete) {
      setAttention(true)
      setTimeout(() => setAttention(false), 900)
      document.getElementById('qb-tasksheet-trigger')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!form.locationAddress.trim()) return

    const combinedDetails = [
      taskSheetSummary,
      form.considerations && `Considerations: ${form.considerations}`,
    ].filter(Boolean).join('\n\n')

    onSubmit({
      numWorkers: workers, numForemen: foremen, numSupervisors: supervisors,
      workerRate, foremanRate, supervisorRate,
      taskDetails: combinedDetails, locationAddress: form.locationAddress,
      locationLat: form.locationLat ? Number(form.locationLat) : undefined,
      locationLng: form.locationLng ? Number(form.locationLng) : undefined,
      stream: form.stream, paymentTerms: form.paymentTerms,
    })
  }

  return (
    <div className="fixed inset-0 z-[90] overflow-y-auto py-6 px-4" style={{ background: 'rgba(28,42,40,0.35)' }}>
      <div className="max-w-[1400px] mx-auto" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>
        <div style={{ background: '#EFEBDF', border: '1px solid #CFC7AF' }}>
          {/* Header */}
          <div className="flex items-baseline justify-between gap-4 px-6 py-5 flex-wrap" style={{ borderBottom: '1px solid #CFC7AF' }}>
            <div>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#7C5A1E', display: 'block', marginBottom: 4 }}>
                OPHELP Projekte · Partner Dashboard
              </span>
              <h1 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '1.5rem', color: '#1C2A28', margin: 0 }}>Quotation Builder</h1>
            </div>
            <div className="flex gap-2.5 flex-wrap">
              <button
                onClick={() => setDocModal('jobsheet')}
                className="px-4 py-2.5 text-xs uppercase tracking-wide rounded-[2px]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #1C2A28', color: '#1C2A28', background: 'none' }}
              >View Jobsheet</button>
              <button
                onClick={() => setDocModal('summary')}
                className="px-4 py-2.5 text-xs uppercase tracking-wide rounded-[2px]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #1C2A28', color: '#1C2A28', background: 'none' }}
              >View Summary Sheet</button>
              <button
                onClick={() => setDocModal('invoice')}
                className="px-4 py-2.5 text-xs uppercase tracking-wide rounded-[2px]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #1C2A28', color: '#1C2A28', background: 'none' }}
              >View Invoice</button>
              <button
                onClick={onCancel}
                className="px-4 py-2.5 text-xs uppercase tracking-wide rounded-[2px]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #1C2A28', color: '#1C2A28', background: 'none' }}
              >Cancel</button>
              <button
                onClick={reset}
                className="px-4 py-2.5 text-xs uppercase tracking-wide rounded-[2px]"
                style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #1C2A28', color: '#1C2A28', background: 'none' }}
              >Clear form</button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2.5 text-xs uppercase tracking-wide rounded-[2px] disabled:opacity-50"
                style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #A97D2C', color: '#FBF9F3', background: '#A97D2C' }}
              >{submitting ? 'Submitting…' : 'Submit quotation request'}</button>
            </div>
          </div>

          <div className="grid" style={{ gridTemplateColumns: 'minmax(320px, 400px) 1fr' }}>
            {/* ================= FORM SIDE ================= */}
            <div className="px-6 py-6" style={{ borderRight: '1px dashed #48605B', background: '#E4DFD0' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#48605B', marginBottom: 12 }}>Task</div>

              <div className="mb-3.5">
                <label style={labelStyle}>
                  Task detail <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.58rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9B3B2E', fontWeight: 600 }}>required — opens Task Sheet</span>
                </label>
                <button
                  id="qb-tasksheet-trigger"
                  type="button"
                  onClick={openTaskSheet}
                  className="w-full flex items-center gap-2.5 text-left text-sm px-3 py-3.5 rounded-[2px] transition-colors"
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif", color: '#48605B', background: '#FBF9F3',
                    border: taskSheetComplete ? '1.5px solid #5C7266' : '1.5px dashed #A97D2C',
                    animation: attention ? 'qb-shake 0.4s ease 2' : undefined,
                  }}
                >
                  <span className="text-lg flex-shrink-0">📄</span>
                  <span className="flex-1 leading-snug" style={taskSheetComplete ? { color: '#1C2A28', fontWeight: 500 } : undefined}>
                    {taskSheetComplete
                      ? `Task Sheet completed — "${taskSheetData.shiftTitle}" (${taskSheetData.tasks.length} task${taskSheetData.tasks.length === 1 ? '' : 's'}). Click to review or edit.`
                      : 'Click to open the Task Sheet and enter task detail'}
                  </span>
                  <span className="flex-shrink-0" style={{ color: '#7C5A1E' }}>→</span>
                </button>
              </div>

              <div className="mb-3.5">
                <label style={labelStyle}>Considerations</label>
                <textarea className={fieldCls} style={{ ...fieldStyle, minHeight: 56, resize: 'vertical' }} value={form.considerations} onChange={e => change('considerations', e.target.value)} placeholder="Access, timing, site conditions, safety notes" />
              </div>
              <div className="mb-3.5">
                <label style={labelStyle}>Location address *</label>
                <input className={fieldCls} style={fieldStyle} value={form.locationAddress} onChange={e => change('locationAddress', e.target.value)} placeholder="Site address" />
              </div>
              <div className="flex gap-2.5 mb-3.5">
                <div className="flex-1">
                  <label style={labelStyle}>Latitude (optional)</label>
                  <input className={fieldCls} style={fieldStyle} value={form.locationLat} onChange={e => change('locationLat', e.target.value)} placeholder="Pin on map" />
                </div>
                <div className="flex-1">
                  <label style={labelStyle}>Longitude (optional)</label>
                  <input className={fieldCls} style={fieldStyle} value={form.locationLng} onChange={e => change('locationLng', e.target.value)} />
                </div>
              </div>

              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#48605B', margin: '22px 0 12px' }}>Costing</div>
              <div style={{ background: '#FBF9F3', border: '1px solid #CFC7AF', padding: '14px 14px 16px', marginBottom: 6 }}>
                {[
                  { key: 'numForemen', rateKey: 'foremanRate', label: 'Foreman' },
                  { key: 'numWorkers', rateKey: 'workerRate', label: 'Workers' },
                  { key: 'numSupervisors', rateKey: 'supervisorRate', label: 'Operation Supervisors' },
                ].map(item => (
                  <div key={item.key} className="py-3" style={{ borderBottom: '1px solid #CFC7AF' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#7C5A1E', marginBottom: 8 }}>{item.label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block mb-1" style={{ fontSize: '0.66rem', color: '#48605B' }}>No. required</label>
                        <input type="number" min="0" className="w-full text-sm px-2 py-1.5 border rounded-[2px]" style={{ borderColor: '#CFC7AF', background: '#fff' }}
                          value={(form as any)[item.key]} onChange={e => change(item.key as keyof typeof form, e.target.value)} />
                      </div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: '0.66rem', color: '#48605B' }}>Rate (R)</label>
                        <input type="number" min="0" className="w-full text-sm px-2 py-1.5 border rounded-[2px]" style={{ borderColor: '#CFC7AF', background: '#fff' }}
                          value={(form as any)[item.rateKey]} onChange={e => change(item.rateKey as keyof typeof form, e.target.value)} placeholder="0.00" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#48605B', marginTop: 10, lineHeight: 1.5 }}>
                Item cost = Rate × No. required. Subtotal, 20% admin fee, 14% VAT and the quotation total are calculated automatically on the right — as an indicative estimate. The Operation Office confirms the final amount during approval.
              </div>

              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <div>
                  <label style={labelStyle}>Payment terms</label>
                  <select className={fieldCls} style={fieldStyle} value={form.paymentTerms} onChange={e => change('paymentTerms', e.target.value)}>
                    <option value="upfront">Upfront</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Operation stream</label>
                  <select className={fieldCls} style={fieldStyle} value={form.stream} onChange={e => change('stream', e.target.value)}>
                    <option value="pre_school">Pre-School</option>
                    <option value="school">School</option>
                    <option value="technical_services">Technical Services</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ================= DOCUMENT PREVIEW SIDE ================= */}
            <div style={{ background: '#FBF9F3' }}>
              <div className="px-10 py-9">
                <div className="flex justify-between items-start gap-5 pb-4 mb-5 flex-wrap" style={{ borderBottom: '2px solid #1C2A28' }}>
                  <div className="flex gap-3.5 items-start">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0" style={{ border: '2px solid #A97D2C', fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '0.9rem', color: '#7C5A1E' }}>OP</div>
                    <div>
                      <p style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '1.1rem', color: '#1C2A28', margin: '0 0 2px' }}>OPHELP Projekte</p>
                      <p style={{ fontStyle: 'italic', fontSize: '0.76rem', color: '#48605B', margin: '0 0 6px' }}>Uitreikbediening na mense in nood in Kaapstad — Outreach ministry to people in need in Cape Town</p>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.66rem', lineHeight: 1.6, color: '#48605B' }}>
                        PO Box 910, Parow 7499 &nbsp;·&nbsp; Tel 021 930 8055 &nbsp;·&nbsp; Fax 021 930 7690<br />
                        ophelp.operations@straatwerk.org.za<br />
                        NPO 003-276 &nbsp;·&nbsp; PBO 930008075
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', color: '#48605B', lineHeight: 1.9, whiteSpace: 'nowrap' }}>
                    Date: <b style={{ color: '#1C2A28' }}>{todayDisplay()}</b><br />
                    Serial No.: <b style={{ color: '#1C2A28' }}>Assigned on approval</b><br />
                    From: <b style={{ color: '#1C2A28' }}>{fromName || '—'}</b>
                  </div>
                </div>

                <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 700, fontSize: '1.4rem', color: '#1C2A28', margin: '0 0 20px', display: 'flex', alignItems: 'baseline', gap: 12 }}>
                  <span style={{ width: 24, height: 3, background: '#A97D2C', display: 'inline-block' }} />
                  Quotation &amp; Cleaning Plan
                </h2>

                <DocRow label="Task detail" value={taskSheetSummary} />
                <DocRow label="Considerations" value={form.considerations} />
                <DocRow label="Location" value={form.locationAddress} />
                <DocRow label="Payment terms" value={form.paymentTerms} capitalize />
                <DocRow label="Stream" value={STREAM_LABELS[form.stream]} />

                <div className="flex items-center gap-2.5" style={{ margin: '30px 0 10px' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#48605B' }}>Costing</span>
                  <span className="flex-1 h-px" style={{ background: '#CFC7AF' }} />
                </div>
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="text-left pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#48605B', borderBottom: '1px solid #1C2A28' }}>Item</th>
                      <th className="text-right pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#48605B', borderBottom: '1px solid #1C2A28' }}>Unit cost</th>
                      <th className="text-right pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#48605B', borderBottom: '1px solid #1C2A28' }}>No. of units</th>
                      <th className="text-right pb-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.06em', textTransform: 'uppercase', color: '#48605B', borderBottom: '1px solid #1C2A28' }}>Item cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr><td colSpan={4} className="py-2" style={{ color: '#B4AC97', fontStyle: 'italic' }}>No costing items entered yet</td></tr>
                    ) : rows.map(r => (
                      <tr key={r.role}>
                        <td className="py-2" style={{ fontWeight: 600, color: '#1C2A28', borderBottom: '1px solid #CFC7AF' }}>{r.role}</td>
                        <td className="py-2 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace", borderBottom: '1px solid #CFC7AF' }}>{fmt(r.rate)}</td>
                        <td className="py-2 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace", borderBottom: '1px solid #CFC7AF' }}>{r.qty}</td>
                        <td className="py-2 text-right" style={{ fontFamily: "'IBM Plex Mono', monospace", borderBottom: '1px solid #CFC7AF' }}>{fmt(r.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="ml-auto mt-3.5" style={{ maxWidth: 320 }}>
                  <TotalsRow label="Subtotal" value={fmt(subtotal)} />
                  <TotalsRow label="Admin fee (20%)" value={fmt(admin)} />
                  <TotalsRow label="VAT (14%)" value={fmt(vat)} />
                  <TotalsRow label="Quotation total" value={fmt(total)} grand />
                </div>

                <div className="mt-8 pt-4" style={{ borderTop: '1px solid #CFC7AF' }}>
                  <h4 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#48605B', margin: '0 0 8px' }}>Quotation conditions</h4>
                  <p style={{ fontSize: '0.78rem', lineHeight: 1.65, color: '#48605B', margin: '0 0 14px' }}>
                    In the case of an extensive job to be done, it is often difficult to predict exactly what it requires to complete the job. Since our service is a non-profit inspired operation, we do not build into a quote a profit margin to cover for unforeseen expenses. The quotation represents predicted actual costs. It is our policy that if the job eventually costs less than the quoted cost, we will invoice you for the actual cost, not the quoted cost. And, in performing the job, if the actual cost runs higher than the quoted cost, we will negotiate a revised cost with you before incurring expenses above the quoted cost.
                  </p>
                  <h4 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#48605B', margin: '0 0 8px' }}>Payment conditions</h4>
                  <ul className="pl-4 m-0" style={{ fontSize: '0.78rem', lineHeight: 1.75, color: '#48605B' }}>
                    <li>Event organisers: all labour to be paid in advance, the balance on subsequent invoice.</li>
                    <li>Clients without credit arrangements: all labour to be paid in advance, the balance on subsequent invoice.</li>
                    <li>Clients with credit arrangements: payment directly on submitted invoice.</li>
                  </ul>
                </div>

                <div className="mt-8 pt-4 text-center" style={{ borderTop: '2px solid #1C2A28' }}>
                  <div style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontSize: '0.85rem', color: '#1C2A28' }}>Die liefde van Christus dring ons</div>
                  <div style={{ fontSize: '0.72rem', color: '#48605B', marginTop: 2 }}>The love of Christ compels us</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TaskSheetModal
        open={taskSheetOpen}
        onClose={() => setTaskSheetOpen(false)}
        onSave={saveTaskSheet}
        initial={taskSheetData}
      />

      <JobsheetModal
        open={docModal === 'jobsheet'}
        onClose={() => setDocModal(null)}
        onNavigate={(which) => setDocModal(which)}
      />
      <SummarySheetModal
        open={docModal === 'summary'}
        onClose={() => setDocModal(null)}
        onNavigate={(which) => setDocModal(which)}
      />
      <InvoiceModal
        open={docModal === 'invoice'}
        onClose={() => setDocModal(null)}
        onNavigate={(which) => setDocModal(which)}
      />

      <style>{`@keyframes qb-shake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-3px);} 75%{transform:translateX(3px);} }`}</style>
    </div>
  )
}

function DocRow({ label, value, capitalize }: { label: string; value?: string; capitalize?: boolean }) {
  return (
    <dl className="grid gap-1.5 mb-2.5" style={{ gridTemplateColumns: '130px 1fr', fontSize: '0.88rem' }}>
      <dt style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: '#5C7266', paddingTop: 2 }}>{label}</dt>
      <dd className="m-0" style={{ color: value ? '#1C2A28' : '#9C9583', fontStyle: value ? 'normal' : 'italic', lineHeight: 1.55, whiteSpace: 'pre-wrap', textTransform: capitalize ? 'capitalize' : 'none' }}>
        {value || 'Not yet entered'}
      </dd>
    </dl>
  )
}

function TotalsRow({ label, value, grand }: { label: string; value: string; grand?: boolean }) {
  return (
    <div
      className="flex justify-between py-1.5"
      style={{
        fontSize: grand ? '1.05rem' : '0.85rem', fontFamily: "'IBM Plex Mono', monospace",
        borderBottom: grand ? 'none' : '1px solid #CFC7AF',
        borderTop: grand ? '2px solid #1C2A28' : 'none',
        marginTop: grand ? 4 : 0, paddingTop: grand ? 12 : 6,
        fontWeight: grand ? 600 : 400,
      }}
    >
      <span style={{ fontFamily: grand ? "'Fraunces', serif" : "'IBM Plex Sans', sans-serif", color: grand ? '#1C2A28' : '#48605B', fontSize: grand ? '0.92rem' : '0.8rem', fontWeight: grand ? 600 : 400 }}>{label}</span>
      <span style={{ color: grand ? '#7C5A1E' : 'inherit' }}>{value}</span>
    </div>
  )
}
