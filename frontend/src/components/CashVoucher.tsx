import { useState, useEffect, useCallback } from 'react'

// ── Fonts ─────────────────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    const id = 'cv-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  ink: '#14201E', ink2: '#1D2E2A', paper: '#F4F0E4', paper2: '#EAE4D4',
  amber: '#E8A33D', amberD: '#7A5015', teal: '#1F6F6B', tealD: '#0E3532',
  coral: '#D65B3C', coralD: '#6E2C1B', slate: '#6B7370',
  line: 'rgba(20,32,30,0.16)', lineStrong: 'rgba(20,32,30,0.32)',
}
const display = "'Oswald','Segoe UI',sans-serif"
const mono = "'IBM Plex Mono','SF Mono',Consolas,monospace"
const body = "'Inter','Segoe UI',Arial,sans-serif"

// ── State ─────────────────────────────────────────────────────────────────────
interface VoucherState {
  voucherNo: string; day: string; date: string; takenBy: string
  amount: string; change: string; purpose: string; approvedBy: string
  txSupplier: string; txAmount: string
  account: string; column: string; captionC: string; captionE: string; ophelpBalance: string
  pay: string; transport: string; material: string; admin: string; other: string; fee: string
  client: string
}

function today() {
  const d = new Date()
  return d.toISOString().slice(0, 10)
}
function dayName(iso: string) {
  const d = new Date(iso + 'T12:00:00')
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-ZA', { weekday: 'long' })
}
function blank(): VoucherState {
  const dt = today()
  return {
    voucherNo: '', day: dayName(dt), date: dt,
    takenBy: '', amount: '', change: '', purpose: '', approvedBy: '',
    txSupplier: '', txAmount: '',
    account: '', column: '', captionC: '', captionE: '', ophelpBalance: '',
    pay: '', transport: '', material: '', admin: '', other: '', fee: '',
    client: '',
  }
}
function fmtNum(v: string) { const n = parseFloat(v); return isNaN(n) ? '0.00' : n.toFixed(2) }
function sumInvoice(s: VoucherState) {
  return ['pay', 'transport', 'material', 'admin', 'other', 'fee']
    .reduce((acc, k) => acc + (parseFloat((s as unknown as Record<string, string>)[k]) || 0), 0)
}

// ── Shared field components ───────────────────────────────────────────────────
function FI({ label, value, onChange, placeholder, type = 'text', mono: useMono }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; type?: string; mono?: boolean
}) {
  const [foc, setFoc] = useState(false)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.slate }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
        style={{ fontFamily: useMono ? mono : body, fontSize: 14, color: T.ink, background: 'transparent', border: 'none', borderBottom: `1px ${foc ? 'solid' : 'dashed'} ${foc ? T.teal : T.lineStrong}`, padding: '3px 2px 5px', outline: 'none', width: '100%' }}
      />
    </div>
  )
}

function AmtField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [foc, setFoc] = useState(false)
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em', color: T.coralD }}>{label}</label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontFamily: mono, fontWeight: 600, fontSize: 13 }}>R</span>
        <input type="number" step="0.01" value={value} onChange={e => onChange(e.target.value)} placeholder="0.00"
          onFocus={() => setFoc(true)} onBlur={() => setFoc(false)}
          style={{ fontFamily: mono, fontWeight: 600, fontSize: 14, color: T.ink, background: 'transparent', border: 'none', borderBottom: `1px ${foc ? 'solid' : 'dashed'} ${foc ? T.teal : T.lineStrong}`, padding: '3px 2px 5px', outline: 'none', flex: 1 }}
        />
      </div>
    </div>
  )
}

