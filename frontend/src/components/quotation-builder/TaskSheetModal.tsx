import { useEffect, useState } from 'react'

export interface TaskSheetFormData {
  shiftTitle: string
  shiftTime: string
  day: string
  date: string
  tasks: string[]
  gloves: string
  bags: string
  minutes: string
  otherMaterials: string
  special: string
}

const DEFAULT_TASKS = [
  "Assist Administration in administrating TeamQs and in organising the area cleaning duty of the teams in rotation, keeping record of the teams' next turn",
  'Be roll called for this shift, receive your workers, do the Team Talk, and then keep the OPHELP deployment area clean until the end of the shift.',
  'Using the OPHELP skills of Co-operation, Focus, and Overcoming Obstacles, get everyone in the area to act orderly.',
  'Assist Administration and the helpers to distribute food and to clean up afterwards',
  'End the shift at PM deployment (12:30), with the Administrator managing the report-back. Return to the Depot for rewards and materials return.',
  'Report all interruptions that occur on the shift — including possible toilet visits — noting the exact time, cause, and end time.',
  'Note any suggestions on how to improve performance to achieve the Objectives of the shift (above).',
]

export function emptyTaskSheet(): TaskSheetFormData {
  return {
    shiftTitle: '', shiftTime: 'AM up to roll call of PM shifts', day: '', date: '',
    tasks: [...DEFAULT_TASKS], gloves: '', bags: '', minutes: '', otherMaterials: '', special: '',
  }
}

export function compileTaskSheet(d: TaskSheetFormData): string {
  const tasks = d.tasks.map(t => t.trim()).filter(Boolean)
  const lines: string[] = []
  lines.push(`Shift: ${d.shiftTitle} — ${d.shiftTime}`)
  if (d.day || d.date) lines.push(`Day/Date: ${[d.day, d.date].filter(Boolean).join(' / ')}`)
  lines.push('')
  lines.push('Specific tasks:')
  tasks.forEach((t, i) => lines.push(`${i + 1}. ${t}`))
  const materialsBits: string[] = []
  if (d.gloves) materialsBits.push(`${d.gloves} gloves`)
  if (d.bags) materialsBits.push(`${d.bags} bags`)
  if (d.otherMaterials) materialsBits.push(d.otherMaterials)
  if (materialsBits.length) { lines.push(''); lines.push(`Materials needed: ${materialsBits.join(', ')}`) }
  if (d.minutes) lines.push(`Estimated time on the job: ${d.minutes} minutes`)
  if (d.special) { lines.push(''); lines.push(`Special instructions: ${d.special}`) }
  return lines.join('\n')
}

