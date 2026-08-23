import { useState, useEffect } from 'react'

// ── Fonts (Oswald + IBM Plex Mono via Google Fonts) ───────────────────────────
function useFonts() {
  useEffect(() => {
    const id = 'school-deploy-fonts'
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
  line: 'rgba(20,32,30,0.14)', lineStrong: 'rgba(20,32,30,0.28)',
  blue: '#3E6FA6', olive: '#6C7A3B', tan: '#A8792F',
  purple: '#8A5AA6',
}
const display = "'Oswald', 'Segoe UI', sans-serif"
const mono = "'IBM Plex Mono', 'SF Mono', Consolas, monospace"
const body = "'Inter', 'Segoe UI', Arial, sans-serif"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Slot { label: string; filled: boolean }
interface ShiftDef { title: string; dur: string; foreman: string; workers: Slot[]; client: string; comment: string; stamp: boolean }
interface Window { name: string; time: string; shifts: ShiftDef[] }
interface DayDef { dow: string; date: string; windows: Window[] }

// ── Data helpers ──────────────────────────────────────────────────────────────
const S = (n: number): Slot[] => Array.from({ length: n }, (_, i) => ({ label: String(i + 1), filled: false }))
const W = (arr: string[]): Slot[] => arr.map(v => ({ label: v, filled: true }))
function mk(title: string, dur: string, foreman: string, workers: Slot[], client: string, comment = '', stamp = false): ShiftDef {
  return { title, dur, foreman, workers, client, comment, stamp }
}

// ── Deployment data ───────────────────────────────────────────────────────────
const DAYS: DayDef[] = [
  {
    dow: 'Thursday', date: '20 Aug 2026', windows: [
      { name: 'Morning deployments', time: '06:30 – 11:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3','JSD4','JSD5']), 'Ophelp Jesus Saves Daily'),
        mk('Community service gatekeeper', '06:30 – 11:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Dawn patrol hotspot teams (P1 & P4)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('Dawn patrol hotspot teams (P2 & P3)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('LMRID weed maintenance', '9-hr session', 'AF', W(['A1','A2']), 'LMRID', 'Vocational track'),
        mk('CCID services supervisor — AM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('CCID services manager — AM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
      ]},
      { name: 'Mid-morning deployments', time: '11:00 – 15:00', shifts: [
        mk('Hotspots — midmorning', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Community service gatekeeper', '11:00 – 15:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
      { name: 'Afternoon deployments', time: '15:00 – 19:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'Ophelp Jesus Saves Daily'),
        mk('Sea Point street cleaning', '5-hr session', 'JOS', S(3), 'Nicola Jowell'),
        mk('Mouille Point regular cleaning', '5-hr session', '1', S(2), 'MPRPA'),
        mk('Ophelp operations supervisor', '5-hr session', 'CSS', [], 'Ophelp Operations', '', true),
        mk('Roving hotspots', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — PM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('Community service gatekeeper', '15:00 – 19:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
    ],
  },
  {
    dow: 'Friday', date: '21 Aug 2026', windows: [
      { name: 'Morning deployments', time: '06:30 – 11:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3','JSD4','JSD5']), 'Ophelp Jesus Saves Daily'),
        mk('Community service gatekeeper', '06:30 – 11:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Dawn patrol hotspot teams (P1 & P4)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('Dawn patrol hotspot teams (P2 & P3)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('Sea Point street cleaning', '5-hr session', 'JOS', S(3), 'Nicola Jowell'),
        mk('CCID services supervisor — AM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('CCID services manager — AM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Mouille Point regular cleaning', '5-hr session', '1', S(2), 'MPRPA'),
        mk('LMRID street cleaning', '9-hr session', 'OS', W(['A1','A2','A3','A4','A5']), 'LMRID', 'Vocational track'),
      ]},
      { name: 'Mid-morning deployments', time: '11:00 – 15:00', shifts: [
        mk('Community service gatekeeper', '11:00 – 15:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Hotspots — midmorning', '5-hr session', '1', S(2), 'CCID Opruim Services'),
      ]},
      { name: 'Afternoon deployments', time: '15:00 – 19:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'Ophelp Jesus Saves Daily'),
        mk('Ophelp operations supervisor', '5-hr session', 'CSS', [], 'Ophelp Operations', '', true),
        mk('Roving hotspots', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — PM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('De Waal Park cleaning', '5-hr session', 'F', S(4), 'Friends of De Waal Park'),
        mk('CCID services manager — PM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Community service gatekeeper', '15:00 – 19:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
    ],
  },
  {
    dow: 'Saturday', date: '22 Aug 2026', windows: [
      { name: 'Morning deployments', time: '06:30 – 11:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3','JSD4','JSD5']), 'Ophelp Jesus Saves Daily'),
        mk('Community service gatekeeper', '06:30 – 11:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Dawn patrol hotspot teams (P1 & P4)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('Dawn patrol hotspot teams (P2 & P3)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — AM', '5-hr session', 'CSS', [], 'CCID Opruim Services'),
        mk('CCID services manager — AM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Community service gatekeeper', '11:00 – 15:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
      { name: 'Mid-morning deployments', time: '11:00 – 15:00', shifts: [
        mk('Hotspots — midmorning', '5-hr session', '1', S(2), 'CCID Opruim Services'),
      ]},
      { name: 'Afternoon', time: '15:00 – 19:00', shifts: [
        mk('Mouille Point regular cleaning', '5-hr session', '1', S(2), 'MPRPA'),
        mk('Common Ground Church cleaning', '5-hr session', 'F', [{label:'1',filled:false},{label:'2',filled:false},{label:'Rec',filled:false},{label:'Rec',filled:false}], 'Common Ground Church'),
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'Ophelp Jesus Saves Daily'),
        mk('Ophelp operations supervisor', '5-hr session', 'OSS', [], 'Ophelp Operations', '', true),
        mk('Roving hotspots', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — PM', '5-hr session', 'CSS', [], 'CCID Opruim Services'),
        mk('Sea Point street cleaning', '5-hr session', 'JOS', S(3), 'Nicola Jowell'),
        mk('Community service gatekeeper', '15:00 – 19:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
    ],
  },
  {
    dow: 'Sunday', date: '23 Aug 2026', windows: [
      { name: 'Morning', time: '06:30 – 11:00', shifts: [
        mk('Roving hotspots cleaning', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk("St. Stephen's Church cleaning", '3-hr session', 'F', S(2), "St. Stephen's Church"),
      ]},
      { name: 'Afternoon', time: '15:00 – 19:00', shifts: [
        mk('Roving hotspots cleaning', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('MPRPA regular cleaning', '5-hr session', 'F', S(2), 'MPRPA'),
      ]},
    ],
  },
  {
    dow: 'Monday', date: '24 Aug 2026', windows: [
      { name: 'Morning deployments', time: '06:30 – 11:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3','JSD4','JSD5']), 'Ophelp Jesus Saves Daily'),
        mk('Community service gatekeeper', '06:30 – 11:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Dawn patrol hotspot teams (P1 & P4)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('Dawn patrol hotspot teams (P2 & P3)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — AM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('LMRID street cleaning', '9-hr session', 'OS', W(['A1','A2','A3','A4','A5']), 'LMRID', 'Vocational track'),
        mk('Mouille Point regular cleaning', '5-hr session', '1', S(2), 'MPRPA'),
        mk('CCID services manager — AM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
      ]},
      { name: 'Mid-morning deployments', time: '11:00 – 15:00', shifts: [
        mk('Community service gatekeeper', '11:00 – 15:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Hotspots — midmorning', '5-hr session', '1', S(2), 'CCID Opruim Services'),
      ]},
      { name: 'Afternoon deployments', time: '15:00 – 19:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'Ophelp Jesus Saves Daily'),
        mk('Ophelp operations supervisor', '5-hr session', 'CSS', [], 'Ophelp Operations', '', true),
        mk('Roving hotspots', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — PM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('De Waal Park cleaning', '5-hr session', 'F', S(4), 'Friends of De Waal Park'),
        mk('CCID services manager — PM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Community service gatekeeper', '15:00 – 19:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
    ],
  },
  {
    dow: 'Tuesday', date: '25 Aug 2026', windows: [
      { name: 'Morning deployments', time: '06:30 – 11:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3','JSD4','JSD5']), 'Ophelp Jesus Saves Daily'),
        mk('Community service gatekeeper', '06:30 – 11:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Dawn patrol hotspot teams (P1 & P4)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('Dawn patrol hotspot teams (P2 & P3)', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — AM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('CCID services manager — AM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
      ]},
      { name: 'Mid-morning deployments', time: '11:00 – 15:00', shifts: [
        mk('Community service gatekeeper', '11:00 – 15:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Hotspots — midmorning', '5-hr session', '1', S(2), 'CCID Opruim Services'),
      ]},
      { name: 'Afternoon deployments', time: '15:00 – 19:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'Ophelp Jesus Saves Daily'),
        mk('Sea Point street cleaning', '5-hr session', 'JOS', S(3), 'Nicola Jowell'),
        mk('Mouille Point regular cleaning', '5-hr session', '1', S(2), 'MPRPA'),
        mk('Ophelp operations supervisor', '5-hr session', 'CSS', [], 'Ophelp Operations', '', true),
        mk('Roving hotspots', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — PM', '5-hr session', 'SM', [], 'CCID Opruim Services'),
        mk('CCID services manager — PM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Community service gatekeeper', '15:00 – 19:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
    ],
  },
  {
    dow: 'Wednesday', date: '26 Aug 2026', windows: [
      { name: 'Morning deployments', time: '06:30 – 11:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3','JSD4','JSD5']), 'Ophelp Jesus Saves Daily'),
        mk('Community service gatekeeper', '06:30 – 11:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Dawn patrol hotspot teams (P1 & P4)', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('Dawn patrol hotspot teams (P2 & P3)', '5-hr session', '1', S(2), 'CCID Opruim Services'),
        mk('LMRID composting & gardening', '9-hr session', 'AF', W(['A1','A2']), 'LMRID', 'Vocational track'),
        mk('CCID services supervisor — AM', '5-hr session', 'CSM', [], 'CCID Opruim Services'),
        mk('CCID services manager — AM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Mouille Point regular cleaning', '5-hr session', '1', S(2), 'MPRPA'),
      ]},
      { name: 'Mid-morning deployments', time: '11:00 – 15:00', shifts: [
        mk('Community service gatekeeper', '11:00 – 15:00', '', W(['Team ___']), '', 'Admin sign required'),
        mk('Hotspots — midmorning', '5-hr session', '1', S(2), 'CCID Opruim Services'),
      ]},
      { name: 'Afternoon deployments', time: '15:00 – 19:00', shifts: [
        mk('Ophelp Jesus Saves Daily', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'Ophelp Jesus Saves Daily'),
        mk('Ophelp Jesus Saves Daily — festive season', '3-hr session', 'JSDF', W(['JSD1','JSD2','JSD3']), 'CCID Festive Season', '13:00 – 15:00'),
        mk('Ophelp operations supervisor', '5-hr session', 'OPS', [], 'Ophelp Operations', '', true),
        mk('Roving hotspots', '5-hr session', 'F', S(2), 'CCID Opruim Services'),
        mk('CCID services supervisor — PM', '5-hr session', 'CSS', S(2), 'CCID Opruim Services'),
        mk('CCID services manager — PM', '5-hr session', 'SM', [], 'CCID Extra'),
        mk('CCID recycling project', '5-hr session', '', S(4), 'CCID Extra'),
        mk('Community service gatekeeper', '15:00 – 19:00', '', W(['Team ___']), '', 'Admin sign required'),
      ]},
    ],
  },
]

// ── Client → accent colour ────────────────────────────────────────────────────
function clientAccent(client: string): string {
  if (!client) return T.slate
  const c = client.toLowerCase()
  if (c.includes('ccid') || c.includes('opruim')) return T.teal
  if (c.includes('ophelp')) return T.coral
  if (c.includes('mprpa')) return T.blue
  if (c.includes('lmrid')) return T.olive
  if (c.includes('nicola') || c.includes('jowell')) return T.tan
  return T.purple
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function SlotChip({ slot }: { slot: Slot }) {
  return (
    <span style={{
      fontFamily: mono, fontSize: 11, borderRadius: 3, padding: '2px 7px',
      border: slot.filled ? `1px solid ${T.ink}` : `1px dashed ${T.lineStrong}`,
      background: slot.filled ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
      color: slot.filled ? T.ink : T.slate, fontWeight: slot.filled ? 500 : 400,
    }}>{slot.label}</span>
  )
}

function Ticket({ sh }: { sh: ShiftDef }) {
  const accent = clientAccent(sh.client)
  const isGatekeeper = sh.title.toLowerCase().includes('gatekeeper')
  return (
    <div style={{
      position: 'relative', background: T.paper2, borderRadius: 4,
      border: `1px solid ${T.lineStrong}`, borderLeft: `4px solid ${accent}`,
      padding: '14px 16px 14px 18px', overflow: 'hidden',
    }}>
      {sh.stamp && (
        <div style={{
          position: 'absolute', top: 10, right: -22,
          background: T.amber, color: T.amberD, fontFamily: display, fontSize: 9.5,
          fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
          padding: '3px 26px', transform: 'rotate(28deg)', border: `1px solid ${T.amberD}`,
        }}>Supervisor</div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
        <div style={{ fontFamily: display, fontWeight: 600, fontSize: 15, lineHeight: 1.25, textTransform: 'uppercase', letterSpacing: '0.01em' }}>
          {sh.title}
        </div>
        <div style={{ flexShrink: 0, fontFamily: mono, fontSize: 10.5, background: T.ink, color: T.paper, padding: '3px 7px', borderRadius: 3, whiteSpace: 'nowrap' }}>
          {sh.dur}
        </div>
      </div>
      {sh.client && (
        <div style={{ display: 'inline-block', marginTop: 7, fontFamily: mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.04em', color: T.slate }}>
          {sh.client}
        </div>
      )}
      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sh.foreman && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate, width: 58, flexShrink: 0, paddingTop: 2, letterSpacing: '0.03em' }}>Foreman</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              <SlotChip slot={{ label: sh.foreman, filled: true }} />
            </div>
          </div>
        )}
        {(sh.workers.length > 0 || !sh.foreman) && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
            <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate, width: 58, flexShrink: 0, paddingTop: 2, letterSpacing: '0.03em' }}>
              {isGatekeeper ? 'Team' : 'Workers'}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {sh.workers.length > 0
                ? sh.workers.map((slot, i) => <SlotChip key={i} slot={slot} />)
                : <span style={{ fontFamily: mono, fontSize: 11, border: `1px dashed ${T.lineStrong}`, borderRadius: 3, padding: '2px 7px', color: T.slate, background: 'rgba(255,255,255,0.35)' }}>—</span>
              }
            </div>
          </div>
        )}
      </div>
      {sh.comment && (
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: `1px dashed ${T.line}`, fontSize: 11.5, color: T.coralD, fontWeight: 500 }}>
          <span style={{ color: T.slate, fontWeight: 400 }}>Note — </span>{sh.comment}
        </div>
      )}
      {isGatekeeper && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6 }}>
          <span style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', color: T.slate }}>Sign</span>
          <div style={{ flex: 1, borderBottom: `1px dashed ${T.lineStrong}`, height: 18 }} />
        </div>
      )}
    </div>
  )
}

function DeployWindow({ win }: { win: Window }) {
  return (
    <section style={{ marginBottom: 30 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 12 }}>
        <h2 style={{ fontFamily: display, fontSize: 17, textTransform: 'uppercase', letterSpacing: '0.03em', margin: 0, fontWeight: 600 }}>
          {win.name}
        </h2>
        <span style={{ fontFamily: mono, fontSize: 12, color: T.slate }}>{win.time}</span>
        <div style={{ flex: 1, height: 1, background: T.lineStrong }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {win.shifts.map((sh, i) => <Ticket key={i} sh={sh} />)}
      </div>
    </section>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function SchoolDeploymentSchedule() {
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
              SD
            </div>
            <div>
              <h1 style={{ fontFamily: display, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 30, margin: 0, lineHeight: 1 }}>
                School Deployment Schedule
              </h1>
              <div style={{ fontFamily: mono, fontSize: 12, color: T.slate, marginTop: 6, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
                Weekly deployment board
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', fontFamily: mono, fontSize: 12, color: T.slate, lineHeight: 1.6 }}>
            Week 34 · <b style={{ color: T.ink, fontWeight: 600 }}>20 – 26 Aug 2026</b><br />
            {totalShifts} total shifts · Issued for depot dispatch &amp; foremen sign-in
          </div>
        </header>

        {/* Day tab strip */}
        <nav style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4, marginBottom: 0 }}>
          {DAYS.map((d, i) => {
            const shiftCount = d.windows.reduce((n, w) => n + w.shifts.length, 0)
            const isActive = i === activeDay
            return (
              <button key={i} onClick={() => setActiveDay(i)}
                style={{
                  position: 'relative', flex: '1 1 0', minWidth: 118,
                  background: isActive ? T.ink : T.paper2,
                  border: `1px solid ${isActive ? T.ink : T.lineStrong}`,
                  borderBottom: 'none', borderRadius: '10px 10px 0 0',
                  padding: '10px 12px 12px', cursor: 'pointer', textAlign: 'left',
                  transform: isActive ? 'translateY(-3px)' : 'none',
                  transition: 'background 0.15s, transform 0.1s',
                }}>
                <div style={{ fontFamily: display, fontSize: 14, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: isActive ? T.amber : T.ink }}>
                  {d.dow}
                </div>
                <div style={{ fontFamily: mono, fontSize: 11, color: isActive ? 'rgba(244,240,228,0.65)' : T.slate, marginTop: 2 }}>
                  {d.date}
                </div>
                <div style={{ marginTop: 8, display: 'inline-block', fontFamily: mono, fontSize: 10, background: isActive ? T.amber : T.ink, color: isActive ? T.ink : T.paper, padding: '2px 7px', borderRadius: 20 }}>
                  {shiftCount} shifts
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
