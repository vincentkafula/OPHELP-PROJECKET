import { useState, useEffect, useRef, useCallback } from 'react'

// ── Fonts + Leaflet ────────────────────────────────────────────────────────────
function useAssets() {
  useEffect(() => {
    if (!document.getElementById('ldr-fonts')) {
      const f = document.createElement('link'); f.id = 'ldr-fonts'; f.rel = 'stylesheet'
      f.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
      document.head.appendChild(f)
    }
    if (!document.getElementById('leaflet-css')) {
      const c = document.createElement('link'); c.id = 'leaflet-css'; c.rel = 'stylesheet'
      c.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css'
      document.head.appendChild(c)
    }
    if (!document.getElementById('xlsx-js')) {
      const x = document.createElement('script'); x.id = 'xlsx-js'; x.async = true
      x.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
      document.head.appendChild(x)
    }
  }, [])
}

// ── Tokens ─────────────────────────────────────────────────────────────────────
const T = {
  ink: '#14201E', ink2: '#1D2E2A', paper: '#F4F0E4', paper2: '#EAE4D4',
  amber: '#E8A33D', amberD: '#7A5015', teal: '#1F6F6B', tealD: '#0E3532',
  coral: '#D65B3C', coralD: '#6E2C1B', slate: '#6B7370',
  line: 'rgba(20,32,30,0.16)', lineStrong: 'rgba(20,32,30,0.32)',
}
const display = "'Oswald','Segoe UI',sans-serif"
const mono = "'IBM Plex Mono','SF Mono',Consolas,monospace"
const body = "'Inter','Segoe UI',Arial,sans-serif"

// ── Types ─────────────────────────────────────────────────────────────────────
type LeaveType = 'Holiday' | 'Family' | 'Sick'
interface LeaveRecord { period: string; days: number; type: LeaveType }
interface Entitlement { holiday: number; family: number; sick: number }
interface Employee { id: string; name: string; entitlement: Entitlement; records: LeaveRecord[] }

