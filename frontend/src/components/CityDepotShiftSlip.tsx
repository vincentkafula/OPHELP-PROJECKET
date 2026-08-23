import { useState, useEffect, useCallback } from 'react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  navy: '#173B73', green: '#3E7D3E', blueLight: '#E4EEF7', blueMid: '#5B95BE',
  orange: '#E07B39', purple: '#6B4A7A', purpleLight: '#EFE3F2',
  line: '#B9C7DA', paper: '#FFFFFF', ink: '#16233F', muted: '#6B7686',
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface EquipRow { item: string; request: string; supplied: string; signed1: string; returned: string; signed2: string; consumption: string }
interface Meta { day: string; date: string; time: string; foreman: string; area: string; workers: string }

function blankRow(item = ''): EquipRow { return { item, request: '', supplied: '', signed1: '', returned: '', signed2: '', consumption: '' } }
function uid() { return Math.random().toString(36).slice(2, 9) }
interface Row extends EquipRow { id: string }
function makeRow(item = ''): Row { return { id: uid(), ...blankRow(item) } }

const PRESET_ITEMS = ['Bibs (Foreman)', 'Bibs (1st Team)', 'Bibs (Workers)']
const BLANK_COUNT = 14

function initRows(): Row[] {
  return [
    ...PRESET_ITEMS.map(makeRow),
    ...Array.from({ length: BLANK_COUNT }, () => makeRow()),
  ]
}

// ── Shared cell input ─────────────────────────────────────────────────────────
function CI({ value, onChange, placeholder, center, bold, bg }: { value: string; onChange: (v: string) => void; placeholder?: string; center?: boolean; bold?: boolean; bg?: string }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        fontFamily: "'Segoe UI', Arial, sans-serif", fontSize: 13, color: C.ink,
        border: 'none', background: focused ? '#FFF7D6' : (bg ?? 'transparent'),
        width: '100%', outline: 'none', padding: '5px 6px',
        textAlign: center ? 'center' : 'left',
        fontWeight: bold ? 700 : 400,
      }}
    />
  )
}