const inputCls = 'w-full text-sm px-2.5 py-2 border rounded-[2px] bg-white'
const inputStyle = { fontFamily: "'IBM Plex Sans', sans-serif", borderColor: '#CFC7AF', color: '#1C2A28' }
const labelCls = 'block mb-1.5'
const labelStyle = { fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.64rem', letterSpacing: '0.06em', textTransform: 'uppercase' as const, color: '#5C7266' }

interface Props {
  open: boolean
  onClose: () => void
  onSave: (summary: string, data: TaskSheetFormData) => void
  initial: TaskSheetFormData
  defaultTitle?: string
}

export default function TaskSheetModal({ open, onClose, onSave, initial, defaultTitle }: Props) {
  const [data, setData] = useState<TaskSheetFormData>(initial)

  useEffect(() => {
    if (open) setData(d => ({ ...d, shiftTitle: d.shiftTitle || defaultTitle || '' }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const change = (field: keyof TaskSheetFormData, value: string) => setData(d => ({ ...d, [field]: value }))
  const changeTask = (i: number, value: string) => setData(d => ({ ...d, tasks: d.tasks.map((t, idx) => idx === i ? value : t) }))
  const removeTask = (i: number) => setData(d => ({ ...d, tasks: d.tasks.filter((_, idx) => idx !== i) }))
  const addTask = () => setData(d => ({ ...d, tasks: [...d.tasks, ''] }))

  const save = () => {
    const tasks = data.tasks.map(t => t.trim()).filter(Boolean)
    if (!data.shiftTitle.trim() || tasks.length === 0) {
      window.alert('Please give the shift a title and at least one specific task before saving.')
      return
    }
    onSave(compileTaskSheet({ ...data, tasks }), { ...data, tasks })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-4 py-6"
      style={{ background: 'rgba(28,42,40,0.55)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-3xl bg-white flex flex-col my-3"
        style={{ border: '1px solid #1C2A28', boxShadow: '0 18px 44px rgba(0,0,0,0.28)' }}
      >
        <div className="flex justify-between items-start gap-4 px-6 py-5" style={{ borderBottom: '2px solid #1C2A28', background: '#E4DFD0' }}>
          <div>
            <h2 style={{ fontFamily: "'Fraunces', serif", fontWeight: 600, fontSize: '1.15rem', color: '#1C2A28', margin: 0 }}>Task Sheet</h2>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', color: '#48605B' }}>
              Attached document · fill in before submitting the quotation request
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ border: '1px solid #1C2A28', color: '#1C2A28' }}
          >×</button>
        </div>

        <div className="px-6 py-5 overflow-y-auto" style={{ maxHeight: '65vh' }}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-5 mb-5" style={{ borderBottom: '1px solid #CFC7AF' }}>
            <div>
              <label className={labelCls} style={labelStyle}>Shift title</label>
              <input className={inputCls} style={inputStyle} value={data.shiftTitle} onChange={e => change('shiftTitle', e.target.value)} placeholder="e.g. Grand Parade" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Shift time</label>
              <select className={inputCls} style={inputStyle} value={data.shiftTime} onChange={e => change('shiftTime', e.target.value)}>
                <option value="AM up to roll call of PM shifts">AM up to roll call of PM shifts</option>
                <option value="PM shift (12:30 deployment)">PM shift (12:30 deployment)</option>
                <option value="Full day (AM + PM)">Full day (AM + PM)</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Day</label>
              <input className={inputCls} style={inputStyle} value={data.day} onChange={e => change('day', e.target.value)} placeholder="e.g. Wednesday" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Date</label>
              <input type="date" className={inputCls} style={inputStyle} value={data.date} onChange={e => change('date', e.target.value)} />
            </div>
          </div>

          <div className="p-4 mb-5 text-sm" style={{ background: '#E4DFD0', border: '1px solid #CFC7AF', color: '#48605B', lineHeight: 1.6 }}>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1C2A28', margin: '0 0 8px' }}>Objectives of the shift</h4>
                <ol className="pl-4 m-0" style={{ fontSize: '0.78rem' }}>
                  <li>Training in leading a team on a mission</li>
                  <li>Keeping the OPHELP deployment area (as defined by the map of this area) clean</li>
                  <li>Keeping the OPHELP deployment area safe and everyone in the area acting orderly</li>
                  <li>Training in proper reporting and taking leadership initiative</li>
                </ol>
              </div>
              <div>
                <h4 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1C2A28', margin: '0 0 8px' }}>General instructions for the shift</h4>
                <ol className="pl-4 m-0" style={{ fontSize: '0.78rem' }}>
                  <li>Prepare for the shift the day before.</li>
                  <li>Report as leader at the Shift Leader roll-call at the Depot and collect equipment using the required Shift Slip.</li>
                  <li>Perform the specific tasks listed below until roll call of PM shifts and report on these tasks on this Task Sheet.</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 mt-6 mb-3">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1C2A28' }}>Specific tasks</span>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.7rem', color: '#48605B' }}>— edit to match this site, or add your own</span>
            <span className="flex-1 h-px" style={{ background: '#CFC7AF' }} />
          </div>
          <div>
            {data.tasks.map((t, i) => (
              <div key={i} className="flex gap-3 items-start py-2.5" style={{ borderBottom: '1px solid #CFC7AF' }}>
                <div className="w-5 flex-shrink-0 pt-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.78rem', color: '#7C5A1E' }}>{i + 1}.</div>
                <textarea
                  rows={2}
                  className="flex-1 text-sm px-2.5 py-2 border rounded-[2px] resize-y"
                  style={{ ...inputStyle, minHeight: 44 }}
                  value={t}
                  onChange={e => changeTask(i, e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeTask(i)}
                  className="w-[30px] h-[30px] rounded-[2px] flex-shrink-0 mt-1.5"
                  style={{ border: '1px solid #CFC7AF', color: '#48605B' }}
                >×</button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addTask}
            className="mt-2.5 px-3.5 py-2 text-xs rounded-[2px]"
            style={{ border: '1px dashed #48605B', color: '#48605B', background: 'none' }}
          >+ Add task</button>

          <div className="flex items-center gap-2.5 mt-6 mb-3">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1C2A28' }}>Materials needed</span>
            <span style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '0.7rem', color: '#48605B' }}>— estimate for this job</span>
            <span className="flex-1 h-px" style={{ background: '#CFC7AF' }} />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-1.5">
            <div>
              <label className={labelCls} style={labelStyle}>Gloves needed</label>
              <input inputMode="numeric" className={inputCls} style={inputStyle} value={data.gloves} onChange={e => change('gloves', e.target.value)} placeholder="e.g. 4" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Bags needed</label>
              <input inputMode="numeric" className={inputCls} style={inputStyle} value={data.bags} onChange={e => change('bags', e.target.value)} placeholder="e.g. 10" />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Est. minutes on the job</label>
              <input inputMode="numeric" className={inputCls} style={inputStyle} value={data.minutes} onChange={e => change('minutes', e.target.value)} placeholder="e.g. 240" />
            </div>
          </div>
          <div className="mt-3">
            <label className={labelCls} style={labelStyle}>Other materials (specify type &amp; quantity)</label>
            <input className={inputCls} style={inputStyle} value={data.otherMaterials} onChange={e => change('otherMaterials', e.target.value)} placeholder="e.g. 2 x extra bibs, 1 x extra broom" />
          </div>

          <div className="p-3.5 mt-4 text-sm" style={{ background: '#E4DFD0', border: '1px solid #CFC7AF', color: '#48605B' }}>
            <h4 style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.66rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1C2A28', margin: '0 0 8px' }}>Usual set of materials for this shift (reference)</h4>
            4 x Gloves · 2 x Foreman Bibs · 2 x Worker Bibs + 2 for recruits · 10 x COCT blue bags · 1 x Scoop &amp; 1 x Broom
          </div>

          <div className="flex items-center gap-2.5 mt-6 mb-3">
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1C2A28' }}>Special instructions for the shift</span>
            <span className="flex-1 h-px" style={{ background: '#CFC7AF' }} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Including any written report or site-specific notes</label>
            <textarea
              className="w-full text-sm px-2.5 py-2 border rounded-[2px] resize-y"
              style={{ ...inputStyle, minHeight: 70 }}
              value={data.special}
              onChange={e => change('special', e.target.value)}
              placeholder="Access instructions, hazards, contact on site, timing constraints..."
            />
          </div>
        </div>

        <div className="flex justify-between items-center gap-3 px-6 py-4 mt-2" style={{ borderTop: '1px solid #CFC7AF', background: '#FBF9F3' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.64rem', color: '#48605B' }}>GRAND_PARADE Task Sheet template</span>
          <div className="flex gap-2.5">
            <button
              type="button" onClick={onClose}
              className="px-4 py-2 text-xs uppercase tracking-wide rounded-[2px]"
              style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #1C2A28', color: '#1C2A28', background: 'none' }}
            >Cancel</button>
            <button
              type="button" onClick={save}
              className="px-4 py-2 text-xs uppercase tracking-wide rounded-[2px]"
              style={{ fontFamily: "'IBM Plex Mono', monospace", border: '1px solid #A97D2C', color: '#FBF9F3', background: '#A97D2C' }}
            >Save &amp; insert task detail</button>
          </div>
        </div>
      </div>
    </div>
  )
}