// ── Seed data ─────────────────────────────────────────────────────────────────
const SEED: Employee[] = [
  { id:'patience', name:'Patience Takavadiyi', entitlement:{holiday:15,family:3,sick:7},
    records:[{period:'13 Apr – 05 May 2026',days:15,type:'Holiday'}] },
  { id:'keagan', name:'Keagan Rudolph', entitlement:{holiday:15,family:3,sick:12},
    records:[{period:'01 Aug 2025',days:1,type:'Sick'},{period:'30 Mar – 07 Apr 2026',days:4,type:'Holiday'},{period:'29 Jun 2026',days:1,type:'Holiday'}] },
  { id:'vincent', name:'Vincent Kafula', entitlement:{holiday:16,family:3,sick:26},
    records:[
      {period:'04–05 Aug 2025',days:2,type:'Holiday'},{period:'13 Oct 2025',days:1,type:'Sick'},
      {period:'15 Oct 2025',days:1,type:'Family'},{period:'20 Oct 2025',days:1,type:'Family'},
      {period:'27 Oct 2025',days:1,type:'Family'},{period:'29 Oct 2025',days:1,type:'Family'},
      {period:'30 Oct 2025',days:1,type:'Family'},{period:'03 Nov 2025',days:1,type:'Family'},
      {period:'05 Nov 2025',days:1,type:'Family'},{period:'07–14 Nov 2025',days:6,type:'Holiday'},
      {period:'18 Mar 2026',days:1,type:'Family'},{period:'04 May 2026',days:1,type:'Holiday'}
    ]},
  { id:'taonga', name:'Taonga Kusure', entitlement:{holiday:15,family:3,sick:30},
    records:[{period:'13 Apr – 03 May 2026',days:13,type:'Holiday'},{period:'23 Jun 2026',days:1,type:'Holiday'}] },
  { id:'larry', name:'Larry Seef', entitlement:{holiday:1.2,family:3,sick:13.18},
    records:[{period:'Paid out',days:1.2,type:'Holiday'},{period:'17 Jul 2025',days:1,type:'Sick'}] },
  { id:'melanie', name:'Melanie de Bruyn', entitlement:{holiday:7.53,family:3,sick:12.01},
    records:[{period:'18–20 Jul 2025',days:3,type:'Sick'},{period:'27 Oct 2025',days:1,type:'Holiday'},{period:'30 Oct 2025',days:1,type:'Holiday'}] },
  { id:'charles', name:'Charles Kudzinesa', entitlement:{holiday:30.65,family:3,sick:20.38},
    records:[{period:'04–24 Jul 2024',days:15,type:'Holiday'},{period:'04–06 May 2026',days:3,type:'Holiday'}] },
  { id:'collin', name:'Collin Pitzer', entitlement:{holiday:33.13,family:3,sick:12.67},
    records:[
      {period:'28 Jul – 02 Aug 2025',days:6,type:'Holiday'},{period:'04–08 Aug 2025',days:5,type:'Holiday'},
      {period:'29 Oct 2025',days:1,type:'Holiday'},{period:'12 Dec 2025',days:10,type:'Holiday'},
      {period:'23 Dec 2025',days:1,type:'Holiday'}
    ]},
  { id:'charlotte', name:'Charlotte Januarie', entitlement:{holiday:12.08,family:8,sick:30},
    records:[
      {period:'01–07 Jul 2025',days:5,type:'Sick'},{period:'09–13 Jul 2025',days:3,type:'Sick'},
      {period:'23–25 Jul 2025',days:3,type:'Sick'},{period:'28–30 Jul 2025',days:3,type:'Sick'},
      {period:'04 Aug 2025',days:1,type:'Sick'},{period:'25 Aug 2025',days:1,type:'Sick'},
      {period:'24 Sep 2025',days:1,type:'Sick'},{period:'08 Oct 2025',days:1,type:'Sick'},
      {period:'16 Oct 2025',days:1,type:'Sick'},{period:'12–13 May 2026',days:2,type:'Sick'},
      {period:'10–11 Jun 2026',days:2,type:'Sick'},{period:'18 Jun 2026',days:1,type:'Sick'}
    ]},
  { id:'dawn', name:'Dawn Le Fleur', entitlement:{holiday:12.7,family:3,sick:15.43},
    records:[
      {period:'05 Sep 2025',days:1,type:'Holiday'},{period:'15–18 Nov 2025',days:4,type:'Holiday'},
      {period:'25–26 Dec 2025',days:2,type:'Holiday'},{period:'03–07 Apr 2026',days:4,type:'Holiday'},
      {period:'08–09 Jun 2026',days:2,type:'Sick'},{period:'26–30 Dec 2025',days:3,type:'Family'},
      {period:'09 Jan 2026',days:1,type:'Family'},{period:'21 Jan 2026',days:1,type:'Sick'},
      {period:'29 Jan 2026',days:1,type:'Sick'},{period:'10 Feb 2026',days:1,type:'Family'},
      {period:'19 Feb 2026',days:2,type:'Sick'},{period:'16 Apr 2026',days:1,type:'Family'},
      {period:'20–21 Apr 2026',days:2,type:'Sick'},{period:'22 Apr 2026',days:1,type:'Family'},
      {period:'19–20 May 2026',days:2,type:'Sick'},{period:'15–16 Jun 2026',days:2,type:'Family'}
    ]},
]

const STORAGE_KEY = 'ophelp_leave_register_v1'

function loadEmployees(): Employee[] {
  try { const r = localStorage.getItem(STORAGE_KEY); if (r) return JSON.parse(r) } catch { /**/ }
  return JSON.parse(JSON.stringify(SEED))
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function usedFor(emp: Employee, type: LeaveType) {
  return emp.records.filter(r => r.type === type).reduce((s, r) => s + (r.days || 0), 0)
}
function remainingFor(emp: Employee, type: LeaveType) {
  return (emp.entitlement[type.toLowerCase() as keyof Entitlement] || 0) - usedFor(emp, type)
}
function fmt(n: number): string {
  const v = Math.round(n * 100) / 100
  return v % 1 === 0 ? String(v) : v.toFixed(2)
}
function genRef() { return 'LV-' + new Date().getFullYear() + '-' + Math.floor(1000 + Math.random() * 9000) }

// ── Section label ─────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.tealD, fontWeight: 600, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
      {children}
      <div style={{ flex: 1, height: 1, background: T.lineStrong }} />
    </div>
  )
}

