import { useState, useEffect } from 'react'

// ── Fonts ──────────────────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    if (!document.getElementById('fol-fonts')) {
      const l = document.createElement('link'); l.id = 'fol-fonts'; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(l)
    }
  }, [])
}

// ── Tokens ─────────────────────────────────────────────────────────────────────
const C = {
  paper: '#F5F3EC', paperDim: '#EFEBDF', card: '#FFFFFF',
  ink: '#1B211F', inkSoft: '#4A5250', slate: '#767F7C', line: '#DDD6C4',
  teal: '#1F4A43', tealDeep: '#122E29', tealMid: '#2B5F56',
  amber: '#E2A33B', amberDeep: '#B67B1E',
  brick: '#A8452F', moss: '#3F7856',
}
const display = "'Space Grotesk',sans-serif"
const body = "'IBM Plex Sans',sans-serif"
const mono = "'IBM Plex Mono',monospace"

// ── Types ──────────────────────────────────────────────────────────────────────
interface ShiftRow { serial: string; task: string; paid: number; workers: number }
interface PettyRow { serial: string; supplier: string; desc: string; paid: number }
interface DayShift { admin: string | null; provided: number; shifts: ShiftRow[]; pettyCash: PettyRow[] }
interface WeekDay { key: string; d: string; date: string }

// ── Static data ────────────────────────────────────────────────────────────────
const WEEK: WeekDay[] = [
  { key: 'mon', d: 'Mon', date: '03 Aug' },
  { key: 'tue', d: 'Tue', date: '04 Aug' },
  { key: 'wed', d: 'Wed', date: '05 Aug' },
  { key: 'thu', d: 'Thu', date: '06 Aug' },
  { key: 'fri', d: 'Fri', date: '07 Aug' },
  { key: 'sat', d: 'Sat', date: '08 Aug' },
  { key: 'sun', d: 'Sun', date: '09 Aug' },
]

const DAY_NAMES: Record<string, string> = {
  mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday',
  fri: 'Friday', sat: 'Saturday', sun: 'Sunday',
}

const empty = (): DayShift => ({ admin: null, provided: 0, shifts: [], pettyCash: [] })

type DayData = Record<string, { AM: DayShift; PM: DayShift }>
const DATA: DayData = {}
WEEK.forEach(w => { DATA[w.key] = { AM: empty(), PM: empty() } })

DATA.thu.PM = {
  admin: 'Bernard Adome',
  provided: 2000,
  shifts: [
    { serial: '26080617', task: 'OPHELP Jesus Saves Daily',          paid: 140, workers: 140 },
    { serial: '26080618', task: 'Mouille Point Regular Cleaning',    paid: 96,  workers: 96  },
    { serial: '26080619', task: 'Cigarette Butt Picking PM',         paid: 210, workers: 210 },
    { serial: '26080620', task: 'Special Response Team 2',           paid: 140, workers: 140 },
    { serial: '26080621', task: 'Graffiti Removal',                  paid: 140, workers: 140 },
    { serial: '26080622', task: 'Labour for A-Team Projects',        paid: 140, workers: 140 },
    { serial: '26080623', task: 'Pre-school Operations Supervisor',  paid: 80,  workers: 80  },
  ],
  pettyCash: [
    { serial: '01060826', supplier: 'Ophelp',                  desc: 'Airtime subsidy: Bernard Adome',        paid: 15  },
    { serial: '02060826', supplier: 'Taxi',                    desc: 'Taxi fare to and from Sea Point Ops',   paid: 32  },
    { serial: '03060826', supplier: 'Fastnet Business Center', desc: 'Lamination of maps',                   paid: 30  },
    { serial: '04060826', supplier: 'Waltons',                 desc: 'Book cover for clipboards',            paid: 193 },
  ],
}

