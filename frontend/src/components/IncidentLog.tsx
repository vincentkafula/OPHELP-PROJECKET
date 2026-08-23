import { useState, useEffect } from 'react'

function useFonts() {
  useEffect(() => {
    if (!document.getElementById('fol-fonts')) {
      const l = document.createElement('link'); l.id = 'fol-fonts'; l.rel = 'stylesheet'
      l.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(l)
    }
  }, [])
}

const C = {
  paper: '#F5F3EC', paperDim: '#EFEBDF', card: '#FFFFFF',
  ink: '#1B211F', inkSoft: '#4A5250', slate: '#767F7C', line: '#DDD6C4',
  teal: '#1F4A43', tealDeep: '#122E29', tealMid: '#2B5F56',
  amber: '#E2A33B', amberDeep: '#B67B1E',
  brick: '#A8452F', moss: '#3F7856',
}
const display = "'Space Grotesk',sans-serif"
const body = "'IBM Plex Sans',sans-serif"
const mono = "'IBM Plex Mono',monospace"

// ── Category config ───────────────────────────────────────────────────────────
type Cat = 'shift' | 'debt' | 'loss' | 'reward' | 'safety' | 'maintenance' | 'admin' | 'meeting' | 'donation'

const CAT: Record<Cat, { label: string; border: string; bg: string; color: string; cardBg?: string }> = {
  shift:       { label: 'Staffing Gap',      border: C.slate,   bg: 'rgba(118,127,124,.12)', color: C.slate   },
  debt:        { label: 'Bill of Debt',       border: C.brick,   bg: 'rgba(168,69,47,.1)',    color: C.brick   },
  loss:        { label: 'Lost / Missing',     border: C.brick,   bg: 'rgba(168,69,47,.1)',    color: C.brick   },
  reward:      { label: 'Reward Claim',       border: C.moss,    bg: 'rgba(63,120,86,.1)',    color: C.moss    },
  safety:      { label: 'Safety Incident',    border: C.brick,   bg: 'rgba(168,69,47,.15)',   color: C.brick,  cardBg: '#FBF3F1' },
  maintenance: { label: 'Maintenance',        border: C.tealMid, bg: 'rgba(43,95,86,.1)',     color: C.tealMid },
  admin:       { label: 'Admin Note',         border: C.amber,   bg: 'rgba(226,163,59,.15)',  color: C.amberDeep },
  meeting:     { label: 'Meeting Minutes',    border: C.teal,    bg: 'rgba(31,74,67,.1)',     color: C.teal    },
  donation:    { label: 'Donation',           border: C.moss,    bg: 'rgba(63,120,86,.1)',    color: C.moss    },
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface Incident { serial: string; cat: Cat; title: string; detail: string; resolution: string; by: string }
interface NoShow   { name: string; role: string; session: string; booked: boolean }
interface WeekDay  { key: string; d: string; date: string; admin: string; ops: string }

// ── Data ──────────────────────────────────────────────────────────────────────
const WEEK: WeekDay[] = [
  { key: 'sat', d: 'Sat', date: '01 Aug', admin: 'Taonga',  ops: '—' },
  { key: 'sun', d: 'Sun', date: '02 Aug', admin: '—',       ops: '—' },
  { key: 'mon', d: 'Mon', date: '03 Aug', admin: 'Fanelo',  ops: 'Collin, Charles, Petrus' },
  { key: 'tue', d: 'Tue', date: '04 Aug', admin: 'Bernard', ops: 'Petrus, Collin, Charles' },
  { key: 'wed', d: 'Wed', date: '05 Aug', admin: 'Fanelo',  ops: 'Charles, Petrus, Collin' },
  { key: 'thu', d: 'Thu', date: '06 Aug', admin: 'Bernard', ops: 'Coolin, Petrus, Dawn le Fleur' },
  { key: 'fri', d: 'Fri', date: '07 Aug', admin: 'Fanelo',  ops: 'Collin, Petrus, Dawn' },
]

const DAY_NAMES: Record<string, string> = {
  sat:'Saturday', sun:'Sunday', mon:'Monday', tue:'Tuesday', wed:'Wednesday', thu:'Thursday', fri:'Friday',
}

const NO_SHOWS: Record<string, NoShow[]> = {
  sat: [{ name: 'Rene Petzer',  role: 'Worker',  session: 'Morning',   booked: true }],
  sun: [{ name: 'Ashton Bosch', role: 'Foreman', session: 'Afternoon', booked: true }],
  mon: [{ name: 'Meleney',      role: 'Worker',  session: 'Morning',   booked: true }],
  tue: [{ name: 'Vukile',       role: 'Worker',  session: 'Morning',   booked: true }],
  wed: [], thu: [], fri: [],
}

const INCIDENTS: Record<string, Incident[]> = {
  sat: [
    { serial:'4717', cat:'debt',  title:'Outstanding bills of debt updated',
      detail:'Two debtors on the register: Mama Mafia owes R60 of R90 (missing item slip, no. 145) — saving from ready cash, R30 saved so far. Ryan Thomas owes R25.22 of R25.22 (Incident 4695 / MIS 162) — disqualified from participating until settled.',
      resolution:'Register total outstanding: R85.22 of R115.22 issued.', by:'Day Admin' },
    { serial:'4717', cat:'admin', title:'Admin computer stopped working',
      detail:'The Day Admin office computer failed. Taonga was advised to reboot; this did not resolve it. Failure was traced to a delayed software update.',
      resolution:'Computer shut down pending inspection by the IT Team. Taonga to use a laptop in the meantime.', by:'Taonga / Vincent' },
  ],
  sun: [
    { serial:'4719', cat:'admin', title:'Disputed extra hour — OBSID Sunday shift',
      detail:"Demien Miller and Yasim Buye, booked for a scheduled 4-hour OBSID shift, said they were asked to work five hours and requested extra pay. Admin confirmed William was not aware of any extra-hour arrangement; he agreed to follow up with OBSID on Monday.",
      resolution:'Team paid for the scheduled 4-hour shift in the interim. Yasin Buye and Damien Miller were each paid R35 for the extra half-shift hour, pending OBSID confirmation.', by:'Vincent' },
  ],
  mon: [
    { serial:'4721', cat:'reward', title:"Pre-school 6×6 claim — Jonathan de Bruin",
      detail:'Jonathan de Bruin submitted a 6×6 reward claim.',
      resolution:'Instructed to claim it the following day per project rules.', by:'Fanelo' },
    { serial:'4722', cat:'reward', title:"Pre-school 6×6 claim — Lizelle Cook",
      detail:'Lizelle Cook submitted a 6×6 reward claim.',
      resolution:'Instructed to claim it the following day per project rules.', by:'Fanelo' },
    { serial:'4723', cat:'admin', title:'Day administrator delayed — transport breakdown',
      detail:'Fanelo was delayed by a transport breakdown, arriving on site at 06:45 instead of the stipulated 06:30.',
      resolution:'Fanelo was coached on timekeeping.', by:'Fanelo' },
  ],
  tue: [
    { serial:'4725', cat:'reward', title:'6×6 claims paid — Lizelle Cook & Jonathan de Bruin',
      detail:"Both participants' claims, submitted the previous day (Monday 3 August), were processed.",
      resolution:'Claims paid out.', by:'Bernard' },
    { serial:'4726', cat:'meeting', title:'School Management Meeting minutes (31 July 2026)',
      detail:"Chaired by Hannes van der Merwe. Key items: coaching plan agreed for recurring incidents involving one participant; clarified roll-call procedure for filling open shift slots (team queue first, general pool only if unfilled); food-sharing pilot continuing well, two-person distribution team retained; Administration to take over Health & Safety Committee oversight; trolley wheel sourcing ongoing; Leaders Training Programme announced with 6 months' secured funding; Team 13, Team Coaching and Team 24 scored zero for the week over missing supporting documentation; depot gatekeeping practice flagged for a formal workshop.",
      resolution:'Minutes prepared by Vincent Kafula; next meeting Friday 7 August, afternoon.', by:'Vincent Kafula' },
  ],
  wed: [
    { serial:'4728', cat:'donation', title:'Good Samaritan donation received',
      detail:"An anonymous donor gave: 5 female tracksuit tops, 6 female trousers, 6 long-sleeved T-shirts, 4 ladies' church jackets, 2 ladies' dresses, 1 pair of shoes/boots, and assorted underwear and bras. Received by Charlotte.",
      resolution:'Logged by Lungile, Chilli, Charlotte and Fanelo Ngwenya.', by:'Fanelo' },
    { serial:'4729', cat:'loss', title:'Food-sharing container lost',
      detail:"At 11:45, Patrick Curtis found that Dumisani Fana's team had not returned their food-sharing container. John Luiz (Dumisani's teammate) said he heard Dumisani say he was taking the container with him.",
      resolution:'Jody coached Patrick on vigilance during food sharing. Hannes confirmed OPHELP will carry the cost of the loss.', by:'Jody' },
    { serial:'4730', cat:'reward', title:'Team coaching 6× reward claim — R180',
      detail:'Team coaching submitted a six-times reward claim for R180.',
      resolution:'Split as: R40 to the protégé, R40 to the team fund, R100 to Jody Solomon, per team agreement.', by:'Fanelo' },
    { serial:'4731', cat:'maintenance', title:'City of Cape Town maintenance on site',
      detail:'CoCT maintenance staff fitted 2 shower heads in the bathhouse and fixed the door handle to the stores next to the deployment area.',
      resolution:'Work completed.', by:'Fanelo' },
  ],
  thu: [
    { serial:'4733', cat:'debt', title:'Bill of Debt register — no new entries',
      detail:'No new debtors added to the register on this shift; prior balances (Mama Mafia, Ryan Thomas) remain outstanding.',
      resolution:'—', by:'Day Admin' },
    { serial:'4734', cat:'loss', title:'Fernando Timane lost gloves on shift',
      detail:'Dawn patrol (P1 & P4) — Fernando Timane (shift leader), Michael Pony, Zwelake Zama (workers). Fernando reported to stores on return to depot that he had lost his green gloves; he could not recall where.',
      resolution:'A missing item slip and a bill of debt slip were issued to Fernando Timane.', by:'Bernard' },
    { serial:'4735', cat:'shift', title:'Team 24 failed to provide gatekeeper, 06:30–11:00',
      detail:'Vusumsi Mpokeli, scheduled by Team 24, did not arrive. Konstantine Erkert was informed.',
      resolution:'Vincent Seegreen and Rene Pitzer stood in to keep the gate from 07:00–11:00. Konstantin Erkert paid R70, shared between them.', by:'Bernard' },
    { serial:'4736', cat:'maintenance', title:'City of Cape Town maintenance on site',
      detail:'Three CoCT maintenance staff arrived ~10:52 and fitted 3 shower heads, fixed 2 taps on pipes to the boiler room, and repaired the bathhouse office and storeroom door handles.',
      resolution:'5 shower rooms still without heads — staff may return to continue the work.', by:'Bernard' },
  ],
  fri: [
    { serial:'4738', cat:'reward', title:'6×6 claim submitted — Muzi Babi',
      detail:'Muzi Babi submitted a 6×6 claim.',
      resolution:'Coached to collect it the following day.', by:'Fanelo' },
    { serial:'4739', cat:'shift', title:'Team failed to report for practice session (MPRPA)',
      detail:'Konstantin Eckert, Gerald Mzamo, Dawn Le Fleur, Collin Pitzer — Team 24 had no members present for the morning deployment. Collin called Dawn to confirm final deployments.',
      resolution:'Shift rescheduled to the afternoon session; Konstantin coached on preparation. Cause: the slot moved from afternoon to morning, communicated to the team on Wed 5 Aug.', by:'Collin' },
    { serial:'4740', cat:'safety', title:'Intoxicated worker — Desmond Hendricks',
      detail:'At 13:15, Fanelo flagged that Desmond Hendricks appeared to be under the influence of alcohol. Jody attempted to breathalyse him; Desmond refused.',
      resolution:"Desmond was replaced on shift by Vincent Seagreen (via Foreman Meshack). Incident report submitted at Fanelo's request.", by:'Jody' },
  ],
}

// ── Computed totals ───────────────────────────────────────────────────────────
const ALL_INCIDENTS = Object.values(INCIDENTS).flat()
const CAT_COUNTS = (Object.keys(CAT) as Cat[]).reduce<Record<string, number>>((acc, k) => {
  acc[k] = ALL_INCIDENTS.filter(i => i.cat === k).length; return acc
}, {})
const TOTAL_NO_SHOWS = Object.values(NO_SHOWS).flat().length

const STATS = [
  { label: 'Total Incidents',  value: ALL_INCIDENTS.length, delta: '01–07 Aug 2026',                 warn: false },
  { label: 'Staffing Gaps',    value: CAT_COUNTS.shift + TOTAL_NO_SHOWS, delta: 'No-shows + uncovered posts', warn: false },
  { label: 'Bills of Debt',    value: CAT_COUNTS.debt + CAT_COUNTS.loss, delta: 'Issued or updated this week', warn: false },
  { label: 'Reward Claims',    value: CAT_COUNTS.reward, delta: '6×6 / 6× claims logged',            warn: false },
  { label: 'Safety Incidents', value: CAT_COUNTS.safety, delta: 'Requiring immediate action',        warn: CAT_COUNTS.safety > 0 },
]

// ── Main component ────────────────────────────────────────────────────────────
export default function IncidentLog() {
  useFonts()
  const [activeDay, setActiveDay]    = useState('sat')
  const [activeFilter, setFilter]    = useState<'all' | Cat>('all')

  const wInfo   = WEEK.find(w => w.key === activeDay)!
  const noShows = NO_SHOWS[activeDay]
  const dayIncs = INCIDENTS[activeDay].filter(i => activeFilter === 'all' || i.cat === activeFilter)

  // reset filter when switching day so stale category doesn't blank the view
  function selectDay(k: string) { setActiveDay(k); setFilter('all') }

  const card: React.CSSProperties = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 10 }
  const thS: React.CSSProperties  = { textAlign: 'left', fontFamily: mono, fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.slate, fontWeight: 600, padding: '9px 14px', background: C.paperDim, borderBottom: `1px solid ${C.line}` }
  const tdS: React.CSSProperties  = { padding: '9px 14px', fontSize: 13, borderBottom: `1px solid ${C.line}` }

  return (
    <div style={{ background: C.paper, minHeight: '100%', fontFamily: body, color: C.ink, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto', padding: '26px 28px 70px' }}>

        {/* Topbar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, gap: 20, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: display, fontSize: 23, fontWeight: 600, letterSpacing: '-0.01em', margin: 0 }}>City Depot Incident Log</h1>
            <div style={{ color: C.slate, fontSize: 13, marginTop: 4 }}>01 – 07 August 2026 · Weekly operations record</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 500, background: C.teal, color: '#fff', border: `1px solid ${C.teal}` }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.amber }} /> 7-day log
            </span>
            <button style={{ padding: '9px 16px', borderRadius: 8, background: C.ink, color: '#fff', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: body }}>
              Export Weekly Log
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
          {STATS.map(s => (
            <div key={s.label} style={{ ...card, padding: '16px 16px 14px', position: 'relative', overflow: 'hidden', ...(s.warn ? { borderColor: C.brick } : {}) }}>
              {s.warn && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: C.brick }} />}
              <div style={{ fontSize: 11, color: C.slate, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{s.label}</div>
              <div style={{ fontFamily: display, fontSize: 22, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 11.5, marginTop: 6, color: C.slate }}>{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Day selector */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 6, background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, padding: 5, overflowX: 'auto', width: 'fit-content' }}>
            {WEEK.map(w => {
              const cnt = INCIDENTS[w.key].length
              const active = w.key === activeDay
              return (
                <button key={w.key} onClick={() => selectDay(w.key)}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '8px 14px', borderRadius: 8, minWidth: 66, border: 'none', cursor: 'pointer', background: active ? C.teal : 'transparent', flexShrink: 0, transition: 'background .15s' }}>
                  <span style={{ fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: active ? '#BFD4CE' : C.slate, fontWeight: 600 }}>{w.d}</span>
                  <span style={{ fontFamily: mono, fontSize: 13, color: active ? '#fff' : C.ink }}>{w.date}</span>
                  <span style={{ fontSize: 10, color: active ? C.amber : C.slate, marginTop: 1 }}>{cnt} log{cnt !== 1 ? 's' : ''}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Category chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {([['all', 'All categories'], ...Object.entries(CAT).map(([k, v]) => [k, v.label])] as [string, string][]).map(([key, label]) => {
            const active = activeFilter === key
            return (
              <button key={key} onClick={() => setFilter(key as typeof activeFilter)}
                style={{ padding: '6px 13px', borderRadius: 999, border: `1px solid ${active ? C.ink : C.line}`, background: active ? C.ink : C.card, fontSize: 12, fontWeight: 500, color: active ? '#fff' : C.inkSoft, cursor: 'pointer', fontFamily: body, transition: 'background .15s' }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Day header */}
        <div style={{ ...card, padding: '14px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontFamily: display, fontWeight: 600, fontSize: 15 }}>{DAY_NAMES[activeDay]} {wInfo.date} 2026</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[['Admin', wInfo.admin], ['Ops', wInfo.ops]].map(([lbl, val]) => (
              <span key={lbl} style={{ fontSize: 11.5, padding: '4px 10px', borderRadius: 999, background: C.paperDim, color: C.inkSoft }}>
                {lbl}: <b style={{ color: C.teal }}>{val}</b>
              </span>
            ))}
          </div>
        </div>

        {/* No-show strip */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.slate, marginBottom: 8 }}>Failed to turn up for booked shift</div>
          {noShows.length === 0
            ? <div style={{ padding: '16px 18px', fontSize: 12.5, color: C.slate, background: C.card, border: `1px dashed ${C.line}`, borderRadius: 10 }}>No new no-shows reported for this shift.</div>
            : (
              <table style={{ width: '100%', borderCollapse: 'collapse', ...card, overflow: 'hidden' }}>
                <thead><tr>{['Name', 'Designation', 'Session', 'Booked', 'Pirated'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {noShows.map((n, i) => (
                    <tr key={i}>
                      <td style={{ ...tdS, fontWeight: 500 }}>{n.name}</td>
                      <td style={tdS}>{n.role}</td>
                      <td style={tdS}>{n.session}</td>
                      <td style={{ ...tdS, color: C.moss, fontWeight: 700 }}>{n.booked ? '✓' : ''}</td>
                      <td style={tdS} />
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>

        {/* Incident cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {dayIncs.length === 0
            ? (
              <div style={{ ...card, border: `1px dashed ${C.line}`, padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ fontFamily: display, fontSize: 14.5, color: C.inkSoft, fontWeight: 600, marginBottom: 4 }}>No incidents in this category</div>
                <div style={{ fontSize: 12.5, color: C.slate }}>Try a different filter or select another day.</div>
              </div>
            )
            : dayIncs.map((inc, i) => {
              const cfg = CAT[inc.cat]
              return (
                <div key={i} style={{ ...card, padding: '16px 18px', borderLeft: `4px solid ${cfg.border}`, background: cfg.cardBg ?? C.card }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: mono, fontSize: 11.5, color: C.slate }}>#{inc.serial}</span>
                      <span style={{ fontFamily: display, fontWeight: 600, fontSize: 14 }}>{inc.title}</span>
                    </div>
                    <span style={{ fontSize: 10.5, fontWeight: 600, padding: '3px 9px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap', background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                  </div>

                  <p style={{ fontSize: 13, color: C.inkSoft, marginBottom: inc.resolution && inc.resolution !== '—' ? 10 : 0, lineHeight: 1.55 }}>{inc.detail}</p>

                  {inc.resolution && inc.resolution !== '—' && (
                    <div style={{ background: C.paperDim, borderRadius: 8, padding: '10px 12px', fontSize: 12.5 }}>
                      <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.06em', color: C.slate, fontWeight: 600, marginBottom: 3 }}>Resolution / Management Comment</div>
                      {inc.resolution}
                    </div>
                  )}

                  <div style={{ marginTop: 8, fontSize: 11.5, color: C.slate }}>
                    Reported by <b style={{ color: C.inkSoft }}>{inc.by}</b>
                  </div>
                </div>
              )
            })
          }
        </div>

      </div>
    </div>
  )
}
