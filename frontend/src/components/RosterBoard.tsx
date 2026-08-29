import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { RosterApi } from '@/lib/api'
import { dbBus } from '@/lib/events'
import { ROSTER_DATA, ROSTER_DAY_KEYS, ROSTER_STATUS_LABELS, type RosterShift } from '@/lib/rosterData'

function useLive<T>(loader: () => T): T {
  const [data, setData] = useState<T>(loader)
  const reload = useCallback(() => setData(loader()), [])
  useEffect(() => { const unsub = dbBus.subscribe(reload); return unsub }, [reload])
  return data
}

// ── Sky-colour interpolation across the depot's working day ────────────────
const STOPS: [number, [number, number, number]][] = [
  [5.0, [30, 42, 70]],
  [6.5, [232, 135, 58]],
  [9.0, [127, 178, 214]],
  [12.5, [234, 217, 174]],
  [15.5, [217, 138, 61]],
  [18.5, [122, 59, 62]],
]
function hourColor(h: number): [number, number, number] {
  if (h <= STOPS[0][0]) return STOPS[0][1]
  if (h >= STOPS[STOPS.length - 1][0]) return STOPS[STOPS.length - 1][1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [h0, c0] = STOPS[i], [h1, c1] = STOPS[i + 1]
    if (h >= h0 && h <= h1) {
      const t = (h - h0) / (h1 - h0)
      return c0.map((v, idx) => Math.round(v + (c1[idx] - v) * t)) as [number, number, number]
    }
  }
  return STOPS[0][1]
}
function toHour(str: string) { const [hh, mm] = str.split(':').map(Number); return hh + mm / 60 }
function rgbStr(c: [number, number, number]) { return `rgb(${c[0]},${c[1]},${c[2]})` }
function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
function groupByStart(shifts: RosterShift[]): [string, RosterShift[]][] {
  const map = new Map<string, RosterShift[]>()
  shifts.forEach(s => { if (!map.has(s.start)) map.set(s.start, []); map.get(s.start)!.push(s) })
  return [...map.entries()].sort((a, b) => toHour(a[0]) - toHour(b[0]))
}

type Names = Record<string, Record<string, string>>
type Status = Record<string, Record<string, boolean>>

