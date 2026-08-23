/**
 * OASys — OPHELP Accounting System
 * Full React port of the OASys HTML ledger.
 * Persists to localStorage under STORAGE_KEY.
 */
import { useState, useEffect, useCallback } from 'react'

// ── CSS tokens ────────────────────────────────────────────────────────────────
const T = {
  cover: '#1f3d34', coverDark: '#152a24',
  paper: '#f6f1e4', paperLine: '#e3d9bd',
  ink: '#2b2620', inkSoft: '#6b6154',
  rule: '#c9bd9c', gold: '#b8863b', goldSoft: '#e9d3a3',
  red: '#8c3b2e', green: '#3c6e4f', white: '#fffdf8',
}
const serif = "Georgia, 'Iowan Old Style', 'Times New Roman', serif"
const mono = "ui-monospace, 'SF Mono', Menlo, Consolas, monospace"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Entry {
  id: string; dd: string; mm: string; yyyy: string; no: string; description: string
  foremen: number; workers: number; feeRate: number; xtra: number
  pay_c: number; pay_e: number; reward_c: number; reward_e: number
  transport_c: number; transport_e: number; material_c: number; material_e: number
  admin_c: number; admin_e: number; other_c: number; other_e: number
}
interface Category { id: string; name: string; entries: Entry[] }
interface Client { id: string; name: string; categories: Category[] }
interface OASysState {
  clients: Client[]
  activeClientId: string | null
  activeCategoryId: Record<string, string>
  ceLabels: { c: string; e: string }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'ophelp_oasys_v1'
const DEFAULT_CATS = ['Jobsheets', 'Cash Vouchers', 'Payment Authorisation', 'Journal Entries']
const FIELDS = [
  { key: 'pay', label: 'Pay' }, { key: 'reward', label: '6X Reward' },
  { key: 'transport', label: 'Transport' }, { key: 'material', label: 'Material' },
  { key: 'admin', label: 'Admin' }, { key: 'other', label: 'Other' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() { return Math.random().toString(36).slice(2, 10) }
function num(v: unknown): number { const n = parseFloat(String(v)); return isNaN(n) ? 0 : n }
function fmt(v: number): string {
  const neg = v < -0.005; const abs = Math.abs(v)
  const s = abs.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return neg ? `(${s})` : s
}

function blankEntry(): Entry {
  const e: Partial<Entry> = { id: uid(), dd: '', mm: '', yyyy: String(new Date().getFullYear()), no: '', description: '', foremen: 0, workers: 0, feeRate: 25, xtra: 0 }
  FIELDS.forEach(f => { (e as unknown as Record<string, number>)[f.key + '_c'] = 0; (e as unknown as Record<string, number>)[f.key + '_e'] = 0 })
  return e as Entry
}
function newCategory(name: string): Category { return { id: uid(), name, entries: [] } }
function newClient(name: string): Client { return { id: uid(), name, categories: DEFAULT_CATS.map(newCategory) } }

// ── Computation ───────────────────────────────────────────────────────────────
interface Computed {
  inv: Record<string, number>; xtra: number; fee: number
  invoiceTotal: number; expenseTotal: number; rewardBalance: number; ophelpBalance: number
}
function computeEntry(e: Entry): Computed {
  const ev = e as unknown as Record<string, number>
  const inv: Record<string, number> = {}
  FIELDS.forEach(f => { inv[f.key] = num(ev[f.key + '_c']) + num(ev[f.key + '_e']) })
  const xtra = num(e.xtra)
  const detailSum = FIELDS.reduce((s, f) => s + inv[f.key], 0) + xtra
  const fee = detailSum * (num(e.feeRate) / 100)
  const invoiceTotal = detailSum + fee
  const expenseTotal = FIELDS.reduce((s, f) => s + num(ev[f.key + '_c']) + num(ev[f.key + '_e']), 0)
  const rewardBalance = inv.reward
  const ophelpBalance = invoiceTotal - expenseTotal - rewardBalance
  return { inv, xtra, fee, invoiceTotal, expenseTotal, rewardBalance, ophelpBalance }
}
interface Totals { expenseTotal: number; invoiceTotal: number; fee: number; rewardBalance: number; ophelpBalance: number; pay: number; reward: number; transport: number; material: number; admin: number; other: number; xtra: number }
function sumCategory(cat: Category): Totals {
  const t: Totals = { expenseTotal: 0, invoiceTotal: 0, fee: 0, rewardBalance: 0, ophelpBalance: 0, pay: 0, reward: 0, transport: 0, material: 0, admin: 0, other: 0, xtra: 0 }
  cat.entries.forEach(e => {
    const c = computeEntry(e)
    t.expenseTotal += c.expenseTotal; t.invoiceTotal += c.invoiceTotal; t.fee += c.fee
    t.rewardBalance += c.rewardBalance; t.ophelpBalance += c.ophelpBalance; t.xtra += c.xtra
    FIELDS.forEach(f => { (t as unknown as Record<string, number>)[f.key] += c.inv[f.key] })
  })
  return t
}
interface ClientTotals { expenseTotal: number; invoiceTotal: number; fee: number; rewardBalance: number; ophelpBalance: number }
function sumClient(client: Client): ClientTotals {
  const t: ClientTotals = { expenseTotal: 0, invoiceTotal: 0, fee: 0, rewardBalance: 0, ophelpBalance: 0 }
  client.categories.forEach(cat => {
    const s = sumCategory(cat); t.expenseTotal += s.expenseTotal; t.invoiceTotal += s.invoiceTotal
    t.fee += s.fee; t.rewardBalance += s.rewardBalance; t.ophelpBalance += s.ophelpBalance
  })
  return t
}

// ── Persist ───────────────────────────────────────────────────────────────────
function loadState(): OASysState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const d = JSON.parse(raw) as Partial<OASysState>
      return {
        clients: d.clients ?? [],
        activeClientId: d.activeClientId ?? null,
        activeCategoryId: d.activeCategoryId ?? {},
        ceLabels: d.ceLabels ?? { c: 'Cash', e: 'EFT' },
      }
    }
  } catch { /**/ }
  return { clients: [], activeClientId: null, activeCategoryId: {}, ceLabels: { c: 'Cash', e: 'EFT' } }
}
function saveState(s: OASysState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ clients: s.clients, activeClientId: s.activeClientId, activeCategoryId: s.activeCategoryId, ceLabels: s.ceLabels })) } catch { /**/ }
}

