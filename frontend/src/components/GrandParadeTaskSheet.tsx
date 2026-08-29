import { useState, useEffect, useCallback } from 'react'
import type { TaskSheetData, TaskSheetRatedTask } from '@/lib/types'
export type { TaskSheetData }

// ── Design tokens — cream/serif letterhead palette, matching the
// partner-facing TaskSheetModal template used in the Quotation Builder. ──
const C = {
  navy: '#1C2A28', navyDark: '#1C2A28', green: '#1C2A28', greenDark: '#1C2A28',
  greenLight: '#EFEBDF', blueLight: '#FBF9F3', blueMid: '#A97D2C',
  orange: '#7C5A1E', orangeLight: '#EFEBDF',
  purple: '#48605B', purpleLight: '#EFEBDF',
  teal: '#48605B', tealLight: '#EFEBDF',
  line: '#CFC7AF', paper: '#FFFFFF', ink: '#1C2A28', muted: '#48605B',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type RatedTask = TaskSheetRatedTask
type Meta = TaskSheetData['meta']
type Materials = TaskSheetData['materials']
type SheetState = TaskSheetData

function blankTask(): RatedTask { return { slight: false, dirty: false, veryDirty: false, comment: '', bags: '', minutes: '' } }
export function blankState(): SheetState {
  const today = new Date()
  const yyyy = today.getFullYear(), mm = String(today.getMonth() + 1).padStart(2, '0'), dd = String(today.getDate()).padStart(2, '0')
  const dayName = today.toLocaleDateString('en-ZA', { weekday: 'long' })
  return {
    meta: { shifttime: 'AM up to roll call of PM shifts.', day: dayName, date: `${yyyy}-${mm}-${dd}`, senior: '', junior: '' },
    tasks: [blankTask(), blankTask(), blankTask(), blankTask()],
    suggestions: '', materials: { glovesUsed: '', bagsUsed: '', materialsType: '', materialsQty: '', minutesTotal: '' },
    specialInstructions: '',
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function CellInput({ value, onChange, placeholder, textarea, height }: { value: string; onChange: (v: string) => void; placeholder?: string; textarea?: boolean; height?: number }) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: C.ink, border: 'none',
    background: 'transparent', width: '100%', outline: 'none', padding: '4px 5px', resize: 'none',
    lineHeight: 1.4, height: textarea ? (height ?? 56) : undefined,
  }
  const [focused, setFocused] = useState(false)
  const style = { ...baseStyle, background: focused ? '#FFF7D6' : 'transparent' }
  if (textarea) return (
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={style} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  )
  return (
    <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={style} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
  )
}

// ── Static task labels ────────────────────────────────────────────────────────
const TASK_LABELS: React.ReactNode[] = [
  <><span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>1.</span>Assist Preschool Administration in administrating <i><u>TeamQ</u>s</i> and in organising the area cleaning duty of the teams in rotation, keeping record of the teams' next turn</>,
  <><span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>2.</span>Be roll called for this <b>Grand Parade shift</b>, receive your workers, do the <i><u>Team Talk</u></i>, and then keep the OPHELP deployment area clean until the end of the shift.</>,
  <><span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>3.</span>Using the OPHELP skills of <i>Co-operation</i>, <i>Focus</i>, and <i>Overcoming Obstacles</i>, and <i>God's design for how to get it right</i>, to get everyone in the area to act orderly.</>,
  <><span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>4.</span>Assist Preschool Administration and the helpers to distribute food and to clean up afterwards</>,
]

// ── Export ────────────────────────────────────────────────────────────────────
function exportJSON(s: SheetState) {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `grand-parade-task-sheet-${s.meta.date || 'export'}.json`; a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ─────────────────────────────────────────────────────────────
interface GrandParadeTaskSheetProps {
  initialData?: SheetState
  onSave?: (data: SheetState) => void
  readOnly?: boolean
  footerExtra?: React.ReactNode
}

export default function GrandParadeTaskSheet({ initialData, onSave, readOnly = false, footerExtra }: GrandParadeTaskSheetProps = {}) {
  const [s, setS] = useState<SheetState>(initialData ?? blankState)

  // Auto-update day name when date changes
  useEffect(() => {
    if (!s.meta.date) return
    const d = new Date(s.meta.date + 'T12:00:00')
    if (!isNaN(d.getTime())) {
      const dayName = d.toLocaleDateString('en-ZA', { weekday: 'long' })
      if (dayName !== s.meta.day) setS(prev => ({ ...prev, meta: { ...prev.meta, day: dayName } }))
    }
  }, [s.meta.date])

  const setMeta = useCallback((key: keyof Meta, val: string) =>
    setS(prev => ({ ...prev, meta: { ...prev.meta, [key]: val } })), [])
  const setTask = useCallback((idx: number, key: keyof RatedTask, val: string | boolean) =>
    setS(prev => { const tasks = [...prev.tasks]; tasks[idx] = { ...tasks[idx], [key]: val }; return { ...prev, tasks } }), [])
  const setMat = useCallback((key: keyof Materials, val: string) =>
    setS(prev => ({ ...prev, materials: { ...prev.materials, [key]: val } })), [])

  function resetForm() {
    if (!confirm('Clear all entered data on this task sheet?')) return
    setS(blankState())
  }

  // Shared styles
  const sheetBorder: React.CSSProperties = { border: `1px solid ${C.navy}`, borderRadius: 0, overflow: 'hidden', background: C.paper }
  const thStyle = (bg: string): React.CSSProperties => ({ background: bg, color: '#fff', fontSize: 11.5, fontWeight: 800, padding: '8px 5px', textAlign: 'center', border: `1px solid ${C.line}` })
  const tdTask: React.CSSProperties = { border: `1px solid ${C.line}`, padding: '9px 10px', fontSize: 13, fontWeight: 600, lineHeight: 1.35, verticalAlign: 'top', width: '34%' }
  const tdRate: React.CSSProperties = { border: `1px solid ${C.line}`, textAlign: 'center', verticalAlign: 'middle', padding: '10px 0', width: '7%' }
  const tdComment: React.CSSProperties = { border: `1px solid ${C.line}`, verticalAlign: 'top', width: '26%' }
  const tdNum: React.CSSProperties = { border: `1px solid ${C.line}`, textAlign: 'center', verticalAlign: 'middle', width: '11%' }

  return (
    <div style={{ background: '#EFEBDF', padding: '20px 8px 60px', fontFamily: "'IBM Plex Sans', sans-serif", color: C.ink }}>
      {/* Sheet */}
      <div style={{ maxWidth: 1100, margin: '0 auto', ...sheetBorder, opacity: readOnly ? 0.92 : 1, pointerEvents: readOnly ? 'none' : 'auto' }}>

        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: `2px solid ${C.navy}` }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
                <label style={{ fontWeight: 800, color: C.navy, fontSize: 14, whiteSpace: 'nowrap' }}>Shift Title:</label>
                <span style={{ fontWeight: 700, fontStyle: 'italic', fontSize: 17, fontFamily: "'Fraunces', serif", color: C.ink, borderBottom: `1px solid ${C.line}`, padding: '2px 6px', minWidth: 220 }}>GRAND PARADE</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <label style={{ fontWeight: 800, color: C.navy, fontSize: 14, whiteSpace: 'nowrap' }}>Shift Time:</label>
                <input value={s.meta.shifttime} onChange={e => setMeta('shifttime', e.target.value)}
                  style={{ fontWeight: 700, fontSize: 13.5, border: 'none', borderBottom: `1px solid ${C.line}`, background: 'transparent', outline: 'none', padding: '4px 5px', minWidth: 320, flex: 1, fontFamily: "'IBM Plex Sans', sans-serif", color: C.ink }} />
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.greenDark, whiteSpace: 'nowrap' }}>Version 260806</div>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', borderBottom: `2px solid ${C.navy}` }}>
          {([
            { label: 'Day:', field: 'day' as const, placeholder: 'e.g. Monday' },
            { label: 'Date:', field: 'date' as const, type: 'date' },
            { label: 'Senior Leader:', field: 'senior' as const, placeholder: 'Name' },
            { label: 'Junior Leader:', field: 'junior' as const, placeholder: 'Name' },
          ] as const).map((cell, i, arr) => (
            <div key={cell.field} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRight: i < arr.length - 1 ? `2px solid ${C.navy}` : 'none', flex: 1, minWidth: 170 }}>
              <label style={{ fontWeight: 700, fontSize: 13, color: C.navy, whiteSpace: 'nowrap' }}>{cell.label}</label>
              <input type={(cell as { type?: string }).type ?? 'text'} value={s.meta[cell.field]} onChange={e => setMeta(cell.field, e.target.value)}
                placeholder={(cell as { placeholder?: string }).placeholder}
                style={{ fontWeight: 700, fontSize: 12.5, border: 'none', borderBottom: `1px solid ${C.line}`, background: 'transparent', outline: 'none', padding: '3px 5px', flex: 1, fontFamily: "'IBM Plex Sans', sans-serif", color: C.ink }} />
            </div>
          ))}
        </div>

        {/* Objectives / Instructions */}
        <div style={{ borderBottom: `3px solid ${C.navy}`, padding: '14px 18px' }}>
          <h3 style={{ margin: '0 0 6px', fontSize: 15, fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.ink }}>OBJECTIVES of the Shift</h3>
          <ol style={{ margin: '0 0 4px', paddingLeft: 22 }}>
            {[
              'Training in leading a team on a mission',
              'Keeping the OPHELP Deployment area (as defined by the map of this area around Grand PARADE) clean',
              'Keeping the OPHELP Deployment area safe and everyone in the area acting orderly',
              'Training in proper reporting and training in taking leadership initiative',
            ].map((item, i) => <li key={i} style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, lineHeight: 1.35 }}>{item}</li>)}
          </ol>
          <h3 style={{ margin: '14px 0 6px', fontSize: 15, fontFamily: "'Fraunces', serif", fontWeight: 600, color: C.ink }}>GENERAL INSTRUCTIONS for the shift</h3>
          <ol style={{ margin: '0 0 4px', paddingLeft: 22 }}>
            <li style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, lineHeight: 1.35 }}>Prepare for the shift, the day before.</li>
            <li style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, lineHeight: 1.35 }}>Report as leader for the shift at the Shift Leader roll-call at the Depot and get all the equipment for the shift, using the required <u style={{ fontStyle: 'italic' }}>Shift Slip</u></li>
            <li style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 3, lineHeight: 1.35 }}>Perform the specific Tasks listed here below until the roll call of PM shifts and report on these tasks as requested on this <u style={{ fontStyle: 'italic' }}>Task Sheet</u></li>
          </ol>
        </div>

        {/* Task table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ ...thStyle(C.navy), width: '34%', textAlign: 'left', paddingLeft: 10 }}>Specific Tasks</th>
              <th style={{ ...thStyle(C.orange), width: '7%' }}>Slight</th>
              <th style={{ ...thStyle(C.orange), width: '7%' }}>Dirty</th>
              <th style={{ ...thStyle(C.orange), width: '7%' }}>Very<br />dirty</th>
              <th style={{ ...thStyle(C.purple), width: '26%' }}>Comment</th>
              <th style={{ ...thStyle(C.teal), width: '11%' }}>Number<br />Of bags<br />used</th>
              <th style={{ ...thStyle(C.blueMid), width: '11%' }}>Minutes<br />on the<br />job</th>
            </tr>
          </thead>
          <tbody>
            {/* Rated tasks 1–4 */}
            {TASK_LABELS.map((label, i) => (
              <tr key={i}>
                <td style={tdTask}>{label}</td>
                {(['slight', 'dirty', 'veryDirty'] as const).map(key => (
                  <td key={key} style={tdRate}>
                    <input type="checkbox" checked={s.tasks[i][key] as boolean}
                      onChange={e => setTask(i, key, e.target.checked)}
                      style={{ width: 18, height: 18, cursor: 'pointer', accentColor: C.orange }} />
                  </td>
                ))}
                <td style={tdComment}>
                  <CellInput textarea value={s.tasks[i].comment} onChange={v => setTask(i, 'comment', v)} placeholder="Comment..." />
                </td>
                <td style={tdNum}>
                  <input value={s.tasks[i].bags} onChange={e => setTask(i, 'bags', e.target.value)}
                    style={{ textAlign: 'center', fontWeight: 700, padding: '14px 5px', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
                </td>
                <td style={tdNum}>
                  <input value={s.tasks[i].minutes} onChange={e => setTask(i, 'minutes', e.target.value)}
                    style={{ textAlign: 'center', fontWeight: 700, padding: '14px 5px', border: 'none', background: 'transparent', outline: 'none', width: '100%', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
                </td>
              </tr>
            ))}

            {/* Task 5 — wide row */}
            <tr>
              <td colSpan={7} style={{ border: `1px solid ${C.line}`, padding: '8px 10px', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                <span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>5.</span>
                End the shift at PM deployment (12:30), with the Preschool Administrator managing the report-back. Return to the Depot for rewards and materials return.
              </td>
            </tr>

            {/* Task 6 — wide row */}
            <tr>
              <td colSpan={7} style={{ border: `1px solid ${C.line}`, padding: '8px 10px', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                <span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>6.</span>
                <b>Report all interruptions that occurred on the shift</b> — including possible toilet visits — in the comment column, noting the exact time the interruption occurred, by what it was caused, and by what time the interruption ended
              </td>
            </tr>

            {/* Task 7 — suggestions */}
            <tr>
              <td colSpan={7} style={{ border: `1px solid ${C.line}`, padding: '8px 10px 4px', fontSize: 13, fontWeight: 600, lineHeight: 1.35 }}>
                <span style={{ fontWeight: 800, color: C.navy, marginRight: 4 }}>7.</span>
                Write down some suggestions about how to improve our performance to achieve the <u><b>OBJECTIVES of the shift</b></u> (above)?
                <div style={{ marginTop: 4 }}>
                  <CellInput textarea height={70} value={s.suggestions} onChange={v => setS(prev => ({ ...prev, suggestions: v }))} placeholder="Write suggestions here..." />
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* Materials */}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ background: C.greenLight }}>
              <td style={{ border: `1px solid ${C.line}`, padding: '7px 10px', fontSize: 12.5, fontWeight: 800, color: C.navy, verticalAlign: 'middle', width: '22%' }}>Materials Report:</td>
              <td style={{ border: `1px solid ${C.line}`, padding: '7px 10px', fontSize: 12, textAlign: 'right', fontWeight: 700, width: '22%', verticalAlign: 'middle' }}>Total Number of<br /><b>Gloves</b> used</td>
              <td style={{ border: `1px solid ${C.line}`, padding: '3px', width: '6%', verticalAlign: 'middle' }}>
                <input value={s.materials.glovesUsed} onChange={e => setMat('glovesUsed', e.target.value)}
                  style={{ textAlign: 'center', fontWeight: 800, border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '7px 4px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
              </td>
              <td style={{ border: `1px solid ${C.line}`, padding: '7px 10px', fontSize: 12, textAlign: 'right', fontWeight: 700, width: '26%', verticalAlign: 'middle' }}>Total number of <b>bags</b> used</td>
              <td style={{ border: `1px solid ${C.line}`, padding: '3px', width: '6%', verticalAlign: 'middle' }}>
                <input value={s.materials.bagsUsed} onChange={e => setMat('bagsUsed', e.target.value)}
                  style={{ textAlign: 'center', fontWeight: 800, border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '7px 4px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
              </td>
              <td style={{ border: `1px solid ${C.line}`, padding: '3px', width: '6%', background: '#F5F3EA', verticalAlign: 'middle' }}>
                <input disabled placeholder="auto" style={{ textAlign: 'center', color: C.muted, border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '7px 4px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
              </td>
            </tr>
            <tr style={{ background: C.blueLight }}>
              <td style={{ border: `1px solid ${C.line}`, padding: '7px 10px', fontSize: 12.5, verticalAlign: 'middle' }}>
                <span style={{ fontWeight: 800, color: C.navy }}>Materials</span> used (specify type)<br />
                <input value={s.materials.materialsType} onChange={e => setMat('materialsType', e.target.value)}
                  placeholder="Type of material..."
                  style={{ border: 'none', borderBottom: `1px solid ${C.line}`, background: 'transparent', outline: 'none', width: '100%', padding: '3px 5px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: C.ink }} />
              </td>
              <td style={{ border: `1px solid ${C.line}`, padding: '7px 10px', textAlign: 'right', fontWeight: 700, fontSize: 12, verticalAlign: 'middle' }}>Quantity</td>
              <td style={{ border: `1px solid ${C.line}`, padding: '3px', verticalAlign: 'middle' }}>
                <input value={s.materials.materialsQty} onChange={e => setMat('materialsQty', e.target.value)}
                  style={{ textAlign: 'center', fontWeight: 800, border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '7px 4px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
              </td>
              <td style={{ border: `1px solid ${C.line}`, padding: '7px 10px', textAlign: 'right', fontWeight: 700, fontSize: 12, verticalAlign: 'middle' }}>Total of <b>minutes</b> on the job</td>
              <td colSpan={2} style={{ border: `1px solid ${C.line}`, padding: '3px', verticalAlign: 'middle' }}>
                <input value={s.materials.minutesTotal} onChange={e => setMat('minutesTotal', e.target.value)}
                  style={{ textAlign: 'center', fontWeight: 800, border: 'none', background: 'transparent', outline: 'none', width: '100%', padding: '7px 4px', fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5 }} />
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom block */}
        <div style={{ display: 'flex' }}>
          <div style={{ flex: 1, background: C.orangeLight, padding: '12px 16px', borderRight: `2px solid ${C.navy}` }}>
            <div style={{ fontWeight: 800, color: C.orange, fontSize: 13, marginBottom: 8 }}>Usual set of Materials for this shift:</div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {['4 x Gloves', '2 x Foremen Bibs', '2 x Worker Bibs + 2 bibs for recruits', '10 x COCT blue Bags', '1 x Scoop & 1 x Broom'].map(item => (
                <li key={item} style={{ fontWeight: 700, fontSize: 13, marginBottom: 4, color: C.ink }}>{item}</li>
              ))}
            </ul>
          </div>
          <div style={{ flex: 1, background: C.purpleLight, padding: '12px 16px' }}>
            <div style={{ fontWeight: 800, color: C.purple, fontSize: 13, marginBottom: 8 }}>Special Instructions for the shift (including a written report on them here):</div>
            <textarea value={s.specialInstructions} onChange={e => setS(prev => ({ ...prev, specialInstructions: e.target.value }))}
              placeholder="Write special instructions or report here..."
              style={{ height: 110, width: '100%', background: '#fff', border: `1px solid ${C.line}`, borderRadius: 4, padding: 8, fontFamily: "'IBM Plex Sans', sans-serif", fontSize: 12.5, color: C.ink, resize: 'none', outline: 'none' }} />
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 4px 0', maxWidth: 1100, margin: '0 auto' }}>
        {!readOnly && <button onClick={resetForm} style={{ background: '#fff', color: '#B23A3A', border: '1px solid #B23A3A', borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer' }}>
          Clear form
        </button>}
        <button onClick={() => window.print()} style={{ background: '#fff', color: C.navy, border: `1px solid ${C.navy}`, borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer' }}>
          Print
        </button>
        <button onClick={() => exportJSON(s)} style={{ background: '#fff', color: C.navy, border: `1px solid ${C.navy}`, borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer' }}>
          Export JSON
        </button>
        {!readOnly && onSave && <button onClick={() => onSave(s)} style={{ background: C.navy, color: '#fff', border: `1px solid ${C.navy}`, borderRadius: 0, padding: '10px 18px', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4, cursor: 'pointer' }}>
          Save Task Sheet
        </button>}
        {footerExtra}
      </div>
    </div>
  )
}
