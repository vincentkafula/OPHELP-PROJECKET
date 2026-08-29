import { useState } from 'react'
import type { SummarySheetData, SummarySheetRow, SummarySheetPettyEntry } from '@/lib/types'
export type { SummarySheetData }

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

export function blankSummarySheetData(): SummarySheetData {
  const today = new Date()
  return {
    day: today.toLocaleDateString('en-ZA', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }),
    session: 'AM & PM', safeNo: '', bagNo: '',
    rows: [
      ...PRESET.map(([no, particulars]): SummarySheetRow => ({ no, particulars, r: '', c: '' })),
      ...Array.from({ length: BLANK_ROWS }, (): SummarySheetRow => ({ no: '', particulars: '', r: '', c: '' })),
    ],
    petty: [
      { no: '', amount: '', detail: '' },
      { no: '', amount: '', detail: '' },
      { no: '', amount: '', detail: '' },
    ],
    receiptTotal: { r: '', c: '' },
    dayAmount: { r: '', c: '' },
    received: '', submitted: '',
  }
}

interface Props {
  initialData?: SummarySheetData
  onSave?: (data: SummarySheetData) => void
  readOnly?: boolean
  footerExtra?: React.ReactNode
}

export default function SummarySheet({ initialData, onSave, readOnly = false, footerExtra }: Props) {
  const [data, setData] = useState<SummarySheetData>(initialData ?? blankSummarySheetData())

  const setField = <K extends keyof SummarySheetData>(field: K, value: SummarySheetData[K]) =>
    setData(d => ({ ...d, [field]: value }))
  const setRow = (i: number, field: keyof SummarySheetRow, value: string) =>
    setData(d => ({ ...d, rows: d.rows.map((row, idx) => idx === i ? { ...row, [field]: value } : row) }))
  const setPetty = (i: number, field: keyof SummarySheetPettyEntry, value: string) =>
    setData(d => ({ ...d, petty: d.petty.map((p, idx) => idx === i ? { ...p, [field]: value } : p) }))

  const subtotal = data.rows.reduce((s, row) => s + num(row.r) + num(row.c) / 100, 0)
  const petty = data.petty.reduce((s, p) => s + num(p.amount), 0)
  const totalPaidOut = subtotal + petty
  const dayAmt = num(data.dayAmount.r) + num(data.dayAmount.c) / 100
  const balance = dayAmt - totalPaidOut

  const inputBase = 'border-0 bg-transparent font-serif text-sm w-full disabled:opacity-70'

  return (
    <div style={{ opacity: readOnly ? 0.92 : 1 }}>
      <div className="w-full bg-white flex flex-col" style={{ border: '1px solid #1C2A28' }}>
        <div className="px-8 py-6 overflow-y-auto font-serif text-black">
          <div className="text-2xl font-bold underline mb-3.5">
            City Shifts:DAY~<input disabled={readOnly} className="border-0 border-b border-black font-serif font-bold text-2xl underline w-80 bg-transparent" value={data.day} onChange={e => setField('day', e.target.value)} />
          </div>
          <div className="flex items-baseline gap-6 font-bold text-base mb-3.5 flex-wrap">
            <span>AM Admin:<input disabled={readOnly} className="border-0 border-b border-black font-serif font-bold w-40 px-1 bg-transparent" value={data.session} onChange={e => setField('session', e.target.value)} /></span>
            <span>Safe N0.C <input disabled={readOnly} className="border-0 border-b border-black font-serif font-bold w-16 underline bg-transparent" value={data.safeNo} onChange={e => setField('safeNo', e.target.value)} /></span>
            <span>Bag No. <input disabled={readOnly} className="border-0 border-b border-black font-serif font-bold w-20 underline bg-transparent" value={data.bagNo} onChange={e => setField('bagNo', e.target.value)} /></span>
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
                {data.rows.map((row, i) => (
                  <tr key={i}>
                    <td className="border border-black p-1"><input disabled={readOnly} className={inputBase} value={row.no} onChange={e => setRow(i, 'no', e.target.value)} /></td>
                    <td className="border border-black p-1"><input disabled={readOnly} className={inputBase} value={row.particulars} onChange={e => setRow(i, 'particulars', e.target.value)} /></td>
                    <td className="border border-black p-1" style={{ width: '16%' }}><input disabled={readOnly} className={`${inputBase} text-right`} placeholder="R" value={row.r} onChange={e => setRow(i, 'r', e.target.value)} /></td>
                    <td className="border border-black p-1" style={{ width: '14%' }}><input disabled={readOnly} className={inputBase} placeholder="c" maxLength={2} value={row.c} onChange={e => setRow(i, 'c', e.target.value)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full min-w-[560px] border-collapse text-sm">
              <tbody>
                {data.petty.map((p, i) => (
                  <tr key={i}>
                    {i === 0 ? <td className="border border-black p-1.5 text-center text-xs font-bold" style={{ width: '6%' }}>Receipt<br />№</td> : <td className="border border-black p-1.5"></td>}
                    <td className="border border-black p-1.5" style={{ width: '12%' }}><input disabled={readOnly} className={inputBase} value={p.no} onChange={e => setPetty(i, 'no', e.target.value)} /></td>
                    <td className="border border-black p-1.5" style={{ width: '12%' }}><input disabled={readOnly} className={inputBase} value={p.amount} onChange={e => setPetty(i, 'amount', e.target.value)} /></td>
                    <td className="border border-black p-1.5"><input disabled={readOnly} className={inputBase} value={p.detail} onChange={e => setPetty(i, 'detail', e.target.value)} /></td>
                    <td className="border border-black p-1.5 text-right font-bold" style={{ width: '28%' }}>
                      {i === 0 ? 'Subtotaal' : i === 1 ? 'Petty Cash Expenses' : 'Total Amount Paid Out'}
                    </td>
                    <td className="border border-black p-1.5 font-bold" style={{ width: '12%' }}>{rands(i === 0 ? subtotal : i === 1 ? petty : totalPaidOut)}</td>
                    <td className="border border-black p-1.5 font-bold" style={{ width: '8%' }}>{cents(i === 0 ? subtotal : i === 1 ? petty : totalPaidOut)}</td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-black p-1.5" colSpan={4}></td>
                  <td className="border border-black p-1.5 text-right font-bold">Receipt Total</td>
                  <td className="border border-black p-1.5"><input disabled={readOnly} className={inputBase} placeholder="0" value={data.receiptTotal.r} onChange={e => setField('receiptTotal', { ...data.receiptTotal, r: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input disabled={readOnly} className={inputBase} placeholder="00" maxLength={2} value={data.receiptTotal.c} onChange={e => setField('receiptTotal', { ...data.receiptTotal, c: e.target.value })} /></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5" colSpan={4}></td>
                  <td className="border border-black p-1.5 text-right font-bold">Day amount Provided</td>
                  <td className="border border-black p-1.5"><input disabled={readOnly} className={inputBase} value={data.dayAmount.r} onChange={e => setField('dayAmount', { ...data.dayAmount, r: e.target.value })} /></td>
                  <td className="border border-black p-1.5"><input disabled={readOnly} className={inputBase} maxLength={2} value={data.dayAmount.c} onChange={e => setField('dayAmount', { ...data.dayAmount, c: e.target.value })} /></td>
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
              <span>Received: <input disabled={readOnly} className="border-0 border-b border-black font-serif w-56 bg-transparent" value={data.received} onChange={e => setField('received', e.target.value)} /></span>
              <div className="text-center text-xs mt-0.5">Day Supervisor</div>
            </div>
            <div>
              <span>Submitted: <input disabled={readOnly} className="border-0 border-b border-black font-serif w-56 bg-transparent" value={data.submitted} onChange={e => setField('submitted', e.target.value)} /></span>
              <div className="text-center text-xs mt-0.5">Day Supervisor</div>
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid #CFC7AF' }}>
          <span className="text-xs text-gray-500">Subtotaal, Total Amount Paid Out and Balance Left Over calculate automatically</span>
          <div className="flex gap-2.5">
            {!readOnly && onSave && (
              <button onClick={() => onSave(data)} className="px-4 py-2 text-xs uppercase border border-black bg-black text-white rounded-sm">Save Summary Sheet</button>
            )}
            {footerExtra}
          </div>
        </div>
      </div>
    </div>
  )
}