interface DebtRow { name: string; source: string; doc: string; serial: string; bill: number; outstanding: number; comment: string; status: 'owing' | 'partial' }
const DEBTS: DebtRow[] = [
  { name: 'Loyiso Makade',   source: 'Stolen Money',                    doc: 'Incident serial 4398', serial: '84', bill: 80,  outstanding: 80,  comment: 'Disqualified from participating until debt is settled — 11/07/25, Stuart', status: 'owing' },
  { name: 'Heather King',    source: 'Lost Gloves',                     doc: 'Bill of debt',         serial: '83', bill: 10,  outstanding: 10,  comment: '', status: 'owing' },
  { name: 'Amanda Bangeni',  source: 'Replacement of City Depot keys',  doc: 'Bill of debt',         serial: '69', bill: 925, outstanding: 715, comment: 'Failed to keep to repayment agreement — to be addressed on return, 04/07/2025', status: 'partial' },
]

// ── Helpers ────────────────────────────────────────────────────────────────────
function rands(n: number) { return 'R ' + n.toLocaleString('en-ZA') }

// ── Section divider ────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <span style={{ fontFamily: mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: C.slate, whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: C.line }} />
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ big, small }: { big: string; small: string }) {
  return (
    <div style={{ background: C.card, border: `1px dashed ${C.line}`, borderRadius: 10, padding: '40px 20px', textAlign: 'center' }}>
      <div style={{ fontFamily: display, fontSize: 14.5, color: C.inkSoft, fontWeight: 600, marginBottom: 4 }}>{big}</div>
      <div style={{ fontSize: 12.5, color: C.slate }}>{small}</div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function FieldOperationsLedger() {
  useFonts()
  const [activeDay, setActiveDay] = useState('thu')
  const [activeShift, setActiveShift] = useState<'AM' | 'PM'>('PM')
  const [activeTab, setActiveTab] = useState<'shift' | 'petty' | 'debt'>('shift')

  const wInfo = WEEK.find(w => w.key === activeDay)!
  const d = DATA[activeDay][activeShift]

  const shiftTotal = d.shifts.reduce((s, r) => s + r.paid, 0)
  const pettyTotal = d.pettyCash.reduce((s, r) => s + r.paid, 0)
  const totalPaid = shiftTotal + pettyTotal
  const balance = d.provided - totalPaid
  const totalDebtBill = DEBTS.reduce((s, r) => s + r.bill, 0)
  const totalDebtOut  = DEBTS.reduce((s, r) => s + r.outstanding, 0)

  function hasData(k: string, sh: string) {
    const dd = DATA[k][sh as 'AM' | 'PM']
    return dd.shifts.length > 0 || dd.pettyCash.length > 0
  }

  // ── Shared styles ────────────────────────────────────────────────────────────
  const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }
  const thS: React.CSSProperties = { textAlign: 'left', fontFamily: mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.slate, fontWeight: 600, padding: '10px 14px', background: C.paperDim, borderBottom: `1px solid ${C.line}`, whiteSpace: 'nowrap' }
  const tdS: React.CSSProperties = { padding: '11px 14px', borderBottom: `1px solid ${C.line}`, fontSize: 13, verticalAlign: 'top' }
  const tdNum: React.CSSProperties = { ...tdS, fontFamily: mono, textAlign: 'right' }

  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: body, color: C.ink, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '26px 28px 70px' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: display, fontSize: 23, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>
              {DAY_NAMES[activeDay]} {activeShift} Daily Summary
            </h1>
            <div style={{ color: C.slate, fontSize: 13, marginTop: 4 }}>
              {d.admin
                ? `City Depot Shift · ${wInfo.date} 2026 · Submitted by ${d.admin}`
                : `City Depot Shift · ${wInfo.date} 2026 · No submission yet`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: C.teal, color: '#fff', border: `1px solid ${C.teal}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber, flexShrink: 0 }} />
              {activeShift} Batch
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft }}>
              {d.shifts.length} task{d.shifts.length !== 1 ? 's' : ''} logged
            </span>
            <button style={{ padding: '9px 16px', borderRadius: 8, background: C.ink, color: '#fff', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: body }}>
              Submit to Day Supervisor
            </button>
          </div>
        </div>

        {/* Week strip + shift toggle */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 5, overflowX: 'auto' }}>
            {WEEK.map(w => {
              const flagged = hasData(w.key, 'AM') || hasData(w.key, 'PM')
              const active = w.key === activeDay
              return (
                <button key={w.key} onClick={() => setActiveDay(w.key)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 13px', borderRadius: 8, minWidth: 56, background: active ? C.teal : 'transparent', border: 'none', cursor: 'pointer', transition: 'background .15s' }}>
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? '#BFD4CE' : C.slate, fontWeight: 600 }}>{w.d}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: active ? '#fff' : C.ink }}>{w.date}</span>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', marginTop: 2, background: active ? C.amber : flagged ? C.moss : 'transparent' }} />
                </button>
              )
            })}
          </div>
          <div style={{ display: 'flex', background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 5, gap: 4 }}>
            {(['AM', 'PM'] as const).map(sh => (
              <button key={sh} onClick={() => setActiveShift(sh)}
                style={{ padding: '9px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, letterSpacing: '0.02em', border: 'none', cursor: 'pointer', background: activeShift === sh ? C.amber : 'transparent', color: activeShift === sh ? C.tealDeep : C.slate, transition: 'background .15s' }}>
                {sh}
              </button>
            ))}
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
          {[
            { label: 'Day Cash Provided', value: d.provided, note: d.provided ? 'No additional funds issued' : 'Not yet issued', accent: false },
            { label: 'Shift Paid Out', value: shiftTotal, note: `${d.shifts.length} tasks logged`, accent: false },
            { label: 'Petty Cash Spent', value: pettyTotal, note: `${d.pettyCash.length} receipts logged`, accent: false },
            { label: 'Total Paid Out', value: totalPaid, note: 'Shift + petty cash', accent: false },
          ].map(sc => (
            <div key={sc.label} style={{ ...card, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{sc.label}</div>
              <div style={{ fontFamily: display, fontSize: 22, fontWeight: 600 }}>
                <sup style={{ fontSize: 12, fontWeight: 500, color: C.slate, marginRight: 2 }}>R</sup>
                {sc.value.toLocaleString('en-ZA')}
              </div>
              <div style={{ fontSize: 11.5, marginTop: 6, color: C.slate }}>{sc.note}</div>
            </div>
          ))}
          <div style={{ ...card, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden', borderColor: C.amber }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.amber }} />
            <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Outstanding Debt</div>
            <div style={{ fontFamily: display, fontSize: 22, fontWeight: 600 }}>
              <sup style={{ fontSize: 12, fontWeight: 500, color: C.slate, marginRight: 2 }}>R</sup>
              {totalDebtOut.toLocaleString('en-ZA')}
            </div>
            <div style={{ fontSize: 11.5, marginTop: 6, color: C.slate }}>3 open accounts · runs across the week</div>
          </div>
        </div>

        {/* Cash reconciliation tape */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <h2 style={{ fontFamily: display, fontSize: 15, fontWeight: 600 }}>Cash Reconciliation</h2>
            <span style={{ fontSize: 11.5, color: C.slate }}>
              {d.provided ? 'Receipt total not yet reconciled against subtotal' : 'Awaiting float issue and shift entries'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'stretch', background: C.card, border: `1px solid ${C.line}`, borderRadius: 10, overflow: 'hidden' }}>
            {[
              { k: 'Provided',      v: rands(d.provided),                   op: '→', color: C.teal,  light: false },
              { k: 'Shift Payout',  v: '− ' + rands(shiftTotal),            op: '→', color: C.brick, light: false },
              { k: 'Petty Cash',    v: '− ' + rands(pettyTotal),            op: '=', color: C.brick, light: false },
              { k: 'Balance Left Over', v: rands(balance),                  op: '',  color: C.teal,  light: true  },
            ].map((seg, i) => (
              <div key={i} style={{ flex: 1, padding: '16px 18px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 4, background: seg.light ? C.teal : 'transparent', borderLeft: i > 0 ? `1px dashed ${C.line}` : 'none' }}>
                <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.07em', color: seg.light ? '#BFD4CE' : C.slate }}>{seg.k}</span>
                <span style={{ fontFamily: mono, fontSize: 19, fontWeight: 600, color: seg.light ? '#fff' : seg.color }}>{seg.v}</span>
                {seg.light && (
                  <span style={{ fontSize: 10.5, color: C.amber, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                    <span style={{ fontSize: 8 }}>●</span>
                    {d.provided ? 'Pending supervisor sign-off' : 'No shift submitted'}
                  </span>
                )}
                {seg.op && (
                  <div style={{ position: 'absolute', right: -11, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, borderRadius: '50%', background: C.paper, border: `1px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: C.slate, zIndex: 2 }}>
                    {seg.op}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: `1px solid ${C.line}`, marginBottom: 16 }}>
          {([['shift', 'Shift Ledger', d.shifts.length], ['petty', 'Petty Cash', d.pettyCash.length], ['debt', 'Debt Register', DEBTS.length]] as [string, string, number][]).map(([key, label, cnt]) => (
            <button key={key} onClick={() => setActiveTab(key as typeof activeTab)}
              style={{ padding: '10px 4px', marginRight: 22, fontSize: 13.5, fontWeight: 500, color: activeTab === key ? C.ink : C.slate, borderBottom: activeTab === key ? `2px solid ${C.amber}` : '2px solid transparent', background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid', borderBottomColor: activeTab === key ? C.amber : 'transparent', cursor: 'pointer', position: 'relative', top: 1, fontFamily: body }}>
              {label}
              <span style={{ fontFamily: mono, fontSize: 10.5, color: C.slate, background: C.paperDim, borderRadius: 999, padding: '1px 6px', marginLeft: 6 }}>{cnt}</span>
            </button>
          ))}
        </div>

        {/* Shift Ledger panel */}
        {activeTab === 'shift' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600 }}>{activeShift} Batch — City Shifts, {wInfo.date} 2026</h3>
              {d.shifts.length > 0 && <span style={{ fontSize: 12, color: C.slate }}>{d.shifts.length} entries</span>}
            </div>
            {d.shifts.length === 0
              ? <EmptyState big="No entries logged for this shift" small="Slots recorded as Nil, matching the source ledger's convention for unused allocations." />
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', ...card, overflow: 'hidden' }}>
                  <thead>
                    <tr>
                      {['№', 'Particulars', 'Paid Out', 'Foreman Name', 'Workers', 'Transport', 'Comments'].map((h, i) => (
                        <th key={h} style={{ ...thS, textAlign: i >= 2 && i <= 4 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.shifts.map((r, i) => (
                      <tr key={r.serial} style={{ background: i % 2 === 1 ? C.paper : 'transparent' }}>
                        <td style={{ ...tdS, fontFamily: mono, color: C.slate, fontSize: 12 }}>{r.serial}</td>
                        <td style={{ ...tdS, fontWeight: 500 }}>{r.task}</td>
                        <td style={{ ...tdNum }}>{r.paid}</td>
                        <td style={{ ...tdS, color: C.slate }}>—</td>
                        <td style={{ ...tdNum }}>{r.workers}</td>
                        <td style={{ ...tdS, color: C.slate }}>—</td>
                        <td style={{ ...tdS, color: C.slate, fontSize: 12 }}>—</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={2} style={{ ...tdS, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>Subtotal</td>
                      <td style={{ ...tdNum, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>{rands(shiftTotal)}</td>
                      <td colSpan={4} style={{ ...tdS, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }} />
                    </tr>
                  </tfoot>
                </table>
              )}
          </section>
        )}

        {/* Petty Cash panel */}
        {activeTab === 'petty' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600 }}>Petty Cash Expenses {activeShift} — City Depot, {wInfo.date} 2026</h3>
              {d.pettyCash.length > 0 && <span style={{ fontSize: 12, color: C.slate }}>{d.pettyCash.length} of 13 allocated slots used</span>}
            </div>
            {d.pettyCash.length === 0
              ? <EmptyState big="No petty cash receipts for this shift" small="Log receipts as they come in throughout the shift." />
              : (
                <table style={{ width: '100%', borderCollapse: 'collapse', ...card, overflow: 'hidden' }}>
                  <thead>
                    <tr>
                      {['Receipt #', 'Supplier', 'Description', 'Paid Out'].map((h, i) => (
                        <th key={h} style={{ ...thS, textAlign: i === 3 ? 'right' : 'left' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {d.pettyCash.map((r, i) => (
                      <tr key={r.serial} style={{ background: i % 2 === 1 ? C.paper : 'transparent' }}>
                        <td style={{ ...tdS, fontFamily: mono, color: C.slate, fontSize: 12 }}>{r.serial}</td>
                        <td style={{ ...tdS, fontWeight: 500 }}>{r.supplier}</td>
                        <td style={{ ...tdS, color: C.slate, fontSize: 12 }}>{r.desc}</td>
                        <td style={{ ...tdNum }}>{r.paid}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3} style={{ ...tdS, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>Total Petty Cash</td>
                      <td style={{ ...tdNum, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>{rands(pettyTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
          </section>
        )}

        {/* Debt Register panel */}
        {activeTab === 'debt' && (
          <section>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 style={{ fontFamily: display, fontSize: 14.5, fontWeight: 600 }}>Bill of Debt List</h3>
              <span style={{ fontSize: 12, color: C.slate }}>3 open accounts · carried across the week</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...card, overflow: 'hidden' }}>
              <thead>
                <tr>
                  {['Name', 'Debt Source', 'Source Document', 'Serial No.', 'Bill Value', 'Outstanding', 'Status / Comments'].map((h, i) => (
                    <th key={h} style={{ ...thS, textAlign: i >= 4 && i <= 5 ? 'right' : 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DEBTS.map((r, i) => (
                  <tr key={r.serial} style={{ background: i % 2 === 1 ? C.paper : 'transparent' }}>
                    <td style={{ ...tdS, fontWeight: 500 }}>{r.name}</td>
                    <td style={{ ...tdS }}>{r.source}</td>
                    <td style={{ ...tdS, color: C.slate, fontSize: 12 }}>{r.doc}</td>
                    <td style={{ ...tdS, fontFamily: mono, color: C.slate, fontSize: 12 }}>{r.serial}</td>
                    <td style={{ ...tdNum }}>{r.bill}</td>
                    <td style={{ ...tdNum }}>{r.outstanding}</td>
                    <td style={{ ...tdS }}>
                      {r.status === 'owing'
                        ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, background: 'rgba(168,69,47,.1)', color: C.brick, fontSize: 11, fontWeight: 500 }}>
                            {r.outstanding === r.bill ? 'Open' : 'Suspended · unsettled'}
                          </span>
                        : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 999, background: 'rgba(63,120,86,.1)', color: C.moss, fontSize: 11, fontWeight: 500 }}>
                            R{r.bill - r.outstanding} recovered
                          </span>
                      }
                      {r.comment && <div style={{ marginTop: 4, color: C.slate, fontSize: 12 }}>{r.comment}</div>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ ...tdS, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>Total</td>
                  <td style={{ ...tdNum, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>R {totalDebtBill}</td>
                  <td style={{ ...tdNum, fontWeight: 600, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }}>R {totalDebtOut}</td>
                  <td style={{ ...tdS, background: C.paperDim, borderTop: `1px solid ${C.line}`, borderBottom: 'none' }} />
                </tr>
              </tfoot>
            </table>
            <p style={{ marginTop: 10, fontSize: 11.5, color: C.slate }}>Debt records persist across shifts for the full week until settled or written off.</p>
          </section>
        )}

      </div>
    </div>
  )
}
