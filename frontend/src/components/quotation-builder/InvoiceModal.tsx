import { useState } from 'react'

const num = (v: string) => { const n = parseFloat(String(v).replace(/[^0-9.-]/g, '')); return isFinite(n) ? n : 0 }
const fmt2 = (n: number) => (isFinite(n) ? n : 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface Row { code: string; desc: string; qty: string; unit: string; uprice: string; disc: string; tax: string; nett: string }
const PRESET: Row[] = [
  { code: '2000300', desc: '02/03/20 Cleaning Hotel field', qty: '', unit: '', uprice: '', disc: '', tax: '0.00', nett: '600.00' },
  { code: '2000100', desc: 'Material', qty: '', unit: '', uprice: '', disc: '', tax: '0.00', nett: '41.70' },
  { code: '2000200', desc: 'Truck hire', qty: '', unit: '', uprice: '', disc: '', tax: '0.00', nett: '150.00' },
  { code: '1000100', desc: 'Admin Fees', qty: '', unit: '', uprice: '', disc: '', tax: '0.00', nett: '197.93' },
]

interface Props { open: boolean; onClose: () => void; onNavigate: (which: 'summary' | 'jobsheet') => void }

export default function InvoiceModal({ open, onClose, onNavigate }: Props) {
  const [rows, setRows] = useState<Row[]>(PRESET)
  const [date, setDate] = useState('13/03/2026'); const [page, setPage] = useState('1'); const [docno, setDocno] = useState('IN103575')
  const [billTo, setBillTo] = useState('Best Western Cape Suites Hotel\nP O Box 51085\nWATERFRONT\n8002\n\ndeputy.gm@capesuites.co.za')
  const [deliverTo, setDeliverTo] = useState('C/O Constitution & De Villiers\nZONNEBLOEM\n7925')
  const [discPct, setDiscPct] = useState('0.00')

  if (!open) return null

  const setRow = (i: number, field: keyof Row, value: string) => setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  const addRow = () => setRows(rs => [...rs, { code: '', desc: '', qty: '', unit: '', uprice: '', disc: '', tax: '', nett: '' }])
  const removeRow = (i: number) => setRows(rs => rs.filter((_, idx) => idx !== i))

  const subtotal = rows.reduce((s, r) => s + num(r.nett), 0)
  const taxTotal = rows.reduce((s, r) => s + num(r.tax), 0)
  const discAmt = subtotal * (num(discPct) / 100)
  const exclTax = subtotal - discAmt
  const total = exclTax + taxTotal

  const inputBase = 'border-0 bg-transparent font-serif text-sm w-full'

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 py-6" style={{ background: 'rgba(28,42,40,0.55)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-3xl bg-white flex flex-col my-3" style={{ border: '1px solid #1C2A28', boxShadow: '0 22px 50px rgba(15,22,20,0.32)' }}>
        <div className="flex justify-between items-start gap-4 px-6 py-5" style={{ borderBottom: '2px solid #000' }}>
          <div>
            <h2 className="font-serif text-lg font-bold m-0">Invoice</h2>
            <span className="text-xs text-gray-500">Facsimile of the printed Straatwerk / OPHELP Projekte Tax Invoice</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-black flex-shrink-0">×</button>
        </div>

        <div className="px-8 py-6 overflow-y-auto font-serif text-black" style={{ maxHeight: '65vh' }}>
          <div className="flex justify-between gap-4 mb-3.5 flex-wrap">
            <div className="flex gap-3 items-start">
              <div className="w-14 h-14 rounded-full border-2 border-black flex items-center justify-center text-2xl flex-shrink-0">✎</div>
              <div>
                <p className="text-xl font-bold tracking-wide m-0 mb-1">STRAATWERK</p>
                <p className="text-xs leading-relaxed m-0">
                  Registered NPO: NPO 003-276<br />
                  Registered PBO 930008075<br />
                  The body of Christ in Action<br />
                  Operations Office: 021425 0140
                </p>
              </div>
            </div>
            <div className="border border-black min-w-[230px]">
              <div className="text-center font-bold p-1.5 border-b border-black">Copy Tax Invoice</div>
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm gap-2.5">
                <label className="font-bold">Date</label><input className={`${inputBase} text-right w-28`} value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm gap-2.5">
                <label className="font-bold">Page</label><input className={`${inputBase} text-right w-28`} value={page} onChange={e => setPage(e.target.value)} />
              </div>
              <div className="flex justify-between items-center px-2.5 py-1.5 text-sm gap-2.5">
                <label className="font-bold">Document No</label><input className={`${inputBase} text-right w-28`} value={docno} onChange={e => setDocno(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="text-sm leading-relaxed mb-3.5">
            Straatwerk - OPHELP Projekte<br />PO Box 910<br />PAROW<br />7449<br />
            Accounts <input className={`${inputBase} inline w-28 border-b border-black`} defaultValue="S Kempen" /><br />
            Office : <input className={`${inputBase} inline w-32 border-b border-black`} defaultValue="021 439 3803" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-0">
            <div className="border border-black p-2">
              <div className="font-bold text-sm mb-1.5 border-b border-black pb-1">Bill to</div>
              <textarea className="w-full border-0 font-serif text-sm leading-relaxed bg-transparent resize-y" style={{ minHeight: 74 }} value={billTo} onChange={e => setBillTo(e.target.value)} />
            </div>
            <div className="border border-black p-2">
              <div className="font-bold text-sm mb-1.5 border-b border-black pb-1">Deliver to</div>
              <textarea className="w-full border-0 font-serif text-sm leading-relaxed bg-transparent resize-y" style={{ minHeight: 74 }} value={deliverTo} onChange={e => setDeliverTo(e.target.value)} />
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full min-w-[760px] border-collapse text-xs">
              <thead>
                <tr>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '9%' }}>Code</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '26%' }}>Description</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '8%' }}>Quantity</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '8%' }}>Unit</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '11%' }}>Unit Price</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '7%' }}>Disc%</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '9%' }}>Tax</th>
                  <th className="border border-black border-t p-1.5 text-left font-bold uppercase" style={{ width: '12%' }}>Nett Price</th>
                  <th className="border border-black border-t p-1.5" style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1"><input className={inputBase} value={r.code} onChange={e => setRow(i, 'code', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={inputBase} value={r.desc} onChange={e => setRow(i, 'desc', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={`${inputBase} text-right`} value={r.qty} onChange={e => setRow(i, 'qty', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={inputBase} value={r.unit} onChange={e => setRow(i, 'unit', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={`${inputBase} text-right`} value={r.uprice} onChange={e => setRow(i, 'uprice', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={`${inputBase} text-right`} value={r.disc} onChange={e => setRow(i, 'disc', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={`${inputBase} text-right`} value={r.tax} onChange={e => setRow(i, 'tax', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={`${inputBase} text-right`} value={r.nett} onChange={e => setRow(i, 'nett', e.target.value)} /></td>
                    <td className="border border-black p-1 text-center"><button onClick={() => removeRow(i)} className="w-5 h-5 rounded border border-gray-400 text-gray-500">×</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={addRow} className="mt-2 border border-dashed border-gray-500 text-gray-600 rounded px-3 py-1.5 text-xs" style={{ fontFamily: "'IBM Plex Sans', sans-serif" }}>+ Add line</button>

          <div className="grid mt-5 gap-4 items-start" style={{ gridTemplateColumns: '1fr 260px' }}>
            <div className="border border-black p-2.5 text-sm leading-relaxed">
              <div>ABSA Parow B/C <input className={`${inputBase} inline w-20 border-b border-black`} defaultValue="632005" /></div>
              <div>OPHELP Projekte</div>
              <div>Account # <input className={`${inputBase} inline w-28 border-b border-black`} defaultValue="9150624420" /></div>
              <div className="mt-2">Received in good order</div>
              <div className="mt-5">Signed___________________ &nbsp;&nbsp; Date__________________</div>
            </div>
            <div className="border border-black">
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Sub Total</span><b>{fmt2(subtotal)}</b></div>
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Discount @ <input className="border-0 border-b border-black font-serif text-sm w-10 text-right bg-transparent" value={discPct} onChange={e => setDiscPct(e.target.value)} />%</span><b>{fmt2(discAmt)}</b></div>
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Amount Excl Tax</span><b>{fmt2(exclTax)}</b></div>
              <div className="flex justify-between items-center px-2.5 py-1.5 border-b border-black text-sm"><span>Tax</span><b>{fmt2(taxTotal)}</b></div>
              <div className="flex justify-between items-center px-2.5 py-1.5 text-base font-bold"><span>Total</span><b>{fmt2(total)}</b></div>
            </div>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2.5">© Softline (Pty) Ltd</div>
        </div>

        <div className="flex justify-between items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid #CFC7AF' }}>
          <span className="text-xs text-gray-500">Facsimile · Sub Total, Discount, Amount Excl Tax, Tax and Total calculate automatically</span>
          <div className="flex gap-2.5">
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={() => onNavigate('summary')}>View Summary Sheet</button>
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={() => onNavigate('jobsheet')}>View Jobsheet</button>
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