// ── Export ────────────────────────────────────────────────────────────────────
function exportJSON(meta: Meta, rows: Row[], consumables: Row) {
  const data = { meta, equipmentRows: rows.map(({ id: _id, ...r }) => r), consumables: (({ id: _id, ...r }) => r)(consumables) }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a'); a.href = url; a.download = `shift-slip-${meta.date || 'export'}.json`; a.click()
  URL.revokeObjectURL(url)
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CityDepotShiftSlip() {
  const today = new Date()
  const yyyy = today.getFullYear(), mm = String(today.getMonth() + 1).padStart(2, '0'), dd = String(today.getDate()).padStart(2, '0')
  const [meta, setMeta] = useState<Meta>({
    day: today.toLocaleDateString('en-ZA', { weekday: 'long' }),
    date: `${yyyy}-${mm}-${dd}`, time: '', foreman: '', area: '', workers: '',
  })
  const [rows, setRows] = useState<Row[]>(initRows)
  const [consumables, setConsumables] = useState<Row>(makeRow())

  // Auto day name from date
  useEffect(() => {
    if (!meta.date) return
    const d = new Date(meta.date + 'T12:00:00')
    if (!isNaN(d.getTime())) {
      const name = d.toLocaleDateString('en-ZA', { weekday: 'long' })
      if (name !== meta.day) setMeta(prev => ({ ...prev, day: name }))
    }
  }, [meta.date])

  const setMetaField = useCallback((k: keyof Meta, v: string) => setMeta(prev => ({ ...prev, [k]: v })), [])
  const setRowField = useCallback((id: string, k: keyof EquipRow, v: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, [k]: v } : r)), [])
  const setConsField = useCallback((k: keyof EquipRow, v: string) =>
    setConsumables(prev => ({ ...prev, [k]: v })), [])

  function addRow() { setRows(prev => [...prev, makeRow()]) }
  function resetForm() {
    if (!confirm('Clear all entered data on this shift slip?')) return
    setMeta(prev => ({ ...prev, time: '', foreman: '', area: '', workers: '' }))
    setRows([...PRESET_ITEMS.map(makeRow), ...Array.from({ length: BLANK_COUNT }, () => makeRow())])
    setConsumables(makeRow())
  }

  // ── Column defs ──────────────────────────────────────────────────────────────
  const COL_HEADERS: { label: string; bg: string; key: keyof EquipRow }[] = [
    { label: 'Request', bg: C.green, key: 'request' },
    { label: 'Supplied', bg: C.green, key: 'supplied' },
    { label: 'Signed', bg: C.blueMid, key: 'signed1' },
    { label: 'Returned', bg: C.orange, key: 'returned' },
    { label: 'Signed', bg: C.blueMid, key: 'signed2' },
    { label: 'Consumption', bg: C.purple, key: 'consumption' },
  ]

  const thRot = (bg: string, label: string): React.CSSProperties => ({
    writingMode: 'vertical-rl', textAlign: 'center', fontSize: 10.5, fontWeight: 700,
    padding: '8px 2px', color: '#fff', background: bg, border: `1px solid ${C.line}`,
    width: '11.3%',
  })

  return (
    <div style={{ background: '#EDF1F6', padding: '20px 8px 60px', fontFamily: "'Segoe UI', Arial, sans-serif", color: C.ink }}>
      <div style={{ maxWidth: 840, margin: '0 auto', background: C.paper, border: `3px solid ${C.navy}`, borderRadius: 6, overflow: 'hidden' }}>

        {/* Title */}
        <div style={{ textAlign: 'center', padding: '16px 10px 10px', borderBottom: `2px solid ${C.navy}`, fontSize: 24, fontWeight: 800, color: C.navy, textDecoration: 'underline', letterSpacing: 0.3 }}>
          CITY DEPOT: Shift Slip
        </div>

        {/* Meta row */}
        <div style={{ display: 'flex', borderBottom: `2px solid ${C.navy}` }}>
          {([
            { label: 'Day:', field: 'day' as const, placeholder: 'e.g. Monday' },
            { label: 'Date:', field: 'date' as const, type: 'date' },
            { label: 'Time:', field: 'time' as const, placeholder: 'e.g. 08:00-12:00' },
          ] as const).map((cell, i, arr) => (
            <div key={cell.field} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRight: i < arr.length - 1 ? `2px solid ${C.navy}` : 'none' }}>
              <label style={{ fontWeight: 800, fontSize: 14, color: C.navy, whiteSpace: 'nowrap' }}>{cell.label}</label>
              <input
                type={(cell as { type?: string }).type ?? 'text'}
                value={meta[cell.field]}
                onChange={e => setMetaField(cell.field, e.target.value)}
                placeholder={(cell as { placeholder?: string }).placeholder}
                style={{ fontWeight: 700, fontSize: 13, border: 'none', borderBottom: `1px solid ${C.line}`, background: 'transparent', outline: 'none', padding: '4px 5px', flex: 1, fontFamily: "'Segoe UI', Arial, sans-serif", color: C.ink }}
              />
            </div>
          ))}
        </div>

        {/* Foreman / Area / Workers */}
        <div style={{ padding: '12px 16px', borderBottom: `3px solid ${C.navy}` }}>
          {([
            { label: 'Foreman:', field: 'foreman' as const, highlight: true as boolean, placeholder: 'Foreman name' },
            { label: 'Area:', field: 'area' as const, highlight: false as boolean, placeholder: 'Deployment area' },
            { label: 'Workers:', field: 'workers' as const, highlight: false as boolean, placeholder: 'Worker names' },
          ]).map((row, i, arr) => (
            <div key={row.field} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < arr.length - 1 ? 12 : 0 }}>
              <label style={{ fontWeight: 800, fontSize: 14, color: C.navy, minWidth: 88 }}>{row.label}</label>
              <input
                value={meta[row.field]}
                onChange={e => setMetaField(row.field, e.target.value)}
                placeholder={row.placeholder}
                style={{
                  fontWeight: 700, fontSize: 13, fontFamily: "'Segoe UI', Arial, sans-serif", color: C.ink, flex: 1,
                  outline: 'none', padding: row.highlight ? '8px 10px' : '4px 5px',
                  border: row.highlight ? `1.5px solid ${C.line}` : 'none',
                  borderBottom: !row.highlight ? `1.5px solid ${C.line}` : undefined,
                  borderRadius: row.highlight ? 3 : 0,
                  background: row.highlight ? C.blueLight : 'transparent',
                }}
              />
            </div>
          ))}
        </div>

        {/* Equipment table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th style={{ background: C.navy, color: '#fff', textAlign: 'left', fontSize: 16, fontWeight: 800, padding: '12px 10px', border: `1px solid ${C.line}`, width: '32%' }}>
                Equipment <span style={{ fontWeight: 400, fontSize: 15, marginLeft: 6 }}>↓</span>
              </th>
              {COL_HEADERS.map(h => (
                <th key={h.key} style={thRot(h.bg, h.label)}>{h.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={row.id} style={{ background: idx % 2 === 1 ? '#F8FAFC' : C.paper }}>
                <td style={{ border: `1px solid ${C.line}` }}>
                  <CI value={row.item} onChange={v => setRowField(row.id, 'item', v)}
                    placeholder="Item" bold
                    bg={idx % 2 === 1 ? '#F8FAFC' : C.paper} />
                </td>
                {COL_HEADERS.map(h => (
                  <td key={h.key} style={{ border: `1px solid ${C.line}` }}>
                    <CI value={(row as unknown as Record<string, string>)[h.key]} onChange={v => setRowField(row.id, h.key, v)} center />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tbody>
            <tr style={{ borderTop: `3px solid ${C.navy}` }}>
              <td style={{ border: `1px solid ${C.line}`, background: C.purpleLight, padding: '8px 10px', fontWeight: 800, color: C.purple, fontSize: 16 }}>
                Consumables <span style={{ fontWeight: 400, fontSize: 14, marginLeft: 6 }}>↑</span>
              </td>
              {COL_HEADERS.map(h => (
                <td key={h.key} style={{ border: `1px solid ${C.line}`, background: C.purpleLight }}>
                  <CI value={(consumables as unknown as Record<string, string>)[h.key]} onChange={v => setConsField(h.key, v)} center />
                </td>
              ))}
            </tr>
          </tbody>
        </table>

        {/* Add row control */}
        <div className="no-print" style={{ padding: '10px 16px', background: '#F2F5F9', display: 'flex', gap: 10 }}>
          <button onClick={addRow} style={{ border: `1.5px dashed ${C.navy}`, background: '#fff', color: C.navy, fontWeight: 700, fontSize: 12, padding: '6px 12px', borderRadius: 5, cursor: 'pointer' }}>
            + Add equipment row
          </button>
        </div>
      </div>

      {/* Footer actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '16px 4px 0', maxWidth: 840, margin: '0 auto' }}>
        <button onClick={resetForm} style={{ background: '#fff', color: '#B23A3A', border: '2px solid #B23A3A', borderRadius: 6, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Clear form</button>
        <button onClick={() => window.print()} style={{ background: '#fff', color: C.navy, border: `2px solid ${C.navy}`, borderRadius: 6, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Print</button>
        <button onClick={() => exportJSON(meta, rows, consumables)} style={{ background: C.navy, color: '#fff', border: 'none', borderRadius: 6, padding: '10px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Export JSON</button>
      </div>
    </div>
  )
}
