import { useState } from 'react'

const num = (v: string) => { const n = parseFloat(String(v).replace(/[^0-9.-]/g, '')); return isFinite(n) ? n : 0 }
const rands = (n: number) => 'R ' + Math.trunc(n).toLocaleString('en-ZA')
const cents = (n: number) => '.' + Math.round((Math.abs(n) % 1) * 100).toString().padStart(2, '0')

const PRESET: [string, string][] = [
  ['26041601', 'Coaching Admin'], ['26041602', 'Coaching Admin assistant'],
  ['26041603', 'Riebeeck Plein AM'], ['26041604', 'St Georges mail (Strand-wale)'],
  ['26041605', 'St Georges mail (Strand-Riebeeck)'], ['26041606', 'CCID Operations'],
  ['26041607', 'MPRPA Cleaning'], ['26041608', 'SFB Cleaning AM'],
  ['26041609', 'SFB Operations'], ['26041610', 'Jesus Saves Daily AM'],
  ['26041611', 'P1 Litter Picking'], ['26041619', 'P4 Litter Picking'],
  ['26041613', 'CCID Operations PM'], ['26041614', 'CCID Hotspots Cleaning'],
  ['26041615', 'SFB Cleaning PM'], ['26041616', 'SFB (street) Cleaning PM'],
  ['26041617', 'SFB Operations PM'], ['26041618', 'Riebeeck Plein PM'],
]
const BLANK_ROWS = 12

interface Props { open: boolean; onClose: () => void; onNavigate: (which: 'invoice') => void }