function LineInput({ value, onChange, placeholder, readOnly, bold, color }: {
  value: string; onChange?: (v: string) => void; placeholder?: string
  readOnly?: boolean; bold?: boolean; color?: string
}) {
  return (
    <input type={readOnly ? 'text' : 'number'} step="0.01" value={value}
      onChange={e => onChange?.(e.target.value)} placeholder={placeholder}
      readOnly={readOnly}
      style={{ fontFamily: mono, fontSize: readOnly ? 14 : 13, fontWeight: bold ? 600 : 400, color: color ?? T.ink, background: 'transparent', border: 'none', outline: 'none', width: '100%', textAlign: 'right' }}
    />
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CashVoucher() {
  useFonts()
  const [s, setS] = useState<VoucherState>(blank)

  // Auto-update day name when date changes
  useEffect(() => {
    if (!s.date) return
    const name = dayName(s.date)
    if (name && name !== s.day) setS(prev => ({ ...prev, day: name }))
  }, [s.date])

  const set = useCallback((k: keyof VoucherState, v: string) =>
    setS(prev => ({ ...prev, [k]: v })), [])

  const invoiceTotal = sumInvoice(s)

  function clearForm() {
    if (!confirm('Clear all data on this cash voucher?')) return
    setS(blank())
  }

  const cellLbl = (text: string, opts?: { white?: boolean; bold?: boolean }): React.CSSProperties => ({
    fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em',
    color: opts?.white ? 'rgba(244,240,228,0.6)' : T.slate,
    fontWeight: opts?.bold ? 600 : 400, flexShrink: 0,
  })

  const lcell = (w?: number): React.CSSProperties => ({
    padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8,
    ...(w ? { width: w, flexShrink: 0 } : { flex: 1 }),
  })

  return (
    <div style={{ background: T.paper, minHeight: '100%', fontFamily: body, color: T.ink, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 620, margin: '0 auto', padding: '28px 20px 60px' }}>

        {/* Top tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.amber, border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 700, fontSize: 14, color: T.ink, flexShrink: 0 }}>
              OP
            </div>
            <div style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.slate }}>
              City: Ophelp — Projekte
            </div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: T.slate, textAlign: 'right' }}>
            Voucher no.{' '}
            <input value={s.voucherNo} onChange={e => set('voucherNo', e.target.value)}
              placeholder="______"
              style={{ fontFamily: mono, fontSize: 11, color: T.ink, background: 'transparent', border: 'none', borderBottom: `1px dashed ${T.lineStrong}`, outline: 'none', width: 72, padding: '2px 2px' }} />
          </div>
        </div>

        {/* Voucher card */}
        <div style={{ position: 'relative', background: T.paper2, border: `1.5px solid ${T.ink}`, borderRadius: 4, padding: '26px 26px 4px', overflow: 'visible' }}>

          {/* Perforated top edge */}
          <div style={{
            position: 'absolute', left: -1, right: -1, top: 0, height: 12,
            backgroundImage: `radial-gradient(circle at 10px 0, transparent 5px, ${T.paper} 5.5px)`,
            backgroundSize: '20px 12px', backgroundRepeat: 'repeat-x', transform: 'translateY(-6px)',
            pointerEvents: 'none',
          }} />

          {/* V-head */}
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h1 style={{ fontFamily: display, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 22, margin: '0 0 2px' }}>
              Cash Voucher
            </h1>
            <div style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: T.slate }}>
              Petty cash disbursement slip
            </div>
          </div>

          {/* Day + Date */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <FI label="Day" value={s.day} onChange={v => set('day', v)} placeholder="e.g. Thursday" />
            <FI label="Date" value={s.date} onChange={v => set('date', v)} type="date" />
          </div>

          {/* Taken by */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <FI label="Taken by" value={s.takenBy} onChange={v => set('takenBy', v)} placeholder="Full name" />
          </div>

          {/* Amount + Change */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <AmtField label="Amount" value={s.amount} onChange={v => set('amount', v)} />
            <AmtField label="Change" value={s.change} onChange={v => set('change', v)} />
          </div>

          {/* Purpose */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <FI label="Purpose" value={s.purpose} onChange={v => set('purpose', v)} placeholder="What is this cash for?" />
          </div>

          {/* Approved by */}
          <div style={{ display: 'flex', gap: 18, marginBottom: 12 }}>
            <FI label="Approved by" value={s.approvedBy} onChange={v => set('approvedBy', v)} placeholder="Signature / name" />
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: T.lineStrong, margin: '18px 0 14px' }} />

          {/* Transaction strip */}
          <div style={{ display: 'flex', border: `1.5px solid ${T.ink}`, marginBottom: 2 }}>
            <div style={{ background: T.ink, color: T.paper, fontFamily: display, fontWeight: 600, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 12px', display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              Transaction
            </div>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderLeft: `1px solid ${T.lineStrong}`, borderRight: `1px solid ${T.lineStrong}` }}>
              <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate, flexShrink: 0 }}>Supplier</span>
              <input value={s.txSupplier} onChange={e => set('txSupplier', e.target.value)} placeholder="Supplier name"
                style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: body, fontSize: 13, width: '100%' }} />
            </div>
            <div style={{ width: 128, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontFamily: mono, fontWeight: 600, fontSize: 14 }}>
              <span>R</span>
              <input type="number" step="0.01" value={s.txAmount} onChange={e => set('txAmount', e.target.value)} placeholder="0.00"
                style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: mono, fontWeight: 600, fontSize: 14, width: '100%' }} />
            </div>
          </div>

          {/* Ledger */}
          <div style={{ border: `1px solid ${T.lineStrong}`, borderTop: 'none', marginBottom: 0 }}>
            {/* Head row */}
            <div style={{ display: 'flex', borderTop: `1px solid ${T.lineStrong}`, background: T.paper }}>
              <div style={{ ...lcell(96), fontWeight: 600 }}><span style={cellLbl('Expense')}>Expense</span></div>
              <div style={lcell()}>
                <span style={cellLbl('Account')}>Account</span>
                <input value={s.account} onChange={e => set('account', e.target.value)} placeholder="Account name"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: body, fontSize: 13, flex: 1 }} />
              </div>
              <div style={lcell()}>
                <span style={cellLbl('Column')}>Column</span>
                <input value={s.column} onChange={e => set('column', e.target.value)} placeholder="Column ref"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: body, fontSize: 13, flex: 1 }} />
              </div>
            </div>
            {/* Caption row */}
            <div style={{ display: 'flex', borderTop: `1px solid ${T.lineStrong}` }}>
              <div style={lcell(96)}><span style={cellLbl('Caption')}>Caption</span></div>
              <div style={{ display: 'flex', flex: 1 }}>
                <div style={{ ...lcell(), borderLeft: `1px solid ${T.lineStrong}` }}>
                  <span style={cellLbl('C · R')}>C · R</span>
                  <input type="number" step="0.01" value={s.captionC} onChange={e => set('captionC', e.target.value)} placeholder="0.00"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: body, fontSize: 13, width: '100%' }} />
                </div>
                <div style={{ ...lcell(), borderLeft: `1px solid ${T.lineStrong}` }}>
                  <span style={cellLbl('E · R')}>E · R</span>
                  <input type="number" step="0.01" value={s.captionE} onChange={e => set('captionE', e.target.value)} placeholder="0.00"
                    style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: body, fontSize: 13, width: '100%' }} />
                </div>
              </div>
            </div>
            {/* Balance row */}
            <div style={{ display: 'flex', borderTop: `1px solid ${T.lineStrong}`, background: T.ink, color: T.paper }}>
              <div style={lcell(96)}>
                <span style={{ fontFamily: display, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'rgba(244,240,228,0.6)', fontWeight: 600 }}>Ophelp balance</span>
              </div>
              <div style={{ ...lcell(), flex: 1 }} />
              <div style={{ ...lcell(120), flexShrink: 0 }}>
                <span style={{ ...cellLbl('R', { white: true }), marginRight: 2 }}>R</span>
                <input type="number" step="0.01" value={s.ophelpBalance} onChange={e => set('ophelpBalance', e.target.value)} placeholder="0.00"
                  style={{ border: 'none', background: 'transparent', outline: 'none', fontFamily: mono, fontWeight: 600, fontSize: 14, color: T.amber, width: '100%' }} />
              </div>
            </div>
          </div>

          {/* Invoice block */}
          <div style={{ display: 'flex', border: `1px solid ${T.lineStrong}`, borderTop: `1px solid ${T.lineStrong}`, marginBottom: 0 }}>
            <div style={{ width: 84, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 13, borderRight: `1px solid ${T.lineStrong}`, textAlign: 'center', padding: 6 }}>
              Invoice
            </div>
            <div style={{ flex: 1 }}>
              {([
                ['Pay', 'pay'], ['Transport', 'transport'], ['Material', 'material'],
                ['Admin', 'admin'], ['Other', 'other'], ['Fee', 'fee'],
              ] as [string, keyof VoucherState][]).map(([label, key], i) => (
                <div key={key} style={{ display: 'flex', borderTop: i === 0 ? 'none' : `1px solid ${T.line}` }}>
                  <div style={{ ...lcell(96) }}><span style={cellLbl(label)}>{label}</span></div>
                  <div style={{ ...lcell(), justifyContent: 'flex-end' }}>
                    <span style={{ ...cellLbl('R'), marginRight: 2 }}>R</span>
                    <LineInput value={s[key] as string} onChange={v => set(key, v)} placeholder="0.00" />
                  </div>
                </div>
              ))}
              {/* Invoice total */}
              <div style={{ display: 'flex', borderTop: `1px solid ${T.lineStrong}`, background: T.paper }}>
                <div style={lcell(96)}>
                  <span style={{ fontFamily: display, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.03em', color: T.ink, fontWeight: 600 }}>Invoice total</span>
                </div>
                <div style={{ ...lcell(), justifyContent: 'flex-end' }}>
                  <span style={{ ...cellLbl('R'), marginRight: 2 }}>R</span>
                  <LineInput value={invoiceTotal.toFixed(2)} readOnly bold color={T.tealD} />
                </div>
              </div>
            </div>
          </div>

          {/* Client */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 2px 20px' }}>
            <label style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate, flexShrink: 0 }}>Client</label>
            <input value={s.client} onChange={e => set('client', e.target.value)} placeholder="Client name"
              style={{ flex: 1, border: 'none', borderBottom: `1px dashed ${T.lineStrong}`, background: 'transparent', outline: 'none', fontFamily: body, fontSize: 13, padding: '3px 2px' }} />
          </div>
        </div>

        {/* Footer note */}
        <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 10, color: T.slate, marginTop: 16, letterSpacing: '0.02em' }}>
          Ophelp Servor · Operational Files · Cash Voucher for City Depot
        </div>

        {/* Print bar */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={clearForm}
            style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', background: 'transparent', color: T.ink, border: `1px solid ${T.lineStrong}`, borderRadius: 3, padding: '8px 16px', cursor: 'pointer' }}>
            Clear form
          </button>
          <button onClick={() => window.print()}
            style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', background: T.ink, color: T.paper, border: 'none', borderRadius: 3, padding: '8px 16px', cursor: 'pointer' }}>
            Print voucher
          </button>
        </div>

      </div>
    </div>
  )
}