export default function RosterBoard() {
  const remote = useLive(() => RosterApi.get())
  const [names, setNames] = useState<Names>(remote.names)
  const [status, setStatus] = useState<Status>(remote.status)
  const [activeDay, setActiveDay] = useState(ROSTER_DAY_KEYS[0])
  const [searchInput, setSearchInput] = useState('')
  const [syncMode, setSyncMode] = useState<'saved' | 'saving' | 'error'>('saved')
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loadedOnce = useRef(false)

  // Pick up the shared state once on mount (further remote pushes from other
  // viewers are intentionally not force-merged over local edits in progress).
  useEffect(() => {
    if (!loadedOnce.current) { setNames(remote.names); setStatus(remote.status); loadedOnce.current = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const searchTerm = searchInput.trim().toLowerCase()

  function scheduleSave(nextNames: Names, nextStatus: Status) {
    setSyncMode('saving')
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      try { RosterApi.save(nextNames, nextStatus); setSyncMode('saved') }
      catch { setSyncMode('error') }
    }, 500)
  }

  function setName(shiftId: string, role: string, value: string) {
    setNames(prev => {
      const next = { ...prev, [shiftId]: { ...prev[shiftId], [role]: value } }
      scheduleSave(next, status)
      return next
    })
  }
  function toggleStatus(shiftId: string, label: string) {
    setStatus(prev => {
      const shiftStatus = { ...prev[shiftId], [label]: !prev[shiftId]?.[label] }
      const next = { ...prev, [shiftId]: shiftStatus }
      scheduleSave(names, next)
      return next
    })
  }

  function roleProgress(shift: RosterShift) {
    const shiftNames = names[shift.id] || {}
    const filled = shift.roles.filter(r => (shiftNames[r] || '').trim().length > 0).length
    return { filled, total: shift.roles.length }
  }
  function cardMatches(s: RosterShift) {
    if (!searchTerm) return true
    if (s.title.toLowerCase().includes(searchTerm)) return true
    const shiftNames = names[s.id] || {}
    return Object.values(shiftNames).some(n => (n || '').toLowerCase().includes(searchTerm))
  }
  function dayHasMatch(dayKey: string) {
    if (!searchTerm) return false
    return ROSTER_DATA[dayKey].some(cardMatches)
  }

  const weekStats = useMemo(() => {
    let totalShifts = 0, totalRoles = 0, filledRoles = 0
    const uniqueNames = new Set<string>()
    ROSTER_DAY_KEYS.forEach(key => {
      ROSTER_DATA[key].forEach(s => {
        totalShifts++
        totalRoles += s.roles.length
        const shiftNames = names[s.id] || {}
        s.roles.forEach(r => { const n = (shiftNames[r] || '').trim(); if (n) { filledRoles++; uniqueNames.add(n.toLowerCase()) } })
      })
    })
    return { totalShifts, uniqueCount: uniqueNames.size, pct: totalRoles ? Math.round((filledRoles / totalRoles) * 100) : 0 }
  }, [names])

  const shifts = ROSTER_DATA[activeDay]
  const blocks = groupByStart(shifts)
  const spineFrom = hourColor(toHour(blocks[0][0]))
  const spineTo = hourColor(toHour(blocks[blocks.length - 1][0]))
  let totalRoles = 0, filledRoles = 0
  shifts.forEach(s => { const p = roleProgress(s); totalRoles += p.total; filledRoles += p.filled })
  const dayPct = totalRoles ? Math.round((filledRoles / totalRoles) * 100) : 0
  let shiftCounter = 0

  const anyVisible = shifts.some(cardMatches)

  return (
    <div style={{ position: 'relative', background: '#EFE9DC', color: '#1B1B18', fontFamily: "'Public Sans', sans-serif", margin: '-24px', padding: '26px 20px 60px' }}>
      <style>{`
        .roster-board .name-input { border: none; border-bottom: 1px solid #D8D0BC; background: transparent; font-family: 'Public Sans', sans-serif; font-size: 12.5px; color: #1B1B18; padding: 1px 0 2px; width: 100%; }
        .roster-board .name-input::placeholder { color: #8B8776; font-style: italic; }
        .roster-board .name-input:focus { outline: none; border-bottom: 1px solid #D98A3D; }
        .roster-board .chip { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: .02em; padding: 3px 7px; border: 1px solid #D8D0BC; background: #EFE9DC; color: #5B584E; cursor: pointer; user-select: none; border-radius: 2px; transition: background .12s ease, color .12s ease, border-color .12s ease; }
        .roster-board .chip:hover { border-color: #5B584E; }
        .roster-board .chip.on { background: #F5B324; border-color: #F5B324; color: #3B2C05; font-weight: 600; }
        .roster-board .daytab { flex: 0 0 auto; background: #F8F5EC; border: 1px solid #D8D0BC; border-bottom: 3px solid transparent; padding: 10px 14px 8px; cursor: pointer; font-family: 'IBM Plex Mono', monospace; text-align: left; min-width: 104px; transition: background .15s ease, border-color .15s ease; position: relative; }
        .roster-board .daytab:hover { background: #fff; }
        .roster-board .daytab.active { background: #fff; border-color: #1B1B18; border-bottom-width: 3px; }
        .roster-board .print-btn { font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .04em; text-transform: uppercase; background: #1B1B18; color: #F8F5EC; border: none; padding: 8px 14px; cursor: pointer; border-radius: 2px; }
        .roster-board .print-btn:hover { background: #000; }
        .roster-board .searchbar input { width: 100%; font-family: 'IBM Plex Mono', monospace; font-size: 12px; padding: 9px 12px 9px 30px; border: 1px solid #C2B99E; background: #F8F5EC; color: #1B1B18; border-radius: 2px; }
        .roster-board .searchbar input:focus { outline: 2px solid #D98A3D; outline-offset: -1px; }
        @keyframes rosterRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .roster-board .daypanel { animation: rosterRise .25s ease; }
        @media print {
          .roster-board .searchbar, .roster-board .sync-badge, .roster-board .print-btn, .roster-board .daytabs { display: none !important; }
        }
      `}</style>

      <div className="roster-board" style={{ maxWidth: 980, margin: '0 auto' }}>
        {/* Header */}
        <header style={{ borderBottom: '2px solid #1B1B18', paddingBottom: 16, marginBottom: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '.14em', textTransform: 'uppercase', color: '#5B584E', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#F5B324', boxShadow: '0 0 0 3px rgba(245,179,36,0.22)', display: 'inline-block' }} />
                City Depot &nbsp;·&nbsp; Shift Roster &nbsp;·&nbsp; Week 01
              </div>
              <h1 style={{ fontFamily: "'Oswald', sans-serif", fontWeight: 700, fontSize: 'clamp(26px,4.6vw,40px)', letterSpacing: '.01em', textTransform: 'uppercase', margin: '0 0 6px', lineHeight: 1.02 }}>
                Festive Week <span style={{ color: '#D98A3D' }}>Roster</span>
              </h1>
              <p style={{ fontSize: 13.5, color: '#5B584E', maxWidth: '56ch', lineHeight: 1.5, margin: 0 }}>
                Thursday 27 December 2018 to Wednesday 2 January 2019. <b style={{ color: '#1B1B18', fontWeight: 600 }}>Dawn Patrol rolls at 05:00</b> most mornings and the board runs through to last Access Control at 18:30 — each block is tinted to the CBD sky colour at that hour.
              </p>
            </div>
            <div className="sync-badge" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: '.05em', textTransform: 'uppercase', color: '#5B584E', border: '1px solid #C2B99E', background: '#F8F5EC', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: syncMode === 'saved' ? '#3E6B4F' : syncMode === 'saving' ? '#F5B324' : '#B23A3A', display: 'inline-block', animation: syncMode === 'saving' ? 'pulse 1s infinite' : undefined }} />
              {syncMode === 'saved' ? 'Saved to shared roster' : syncMode === 'saving' ? 'Saving…' : 'Could not save'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <b style={{ display: 'block', fontSize: 19, color: '#1B1B18', lineHeight: 1 }}>{weekStats.totalShifts}</b>
              <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5B584E' }}>Shifts this week</span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <b style={{ display: 'block', fontSize: 19, color: '#1B1B18', lineHeight: 1 }}>{weekStats.uniqueCount}</b>
              <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5B584E' }}>Names on the roster</span>
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
              <b style={{ display: 'block', fontSize: 19, color: '#1B1B18', lineHeight: 1 }}>{weekStats.pct}%</b>
              <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5B584E' }}>Roles staffed</span>
            </div>
          </div>

          <div className="searchbar" style={{ marginTop: 16, position: 'relative', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: '#8B8776' }}>⌕</span>
            <input type="text" style={{ paddingLeft: 30 }} value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Find a shift or a name across the week…" autoComplete="off" />
          </div>
        </header>

        {/* Day tabs */}
        <nav className="daytabs" role="tablist" aria-label="Select a day" style={{ display: 'flex', gap: 2, overflowX: 'auto', margin: '20px 0 0', paddingBottom: 2 }}>
          {ROSTER_DAY_KEYS.map(key => {
            const [dow, dnum, month] = key.split(' ')
            const dayShifts = ROSTER_DATA[key]
            const first = hourColor(toHour(dayShifts[0].start))
            const last = hourColor(toHour(dayShifts[dayShifts.length - 1].start))
            const active = key === activeDay
            const hasMatch = dayHasMatch(key)
            return (
              <button key={key} role="tab" aria-selected={active} className={`daytab${active ? ' active' : ''}`} onClick={() => setActiveDay(key)}>
                {hasMatch && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#F5B324' }} />}
                <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: '.06em', textTransform: 'uppercase', color: '#1B1B18' }}>{dow.slice(0, 3)}</div>
                <div style={{ fontSize: 20, fontWeight: 600, color: '#1B1B18', marginTop: 1 }}>{dnum} <span style={{ fontSize: 11, color: '#5B584E' }}>{month.slice(0, 3)}</span></div>
                <div style={{ fontSize: 10, color: '#5B584E', marginTop: 5 }}>{dayShifts.length} shifts</div>
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: -3, height: 3, background: `linear-gradient(90deg, ${rgbStr(first)}, ${rgbStr(last)})` }} />
              </button>
            )
          })}
        </nav>

        {/* Day panel */}
        <section className="daypanel" key={activeDay} style={{ background: '#F8F5EC', border: '1px solid #D8D0BC', borderTop: 'none', padding: '24px 22px 10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 12, marginBottom: 20, paddingBottom: 14, borderBottom: '1px dashed #D8D0BC' }}>
            <div>
              <div style={{ fontFamily: "'Oswald', sans-serif", fontSize: 21, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.01em' }}>{activeDay}</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#5B584E', letterSpacing: '.03em' }}>
                {shifts.length} SHIFTS &nbsp;·&nbsp; {blocks[0][0]}&ndash;{shifts[shifts.length - 1].start} &nbsp;·&nbsp; {filledRoles}/{totalRoles} ROLES NAMED
              </div>
              <div style={{ width: 140, height: 4, background: '#D8D0BC', marginTop: 6, position: 'relative' }}>
                <div style={{ display: 'block', height: '100%', background: rgbStr(spineTo), width: `${dayPct}%`, transition: 'width .25s ease' }} />
              </div>
            </div>
          </div>

          <div style={{ position: 'relative', paddingLeft: 26 }}>
            <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, borderRadius: 2, background: `linear-gradient(${rgbStr(spineFrom)}, ${rgbStr(spineTo)})` }} />
            {blocks.map(([time, group]) => {
              const c = hourColor(toHour(time))
              const bc = rgbStr(c)
              const visibleGroup = group.filter(cardMatches)
              if (visibleGroup.length === 0) return null
              return (
                <div key={time} style={{ position: 'relative', marginBottom: 24 }}>
                  <div style={{ position: 'absolute', left: -26, top: 3, width: 15, height: 15, borderRadius: '50%', border: '2px solid #F8F5EC', boxShadow: `0 0 0 1px ${bc}`, background: bc }} />
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 15, fontWeight: 600, letterSpacing: '.02em' }}>{time}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, textTransform: 'uppercase', letterSpacing: '.1em', color: '#5B584E' }}>
                      {group.length} shift{group.length > 1 ? 's' : ''} start{group.length > 1 ? '' : 's'} now
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(272px,1fr))', gap: 10 }}>
                    {group.map(s => {
                      shiftCounter++
                      const p = roleProgress(s)
                      const pct = p.total ? p.filled / p.total : 0
                      const shiftNames = names[s.id] || {}
                      const shiftStatus = status[s.id] || {}
                      const no = String(shiftCounter).padStart(3, '0')
                      const visible = cardMatches(s)
                      if (!visible) return null
                      return (
                        <div key={s.id} style={{
                          background: s.has_status_row ? '#fff' : 'repeating-linear-gradient(135deg, #fff 0 8px, #F6F2E7 8px 16px)',
                          border: '1px solid #D8D0BC', borderLeft: `4px solid ${bc}`,
                          borderLeftStyle: s.has_status_row ? 'solid' : 'dashed',
                          padding: '12px 13px 12px', position: 'relative',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{s.title}</div>
                            <div title={`${p.filled}/${p.total} roles named`} style={{ width: 24, height: 24, borderRadius: '50%', background: `conic-gradient(${bc} calc(${pct}*360deg), #D8D0BC 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                              <div style={{ width: 17, height: 17, borderRadius: '50%', background: '#fff' }} />
                            </div>
                          </div>
                          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, color: '#5B584E', marginBottom: 9 }}>{s.start}&ndash;{s.end} &nbsp;·&nbsp; No. {no}</div>
                          {!s.has_status_row && (
                            <div style={{ display: 'inline-block', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, textTransform: 'uppercase', letterSpacing: '.08em', color: '#5B584E', border: '1px solid #D8D0BC', padding: '1px 5px', borderRadius: 2, marginBottom: 8 }}>
                              On call / no status log
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 9 }}>
                            {s.roles.map(role => {
                              const val = shiftNames[role] || ''
                              return (
                                <div key={role} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                                  <div style={{ width: 20, height: 20, borderRadius: '50%', flex: '0 0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, fontWeight: 600, color: '#fff', background: val ? bc : '#8B8776', border: val ? '1px solid transparent' : '1px dashed #C2B99E' }}>
                                    {initials(val)}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8.5, textTransform: 'uppercase', letterSpacing: '.06em', color: '#8B8776', lineHeight: 1.4 }}>{role}</span>
                                    <input className="name-input" type="text" value={val} placeholder="Add name" onChange={e => setName(s.id, role, e.target.value)} />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                          {s.has_status_row && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, paddingTop: 8, borderTop: '1px solid #D8D0BC' }}>
                              {ROSTER_STATUS_LABELS.map(label => (
                                <button key={label} type="button" className={`chip${shiftStatus[label] ? ' on' : ''}`} onClick={() => toggleStatus(s.id, label)}>{label}</button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {searchTerm && !anyVisible && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: '#5B584E', padding: '30px 0', textAlign: 'center' }}>
              No shifts or names match "{searchInput.trim()}" on this day.
            </div>
          )}
        </section>

        <footer style={{ marginTop: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#5B584E', letterSpacing: '.02em' }}>
          <span>Names and statuses are shared with everyone viewing this roster.</span>
          <button className="print-btn" type="button" onClick={() => window.print()}>Print this day</button>
        </footer>
      </div>
    </div>
  )
}