export default function SummarySheetModal({ open, onClose, onNavigate }: Props) {
  const [day, setDay] = useState('Thursday, 16 April 2026')
  const [session, setSession] = useState('AM & PM')
  const [safe, setSafe] = useState(''); const [bagno, setBagno] = useState('')
  const [rows, setRows] = useState(() => [
    ...PRESET.map(([no, particulars]) => ({ no, particulars, r: '', c: '' })),
    ...Array.from({ length: BLANK_ROWS }, () => ({ no: '', particulars: '', r: '', c: '' })),
  ])
  const [r1, setR1] = useState({ no: '', amount: '', detail: '' })
  const [r2, setR2] = useState({ no: '', amount: '', detail: '' })
  const [r3, setR3] = useState({ no: '', amount: '', detail: '' })
  const [receiptTotal, setReceiptTotal] = useState({ r: '', c: '' })
  const [dayAmount, setDayAmount] = useState({ r: '2 200', c: '00' })
  const [received, setReceived] = useState(''); const [submitted, setSubmitted] = useState('')

  if (!open) return null

  const setRow = (i: number, field: 'no' | 'particulars' | 'r' | 'c', value: string) =>
    setRows(rs => rs.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  const subtotal = rows.reduce((s, row) => s + num(row.r) + num(row.c) / 100, 0)
  const petty = num(r1.amount) + num(r2.amount) + num(r3.amount)
  const totalPaidOut = subtotal + petty
  const dayAmt = num(dayAmount.r) + num(dayAmount.c) / 100
  const balance = dayAmt - totalPaidOut

  const inputBase = 'border-0 bg-transparent font-serif text-sm w-full'

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 py-6" style={{ background: 'rgba(28,42,40,0.55)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-3xl bg-white flex flex-col my-3" style={{ border: '1px solid #1C2A28', boxShadow: '0 22px 50px rgba(15,22,20,0.32)' }}>
        <div className="flex justify-between items-start gap-4 px-6 py-5" style={{ borderBottom: '2px solid #000' }}>
          <div>
            <h2 className="font-serif text-lg font-bold m-0">Summary Sheet</h2>
            <span className="text-xs text-gray-500">Facsimile of the printed City Shifts AM/PM Summary Sheet</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-black flex-shrink-0">×</button>
        </div>

        <div className="px-8 py-6 overflow-y-auto font-serif text-black" style={{ maxHeight: '65vh' }}>
          <div className="text-2xl font-bold underline mb-3.5">City Shifts:DAY~<input className="border-0 border-b border-black font-serif font-bold text-2xl underline w-80 bg-transparent" value={day} onChange={e => setDay(e.target.value)} /></div>
          <div className="flex items-baseline gap-6 font-bold text-base mb-3.5 flex-wrap">
            <span>AM Admin:<input className="border-0 border-b border-black font-serif font-bold w-40 px-1 bg-transparent" value={session} onChange={e => setSession(e.target.value)} /></span>
            <span>Safe N0.C <input className="border-0 border-b border-black font-serif font-bold w-16 underline bg-transparent" value={safe} onChange={e => setSafe(e.target.value)} /></span>
            <span>Bag No. <input className="border-0 border-b border-black font-serif font-bold w-20 underline bg-transparent" value={bagno} onChange={e => setBagno(e.target.value)} /></span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-black p-1 font-bold text-left" style={{ width: '12%' }}>№</th>
                  <th className="border border-black p-1 font-bold text-left" style={{ width: '58%' }}>Particulars</th>
                  <th className="border border-black p-1 font-bold text-center" colSpan={2} style={{ width: '30%' }}>Paid Out</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1"><input className={inputBase} value={row.no} onChange={e => setRow(i, 'no', e.target.value)} /></td>
                    <td className="border border-black p-1"><input className={inputBase} value={row.particulars} onChange={e => setRow(i, 'particulars', e.target.value)} /></td>
                    <td className="border border-black p-1" style={{ width: '16%' }}><input className={`${inputBase} text-right`} placeholder="R" value={row.r} onChange={e => setRow(i, 'r', e.target.value)} /></td>
                    <td className="border border-black p-1" style={{ width: '14%' }}><input className={inputBase} placeholder="c" maxLength={2} value={row.c} onChange={e => setRow(i, 'c', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 text-center text-xs font-bold" style={{ width: '6%' }}>Receipt<br />№</td>
                  <td className="border border-black p-1.5" style={{ width: '12%' }}><input className={inputBase} value={r1.no} onChange={e => setR1({ ...r1, no: e.target.value })} /></td>
                  <td className="border border-black p-1.5" style={{ width: '12%' }}><input className={inputBase} value={r1.amount} onChange={e => setR1({ ...r1, amount: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r1.detail} onChange={e => setR1({ ...r1, detail: e.target.value })} /></td>
                  <td className="border border-black p-1.5 text-right font-bold" style={{ width: '28%' }}>Subtotaal</td>
                  <td className="border border-black p-1.5 font-bold" style={{ width: '12%' }}>{rands(subtotal)}</td>
                  <td className="border border-black p-1.5 font-bold" style={{ width: '8%' }}>{cents(subtotal)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r2.no} onChange={e => setR2({ ...r2, no: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r2.amount} onChange={e => setR2({ ...r2, amount: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r2.detail} onChange={e => setR2({ ...r2, detail: e.target.value })} /></td>
                  <td className="border border-black p-1.5 text-right font-bold">Petty Cash Expenses</td>
                  <td className="border border-black p-1.5 font-bold">{rands(petty)}</td>
                  <td className="border border-black p-1.5 font-bold">{cents(petty)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r3.no} onChange={e => setR3({ ...r3, no: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r3.amount} onChange={e => setR3({ ...r3, amount: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={r3.detail} onChange={e => setR3({ ...r3, detail: e.target.value })} /></td>
                  <td className="border border-black p-1.5 text-right font-bold">Total Amount Paid Out</td>
                  <td className="border border-black p-1.5 font-bold">{rands(totalPaidOut)}</td>
                  <td className="border border-black p-1.5 font-bold">{cents(totalPaidOut)}</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5" colSpan={4}></td>
                  <td className="border border-black p-1.5 text-right font-bold">Receipt Total</td>
                  <td className="border border-black p-1.5"><input className={inputBase} placeholder="0" value={receiptTotal.r} onChange={e => setReceiptTotal({ ...receiptTotal, r: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} placeholder="00" maxLength={2} value={receiptTotal.c} onChange={e => setReceiptTotal({ ...receiptTotal, c: e.target.value })} /></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5" colSpan={4}></td>
                  <td className="border border-black p-1.5 text-right font-bold">Day amount Provided</td>
                  <td className="border border-black p-1.5"><input className={inputBase} value={dayAmount.r} onChange={e => setDayAmount({ ...dayAmount, r: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input className={inputBase} maxLength={2} value={dayAmount.c} onChange={e => setDayAmount({ ...dayAmount, c: e.target.value })} /></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5" colSpan={4}></td>
                  <td className="border border-black p-1.5 text-right font-bold">Day Cash</td>
                  <td className="border border-black p-1.5"></td>
                  <td className="border border-black p-1.5"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-center text-xs font-bold">Receipt<br />Total</td>
                  <td className="border border-black p-1.5" colSpan={3}></td>
                  <td className="border border-black p-1.5 text-right font-bold">Balance Left Over</td>
                  <td className="border border-black p-1.5 font-bold">{rands(balance)}</td>
                  <td className="border border-black p-1.5 font-bold">{cents(balance)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex justify-between mt-14 px-2.5 flex-wrap gap-5 text-sm">
            <div>
              <span>Received: <input className="border-0 border-b border-black font-serif w-56 bg-transparent" value={received} onChange={e => setReceived(e.target.value)} /></span>
              <div className="text-center text-xs mt-0.5">Day Supervisor</div>
            </div>
            <div>
              <span>Submitted: <input className="border-0 border-b border-black font-serif w-56 bg-transparent" value={submitted} onChange={e => setSubmitted(e.target.value)} /></span>
              <div className="text-center text-xs mt-0.5">Day Supervisor</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid #CFC7AF' }}>
          <span className="text-xs text-gray-500">Facsimile · Subtotaal, Total Amount Paid Out and Balance Left Over calculate automatically</span>
          <div className="flex gap-2.5">
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={() => onNavigate('invoice')}>View Invoice</button>
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