// ── Leave type tag ────────────────────────────────────────────────────────────
const TAG_COLORS: Record<LeaveType, string> = { Holiday: T.amberD, Family: T.tealD, Sick: T.coralD }
function TypeTag({ type }: { type: LeaveType }) {
  return (
    <span style={{ display: 'inline-block', fontFamily: mono, fontSize: 9.5, textTransform: 'uppercase', padding: '2px 7px', borderRadius: 10, color: T.paper, background: TAG_COLORS[type] }}>
      {type}
    </span>
  )
}

// ── Depot map ─────────────────────────────────────────────────────────────────
declare global { interface Window { L?: unknown } }
interface LeafletMap { remove: () => void; setView: (c: [number,number], z: number) => void; on: (e: string, cb: (e: { latlng: { lat: number; lng: number } }) => void) => void }
interface LeafletMarker { remove: () => void; getLatLng: () => { lat: number; lng: number }; on: (e: string, cb: () => void) => void; addTo: (m: LeafletMap) => LeafletMarker }
interface LeafletLib {
  map: (id: string, opts?: object) => LeafletMap
  tileLayer: (url: string, opts?: object) => { addTo: (m: LeafletMap) => void }
  marker: (latlng: [number,number], opts?: object) => LeafletMarker
}

function DepotMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<LeafletMap | null>(null)
  const markerRef = useRef<LeafletMarker | null>(null)
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState('—')
  const [lng, setLng] = useState('—')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Load Leaflet JS then init map
  useEffect(() => {
    function tryInit() {
      const L = (window as Window & { L?: LeafletLib }).L
      if (!L || !mapRef.current || mapInstance.current) return
      const m = L.map('ldr-map', { attributionControl: true })
      m.setView([-33.9249, 18.4241], 12)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap contributors',
      }).addTo(m)
      m.on('click', (e: { latlng: { lat: number; lng: number } }) => placeMarker(e.latlng.lat, e.latlng.lng, true))
      mapInstance.current = m
      setMapReady(true)
    }

    if ((window as Window & { L?: LeafletLib }).L) { tryInit(); return }
    if (!document.getElementById('leaflet-js')) {
      const s = document.createElement('script'); s.id = 'leaflet-js'
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
      s.onload = () => tryInit()
      document.head.appendChild(s)
    } else {
      const interval = setInterval(() => { if ((window as Window & { L?: LeafletLib }).L) { clearInterval(interval); tryInit() } }, 200)
      return () => clearInterval(interval)
    }
  }, [])

  function placeMarker(la: number, ln: number, fromClick: boolean) {
    const L = (window as Window & { L?: LeafletLib }).L; if (!L || !mapInstance.current) return
    if (markerRef.current) markerRef.current.remove()
    const mk = L.marker([la, ln], { draggable: true }).addTo(mapInstance.current)
    mk.on('dragend', () => { const p = mk.getLatLng(); setLat(p.lat.toFixed(6)); setLng(p.lng.toFixed(6)) })
    markerRef.current = mk
    mapInstance.current.setView([la, ln], 15)
    setLat(la.toFixed(6)); setLng(ln.toFixed(6))
    if (fromClick) setStatus('Pin dropped. Drag it to fine-tune.')
  }

  async function geocode() {
    if (!address.trim()) { setStatus('Type an address first.'); return }
    setLoading(true); setStatus('Looking up address…')
    try {
      const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(address)
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      const data = await res.json()
      if (!data.length) { setStatus('No match found — try adding a suburb or city.'); return }
      const { lat: la, lon, display_name } = data[0]
      placeMarker(parseFloat(la), parseFloat(lon), false)
      setStatus('Located: ' + display_name)
    } catch { setStatus('Could not reach the map service.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = { flex: 1, fontFamily: body, fontSize: 13, padding: '8px 10px', border: `1px solid ${T.lineStrong}`, borderRadius: 3, background: T.paper, outline: 'none' }
  const btn: React.CSSProperties = { fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', background: T.tealD, color: T.paper, border: 'none', borderRadius: 3, padding: '0 14px', cursor: 'pointer', flexShrink: 0, height: 38 }

  return (
    <div>
      <SectionLabel>Depot / site location</SectionLabel>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input style={inp} value={address} onChange={e => setAddress(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && geocode()} placeholder="Type a depot or site address, then Locate" />
        <button style={{ ...btn, opacity: loading ? 0.6 : 1 }} onClick={geocode} disabled={loading}>
          {loading ? 'Locating…' : 'Locate'}
        </button>
      </div>
      <div id="ldr-map" ref={mapRef} style={{ width: '100%', height: 240, border: `1.5px solid ${T.ink}`, borderRadius: 3, background: T.paper2 }}>
        {!mapReady && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', fontFamily: mono, fontSize: 11, color: T.slate }}>Loading map…</div>}
      </div>
      <div style={{ display: 'flex', gap: 18, marginTop: 8, fontFamily: mono, fontSize: 10, color: T.slate }}>
        <span>Lat: {lat}</span><span>Lng: {lng}</span>
      </div>
      {status && <div style={{ fontFamily: mono, fontSize: 10, color: T.slate, marginTop: 6 }}>{status}</div>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function LeaveDaysRegister() {
  useAssets()
  const [employees, setEmployees] = useState<Employee[]>(loadEmployees)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [refNo] = useState(genRef)
  const [newRecord, setNewRecord] = useState({ period: '', days: '', type: 'Holiday' as LeaveType })

  // Entitlement edit state (mirrors active employee)
  const [entEdit, setEntEdit] = useState({ holiday: '', family: '', sick: '' })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(employees)) } catch { /**/ }
  }, [employees])

  const activeEmp = employees.find(e => e.id === activeId) ?? null

  function openDetail(id: string) {
    const emp = employees.find(e => e.id === id); if (!emp) return
    setActiveId(id)
    setEntEdit({ holiday: String(emp.entitlement.holiday), family: String(emp.entitlement.family), sick: String(emp.entitlement.sick) })
  }
  function closeDetail() { setActiveId(null) }

  function updateEntitlement(k: keyof Entitlement, v: string) {
    setEntEdit(prev => ({ ...prev, [k]: v }))
    if (!activeId) return
    const val = parseFloat(v) || 0
    setEmployees(prev => prev.map(e => e.id === activeId ? { ...e, entitlement: { ...e.entitlement, [k]: val } } : e))
  }

  function addRecord() {
    if (!activeId || !newRecord.period.trim() || !newRecord.days) return
    setEmployees(prev => prev.map(e => e.id === activeId
      ? { ...e, records: [...e.records, { period: newRecord.period.trim(), days: parseFloat(newRecord.days) || 0, type: newRecord.type }] }
      : e))
    setNewRecord({ period: '', days: '', type: 'Holiday' })
  }

  function removeRecord(empId: string, idx: number) {
    setEmployees(prev => prev.map(e => e.id === empId ? { ...e, records: e.records.filter((_, i) => i !== idx) } : e))
  }

  function resetToSeed() {
    if (!confirm('Reset all leave data back to seed values? Unsaved changes will be lost.')) return
    setEmployees(JSON.parse(JSON.stringify(SEED)))
    setActiveId(null)
  }

  function exportExcel() {
    const XLSX = (window as Window & { XLSX?: { utils: { book_new: () => unknown; aoa_to_sheet: (d: unknown[][]) => { '!cols'?: { wch: number }[] }; book_append_sheet: (wb: unknown, ws: unknown, name: string) => void }; writeFile: (wb: unknown, name: string) => void } }).XLSX
    if (!XLSX) { alert('Excel library is still loading, please try again in a moment.'); return }
    const wb = XLSX.utils.book_new()
    const balSheet: unknown[][] = [['Name','Holiday used','Holiday avail','Holiday left','Family used','Family avail','Family left','Sick used','Sick avail','Sick left']]
    employees.forEach(e => balSheet.push([e.name, usedFor(e,'Holiday'), e.entitlement.holiday, remainingFor(e,'Holiday'), usedFor(e,'Family'), e.entitlement.family, remainingFor(e,'Family'), usedFor(e,'Sick'), e.entitlement.sick, remainingFor(e,'Sick')]))
    const ws1 = XLSX.utils.aoa_to_sheet(balSheet); ws1['!cols'] = Array(10).fill({ wch: 14 })
    const recSheet: unknown[][] = [['Name','Period','Days','Type']]
    employees.forEach(e => e.records.forEach(r => recSheet.push([e.name, r.period, r.days, r.type])))
    const ws2 = XLSX.utils.aoa_to_sheet(recSheet); ws2['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 8 }, { wch: 10 }]
    XLSX.utils.book_append_sheet(wb, ws1, 'Leave Balances')
    XLSX.utils.book_append_sheet(wb, ws2, 'Leave Records')
    XLSX.writeFile(wb, `opruim-leave-register-${refNo}.xlsx`)
  }

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalHolidayLeft = employees.reduce((s, e) => s + remainingFor(e, 'Holiday'), 0)
  const totalFamilyLeft = employees.reduce((s, e) => s + remainingFor(e, 'Family'), 0)
  const totalSickLeft = employees.reduce((s, e) => s + remainingFor(e, 'Sick'), 0)

  // ── Styles ─────────────────────────────────────────────────────────────────
  const panel: React.CSSProperties = { position: 'relative', background: T.paper2, border: `1.5px solid ${T.ink}`, borderRadius: 4, padding: 26, marginBottom: 22 }
  const thS: React.CSSProperties = { background: T.ink, color: T.paper, fontFamily: mono, fontWeight: 600, textTransform: 'uppercase', fontSize: 9.5, letterSpacing: '0.03em', border: `1px solid ${T.lineStrong}`, padding: '6px 8px', textAlign: 'center' }
  const tdS: React.CSSProperties = { border: `1px solid ${T.lineStrong}`, padding: '6px 8px', textAlign: 'center', fontSize: 12.5 }

  const perfEdge = { position: 'absolute' as const, left: -1, right: -1, top: 0, height: 12, backgroundImage: `radial-gradient(circle at 10px 0, transparent 5px, ${T.paper} 5.5px)`, backgroundSize: '20px 12px', backgroundRepeat: 'repeat-x', transform: 'translateY(-6px)', pointerEvents: 'none' as const }

  const actionBtn = (variant?: string): React.CSSProperties => {
    const base: React.CSSProperties = { fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', borderRadius: 3, padding: '8px 16px', cursor: 'pointer' }
    if (variant === 'ghost') return { ...base, background: 'transparent', color: T.ink, border: `1px solid ${T.lineStrong}` }
    if (variant === 'coral') return { ...base, background: T.coralD, color: T.paper, border: 'none' }
    if (variant === 'teal') return { ...base, background: T.tealD, color: T.paper, border: 'none' }
    return { ...base, background: T.ink, color: T.paper, border: 'none' }
  }

  return (
    <div style={{ background: T.paper, minHeight: '100%', fontFamily: body, color: T.ink, WebkitFontSmoothing: 'antialiased' }}>
      <div style={{ maxWidth: 980, margin: '0 auto', padding: '28px 20px 70px' }}>

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: T.teal, border: `2px solid ${T.ink}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: display, fontWeight: 700, fontSize: 13, color: T.paper, flexShrink: 0 }}>OS</div>
            <div style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.slate }}>OPRUIM SERVICES — Operational Files</div>
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: T.slate }}>Ref. <b style={{ color: T.ink }}>{refNo}</b></div>
        </div>

        {/* Main panel */}
        <div style={panel}>
          <div style={perfEdge} />

          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ fontFamily: display, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: 24, margin: '0 0 3px' }}>Leave Days Register</h1>
            <div style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.14em', color: T.slate }}>Financial year · July 2025 – June 2026</div>
          </div>

          {/* Stat tiles */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Employees', value: employees.length, warn: false },
              { label: 'Holiday days left (all staff)', value: fmt(totalHolidayLeft), warn: totalHolidayLeft < 0 },
              { label: 'Family days left (all staff)', value: fmt(totalFamilyLeft), warn: totalFamilyLeft < 0 },
              { label: 'Sick days left (all staff)', value: fmt(totalSickLeft), warn: totalSickLeft < 0 },
            ].map(t => (
              <div key={t.label} style={{ border: `1px solid ${T.lineStrong}`, background: T.paper, borderRadius: 3, padding: '12px 12px 10px' }}>
                <div style={{ fontFamily: mono, fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em', color: T.slate, marginBottom: 6 }}>{t.label}</div>
                <div style={{ fontFamily: display, fontWeight: 700, fontSize: 26, color: t.warn ? T.coralD : T.tealD }}>{t.value}</div>
              </div>
            ))}
          </div>

          {/* Balance table */}
          <SectionLabel>Employee leave balances</SectionLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', border: `1px solid ${T.lineStrong}`, fontSize: 12.5 }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ ...thS, textAlign: 'left', minWidth: 160 }}>Name &amp; surname</th>
                  <th colSpan={3} style={{ ...thS, borderLeft: `2px solid ${T.amberD}` }}>Holiday</th>
                  <th colSpan={3} style={{ ...thS, borderLeft: `2px solid ${T.tealD}` }}>Family</th>
                  <th colSpan={3} style={{ ...thS, borderLeft: `2px solid ${T.coralD}` }}>Sick</th>
                </tr>
                <tr>
                  <th style={{ ...thS, borderLeft: `2px solid ${T.amberD}` }}>Used</th><th style={thS}>Avail.</th><th style={thS}>Left</th>
                  <th style={{ ...thS, borderLeft: `2px solid ${T.tealD}` }}>Used</th><th style={thS}>Avail.</th><th style={thS}>Left</th>
                  <th style={{ ...thS, borderLeft: `2px solid ${T.coralD}` }}>Used</th><th style={thS}>Avail.</th><th style={thS}>Left</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((e, idx) => {
                  const hU = usedFor(e, 'Holiday'), hA = e.entitlement.holiday, hR = remainingFor(e, 'Holiday')
                  const fU = usedFor(e, 'Family'),  fA = e.entitlement.family,  fR = remainingFor(e, 'Family')
                  const sU = usedFor(e, 'Sick'),    sA = e.entitlement.sick,    sR = remainingFor(e, 'Sick')
                  const rowBg = e.id === activeId ? 'rgba(31,111,107,0.14)' : idx % 2 === 1 ? 'rgba(20,32,30,0.03)' : 'transparent'
                  return (
                    <tr key={e.id} style={{ background: rowBg }}>
                      <td style={{ ...tdS, textAlign: 'left', fontWeight: 600, cursor: 'pointer', color: T.tealD }} onClick={() => openDetail(e.id)}>{e.name}</td>
                      <td style={{ ...tdS, borderLeft: `2px solid ${T.amberD}` }}>{fmt(hU)}</td><td style={tdS}>{fmt(hA)}</td>
                      <td style={{ ...tdS, color: hR < 0 ? T.coralD : 'inherit', fontWeight: hR < 0 ? 600 : 400 }}>{fmt(hR)}</td>
                      <td style={{ ...tdS, borderLeft: `2px solid ${T.tealD}` }}>{fmt(fU)}</td><td style={tdS}>{fmt(fA)}</td>
                      <td style={{ ...tdS, color: fR < 0 ? T.coralD : 'inherit', fontWeight: fR < 0 ? 600 : 400 }}>{fmt(fR)}</td>
                      <td style={{ ...tdS, borderLeft: `2px solid ${T.coralD}` }}>{fmt(sU)}</td><td style={tdS}>{fmt(sA)}</td>
                      <td style={{ ...tdS, color: sR < 0 ? T.coralD : 'inherit', fontWeight: sR < 0 ? 600 : 400 }}>{fmt(sR)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p style={{ fontFamily: mono, fontSize: 10, color: T.slate, marginTop: 6 }}>Click an employee name to view or edit their leave records.</p>
        </div>

        {/* Detail panel */}
        {activeEmp && (
          <div style={panel}>
            <div style={perfEdge} />
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
              <h2 style={{ fontFamily: display, fontSize: 18, textTransform: 'uppercase', letterSpacing: '0.02em', margin: 0 }}>{activeEmp.name}</h2>
              <button onClick={closeDetail} style={{ fontFamily: mono, fontSize: 10, textTransform: 'uppercase', background: 'transparent', border: `1px solid ${T.lineStrong}`, borderRadius: 3, padding: '5px 10px', cursor: 'pointer', color: T.ink }}>
                Close
              </button>
            </div>

            {/* Entitlement inputs */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {([['holiday', 'Holiday entitlement'], ['family', 'Family entitlement'], ['sick', 'Sick entitlement']] as [keyof Entitlement, string][]).map(([k, lbl]) => (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontFamily: mono, fontSize: 9.5, textTransform: 'uppercase', color: T.slate }}>{lbl}</label>
                  <input type="number" step="0.01" value={entEdit[k]} onChange={e => updateEntitlement(k, e.target.value)}
                    style={{ width: 90, fontFamily: mono, fontSize: 13, padding: '5px 7px', border: `1px solid ${T.lineStrong}`, borderRadius: 3, background: T.paper, outline: 'none' }} />
                </div>
              ))}
            </div>

            {/* Records table */}
            <SectionLabel>Leave taken this financial year</SectionLabel>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 12 }}>
              <thead>
                <tr>
                  {['Day & date off', 'Days', 'Type', ''].map(h => (
                    <th key={h} style={{ fontFamily: mono, textTransform: 'uppercase', fontSize: 9.5, color: T.slate, borderBottom: `1px solid ${T.lineStrong}`, padding: '6px 8px', textAlign: 'left' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeEmp.records.length === 0
                  ? <tr><td colSpan={4} style={{ padding: '8px', color: T.slate, fontStyle: 'italic' }}>No leave recorded yet.</td></tr>
                  : activeEmp.records.map((r, i) => (
                    <tr key={i}>
                      <td style={{ borderBottom: `1px solid ${T.line}`, padding: '6px 8px' }}>{r.period}</td>
                      <td style={{ borderBottom: `1px solid ${T.line}`, padding: '6px 8px' }}>{fmt(r.days)}</td>
                      <td style={{ borderBottom: `1px solid ${T.line}`, padding: '6px 8px' }}><TypeTag type={r.type} /></td>
                      <td style={{ borderBottom: `1px solid ${T.line}`, padding: '6px 8px' }}>
                        <button onClick={() => removeRecord(activeEmp.id, i)} style={{ background: 'transparent', border: 'none', color: T.coralD, cursor: 'pointer', fontFamily: mono, fontSize: 11 }}>Remove</button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Add record row */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input value={newRecord.period} onChange={e => setNewRecord(p => ({ ...p, period: e.target.value }))}
                placeholder="e.g. 14 – 16 Sep 2026"
                style={{ flex: 1, minWidth: 160, fontFamily: body, fontSize: 12.5, padding: '6px 8px', border: `1px solid ${T.lineStrong}`, borderRadius: 3, background: T.paper, outline: 'none' }} />
              <input type="number" step="0.01" value={newRecord.days} onChange={e => setNewRecord(p => ({ ...p, days: e.target.value }))}
                placeholder="Days"
                style={{ width: 80, fontFamily: body, fontSize: 12.5, padding: '6px 8px', border: `1px solid ${T.lineStrong}`, borderRadius: 3, background: T.paper, outline: 'none' }} />
              <select value={newRecord.type} onChange={e => setNewRecord(p => ({ ...p, type: e.target.value as LeaveType }))}
                style={{ fontFamily: body, fontSize: 12.5, padding: '6px 8px', border: `1px solid ${T.lineStrong}`, borderRadius: 3, background: T.paper, outline: 'none' }}>
                <option>Holiday</option><option>Family</option><option>Sick</option>
              </select>
              <button onClick={addRecord}
                style={{ fontFamily: mono, fontSize: 11, textTransform: 'uppercase', background: T.tealD, color: T.paper, border: 'none', borderRadius: 3, padding: '7px 14px', cursor: 'pointer' }}>
                Add entry
              </button>
            </div>
          </div>
        )}

        {/* Depot map panel */}
        <div style={panel}>
          <div style={perfEdge} />
          <DepotMap />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', fontFamily: mono, fontSize: 10, color: T.slate, marginTop: 16, letterSpacing: '0.02em' }}>
          OPRUIM SERVICES · Leave Days Register · Seeded from the uploaded FY2025/26 workbook — figures are editable
        </div>

        {/* Action bar */}
        <div className="no-print" style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
          <button onClick={resetToSeed} style={actionBtn('ghost')}>Reset to seed data</button>
          <button onClick={exportExcel} style={actionBtn('teal')}>Export Excel</button>
          <button onClick={() => window.print()} style={actionBtn()}>Print</button>
        </div>

      </div>
    </div>
  )
}
