import { useState, useRef } from 'react'
import type { JobSheetData, JobSheetParticipantRow as ParticipantRow, JobSheetFixedRow as FixedRow, JobSheetAccRow as AccRow } from '@/lib/types'
export type { JobSheetData }

// ── Tokens — monochrome serif facsimile palette, matching the partner-
// facing JobsheetModal template (black borders/text on white, no fills). ──
const C = {
  navy: '#1C2A28', navyDark: '#0F1817',
  green: '#1C2A28', greenDark: '#1C2A28',
  blueLight: '#FFFFFF', blueMid: '#1C2A28',
  orange: '#1C2A28', orangeLight: '#FFFFFF',
  purple: '#1C2A28', purpleLight: '#FFFFFF',
  teal: '#1C2A28', tealLight: '#FFFFFF',
  line: '#1C2A28', ink: '#1C2A28', muted: '#5C5C5C',
  paper: '#FFFFFF', bgPage: '#EDEBE3',
}

function mkId() { return Math.random().toString(36).slice(2, 10) }
function mkPRow(): ParticipantRow { return { id: mkId(), name: '', adv: '', ret: '', team: '', paid: '', foreman: '', worker: '' } }
function mkFixed(): FixedRow { return { adv: '', ret: '', num: '', paid: '', foreman: '', paymaster: '' } }
function mkAcc(): AccRow { return { total: '', c: '', e: '', xtra: '', rewrd: '', transport: '', material: '', other: '', adminfee: '' } }

/** A blank JobSheetData record — the same shape Day Admin's Document
 * Library issues to a foreman before they fill it in. */
export function blankJobSheetData(): JobSheetData {
  const today = new Date()
  const dayNamesLocal = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return {
    meta: { day: dayNamesLocal[today.getDay()], date: today.toISOString().slice(0, 10), timeSlot: '07:00-11:00', details: '', partner: 'OPHELP' },
    refLeft: ['', '', ''], refRight: ['', '', '', '', '', ''],
    fixedRows: { taxi: mkFixed(), other: mkFixed(), otherDetails: '' },
    taonga: { adv: '', ret: '', team: '', paid: '110', foreman: '', worker: '' },
    participantRows: [mkPRow(), mkPRow(), mkPRow(), mkPRow()],
    payments: { cashPaid: '', cashBy: '', eft: '' },
    accounts: { acc1: mkAcc(), acc2: mkAcc() },
    area: '', task: '', ceSubtotal: '', invoiceTotal: '', invoices: '',
    consumables: {
      bag: { issued: '', returned: '', used: '', others: '', total: '' },
      glove: { issued: '', returned: '', used: '', total: '', client2: '' },
    },
  }
}

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

// ── Shared cell input ─────────────────────────────────────────────────────────
function CellInput({ value, onChange, placeholder, style = {} }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholder={placeholder}
      style={{
        fontFamily: "Georgia, 'Times New Roman', serif",
        fontSize: 12.5,
        color: C.ink,
        border: 'none',
        background: focused ? '#FFF7D6' : 'transparent',
        width: '100%',
        outline: 'none',
        padding: '4px 5px',
        textAlign: 'center',
        transition: 'background 0.15s',
        ...style,
      }}
    />
  )
}

// ── Main component ────────────────────────────────────────────────────────────
interface JobSheetProps {
  defaultSite?: string
  defaultDate?: string
  defaultTimeSlot?: string
  /** Pre-fill the sheet from a previously-saved record (Operation Office
   * review, or resuming a draft). */
  initialData?: JobSheetData
  /** Called with the sheet's current data — wired to the "Save" button. */
  onSave?: (data: JobSheetData) => void
  /** Disables all inputs — used for a read-only confirmed view. */
  readOnly?: boolean
  /** Extra buttons (e.g. Office's "Confirm & Assign Serial No.") rendered
   * alongside Clear/Print/Export/Save. */
  footerExtra?: React.ReactNode
}

