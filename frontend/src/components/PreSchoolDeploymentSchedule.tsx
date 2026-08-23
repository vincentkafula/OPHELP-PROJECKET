import { useState, useEffect } from 'react'

// ── Fonts ─────────────────────────────────────────────────────────────────────
function useFonts() {
  useEffect(() => {
    const id = 'ps-deploy-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id; link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])
}

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  ink: '#14201E', paper: '#F4F0E4', paper2: '#EAE4D4',
  amber: '#E8A33D', amberD: '#7A5015',
  teal: '#1F6F6B', coral: '#D65B3C', coralD: '#6E2C1B',
  slate: '#6B7370', line: 'rgba(20,32,30,0.14)', lineStrong: 'rgba(20,32,30,0.28)',
  blue: '#3E6FA6', olive: '#6C7A3B', purple: '#8A5AA6', tan: '#A8792F',
}
const display = "'Oswald','Segoe UI',sans-serif"
const mono = "'IBM Plex Mono','SF Mono',Consolas,monospace"
const body = "'Inter','Segoe UI',Arial,sans-serif"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Slot { label: string; filled: boolean }
interface ShiftDef { title: string; dur: string; leader: string; workers: Slot[]; partner: string; comment: string; stamp: boolean }
interface Win { name: string; time: string; shifts: ShiftDef[] }
interface DayDef { dow: string; date: string; windows: Win[] }

const S = (n: number): Slot[] => Array.from({ length: n }, (_, i) => ({ label: String(i + 1), filled: false }))
const W = (arr: string[]): Slot[] => arr.map(v => ({ label: v, filled: true }))
function mk(title: string, dur: string, leader: string, workers: Slot[], partner: string, comment = '', stamp = false): ShiftDef {
  return { title, dur, leader, workers, partner, comment, stamp }
}

// ── Data ──────────────────────────────────────────────────────────────────────
const DAYS: DayDef[] = [
  {
    dow: 'Thursday', date: '20 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Pre-school administration', '5-hr session', '1', [], 'Ophelp Salaries'),
        mk('Response Team 1', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — AM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — AM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('Groote Kerk', '5-hr session', '1', [], 'Groote Kerk'),
        mk('Grand Parade cleaning', '5-hr session', '', W(['1', '2']), 'Team Coaching'),
        mk('OBSID service manager', '9-hr session', 'OSM', [], 'OBSID'),
        mk('OBSID independent worker', '9-hr session', '', S(5), 'OBSID'),
      ]},
      { name: 'Afternoon', time: '', shifts: [
        mk('Response Team 2', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — PM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — PM', '5-hr session', 'M', [], 'CCID Opruim Services'),
        mk('OBSID general cleaning', '4-hr session', '1', S(2), 'OBSID'),
      ]},
    ],
  },
  {
    dow: 'Friday', date: '21 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Pre-school administration', '5-hr session', '1', [], 'Ophelp Salaries'),
        mk('CIDC cleaning', '5-hr session', '1', S(2), 'CIDC', 'Vocational track'),
        mk('Response Team 1', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — AM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — AM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('Grand Parade cleaning', '5-hr session', '', W(['1', '2']), 'Team Coaching'),
        mk('OBSID independent worker', '9-hr session', '', S(6), 'OBSID', '6-hr session, office cleaner — worker 6'),
        mk('OBSID service manager', '9-hr session', 'OSM', [], 'OBSID'),
      ]},
      { name: 'Afternoon', time: '', shifts: [
        mk('Response Team 2', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — PM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — PM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('OBSID general cleaning', '4-hr session', '1', S(2), 'OBSID'),
      ]},
    ],
  },
  {
    dow: 'Saturday', date: '22 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Pre-school administration', '5-hr session', '1', [], 'Ophelp Salaries'),
        mk('Jan Mutton cleaning', '5-hr session', '1', S(2), 'Jan Mutton and Friends'),
      ]},
    ],
  },
  {
    dow: 'Sunday', date: '23 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Groote Kerk', '5-hr session', '1', [], 'Groote Kerk'),
      ]},
    ],
  },
  {
    dow: 'Monday', date: '24 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Pre-school administration', '5-hr session', '1', [], 'Ophelp Salaries'),
        mk('CIDC cleaning', '5-hr session', '1', S(2), 'CIDC', 'Vocational track'),
        mk('Response Team 1', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — AM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — AM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('Grand Parade cleaning', '5-hr session', '', W(['1', '2']), 'Team Coaching'),
        mk('OBSID independent worker', '9-hr session', '', S(6), 'OBSID', '6-hr session, office cleaner — worker 6'),
        mk('OBSID service manager', '9-hr session', 'OSM', [], 'OBSID'),
      ]},
      { name: 'Afternoon', time: '', shifts: [
        mk('Response Team 2', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — PM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — PM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('OBSID general cleaning', '4-hr session', '1', S(2), 'OBSID'),
      ]},
    ],
  },
  {
    dow: 'Tuesday', date: '25 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Pre-school administration', '5-hr session', '1', [], 'Ophelp Salaries'),
        mk('Jan Mutton cleaning', '5-hr session', '1', S(2), 'Jan Mutton and Friends'),
        mk('Response Team 1', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — AM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — AM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('Groote Kerk', '5-hr session', '1', [], 'Groote Kerk'),
        mk('Grand Parade cleaning', '5-hr session', '', W(['1', '2']), 'Team Coaching'),
        mk('OBSID independent worker', '9-hr session', '', S(5), 'OBSID'),
        mk('OBSID service manager', '9-hr session', 'OSM', [], 'OBSID'),
      ]},
      { name: 'Afternoon', time: '', shifts: [
        mk('Response Team 2', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — PM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — PM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('OBSID general cleaning', '4-hr session', '1', S(2), 'OBSID'),
      ]},
    ],
  },
  {
    dow: 'Wednesday', date: '26 Aug 2026', windows: [
      { name: 'Morning', time: '', shifts: [
        mk('Pre-school administration', '5-hr session', '1', [], 'Ophelp Salaries'),
        mk('CIDC cleaning', '5-hr session', '1', S(2), 'CIDC', 'Vocational track'),
        mk('Response Team 1', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — AM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — AM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('Grand Parade cleaning', '5-hr session', '', W(['1', '2']), 'Team Coaching'),
        mk('OBSID independent worker', '9-hr session', '', S(6), 'OBSID', '6-hr session, office cleaner — worker 6'),
        mk('OBSID service manager', '9-hr session', 'OSM', [], 'OBSID'),
      ]},
      { name: 'Afternoon', time: '', shifts: [
        mk('Response Team 2', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Cigarette butt cleaning — PM', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('CCID Junior Supervisor — PM', '5-hr session', 'CJS', [], 'CCID Opruim Services'),
        mk('OBSID general cleaning', '4-hr session', '1', S(2), 'OBSID'),
      ]},
    ],
  },
]

// ── Client accent colour ──────────────────────────────────────────────────────
function accent(partner: string): string {
  if (!partner) return T.slate
  const p = partner.toLowerCase()
  if (p.includes('ccid') || p.includes('opruim')) return T.teal
  if (p.includes('ophelp')) return T.coral
  if (p.includes('obsid')) return T.blue
  if (p.includes('cidc')) return T.olive
  if (p.includes('kerk') || p.includes('church')) return T.purple
  if (p.includes('coaching')) return T.amberD
  return T.tan
}

// ── Slot chip ─────────────────────────────────────────────────────────────────
function Chip({ slot }: { slot: Slot }) {
  return (
    <span style={{
      fontFamily: mono, fontSize: 11, borderRadius: 3, padding: '2px 7px',
      border: slot.filled ? `1px solid ${T.ink}` : `1px dashed ${T.lineStrong}`,
      background: slot.filled ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
      color: slot.filled ? T.ink : T.slate, fontWeight: slot.filled ? 500 : 400,
    }}>{slot.label}</span>
  )
}

// ── Ticket card ───────────────────────────────────────────────────────────────
function Ticket({ sh }: { sh: ShiftDef }) {
  const col = accent(sh.partner)
  return (
    <div style={{ position: 'relative', background: T.paper2, borderRadius: 4, border: `1px solid ${T.lineStrong}`, borderLeft: `4px solid ${col}`, padding: '14px 16px 14px 18px', overflow: 'hidden' }}>
      {sh.stamp && (
        <div style={{ position: 'absolute', top: 10, right: -22, background: T.amber, color: T.amberD, fontFamily: display, fontSize: 9.5, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '3px 26px', transform: 'rotate(28deg)', border: `1px solid ${T.amberD}` }}>
          Supervisor
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontFamily: display, fontWeight: 600, fontSize: 15, lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          {sh.title}
        </div>
        <div style={{ flexShrink: 0, fontFamily: mono, fontSize: 10.5, background: T.ink, color: T.paper, padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap' }}>
          {sh.dur}
        </div>
      </div>
      {sh.partner && (
        <div style={{ display: 'inline-block', marginTop: 7, fontFamily: mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.slate }}>
          {sh.partner}
        </div>
      )}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sh.leader && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate, width: 52, flexShrink: 0, paddingTop: 2, letterSpacing: '0.03em' }}>Leader</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <Chip slot={{ label: sh.leader, filled: true }} />
            </div>
          </div>
        )}
        {sh.workers.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate, width: 52, flexShrink: 0, paddingTop: 2, letterSpacing: '0.03em' }}>Workers</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {sh.workers.map((s, i) => <Chip key={i} slot={s} />)}
            </div>
          </div>
        )}
      </div>
      {sh.comment && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${T.line}`, fontSize: 11.5, color: T.coralD, fontWeight: 500 }}>
          <span style={{ color: T.slate, fontWeight: 400 }}>Note — </span>{sh.comment}
        </div>
      )}
    </div>
  )
}

// ── Deployment window ─────────────────────────────────────────────────────────
function DeployWindow({ win }: { win: Win }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0, fontWeight: 600 }}>{win.name}</h2>
        {win.time && <span style={{ fontFamily: mono, fontSize: 12, color: T.slate }}>{win.time}</span>}
        <div style={{ flex: 1, height: 1, background: T.lineStrong }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 14 }}>
        {win.shifts.map((sh, i) => <Ticket key={i} sh={sh} />)}
      </div>
    </section>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function PreSchoolDeploymentSchedule() {
  useFonts()
  const [activeDay, setActiveDay] = useState(0)
  const day = DAYS[activeDay]
  const totalShifts = DAYS.reduce((n, d) => n + d.windows.reduce((m, w) => m + w.shifts.length, 0), 0)

  return (
    <div style={{ background: T.paper, minHeight: '100%', fontFamily: body, color: T.ink, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 80px' }}>

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24, paddingBottom: 20, borderBottom: `3px solid ${T.ink}`, marginBottom: 22, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: T.amber, border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 700, fontSize: 18, color: T.ink, flexShrink: 0 }}>
              PS
            </div>
            <div>
              <h1 style={{ fontFamily: display, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 30, margin: 0, lineHeight: 1 }}>
                Pre-School Deployment Schedule
              </h1>
              <div style={{ fontFamily: mono, fontSize: 12, color: T.slate, marginTop: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Weekly deployment board
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: mono, fontSize: 12, color: T.slate, lineHeight: 1.6 }}>
            Week 34 · <b style={{ color: T.ink, fontWeight: 600 }}>20 – 26 Aug 2026</b><br />
            {totalShifts} total shifts · Issued for team leads &amp; partner sign-off
          </div>
        </header>

        {/* Day tab strip */}
        <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
          {DAYS.map((d, i) => {
            const count = d.windows.reduce((n, w) => n + w.shifts.length, 0)
            const active = i === activeDay
            return (
              <button key={i} onClick={() => setActiveDay(i)} style={{
                flex: '1 1 0', minWidth: 118, background: active ? T.ink : T.paper2,
                border: `1px solid ${active ? T.ink : T.lineStrong}`, borderBottom: 'none',
                borderRadius: '10px 10px 0 0', padding: '10px 12px 12px', cursor: 'pointer',
                textAlign: 'left', transform: active ? 'translateY(-3px)' : 'none',
                transition: 'background 0.15s, transform 0.1s',
              }}>
                <div style={{ fontFamily: display, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: active ? T.amber : T.ink }}>
                  {d.dow}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: active ? 'rgba(244,240,228,0.65)' : T.slate, marginTop: 2 }}>
                  {d.date}
                </div>
                <div style={{ marginTop: 8, display: 'inline-block', fontFamily: mono, fontSize: 10, background: active ? T.amber : T.ink, color: active ? T.ink : T.paper, padding: '2px 7px', borderRadius: 20 }}>
                  {count} shift{count === 1 ? '' : 's'}
                </div>
              </button>
            )
          })}
        </nav>

        {/* Day panel */}
        <div style={{ borderTop: `3px solid ${T.ink}`, paddingTop: 20 }}>
          {day.windows.map((win, i) => <DeployWindow key={i} win={win} />)}
        </div>

      </div>
    </div>
  )
}