// ── Entry form ────────────────────────────────────────────────────────────────
interface EntryFormProps {
  initial: Entry; ceLabels: { c: string; e: string }; isEditing: boolean
  onSave: (e: Entry) => void; onCancel: () => void
}
function EntryForm({ initial, ceLabels, isEditing, onSave, onCancel }: EntryFormProps) {
  const [e, setE] = useState<Entry>({ ...initial })
  const c = computeEntry(e)
  const set = (key: string, val: string | number) => setE(prev => ({ ...prev, [key]: val }))
  const numFld = (key: string) => (
    <input type="number" step="0.01" value={(e as unknown as Record<string, number | string>)[key]}
      onChange={ev => set(key, ev.target.value)}
      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${T.rule}`, borderRadius: 2, fontFamily: serif, fontSize: 13, background: T.paper, outline: 'none' }}
      onFocus={ev => (ev.target.style.outline = `2px solid ${T.gold}`)}
      onBlur={ev => (ev.target.style.outline = 'none')}
    />
  )
  const txtFld = (key: string, placeholder?: string) => (
    <input type="text" value={(e as unknown as Record<string, string>)[key]}
      onChange={ev => set(key, ev.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '7px 8px', border: `1px solid ${T.rule}`, borderRadius: 2, fontFamily: serif, fontSize: 13, background: T.paper, outline: 'none' }}
      onFocus={ev => (ev.target.style.outline = `2px solid ${T.gold}`)}
      onBlur={ev => (ev.target.style.outline = 'none')}
    />
  )
  const lbl = (text: string) => <label style={{ display: 'block', fontSize: 10, color: T.inkSoft, marginBottom: 3, letterSpacing: 0.3 }}>{text}</label>

  return (
    <div style={{ background: T.white, border: `1px solid ${T.rule}`, borderRadius: 3, padding: '16px 18px', marginBottom: 16, boxShadow: `0 6px 18px rgba(31,61,52,0.18)` }}>
      <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: T.inkSoft, marginBottom: 8 }}>Job detail</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 8 }}>
        {[['dd', 'Day (dd)'], ['mm', 'Month (mm)'], ['yyyy', 'Year']].map(([k, l]) => (
          <div key={k}>{lbl(l)}<input type="number" value={(e as unknown as Record<string, string>)[k]} onChange={ev => set(k, ev.target.value)} style={{ width: '100%', padding: '7px 8px', border: `1px solid ${T.rule}`, borderRadius: 2, fontFamily: serif, fontSize: 13, background: T.paper, outline: 'none' }} /></div>
        ))}
        <div>{lbl('Reference No.')}{txtFld('no')}</div>
        <div>{lbl('Foremen')}{numFld('foremen')}</div>
        <div>{lbl('Workers')}{numFld('workers')}</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 12 }}>
        <div style={{ gridColumn: 'span 3' }}>{lbl('Description')}{txtFld('description', 'e.g. Hotspot cleaning')}</div>
        <div>{lbl('Xtra (manual add-on)')}{numFld('xtra')}</div>
        <div>{lbl('Fee rate %')}{numFld('feeRate')}</div>
      </div>
      <div style={{ fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase' as const, color: T.inkSoft, marginBottom: 8 }}>
        Expense detail — enter {ceLabels.c} / {ceLabels.e} for each cost line
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8, marginBottom: 12 }}>
        {FIELDS.map(f => (
          <>
            <div key={f.key + '_c'}>{lbl(`${f.label} — ${ceLabels.c}`)}{numFld(f.key + '_c')}</div>
            <div key={f.key + '_e'}>{lbl(`${f.label} — ${ceLabels.e}`)}{numFld(f.key + '_e')}</div>
          </>
        ))}
      </div>
      {/* Live preview */}
      <div style={{ padding: '10px 12px', background: T.paper, border: `1px dashed ${T.rule}`, borderRadius: 2, display: 'flex', flexWrap: 'wrap' as const, gap: 16, fontSize: 12.5, marginBottom: 12 }}>
        {[
          ['Invoice total', `R ${fmt(c.invoiceTotal)}`, T.ink],
          ['Fee', `R ${fmt(c.fee)}`, T.inkSoft],
          ['Expense total', `R ${fmt(c.expenseTotal)}`, T.inkSoft],
          ['6X Reward balance', `R ${fmt(c.rewardBalance)}`, T.gold],
          ['OPHELP balance', `R ${fmt(c.ophelpBalance)}`, c.ophelpBalance < 0 ? T.red : T.green],
        ].map(([label, val, color]) => (
          <span key={label as string}>
            {label}<b style={{ display: 'block', fontSize: 14, marginTop: 1, color: color as string }}>{val}</b>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 2, border: `1px solid ${T.rule}`, background: 'transparent', color: T.inkSoft, cursor: 'pointer', fontFamily: serif, fontSize: 13 }}>Cancel</button>
        <button onClick={() => onSave(e)} style={{ padding: '9px 18px', borderRadius: 2, border: 'none', background: T.gold, color: '#241a08', fontWeight: 700, cursor: 'pointer', fontFamily: serif, fontSize: 13 }}>
          {isEditing ? 'Save changes' : 'Add to register'}
        </button>
      </div>
    </div>
  )
}

// ── Ledger table ──────────────────────────────────────────────────────────────
function LedgerTable({ cat, ceLabels, onEdit, onRemove }: { cat: Category; ceLabels: { c: string; e: string }; onEdit: (id: string) => void; onRemove: (id: string) => void }) {
  const t = sumCategory(cat)
  const thS: React.CSSProperties = { background: T.ink, color: T.white, fontWeight: 500, fontSize: 10.5, letterSpacing: 0.3, textTransform: 'uppercase', textAlign: 'center', padding: '6px 8px', border: `1px solid ${T.paperLine}`, whiteSpace: 'nowrap' }
  const tdS: React.CSSProperties = { border: `1px solid ${T.paperLine}`, padding: '6px 8px', textAlign: 'right', whiteSpace: 'nowrap', fontFamily: mono, fontSize: 12 }
  const footS: React.CSSProperties = { ...tdS, background: T.paperLine, fontWeight: 700, borderTop: `2px solid ${T.ink}` }

  if (cat.entries.length === 0) {
    return (
      <table style={{ borderCollapse: 'collapse', width: '100%', background: T.white }}>
        <tbody><tr><td style={{ textAlign: 'center', color: T.inkSoft, fontStyle: 'italic', padding: 20, border: `1px solid ${T.paperLine}` }}>No entries in this register yet. Use "+ Add entry" above to log the first one.</td></tr></tbody>
      </table>
    )
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12.5, background: T.white }}>
        <thead>
          <tr>
            <th style={{ ...thS, textAlign: 'left' }}>Date</th>
            <th style={{ ...thS, textAlign: 'left', minWidth: 150 }}>Description</th>
            <th style={thS}>No.</th>
            <th style={thS}>Fmn</th>
            <th style={thS}>Wkr</th>
            {['Pay', 'Reward', 'Transport', 'Material', 'Admin', 'Other'].map((h, i) => (
              <th key={h} style={{ ...thS, borderLeft: i === 0 ? `2px solid ${T.white}` : undefined }}>{h}</th>
            ))}
            <th style={thS}>Xtra</th>
            <th style={thS}>Fee%</th>
            <th style={{ ...thS, borderLeft: `2px solid ${T.white}` }}>Invoice Total</th>
            <th style={thS}>Reward Bal</th>
            <th style={thS}>OPHELP Bal</th>
            <th style={thS} />
          </tr>
        </thead>
        <tbody>
          {cat.entries.map((e, idx) => {
            const c = computeEntry(e)
            const trS: React.CSSProperties = { background: idx % 2 === 1 ? 'rgba(0,0,0,0.02)' : T.white, cursor: 'pointer' }
            return (
              <tr key={e.id} style={trS} onDoubleClick={() => onEdit(e.id)}>
                <td style={{ ...tdS, textAlign: 'left', fontFamily: serif }}>{e.dd || '–'}/{e.mm || '–'}/{e.yyyy || '–'}</td>
                <td style={{ ...tdS, textAlign: 'left', fontFamily: serif, whiteSpace: 'normal', minWidth: 150 }}>{e.description || '—'}</td>
                <td style={tdS}>{e.no}</td>
                <td style={tdS}>{e.foremen || 0}</td>
                <td style={tdS}>{e.workers || 0}</td>
                {FIELDS.map((f, i) => <td key={f.key} style={{ ...tdS, borderLeft: i === 0 ? `2px solid ${T.ink}` : undefined }}>{fmt(c.inv[f.key])}</td>)}
                <td style={tdS}>{fmt(c.xtra)}</td>
                <td style={tdS}>{num(e.feeRate)}%</td>
                <td style={{ ...tdS, borderLeft: `2px solid ${T.ink}`, fontWeight: 700 }}>{fmt(c.invoiceTotal)}</td>
                <td style={tdS}>{fmt(c.rewardBalance)}</td>
                <td style={{ ...tdS, color: c.ophelpBalance < 0 ? T.red : 'inherit' }}>{fmt(c.ophelpBalance)}</td>
                <td style={{ ...tdS, textAlign: 'center' }}>
                  <button onClick={() => onEdit(e.id)} title="Edit" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.gold, fontSize: 13, marginRight: 4 }}>✎</button>
                  <button onClick={() => { if (confirm('Remove this entry from the register?')) onRemove(e.id) }} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.red, fontSize: 13 }}>✕</button>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={5} style={footS}>Register subtotal</td>
            {FIELDS.map((f, i) => <td key={f.key} style={{ ...footS, borderLeft: i === 0 ? `2px solid ${T.ink}` : undefined }}>{fmt((t as unknown as Record<string, number>)[f.key])}</td>)}
            <td style={footS}>{fmt(t.xtra)}</td>
            <td style={footS} />
            <td style={{ ...footS, borderLeft: `2px solid ${T.ink}` }}>{fmt(t.invoiceTotal)}</td>
            <td style={footS}>{fmt(t.rewardBalance)}</td>
            <td style={footS}>{fmt(t.ophelpBalance)}</td>
            <td style={footS} />
          </tr>
        </tfoot>
      </table>
      <p style={{ fontSize: 11, color: T.inkSoft, marginTop: 8 }}>
        Cost lines entered as {ceLabels.c} / {ceLabels.e}. Rename these in the Guide tab.
      </p>
    </div>
  )
}

// ── Reports view ──────────────────────────────────────────────────────────────
function ReportsView({ clients }: { clients: Client[] }) {
  if (clients.length === 0) return (
    <div style={{ padding: '60px 20px', textAlign: 'center', color: T.inkSoft, fontFamily: serif }}>
      <h3 style={{ fontSize: 20, color: T.ink, fontWeight: 400 }}>Nothing to report yet</h3>
      <p>Add a client and log entries to see totals here.</p>
    </div>
  )

  const rows = clients.map(c => ({ name: c.name, t: sumClient(c) }))
  const grand = rows.reduce((a, r) => ({
    invoiceTotal: a.invoiceTotal + r.t.invoiceTotal, fee: a.fee + r.t.fee,
    ophelpBalance: a.ophelpBalance + r.t.ophelpBalance, rewardBalance: a.rewardBalance + r.t.rewardBalance,
    expenseTotal: a.expenseTotal + (r.t as ClientTotals).expenseTotal,
  }), { invoiceTotal: 0, fee: 0, ophelpBalance: 0, rewardBalance: 0, expenseTotal: 0 })
  const maxInv = Math.max(1, ...rows.map(r => r.t.invoiceTotal))
  const sorted = [...rows].sort((a, b) => b.t.invoiceTotal - a.t.invoiceTotal)

  const thS: React.CSSProperties = { background: T.ink, color: T.white, fontWeight: 500, fontSize: 10.5, letterSpacing: 0.3, textTransform: 'uppercase' as const, textAlign: 'center', padding: '6px 8px', border: `1px solid ${T.paperLine}` }
  const tdS: React.CSSProperties = { border: `1px solid ${T.paperLine}`, padding: '6px 8px', textAlign: 'right', fontFamily: mono, fontSize: 12.5 }

  return (
    <>
      <h2 style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 8, fontWeight: 400, fontFamily: serif, color: T.ink, margin: '0 0 18px' }}>Portfolio report — all clients</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
        {[
          ['Total invoiced', `R ${fmt(grand.invoiceTotal)}`, T.ink],
          ['Total fee earned', `R ${fmt(grand.fee)}`, T.gold],
          ['OPHELP balance', `R ${fmt(grand.ophelpBalance)}`, grand.ophelpBalance < 0 ? T.red : T.green],
          ['6X Reward balance', `R ${fmt(grand.rewardBalance)}`, T.cover],
        ].map(([label, val, color]) => (
          <div key={label as string} style={{ background: T.white, border: `1px solid ${T.rule}`, borderRadius: 2, padding: '12px 14px' }}>
            <div style={{ fontSize: 10.5, textTransform: 'uppercase' as const, letterSpacing: 0.6, color: T.inkSoft }}>{label}</div>
            <div style={{ fontSize: 19, fontWeight: 700, marginTop: 3, color: color as string, fontFamily: mono }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 22, alignItems: 'start' }}>
        <div style={{ background: T.white, border: `1px solid ${T.rule}`, borderRadius: 3, padding: 18, boxShadow: `0 6px 18px rgba(31,61,52,0.18)` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, borderBottom: `1px solid ${T.paperLine}`, paddingBottom: 8, fontFamily: serif }}>Invoice total by client</h3>
          {sorted.map(r => (
            <div key={r.name} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 90px', alignItems: 'center', gap: 10, marginBottom: 8, fontSize: 12.5 }}>
              <span style={{ fontFamily: serif, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
              <div style={{ background: T.paperLine, height: 16, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', background: `linear-gradient(90deg, ${T.gold}, ${T.cover})`, borderRadius: 2, width: `${Math.max(2, r.t.invoiceTotal / maxInv * 100)}%` }} />
              </div>
              <span style={{ textAlign: 'right', fontFamily: mono }}>R {fmt(r.t.invoiceTotal)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: T.white, border: `1px solid ${T.rule}`, borderRadius: 3, padding: 18, boxShadow: `0 6px 18px rgba(31,61,52,0.18)` }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, borderBottom: `1px solid ${T.paperLine}`, paddingBottom: 8, fontFamily: serif }}>Client ledger</h3>
          <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
            <thead><tr>
              <th style={{ ...thS, textAlign: 'left' }}>Client</th>
              <th style={thS}>Invoice</th><th style={thS}>Fee</th><th style={thS}>OPHELP Bal</th>
            </tr></thead>
            <tbody>
              {sorted.map(r => (
                <tr key={r.name}>
                  <td style={{ ...tdS, textAlign: 'left', fontFamily: serif }}>{r.name}</td>
                  <td style={tdS}>{fmt(r.t.invoiceTotal)}</td>
                  <td style={tdS}>{fmt(r.t.fee)}</td>
                  <td style={{ ...tdS, color: r.t.ophelpBalance < 0 ? T.red : 'inherit' }}>{fmt(r.t.ophelpBalance)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: T.paperLine, fontWeight: 700 }}>
                <td style={{ ...tdS, textAlign: 'left', fontFamily: serif }}>Grand total</td>
                <td style={tdS}>{fmt(grand.invoiceTotal)}</td>
                <td style={tdS}>{fmt(grand.fee)}</td>
                <td style={{ ...tdS, color: grand.ophelpBalance < 0 ? T.red : 'inherit' }}>{fmt(grand.ophelpBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </>
  )
}

// ── Guide view ────────────────────────────────────────────────────────────────
function GuideView({ ceLabels, onChange }: { ceLabels: { c: string; e: string }; onChange: (l: { c: string; e: string }) => void }) {
  const inpS: React.CSSProperties = { padding: 8, border: `1px solid ${T.rule}`, borderRadius: 2, width: '100%', fontFamily: serif, fontSize: 13, background: T.paper, outline: 'none' }
  const formula = (title: string, body: string) => (
    <div style={{ background: T.white, borderLeft: `4px solid ${T.gold}`, padding: '12px 16px', margin: '12px 0', borderRadius: '0 2px 2px 0', boxShadow: `0 6px 18px rgba(31,61,52,0.18)` }}>
      <div style={{ fontFamily: mono, fontSize: 13, color: T.coverDark, marginBottom: 4 }}>{title}</div>
      <div style={{ fontFamily: serif, fontSize: 13.5 }}>{body}</div>
    </div>
  )
  const tip = (text: React.ReactNode) => (
    <div style={{ background: T.goldSoft, borderRadius: 2, padding: '10px 14px', fontSize: 13.5, margin: '14px 0', fontFamily: serif }}>{text}</div>
  )
  const warn = (text: React.ReactNode) => (
    <div style={{ background: '#f1ddd6', borderLeft: `4px solid ${T.red}`, padding: '10px 14px', fontSize: 13.5, margin: '14px 0', fontFamily: serif }}>{text}</div>
  )

  return (
    <div style={{ maxWidth: 820, fontFamily: serif, color: T.ink }}>
      <h2 style={{ borderBottom: `2px solid ${T.ink}`, paddingBottom: 8, fontWeight: 400 }}>Guide &amp; advice for running OASys</h2>
      <p style={{ lineHeight: 1.65, fontSize: 14.5 }}>This rebuilds the <b>OASys [OPHELP Accounting System]</b> spreadsheet as an interactive ledger. Every client keeps their own set of registers; every entry is rolled up into invoice totals, a fee, and two running balances — exactly the way the original workbook's formulas did it.</p>

      <h3 style={{ color: T.cover, marginTop: 28 }}>How a register is structured</h3>
      <p style={{ lineHeight: 1.65, fontSize: 14.5 }}>A <b>client</b> (e.g. a CCID precinct, a hotel, an ad-hoc job) holds one or more <b>registers</b>. The four standard registers are <code style={{ background: T.paperLine, padding: '1px 6px', borderRadius: 2, fontFamily: mono, fontSize: 13 }}>Jobsheets</code>, <code style={{ background: T.paperLine, padding: '1px 6px', borderRadius: 2, fontFamily: mono, fontSize: 13 }}>Cash Vouchers</code>, <code style={{ background: T.paperLine, padding: '1px 6px', borderRadius: 2, fontFamily: mono, fontSize: 13 }}>Payment Authorisation</code> and <code style={{ background: T.paperLine, padding: '1px 6px', borderRadius: 2, fontFamily: mono, fontSize: 13 }}>Journal Entries</code>.</p>

      <h3 style={{ color: T.cover, marginTop: 28 }}>What each entry field means</h3>
      <p style={{ lineHeight: 1.65, fontSize: 14.5 }}>Every cost line is split into two channels labelled <b>{ceLabels.c}</b> and <b>{ceLabels.e}</b> — rename them below to match how your organisation pays out (cash-in-hand vs EFT is the common case).</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '14px 0' }}>
        <div>
          <label style={{ fontSize: 11, color: T.inkSoft, display: 'block', marginBottom: 4 }}>Label for "C" channel</label>
          <input value={ceLabels.c} onChange={e => onChange({ ...ceLabels, c: e.target.value || 'C' })} style={inpS} />
        </div>
        <div>
          <label style={{ fontSize: 11, color: T.inkSoft, display: 'block', marginBottom: 4 }}>Label for "E" channel</label>
          <input value={ceLabels.e} onChange={e => onChange({ ...ceLabels, e: e.target.value || 'E' })} style={inpS} />
        </div>
      </div>

      <h3 style={{ color: T.cover, marginTop: 28 }}>How the numbers are calculated</h3>
      {formula('Invoice line (Pay / Reward / Transport / Material / Admin / Other)', '= channel C + channel E')}
      {formula('Fee', '= (Pay + Xtra + Reward + Transport + Material + Admin + Other) × Fee rate %')}
      {formula('Invoice Total', '= Pay + Xtra + Reward + Transport + Material + Admin + Other + Fee')}
      {formula('6X Reward Balance', '= the Reward invoice line (held in trust for the reward scheme)')}
      {formula('OPHELP Balance', '= Invoice Total − (sum of every raw expense-detail cell) − 6X Reward Balance')}

      <h3 style={{ color: T.cover, marginTop: 28 }}>Advice for keeping this useful day to day</h3>
      {tip(<><b>Log as you go, not at month end.</b> Enter each jobsheet, cash voucher or payment authorisation the day it happens so the running balances stay trustworthy.</>)}
      {tip(<><b>Keep the fee rate consistent per client.</b> 25% was the default across almost every register in the source file. Change it per-entry only when a client has a genuinely different agreement.</>)}
      {tip(<><b>Watch the OPHELP Balance for negatives.</b> A negative balance means expenses exceeded what was invoiced. Rows showing a negative are highlighted in red throughout.</>)}
      {tip(<><b>Use the Reports tab before month-end invoicing.</b> It ranks every client by invoice total and gives portfolio-wide fee and balance figures in one place.</>)}
      {warn(<><b>Data is saved locally in your browser.</b> It is not shared with other users and won't sync automatically. Use Export from the Reports view for backups.</>)}
    </div>
  )
}

// ── Main OASys component ──────────────────────────────────────────────────────
export default function OASys() {
  const [s, setS] = useState<OASysState>(loadState)
  const [view, setView] = useState<'ledger' | 'reports' | 'guide'>('ledger')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [newClientName, setNewClientName] = useState('')

  useEffect(() => { saveState(s) }, [s])

  const update = useCallback((fn: (prev: OASysState) => OASysState) => setS(fn), [])

  const activeClient = s.clients.find(c => c.id === s.activeClientId) ?? null
  const activeCategory = activeClient
    ? (activeClient.categories.find(c => c.id === s.activeCategoryId[activeClient.id]) ?? activeClient.categories[0] ?? null)
    : null

  function addClient() {
    const name = newClientName.trim(); if (!name) return
    const client = newClient(name)
    update(prev => ({
      ...prev, clients: [...prev.clients, client], activeClientId: client.id,
      activeCategoryId: { ...prev.activeCategoryId, [client.id]: client.categories[0].id },
    }))
    setNewClientName('')
  }
  function removeClient(id: string) {
    const cl = s.clients.find(c => c.id === id)
    if (!cl || !confirm(`Remove client "${cl.name}" and all its ledger entries? This can't be undone.`)) return
    update(prev => ({
      ...prev,
      clients: prev.clients.filter(c => c.id !== id),
      activeClientId: prev.activeClientId === id ? (prev.clients.find(c => c.id !== id)?.id ?? null) : prev.activeClientId,
    }))
  }
  function selectClient(id: string) {
    update(prev => ({ ...prev, activeClientId: id }))
    setFormOpen(false); setEditingId(null); setView('ledger')
  }

  function addCategory() {
    if (!activeClient) return
    const name = prompt('Name this new register (e.g. Ad Hoc Services):'); if (!name) return
    const cat = newCategory(name.trim())
    update(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === activeClient.id ? { ...c, categories: [...c.categories, cat] } : c),
      activeCategoryId: { ...prev.activeCategoryId, [activeClient.id]: cat.id },
    }))
    setFormOpen(false); setEditingId(null)
  }
  function removeCategory(catId: string) {
    if (!activeClient) return
    const cat = activeClient.categories.find(c => c.id === catId)
    if (!cat || !confirm(`Remove register "${cat.name}"? Its ${cat.entries.length} entries will be deleted.`)) return
    const remaining = activeClient.categories.filter(c => c.id !== catId)
    update(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === activeClient.id ? { ...c, categories: remaining } : c),
      activeCategoryId: { ...prev.activeCategoryId, [activeClient.id]: remaining[0]?.id ?? '' },
    }))
  }
  function selectCategory(catId: string) {
    if (!activeClient) return
    update(prev => ({ ...prev, activeCategoryId: { ...prev.activeCategoryId, [activeClient.id]: catId } }))
    setFormOpen(false); setEditingId(null)
  }

  function saveEntry(entry: Entry) {
    if (!activeClient || !activeCategory) return
    update(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === activeClient.id ? {
        ...c,
        categories: c.categories.map(cat => cat.id === activeCategory.id ? {
          ...cat,
          entries: cat.entries.find(e => e.id === entry.id)
            ? cat.entries.map(e => e.id === entry.id ? entry : e)
            : [...cat.entries, entry],
        } : cat),
      } : c),
    }))
    setFormOpen(false); setEditingId(null)
  }
  function removeEntry(entryId: string) {
    if (!activeClient || !activeCategory) return
    update(prev => ({
      ...prev,
      clients: prev.clients.map(c => c.id === activeClient.id ? {
        ...c,
        categories: c.categories.map(cat => cat.id === activeCategory.id
          ? { ...cat, entries: cat.entries.filter(e => e.id !== entryId) } : cat),
      } : c),
    }))
  }
  function startEdit(entryId: string) { setEditingId(entryId); setFormOpen(true) }

  const clientTotals = activeClient ? sumClient(activeClient) : null
  const catTotals = activeCategory ? sumCategory(activeCategory) : null
  const editingEntry = editingId && activeCategory ? activeCategory.entries.find(e => e.id === editingId) ?? null : null

  // ── Grand summary for sidebar ─────────────────────────────────────────────
  const grand = s.clients.reduce<ClientTotals>((a, c) => {
    const t = sumClient(c)
    return { expenseTotal: a.expenseTotal + t.expenseTotal, invoiceTotal: a.invoiceTotal + t.invoiceTotal, fee: a.fee + t.fee, rewardBalance: a.rewardBalance + t.rewardBalance, ophelpBalance: a.ophelpBalance + t.ophelpBalance }
  }, { expenseTotal: 0, invoiceTotal: 0, fee: 0, rewardBalance: 0, ophelpBalance: 0 })

  // ── Styles ────────────────────────────────────────────────────────────────
  const tabBtn = (active: boolean) => ({
    background: active ? T.goldSoft : 'transparent',
    border: `1px solid ${active ? T.goldSoft : 'rgba(255,255,255,0.25)'}`,
    color: active ? T.coverDark : 'rgba(255,255,255,0.75)',
    padding: '8px 16px', fontFamily: serif, fontSize: 13, letterSpacing: 0.4,
    cursor: 'pointer', borderRadius: 2, fontWeight: active ? 600 : 400, transition: 'all .15s',
  } as React.CSSProperties)

  const catTabBtn = (active: boolean) => ({
    background: 'transparent', border: 'none',
    borderBottom: `3px solid ${active ? T.gold : 'transparent'}`,
    padding: '9px 14px', fontFamily: serif, fontSize: 13.5, cursor: 'pointer',
    color: active ? T.ink : T.inkSoft, letterSpacing: 0.3,
    fontWeight: active ? 700 : 400,
  } as React.CSSProperties)

  return (
    <div style={{ fontFamily: serif, color: T.ink, minHeight: '100%', display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ background: T.cover, padding: '18px 22px 14px', borderBottom: '3px double rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderRadius: '8px 8px 0 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
          <h1 style={{ color: T.white, fontSize: 22, letterSpacing: 0.5, margin: 0, fontWeight: 400 }}>
            <b style={{ color: T.goldSoft, fontWeight: 700 }}>OASys</b> · OPHELP Accounting System
          </h1>
          <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: 12.5, fontStyle: 'italic' }}>expense &amp; invoice ledger — reward-linked fee model</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['ledger', 'reports', 'guide'] as const).map(v => (
            <button key={v} style={tabBtn(view === v)} onClick={() => setView(v)}>
              {v === 'guide' ? 'Guide & Advice' : v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Shell */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1, minHeight: 0, borderRadius: '0 0 8px 8px', overflow: 'hidden' }}>
        {/* Sidebar */}
        <aside style={{ background: T.coverDark, padding: '18px 14px', borderRight: `6px solid ${T.cover}`, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: -6, width: 6, background: `repeating-linear-gradient(180deg, ${T.goldSoft} 0 6px, transparent 6px 12px)`, opacity: 0.55 }} />
          <h2 style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', margin: '4px 0 12px', fontWeight: 400 }}>Clients</h2>

          {s.clients.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, fontStyle: 'italic', cursor: 'default' }}>No clients yet</p>
          )}
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: '48vh', overflowY: 'auto' }}>
            {s.clients.map(c => (
              <li key={c.id} onClick={() => selectClient(c.id)}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '9px 10px', borderRadius: 2, cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: 14, borderLeft: `3px solid ${s.activeClientId === c.id ? T.goldSoft : 'transparent'}`, background: s.activeClientId === c.id ? 'rgba(184,134,59,0.18)' : 'transparent', fontWeight: s.activeClientId === c.id ? 600 : 400 }}>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
                <button onClick={ev => { ev.stopPropagation(); removeClient(c.id) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 11, padding: 2 }} title="Remove client">✕</button>
              </li>
            ))}
          </ul>

          {/* Add client */}
          <div style={{ marginTop: 14, display: 'flex', gap: 6 }}>
            <input value={newClientName} onChange={e => setNewClientName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addClient()}
              placeholder="New client name…" maxLength={60}
              style={{ flex: 1, padding: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.05)', color: T.white, borderRadius: 2, fontFamily: serif, fontSize: 13, outline: 'none' }}
            />
            <button onClick={addClient} style={{ background: T.gold, border: 'none', color: T.coverDark, fontWeight: 700, padding: '0 12px', borderRadius: 2, cursor: 'pointer', fontFamily: serif }}>Add</button>
          </div>

          {/* Summary */}
          {s.clients.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)' }}>
              {[
                ['All clients — invoiced', `R ${fmt(grand.invoiceTotal)}`],
                ['Total fee earned', `R ${fmt(grand.fee)}`],
                ['OPHELP balance', `R ${fmt(grand.ophelpBalance)}`],
                ['6X Reward balance', `R ${fmt(grand.rewardBalance)}`],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'rgba(255,255,255,0.65)', padding: '4px 2px' }}>
                  <span>{label}</span><b style={{ color: T.goldSoft, fontFamily: mono }}>{val}</b>
                </div>
              ))}
            </div>
          )}
        </aside>

        {/* Main content */}
        <main style={{ background: T.paper, overflowY: 'auto', overflowX: 'hidden' }}>
          <div style={{ padding: '22px 26px 60px', maxWidth: 1400 }}>

            {view === 'reports' && <ReportsView clients={s.clients} />}
            {view === 'guide' && <GuideView ceLabels={s.ceLabels} onChange={labels => update(prev => ({ ...prev, ceLabels: labels }))} />}

            {view === 'ledger' && (
              <>
                {!activeClient && (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: T.inkSoft }}>
                    <h3 style={{ fontSize: 20, color: T.ink, fontWeight: 400 }}>No clients on the ledger yet</h3>
                    <p>Add a client on the left to open their expense &amp; invoice book — each new client starts with the standard four registers: Jobsheets, Cash Vouchers, Payment Authorisation, Journal Entries.</p>
                  </div>
                )}

                {activeClient && (
                  <>
                    {/* Client header */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderBottom: `2px solid ${T.ink}`, paddingBottom: 10, marginBottom: 16 }}>
                      <h2 style={{ margin: 0, fontSize: 24, fontWeight: 400 }}>{activeClient.name}</h2>
                      <div style={{ fontSize: 12, color: T.inkSoft, fontStyle: 'italic' }}>
                        {activeClient.categories.length} register{activeClient.categories.length !== 1 ? 's' : ''} · {activeClient.categories.reduce((a, c) => a + c.entries.length, 0)} entries logged
                      </div>
                    </div>

                    {/* Stamps */}
                    {clientTotals && (
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 18 }}>
                        {[
                          ['Invoice Total', `R ${fmt(clientTotals.invoiceTotal)}`, T.ink, -3],
                          ['Fee income', `R ${fmt(clientTotals.fee)}`, T.gold, 2],
                          ['OPHELP Balance', `R ${fmt(clientTotals.ophelpBalance)}`, clientTotals.ophelpBalance < 0 ? T.red : T.green, -1.5],
                          ['6X Reward Bal.', `R ${fmt(clientTotals.rewardBalance)}`, T.gold, 2.5],
                        ].map(([label, val, color, rot]) => (
                          <div key={label as string} style={{ border: `1.5px solid ${color}`, borderRadius: '50%', width: 112, height: 112, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `rotate(${rot}deg)`, background: 'rgba(255,255,255,0.35)', color: color as string }}>
                            <span style={{ fontSize: 9, letterSpacing: 1, textTransform: 'uppercase', color: T.inkSoft }}>{label}</span>
                            <span style={{ fontSize: 13, fontWeight: 700, marginTop: 3, fontFamily: mono }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Category tabs */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, borderBottom: `1px solid ${T.rule}`, marginBottom: 14, alignItems: 'center' }}>
                      {activeClient.categories.map(cat => (
                        <div key={cat.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <button style={catTabBtn(activeCategory?.id === cat.id)} onClick={() => selectCategory(cat.id)}>{cat.name}</button>
                          {activeClient.categories.length > 1 && (
                            <button onClick={() => removeCategory(cat.id)} style={{ fontSize: 11, color: T.red, cursor: 'pointer', background: 'none', border: 'none', marginLeft: 2, opacity: 0.6, padding: 2 }}>✕</button>
                          )}
                        </div>
                      ))}
                      <button onClick={addCategory} style={{ marginLeft: 'auto', fontSize: 12, color: T.inkSoft, background: T.white, border: `1px dashed ${T.rule}`, padding: '6px 10px', borderRadius: 2, cursor: 'pointer', fontFamily: serif }}>+ Add register</button>
                    </div>

                    {/* Toolbar */}
                    {catTotals && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <div style={{ color: T.inkSoft, fontSize: 12.5, fontFamily: mono }}>
                          Register total — Invoice R {fmt(catTotals.invoiceTotal)} · Fee R {fmt(catTotals.fee)} · OPHELP Bal R {fmt(catTotals.ophelpBalance)}
                        </div>
                        <button onClick={() => { setFormOpen(f => !f); setEditingId(null) }}
                          style={{ background: T.ink, color: T.white, border: 'none', padding: '9px 16px', borderRadius: 2, cursor: 'pointer', fontSize: 13, letterSpacing: 0.3, fontFamily: serif }}>
                          {formOpen ? 'Close form' : '+ Add entry'}
                        </button>
                      </div>
                    )}

                    {/* Entry form */}
                    {formOpen && activeCategory && (
                      <EntryForm
                        initial={editingEntry ?? blankEntry()}
                        ceLabels={s.ceLabels}
                        isEditing={!!editingEntry}
                        onSave={saveEntry}
                        onCancel={() => { setFormOpen(false); setEditingId(null) }}
                      />
                    )}

                    {/* Ledger table */}
                    {activeCategory && (
                      <LedgerTable
                        cat={activeCategory}
                        ceLabels={s.ceLabels}
                        onEdit={startEdit}
                        onRemove={removeEntry}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
