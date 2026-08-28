import { useState } from 'react'

const num = (v: string) => { const n = parseFloat(String(v).replace(/[^0-9.-]/g, '')); return isFinite(n) ? n : 0 }
const fmt = (n: number) => 'R ' + (isFinite(n) ? n : 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const PRESET_ROWS = [
  { label: 'Afternoon Shift:', special: true, time: '07:00-12:00' },
  { label: 'Foreman:', payroll: 'Payroll/165/R120' },
  { label: '①', payroll: 'Payroll/110/R70' },
  { label: '②', payroll: 'Payroll/110/R70' },
]
const BLANK_ROWS = 8

interface Acct { name: string; C: string; E: string; Transport: string; Material: string; Other: string }
const emptyAcct = (name = ''): Acct => ({ name, C: '', E: '', Transport: '', Material: '', Other: '' })

interface Props { open: boolean; onClose: () => void; onNavigate: (which: 'summary' | 'invoice') => void }

export default function JobsheetModal({ open, onClose, onNavigate }: Props) {
  const [day, setDay] = useState('Thursday')
  const [date, setDate] = useState('16 April 2026')
  const [serial, setSerial] = useState('26041601'.split(''))
  const [names, setNames] = useState(() => Array.from({ length: PRESET_ROWS.length + BLANK_ROWS }, () => ({ name: '', eval: '', amount: '', signed: '' })))
  const [cashPaid, setCashPaid] = useState(''); const [cashBy, setCashBy] = useState('')
  const [elecPaid, setElecPaid] = useState('')
  const [acct1, setAcct1] = useState<Acct>(emptyAcct('GSCID Operational'))
  const [acct2, setAcct2] = useState<Acct>(emptyAcct())
  const [area, setArea] = useState(''); const [task, setTask] = useState('')
  const [bagsIssued, setBagsIssued] = useState(''); const [bagsReturned, setBagsReturned] = useState(''); const [bagsUsed, setBagsUsed] = useState('')
  const [gloveIssued, setGloveIssued] = useState(''); const [gloveReturned, setGloveReturned] = useState(''); const [gloveUsed, setGloveUsed] = useState('')
  const [km, setKm] = useState('')
  const [client1, setClient1] = useState('GSCID Operational'); const [client2, setClient2] = useState('')

  if (!open) return null

  const acct1Total = num(acct1.C) + num(acct1.E) + num(acct1.Transport) + num(acct1.Material) + num(acct1.Other)
  const acct2Total = num(acct2.C) + num(acct2.E) + num(acct2.Transport) + num(acct2.Material) + num(acct2.Other)
  const fee1 = acct1Total * 0.25, fee2 = acct2Total * 0.25
  const totalC = num(acct1.C) + num(acct2.C), totalE = num(acct1.E) + num(acct2.E)
  const subtotal = acct1Total + acct2Total

  const inputBase = 'border-0 border-b border-black bg-transparent font-serif text-sm'

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto p-4 py-6" style={{ background: 'rgba(28,42,40,0.55)' }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-3xl bg-white flex flex-col my-3" style={{ border: '1px solid #1C2A28', boxShadow: '0 22px 50px rgba(15,22,20,0.32)' }}>
        <div className="flex justify-between items-start gap-4 px-6 py-5" style={{ borderBottom: '2px solid #000', background: '#fff' }}>
          <div>
            <h2 className="font-serif text-lg font-bold m-0">Jobsheet</h2>
            <span className="text-xs text-gray-500">Facsimile of the printed GSCID Special Operations Jobsheet</span>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full border border-black flex-shrink-0">×</button>
        </div>

        <div className="px-8 py-6 overflow-y-auto font-serif text-black" style={{ maxHeight: '65vh' }}>
          <div className="text-center text-3xl font-bold mb-2">Projek OPRUIM</div>
          <div className="flex justify-center mb-2"><span className="border-4 border-double border-black px-6 py-1 font-bold">GSCID Special Operations</span></div>
          <div className="text-center font-bold text-lg mb-1">JOBSHEET</div>
          <div className="text-center text-sm mb-4">PAID OUT FROM WHAT WAS RECEIVED AS DONATIONS</div>

          <div className="flex items-center gap-3 mb-3 flex-wrap">
            <div className="flex items-center gap-1.5 border border-black px-2.5 py-1 text-sm">
              <label className="font-bold">Day:</label>
              <input className={inputBase} value={day} onChange={e => setDay(e.target.value)} />
            </div>
            <div className="flex items-center gap-1.5 border border-black px-2.5 py-1 text-sm">
              <label className="font-bold">Date:</label>
              <input className={inputBase} value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="flex ml-auto">
              {serial.map((d, i) => (
                <input key={i} maxLength={1} value={d} onChange={e => {
                  const v = e.target.value.replace(/[^0-9]/g, '').slice(0, 1)
                  setSerial(s => s.map((x, idx) => idx === i ? v : x))
                }} className="w-6 h-8 text-center border border-black -ml-px first:ml-0" />
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '38%' }}>Name</th>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '10%' }}>Eval</th>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '24%' }}>Amount</th>
                  <th className="border border-black p-1.5 font-bold" style={{ width: '28%' }}>Signed</th>
                </tr>
              </thead>
              <tbody>
                {PRESET_ROWS.map((r, i) => (
                  <tr key={`p${i}`}>
                    {r.special ? (
                      <>
                        <td className="border border-black p-1"><b>{r.label}</b></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-xs"><u>Time:</u> {r.time}</td>
                      </>
                    ) : (
                      <>
                        <td className="border border-black p-1"><span className="font-bold">{r.label}</span> <input className={inputBase} placeholder="Name" style={{ width: '60%' }} /></td>
                        <td className="border border-black p-1"></td>
                        <td className="border border-black p-1 text-xs">{r.payroll}</td>
                        <td className="border border-black p-1"><input className={inputBase} style={{ width: '100%' }} /></td>
                      </>
                    )}
                  </tr>
                ))}
                {names.slice(PRESET_ROWS.length).map((_, i) => (
                  <tr key={`b${i}`}>
                    <td className="border border-black p-1"><input className={inputBase} style={{ width: '100%' }} /></td>
                    <td className="border border-black p-1"><input className={inputBase} style={{ width: '100%', textAlign: 'center' }} /></td>
                    <td className="border border-black p-1"><input className={inputBase} style={{ width: '100%' }} /></td>
                    <td className="border border-black p-1"><input className={inputBase} style={{ width: '100%' }} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto -mt-px">
            <table className="w-full min-w-[600px] border-collapse text-sm">
              <tbody>
                <tr>
                  <td className="border border-black p-1.5 font-bold whitespace-nowrap">Cash paid out:</td>
                  <td className="border border-black p-1.5 font-bold text-lg">R <input className={inputBase} style={{ width: 90 }} value={cashPaid} onChange={e => setCashPaid(e.target.value)} /></td>
                  <td className="border border-black p-1.5">by: <input className={inputBase} style={{ width: 140 }} placeholder="Name" value={cashBy} onChange={e => setCashBy(e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 font-bold">Electronic via Payroll</td>
                  <td className="border border-black p-1.5 font-bold text-lg">R <input className={inputBase} style={{ width: 90 }} value={elecPaid} onChange={e => setElecPaid(e.target.value)} /></td>
                  <td className="border border-black p-1.5"></td>
                </tr>
                {[['1', acct1, setAcct1], ['2', acct2, setAcct2]].map(([n, a, setA]: any) => (
                  <tr key={n}>
                    <td className="border border-black p-1.5 font-bold whitespace-nowrap">TOTAL for Account {n}</td>
                    <td className="border border-black p-1.5" colSpan={2}>
                      <input className={`${inputBase} font-bold mb-1.5`} style={{ width: '100%' }} placeholder={`Account ${n} name`} value={a.name} onChange={e => setA({ ...a, name: e.target.value })} />
                      <div className="grid grid-cols-6 gap-1.5 text-center">
                        {['C', 'E', 'Transport', 'Material', 'Other'].map(f => (
                          <div key={f}>
                            <label className="block font-bold text-xs">{f}</label>
                            <input className="w-full text-center border border-gray-400 font-serif text-sm p-0.5" value={(a as any)[f]} onChange={e => setA({ ...a, [f]: e.target.value })} />
                          </div>
                        ))}
                        <div><label className="block font-bold text-xs">Fee 25%</label><b className="text-sm">{fmt(n === '1' ? fee1 : fee2)}</b></div>
                      </div>
                    </td>
                  </tr>
                ))}
                <tr>
                  <td className="border border-black p-1.5 font-bold">Area: <input className={inputBase} value={area} onChange={e => setArea(e.target.value)} /></td>
                  <td className="border border-black p-1.5" colSpan={2}>
                    <div className="grid grid-cols-4 gap-1.5 text-center">
                      <div><label className="block font-bold text-xs">C</label><b className="text-sm">{fmt(totalC)}</b></div>
                      <div><label className="block font-bold text-xs">E</label><b className="text-sm">{fmt(totalE)}</b></div>
                      <div><label className="block font-bold text-xs">Subtotal</label><b className="text-sm">{fmt(subtotal)}</b></div>
                      <div><label className="block font-bold text-xs">Invoice Total</label><b className="text-sm">{fmt(subtotal + fee1 + fee2)}</b></div>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 font-bold">Task: <input className={inputBase} value={task} onChange={e => setTask(e.target.value)} /></td>
                  <td className="border border-black p-1.5 text-center font-bold" colSpan={2}>Invoice(s)</td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5">
                    <div className="text-sm mb-1.5"><b>Bags:</b> Issued <input className="w-11 text-center border border-gray-400 mx-1.5" value={bagsIssued} onChange={e => setBagsIssued(e.target.value)} /> Returned <input className="w-11 text-center border border-gray-400 mx-1.5" value={bagsReturned} onChange={e => setBagsReturned(e.target.value)} /> Used <input className="w-11 text-center border border-gray-400 mx-1.5" value={bagsUsed} onChange={e => setBagsUsed(e.target.value)} /></div>
                    <div className="text-sm flex items-center gap-1.5"><label className="font-bold">Transport Kilometers:</label><input className="w-16 text-center border border-gray-400" value={km} onChange={e => setKm(e.target.value)} /></div>
                  </td>
                  <td className="border border-black p-1.5 text-center"><label className="block text-xs font-bold">Total 1</label><b>{fmt(acct1Total + fee1)}</b></td>
                  <td className="border border-black p-1.5 text-center"><label className="block text-xs font-bold">Client 1</label><input className={`${inputBase} text-center font-bold`} style={{ width: '100%' }} value={client1} onChange={e => setClient1(e.target.value)} /></td>
                </tr>
                <tr>
                  <td className="border border-black p-1.5 text-sm"><b>Glove:</b> Issued <input className="w-11 text-center border border-gray-400 mx-1.5" value={gloveIssued} onChange={e => setGloveIssued(e.target.value)} /> Returned <input className="w-11 text-center border border-gray-400 mx-1.5" value={gloveReturned} onChange={e => setGloveReturned(e.target.value)} /> Used <input className="w-11 text-center border border-gray-400 mx-1.5" value={gloveUsed} onChange={e => setGloveUsed(e.target.value)} /></td>
                  <td className="border border-black p-1.5 text-center"><label className="block text-xs font-bold">Total 2</label><b>{fmt(acct2Total + fee2)}</b></td>
                  <td className="border border-black p-1.5 text-center"><label className="block text-xs font-bold">Client 2</label><input className={`${inputBase} text-center font-bold`} style={{ width: '100%' }} placeholder="Client 2 name" value={client2} onChange={e => setClient2(e.target.value)} /></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="text-center text-xs text-gray-500 mt-2.5">OPHELP documents\4 Daily Betaalstate\Betaalstate\1 Wednesday\GSCID Paysheets\GSCID Team II.doc</div>
        </div>

        <div className="flex justify-between items-center gap-3 px-6 py-4" style={{ borderTop: '1px solid #CFC7AF' }}>
          <span className="text-xs text-gray-500">Facsimile · fields are live and calculate automatically</span>
          <div className="flex gap-2.5">
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={() => onNavigate('summary')}>View Summary Sheet</button>
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={() => onNavigate('invoice')}>View Invoice</button>
            <button className="px-4 py-2 text-xs uppercase border border-black" onClick={onClose}>Close</button>
          </div>
        </div>
      </div>
    </div>
  )
}