export default function JobSheet({ defaultSite = '', defaultDate = '', defaultTimeSlot = '', initialData, onSave, readOnly = false, footerExtra }: JobSheetProps) {
  const today = new Date()
  const todayStr = defaultDate || today.toISOString().slice(0, 10)
  const todayDay = dayNames[today.getDay()]

  // ── State ─────────────────────────────────────────────────────────────────
  const [refLeft, setRefLeft] = useState<[string, string, string]>(initialData?.refLeft ?? ['', '', ''])
  const [refRight, setRefRight] = useState<[string, string, string, string, string, string]>(initialData?.refRight ?? ['', '', '', '', '', ''])
  const [day, setDay] = useState(initialData?.meta.day ?? todayDay)
  const [date, setDate] = useState(initialData?.meta.date ?? todayStr)
  const [timeSlot, setTimeSlot] = useState(initialData?.meta.timeSlot ?? (defaultTimeSlot || '07:00-11:00'))
  const [details, setDetails] = useState(initialData?.meta.details ?? '')
  const [partner, setPartner] = useState(initialData?.meta.partner ?? 'OPHELP')

  const [taxi, setTaxi] = useState<FixedRow>(initialData?.fixedRows.taxi ?? mkFixed())
  const [other, setOther] = useState<FixedRow>(initialData?.fixedRows.other ?? mkFixed())
  const [otherDetails, setOtherDetails] = useState(initialData?.fixedRows.otherDetails ?? '')

  const [taonga, setTaonga] = useState(initialData?.taonga ?? { adv: '', ret: '', team: '', paid: '110', foreman: '', worker: '' })
  const [participants, setParticipants] = useState<ParticipantRow[]>(initialData?.participantRows ?? [mkPRow(), mkPRow(), mkPRow(), mkPRow()])

  const [cashPaid, setCashPaid] = useState(initialData?.payments.cashPaid ?? '')
  const [cashBy, setCashBy] = useState(initialData?.payments.cashBy ?? '')
  const [eft, setEft] = useState(initialData?.payments.eft ?? '')

  const [acc1, setAcc1] = useState<AccRow>(initialData?.accounts.acc1 ?? mkAcc())
  const [acc2, setAcc2] = useState<AccRow>(initialData?.accounts.acc2 ?? mkAcc())

  const [area, setArea] = useState(initialData?.area ?? defaultSite)
  const [task, setTask] = useState(initialData?.task ?? '')
  const [ceSubtotal, setCeSubtotal] = useState(initialData?.ceSubtotal ?? '')
  const [invoiceTotal, setInvoiceTotal] = useState(initialData?.invoiceTotal ?? '')
  const [invoices, setInvoices] = useState(initialData?.invoices ?? '')

  const [bagIssued, setBagIssued] = useState(initialData?.consumables.bag.issued ?? '')
  const [bagReturned, setBagReturned] = useState(initialData?.consumables.bag.returned ?? '')
  const [bagUsed, setBagUsed] = useState(initialData?.consumables.bag.used ?? '')
  const [bagOthers, setBagOthers] = useState(initialData?.consumables.bag.others ?? '')
  const [bagTotal, setBagTotal] = useState(initialData?.consumables.bag.total ?? '')
  const [gloveIssued, setGloveIssued] = useState(initialData?.consumables.glove.issued ?? '')
  const [gloveReturned, setGloveReturned] = useState(initialData?.consumables.glove.returned ?? '')
  const [gloveUsed, setGloveUsed] = useState(initialData?.consumables.glove.used ?? '')
  const [gloveTotal, setGloveTotal] = useState(initialData?.consumables.glove.total ?? '')
  const [client2, setClient2] = useState(initialData?.consumables.glove.client2 ?? '')

  const sheetRef = useRef<HTMLDivElement>(null)

  // ── Helpers ───────────────────────────────────────────────────────────────
  function addRow() { setParticipants(p => [...p, mkPRow()]) }
  function removeRow(id: string) { setParticipants(p => p.filter(r => r.id !== id)) }
  function patchRow(id: string, key: keyof ParticipantRow, val: string) {
    setParticipants(p => p.map(r => r.id === id ? { ...r, [key]: val } : r))
  }

  function clearForm() {
    if (!confirm('Clear all entered data on this jobsheet?')) return
    setRefLeft(['', '', '']); setRefRight(['', '', '', '', '', ''])
    setDay(todayDay); setDate(todayStr); setTimeSlot('07:00-11:00'); setDetails(''); setPartner('OPHELP')
    setTaxi(mkFixed()); setOther(mkFixed()); setOtherDetails('')
    setTaonga({ adv: '', ret: '', team: '', paid: '110', foreman: '', worker: '' })
    setParticipants([mkPRow(), mkPRow(), mkPRow(), mkPRow()])
    setCashPaid(''); setCashBy(''); setEft('')
    setAcc1(mkAcc()); setAcc2(mkAcc())
    setArea(defaultSite); setTask(''); setCeSubtotal(''); setInvoiceTotal(''); setInvoices('')
    setBagIssued(''); setBagReturned(''); setBagUsed(''); setBagOthers(''); setBagTotal('')
    setGloveIssued(''); setGloveReturned(''); setGloveUsed(''); setGloveTotal(''); setClient2('')
  }

  function buildData(): JobSheetData {
    return {
      meta: { day, date, timeSlot, details, partner },
      refLeft, refRight,
      fixedRows: { taxi, other, otherDetails },
      taonga,
      participantRows: participants,
      payments: { cashPaid, cashBy, eft },
      accounts: { acc1, acc2 },
      area, task, ceSubtotal, invoiceTotal, invoices,
      consumables: { bag: { issued: bagIssued, returned: bagReturned, used: bagUsed, others: bagOthers, total: bagTotal }, glove: { issued: gloveIssued, returned: gloveReturned, used: gloveUsed, total: gloveTotal, client2 } },
    }
  }

  function exportData() {
    const data = buildData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `jobsheet-${date || 'export'}.json`; a.click()
    URL.revokeObjectURL(url)
  }

  function saveSheet() { onSave?.(buildData()) }

  function printSheet() { window.print() }

  // ── Shared styles ─────────────────────────────────────────────────────────
  const thBase: React.CSSProperties = { fontSize: 11.5, fontWeight: 800, padding: '7px 5px', textAlign: 'center', color: '#fff', border: `1px solid ${C.line}` }
  const tdBase: React.CSSProperties = { border: `1px solid ${C.line}`, verticalAlign: 'middle', padding: 0 }
  const metaLabel: React.CSSProperties = { fontWeight: 700, fontSize: 13, color: C.navy, whiteSpace: 'nowrap' }

  const AccCols = ['C', 'E', 'Xtra', '6xrewrd', 'Transport', 'Material', 'Other', 'Adminfee']
  const acc1Keys: (keyof AccRow)[] = ['c', 'e', 'xtra', 'rewrd', 'transport', 'material', 'other', 'adminfee']

  return (
    <div style={{ background: C.bgPage, padding: '0 0 40px', fontFamily: "Georgia, 'Times New Roman', serif", color: C.ink }}>

      {/* Print-only reset */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>

      {/* Sheet */}
      <div ref={sheetRef} style={{ maxWidth: 1080, margin: '0 auto', background: C.paper, border: `1px solid ${C.navy}`, borderRadius: 0, overflow: 'hidden', opacity: readOnly ? 0.92 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', padding: '18px 22px 14px', borderBottom: `2px solid ${C.navy}` }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, color: C.navy, letterSpacing: 1 }}>OPHELP</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>Version 200725</div>
          <div style={{ margin: '12px auto 0', maxWidth: 520, border: `3px double ${C.navy}`, borderRadius: 0, padding: '6px 10px', fontWeight: 800, fontSize: 17, color: C.navy }}>
            OPHELP Data Capturer
          </div>
          <div style={{ fontSize: 20, fontWeight: 900, color: C.navy, marginTop: 12, letterSpacing: 1 }}>JOBSHEET</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4, color: C.ink }}>PAID OUT FROM WHAT WAS RECEIVED AS DONATIONS</div>
        </div>

        {/* Ref boxes + Day/Date */}
        <div style={{ display: 'flex', alignItems: 'stretch', borderBottom: `2px solid ${C.navy}` }}>
          {/* Ref left (3 boxes) */}
          <div style={{ display: 'flex', borderRight: `2px solid ${C.navy}` }}>
            {refLeft.map((v, i) => (
              <input key={i} maxLength={2} value={v}
                onChange={e => { const n = [...refLeft] as typeof refLeft; n[i] = e.target.value; setRefLeft(n) }}
                style={{ width: 34, height: 34, textAlign: 'center', fontWeight: 700, color: C.navy, fontFamily: 'inherit', fontSize: 12.5, border: 'none', borderRight: i < 2 ? `1.5px solid ${C.navy}` : 'none', outline: 'none', background: 'transparent' }}
              />
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRight: `2px solid ${C.navy}` }}>
            <label style={metaLabel}>Day:</label>
            <CellInput value={day} onChange={setDay} placeholder="e.g. Monday" style={{ textAlign: 'left', fontWeight: 700 }} />
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px' }}>
            <label style={metaLabel}>Date:</label>
            <input type="date" value={date} onChange={e => { setDate(e.target.value); setDay(dayNames[new Date(e.target.value).getDay()]) }}
              style={{ fontFamily: 'inherit', fontSize: 12.5, color: C.ink, border: 'none', background: 'transparent', outline: 'none', padding: '4px 5px', flex: 1, fontWeight: 700 }}
            />
          </div>

          {/* Ref right (6 boxes) */}
          <div style={{ display: 'flex', borderLeft: `2px solid ${C.navy}` }}>
            {refRight.map((v, i) => (
              <input key={i} maxLength={2} value={v}
                onChange={e => { const n = [...refRight] as typeof refRight; n[i] = e.target.value; setRefRight(n) }}
                style={{ width: 34, height: 34, textAlign: 'center', borderLeft: `1.5px solid ${C.navy}`, fontWeight: 700, color: C.navy, fontFamily: 'inherit', fontSize: 12.5, border: 'none', outline: 'none', background: 'transparent', borderRight: i < 5 ? `1.5px solid ${C.navy}` : 'none' }}
              />
            ))}
          </div>
        </div>

        {/* Time Slot / Details / Partner */}
        <div style={{ display: 'flex', borderBottom: `3px solid ${C.navy}` }}>
          {[
            { label: 'Time Slot', value: timeSlot, set: setTimeSlot, placeholder: 'e.g. 07:00-11:00' },
            { label: 'Details', value: details, set: setDetails, placeholder: 'Advanced / Returned notes' },
            { label: 'Partner', value: partner, set: setPartner, placeholder: '' },
          ].map((f, i) => (
            <div key={f.label} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', borderRight: i < 2 ? `2px solid ${C.navy}` : 'none' }}>
              <label style={metaLabel}>{f.label}</label>
              <CellInput value={f.value} onChange={f.set} placeholder={f.placeholder} style={{ textAlign: 'left', fontWeight: 700 }} />
            </div>
          ))}
        </div>

        {/* Main table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '19%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '19.5%' }} />
            <col style={{ width: '19.5%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...thBase, background: C.navy }}>Details</th>
              <th style={{ ...thBase, background: C.blueMid }}>Advanced</th>
              <th style={{ ...thBase, background: C.blueMid }}>Returned</th>
              <th style={{ ...thBase, background: C.navy }}>Number of<br />persons / items</th>
              <th style={{ ...thBase, background: C.green }} rowSpan={2}>Paid<br />out</th>
              <th style={{ ...thBase, background: C.blueMid }} colSpan={2}>Signed</th>
            </tr>
            <tr>
              <th style={{ ...thBase, background: C.navy }} />
              <th style={{ ...thBase, background: C.blueMid }} />
              <th style={{ ...thBase, background: C.blueMid }} />
              <th style={{ ...thBase, background: C.navy }} />
              <th style={{ ...thBase, background: C.blueLight, color: C.navy }}>Foreman</th>
              <th style={{ ...thBase, background: C.blueLight, color: C.navy }}>Paymaster</th>
            </tr>
          </thead>
          <tbody>
            {/* TAXI row */}
            <FixedRowTR label="TAXI Fare" labelColor={C.orange} row={taxi} setRow={setTaxi} />
            {/* Other row */}
            <FixedRowTR label="Other" labelColor={C.purple} row={other} setRow={setOther} />
            {/* Details of other */}
            <tr>
              <td colSpan={7} style={{ padding: '8px 10px', border: `1px solid ${C.line}` }}>
                <div style={{ fontWeight: 700, fontSize: 12.5, color: C.purple, marginBottom: 4 }}>Details of other</div>
                <textarea value={otherDetails} onChange={e => setOtherDetails(e.target.value)}
                  placeholder="Write details here..."
                  style={{ width: '100%', height: 44, resize: 'none', fontFamily: 'inherit', fontSize: 12.5, color: C.ink, border: 'none', background: 'transparent', outline: 'none', padding: '2px 4px' }}
                />
              </td>
            </tr>

            {/* Subhead: Shift members */}
            <tr>
              <th style={{ ...thBase, background: C.teal, textAlign: 'left', paddingLeft: 10 }} rowSpan={2}>
                Shift members
                <span style={{ fontWeight: 600, fontSize: 10.5, display: 'block', marginTop: 3 }}>
                  <b>F.</b>=Foreman &nbsp;<b>W.</b>=Worker &nbsp;<b>R.</b>=Recruit
                </span>
              </th>
              <th style={{ ...thBase, background: C.blueMid }} rowSpan={2}>Advanced</th>
              <th style={{ ...thBase, background: C.blueMid }} rowSpan={2}>Returned</th>
              <th style={{ ...thBase, background: C.navy }} rowSpan={2}>Leader/Participant<br />Team No.</th>
              <th style={{ ...thBase, background: C.green }} rowSpan={2}>Paid<br />out</th>
              <th style={{ ...thBase, background: C.blueMid }} colSpan={2}>Signed</th>
            </tr>
            <tr>
              <th style={{ ...thBase, background: C.blueLight, color: C.navy }}>Foreman</th>
              <th style={{ ...thBase, background: C.blueLight, color: C.navy }}>Worker/Paymaster</th>
            </tr>

            {/* Taonga row (fixed) */}
            <tr>
              <td style={{ ...tdBase, fontWeight: 800, fontSize: 14, padding: '9px 10px', color: C.greenDark }}>
                <CellInput value="Taonga Kusure" onChange={() => {}} style={{ fontWeight: 800, textAlign: 'left', color: C.greenDark }} />
              </td>
              <td style={tdBase}><CellInput value={taonga.adv} onChange={v => setTaonga(t => ({ ...t, adv: v }))} /></td>
              <td style={tdBase}><CellInput value={taonga.ret} onChange={v => setTaonga(t => ({ ...t, ret: v }))} /></td>
              <td style={tdBase}><CellInput value={taonga.team} onChange={v => setTaonga(t => ({ ...t, team: v }))} /></td>
              <td style={tdBase}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 5 }}>
                  <span style={{ fontSize: 10.5, fontWeight: 800, color: C.greenDark }}>EFT</span>
                  <CellInput value={taonga.paid} onChange={v => setTaonga(t => ({ ...t, paid: v }))} style={{ fontWeight: 800 }} />
                </div>
              </td>
              <td style={tdBase}><CellInput value={taonga.foreman} onChange={v => setTaonga(t => ({ ...t, foreman: v }))} /></td>
              <td style={tdBase}><CellInput value={taonga.worker} onChange={v => setTaonga(t => ({ ...t, worker: v }))} /></td>
            </tr>

            {/* Dynamic participant rows */}
            {participants.map((p) => (
              <tr key={p.id}>
                <td style={{ ...tdBase, padding: '9px 10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <CellInput value={p.name} onChange={v => patchRow(p.id, 'name', v)} placeholder="Participant / item" style={{ textAlign: 'left', fontWeight: 700, flex: 1 }} />
                    <button onClick={() => removeRow(p.id)} className="no-print"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#B23A3A', fontSize: 14, lineHeight: 1, padding: '0 2px', opacity: 0.5 }}
                      title="Remove row">×</button>
                  </div>
                </td>
                <td style={tdBase}><CellInput value={p.adv} onChange={v => patchRow(p.id, 'adv', v)} /></td>
                <td style={tdBase}><CellInput value={p.ret} onChange={v => patchRow(p.id, 'ret', v)} /></td>
                <td style={tdBase}><CellInput value={p.team} onChange={v => patchRow(p.id, 'team', v)} /></td>
                <td style={tdBase}><CellInput value={p.paid} onChange={v => patchRow(p.id, 'paid', v)} /></td>
                <td style={tdBase}><CellInput value={p.foreman} onChange={v => patchRow(p.id, 'foreman', v)} /></td>
                <td style={tdBase}><CellInput value={p.worker} onChange={v => patchRow(p.id, 'worker', v)} /></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Add row control */}
        <div className="no-print" style={{ padding: '8px 14px', background: '#F5F3EC', borderBottom: `2px solid ${C.navy}` }}>
          <button onClick={addRow}
            style={{ border: `1px dashed ${C.navy}`, background: '#fff', color: C.navy, fontWeight: 700, fontSize: 12, padding: '6px 12px', borderRadius: 0, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#EDEBE3')}
            onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
          >+ Add participant row</button>
        </div>

        {/* Cash / Electronic */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ border: `1px solid ${C.line}`, padding: '9px 12px', fontWeight: 800, fontSize: 14, color: C.navy, width: '38%' }}>Cash paid out:</td>
              <td style={{ border: `1px solid ${C.line}`, padding: '9px 12px', width: '12%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                  <span>R</span>
                  <CellInput value={cashPaid} onChange={setCashPaid} placeholder="nil" />
                </div>
              </td>
              <td style={{ border: `1px solid ${C.line}`, padding: '9px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700 }}>by:</span>
                  <CellInput value={cashBy} onChange={setCashBy} placeholder="Name" style={{ textAlign: 'left' }} />
                  <span style={{ fontSize: 10, color: C.muted, marginLeft: 'auto', whiteSpace: 'nowrap' }}>Name</span>
                </div>
              </td>
            </tr>
            <tr>
              <td style={{ border: `1px solid ${C.line}`, borderBottom: `3px solid ${C.navy}`, padding: '9px 12px', fontWeight: 800, fontSize: 14, color: C.greenDark }}>Electronic via EFT</td>
              <td style={{ border: `1px solid ${C.line}`, borderBottom: `3px solid ${C.navy}`, padding: '9px 12px' }} colSpan={2}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                  <span>R</span>
                  <CellInput value={eft} onChange={setEft} placeholder="0.00" style={{ textAlign: 'left' }} />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Account 1 */}
        <AccTable label="TOTAL for Account 1" accName={<>Account 1<br /><b>OPHELP Salaries</b></>} bgRow="acc1" cols={AccCols} keys={acc1Keys} acc={acc1} setAcc={setAcc1} />

        {/* Account 2 */}
        <AccTable label="TOTAL for Account 2" accName="Account 2" bgRow="acc2" cols={AccCols} keys={acc1Keys} acc={acc2} setAcc={setAcc2} />

        {/* Area / Task + C E Subtotal / Invoice */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.line}` }}>
          <div style={{ flex: 1, background: C.orangeLight, padding: '10px 16px' }}>
            {[{ label: 'Area:', value: area, set: setArea }, { label: 'Task:', value: task, set: setTask }].map((f, i) => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: i === 0 ? 14 : 0, fontWeight: 700, fontSize: 13.5, color: C.ink }}>
                <label style={{ whiteSpace: 'nowrap' }}>{f.label}</label>
                <input value={f.value} onChange={e => f.set(e.target.value)}
                  style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: `1.5px solid ${C.line}`, outline: 'none', fontFamily: 'inherit', fontSize: 13, color: C.ink, padding: '2px 4px' }}
                />
              </div>
            ))}
          </div>
          <div style={{ width: '44%', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', flex: 1 }}>
              {['C', 'E'].map(lbl => (
                <div key={lbl} style={{ width: 34, borderLeft: `1px solid ${C.line}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: C.muted }}>{lbl}</div>
              ))}
              <div style={{ flex: 1, borderLeft: `1px solid ${C.line}`, padding: '6px 10px', background: C.purpleLight }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.purple }}>Subtotal</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                  <span>R</span>
                  <CellInput value={ceSubtotal} onChange={setCeSubtotal} />
                </div>
              </div>
              <div style={{ flex: 1, borderLeft: `1px solid ${C.line}`, padding: '6px 10px', background: C.purpleLight }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: C.purple }}>Invoice Total</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 800 }}>
                  <span>R</span>
                  <CellInput value={invoiceTotal} onChange={setInvoiceTotal} />
                </div>
              </div>
            </div>
            <div style={{ background: C.purple, color: '#fff', textAlign: 'center', fontWeight: 800, fontSize: 14, padding: 8, letterSpacing: 0.3, borderTop: `1px solid ${C.line}` }}>
              Invoice(s)&nbsp;
              <input value={invoices} onChange={e => setInvoices(e.target.value)}
                style={{ color: '#fff', textAlign: 'center', fontWeight: 800, display: 'inline', width: '60%', background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 13 }}
              />
            </div>
          </div>
        </div>

        {/* Bags / Glove */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['', 'Issued', 'Returned', 'Used', 'Others', 'Total', 'Client'].map((h, i) => (
                <th key={i} style={{ border: `1px solid ${C.line}`, padding: '7px 8px', textAlign: 'center', fontSize: 12, background: '#fff', color: C.ink, fontWeight: 700 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <ConsumeRow tag="Bags:" fields={[
              { label: 'Issued', value: bagIssued, set: setBagIssued },
              { label: 'Returned', value: bagReturned, set: setBagReturned },
              { label: 'Used', value: bagUsed, set: setBagUsed },
              { label: 'Others', value: bagOthers, set: setBagOthers },
            ]} total={{ label: 'Total 1', value: bagTotal, set: setBagTotal }}
              client={{ label: 'Client 1', content: <b>OPHELP Salaries</b> }} last={false}
            />
            <ConsumeRow tag="Glove:" fields={[
              { label: 'Issued', value: gloveIssued, set: setGloveIssued },
              { label: 'Returned', value: gloveReturned, set: setGloveReturned },
              { label: 'Used', value: gloveUsed, set: setGloveUsed },
              { label: '', value: '', set: () => {} },
            ]} total={{ label: 'Total 2', value: gloveTotal, set: setGloveTotal }}
              client={{ label: 'Client 2', content: <CellInput value={client2} onChange={setClient2} placeholder="Client name" style={{ textAlign: 'left' }} /> }} last={true}
            />
          </tbody>
        </table>
      </div>

      {/* Footer actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 4px 0', maxWidth: 1080, margin: '0 auto' }}>
        {!readOnly && <button onClick={clearForm} style={{ border: '1px solid #B23A3A', background: '#fff', color: '#B23A3A', borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer', fontFamily: 'inherit' }}>Clear form</button>}
        <button onClick={printSheet} style={{ border: `1px solid ${C.navy}`, background: '#fff', color: C.navy, borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer', fontFamily: 'inherit' }}>Print</button>
        <button onClick={exportData} style={{ border: `1px solid ${C.navy}`, background: '#fff', color: C.navy, borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer', fontFamily: 'inherit' }}>Export JSON</button>
        {!readOnly && onSave && <button onClick={saveSheet} style={{ background: C.navy, color: '#fff', border: `1px solid ${C.navy}`, borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer', fontFamily: 'inherit' }}>Save Jobsheet</button>}
        {footerExtra}
      </div>
    </div>
  )
}

// ── Fixed Row (Taxi / Other) ──────────────────────────────────────────────────
function FixedRowTR({ label, labelColor, row, setRow }: { label: string; labelColor: string; row: FixedRow; setRow: (r: FixedRow) => void }) {
  const tdBase: React.CSSProperties = { border: `1px solid ${C.line}`, verticalAlign: 'middle', padding: 0 }
  return (
    <tr>
      <td style={{ ...tdBase, fontWeight: 800, fontSize: 14, padding: '9px 10px', color: labelColor }}>
        <CellInput value={label} onChange={() => {}} style={{ fontWeight: 800, textAlign: 'left', color: labelColor }} />
      </td>
      <td style={tdBase}><CellInput value={row.adv} onChange={v => setRow({ ...row, adv: v })} /></td>
      <td style={tdBase}><CellInput value={row.ret} onChange={v => setRow({ ...row, ret: v })} /></td>
      <td style={tdBase}><CellInput value={row.num} onChange={v => setRow({ ...row, num: v })} /></td>
      <td style={tdBase}><CellInput value={row.paid} onChange={v => setRow({ ...row, paid: v })} /></td>
      <td style={tdBase}><CellInput value={row.foreman} onChange={v => setRow({ ...row, foreman: v })} /></td>
      <td style={tdBase}><CellInput value={row.paymaster} onChange={v => setRow({ ...row, paymaster: v })} /></td>
    </tr>
  )
}

// ── Account Table ─────────────────────────────────────────────────────────────
function AccTable({ label, accName, bgRow, cols, keys, acc, setAcc }: {
  label: string; accName: React.ReactNode; bgRow: 'acc1' | 'acc2'; cols: string[]; keys: (keyof AccRow)[]; acc: AccRow; setAcc: (a: AccRow) => void
}) {
  const bg = bgRow === 'acc1' ? C.blueLight : C.tealLight
  const nameColor = bgRow === 'acc1' ? C.navy : C.greenDark
  const lineColor = C.line
  const td: React.CSSProperties = { border: `1px solid ${lineColor}`, textAlign: 'center', verticalAlign: 'middle', padding: 2 }
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <tbody>
        <tr style={{ background: bg }}>
          <td style={{ ...td, fontWeight: 800, fontSize: 13.5, padding: 8, textAlign: 'left', color: nameColor, width: '15%' }}>{label}</td>
          <td style={{ ...td, fontWeight: 700, fontSize: 12.5, padding: 6, width: '14%', color: C.ink }}>{accName}</td>
          {cols.map(c => <th key={c} style={{ ...td, fontSize: 11, fontWeight: 700, color: C.muted, padding: '5px 3px', background: '#F5F7FA', width: '6%' }}>{c}</th>)}
        </tr>
        <tr style={{ background: bg }}>
          <td style={{ ...td, padding: 2 }}><CellInput value={acc.total} onChange={v => setAcc({ ...acc, total: v })} style={{ fontWeight: 700 }} /></td>
          <td style={td} />
          {keys.map(k => (
            <td key={k} style={{ ...td, padding: 2 }}>
              <CellInput value={acc[k]} onChange={v => setAcc({ ...acc, [k]: v })} style={{ fontWeight: 700 }} />
            </td>
          ))}
        </tr>
      </tbody>
    </table>
  )
}

// ── Consumable Row ────────────────────────────────────────────────────────────
function ConsumeRow({ tag, fields, total, client, last }: {
  tag: string
  fields: { label: string; value: string; set: (v: string) => void }[]
  total: { label: string; value: string; set: (v: string) => void }
  client: { label: string; content: React.ReactNode }
  last: boolean
}) {
  const lineColor = C.line
  const borderBottom = last ? `3px solid ${C.navy}` : `1px solid ${lineColor}`
  const td: React.CSSProperties = { border: `1px solid ${lineColor}`, padding: '7px 8px', textAlign: 'center', fontSize: 12, verticalAlign: 'top', borderBottom }
  return (
    <tr>
      <td style={{ ...td, background: C.orangeLight, fontWeight: 800, color: C.ink, textAlign: 'left', width: '9%' }}>{tag}</td>
      {fields.map((f, i) => (
        <td key={i} style={{ ...td, width: '12%' }}>
          {f.label && <span style={{ fontSize: 10.5, color: C.muted, display: 'block', marginBottom: 2 }}>{f.label}:</span>}
          {f.label && <CellInput value={f.value} onChange={f.set} />}
        </td>
      ))}
      <td style={{ ...td, background: C.tealLight, fontWeight: 800, color: C.greenDark, width: '11%' }}>
        <span style={{ fontSize: 10.5, display: 'block', color: C.greenDark }}>{total.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>R <CellInput value={total.value} onChange={total.set} /></div>
      </td>
      <td style={{ ...td, background: C.purpleLight, fontWeight: 700, color: C.purple }}>
        <span style={{ fontSize: 10.5, display: 'block', marginBottom: 2, color: C.purple, fontWeight: 600 }}>{client.label}</span>
        {client.content}
      </td>
    </tr>
  )
}
