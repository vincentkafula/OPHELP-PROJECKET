import { useState, useEffect, useRef } from 'react'
import opHelpLogo from '@/imports/Ophelp_Final_Logo.png'
import LoginModal from '@/components/LoginModal'
import Dashboard from '@/components/Dashboard'
import type { AuthUser } from '@/components/LoginModal'
import { bootstrap } from '@/lib/db'
import { AuthService } from '@/lib/auth'
import { ReportApi } from '@/lib/api'

// ── Colours ──────────────────────────────────────────────────────────────────
const C = {
  green: '#2E7D32',
  greenLight: '#43A047',
  greenDark: '#1B5E20',
  blue: '#1565C0',
  gold: '#F9A825',
  bg: '#F5F7FA',
  white: '#FFFFFF',
  text: '#1F2937',
  textMuted: '#6B7280',
  success: '#4CAF50',
  danger: '#E53935',
}

// ── Fade-in on scroll ─────────────────────────────────────────────────────────
function useFade(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, visible }
}

function Fade({ children, delay = 0, style = {} }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const { ref, visible } = useFade()
  return (
    <div ref={ref} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`, ...style }}>
      {children}
    </div>
  )
}

// ── Nav links ─────────────────────────────────────────────────────────────────
const NAV = ['Home', 'About', 'OPHELP Programme', 'Work Opportunities', 'Partner Shops', 'ATM Locations', 'Dashboard', 'Donate', 'Contact']

// ── Stats ─────────────────────────────────────────────────────────────────────
const STATS = [
  { value: '60+', label: 'Years in Ministry' },
  { value: '10,000+', label: 'Lives Touched' },
  { value: '200,000+', label: 'VTJ Dolls Distributed' },
  { value: '650+', label: 'OPHELP Participants' },
]

// ── Mission cards ─────────────────────────────────────────────────────────────
const MISSION = [
  { icon: '❤️', title: 'Show Christ\'s Love', desc: 'Demonstrating the love of Christ through practical ministry and compassionate outreach to every person we serve.' },
  { icon: '🤝', title: 'Serve Those in Need', desc: 'Actively serving people in distress with dignity, meeting immediate needs while offering pathways to lasting change.' },
  { icon: '📢', title: 'Speak Up for the Voiceless', desc: 'Advocating for those who have no voice, standing with the marginalized and vulnerable in our communities.' },
  { icon: '🌍', title: 'Serve Everyone', desc: 'Serving people regardless of race, age, religion, culture, or sexual orientation — every person holds equal value.' },
]

// ── OPHELP workflow steps ─────────────────────────────────────────────────────
const WORKFLOW = [
  { num: '1', icon: '👤', title: 'Register', desc: 'Participant receives an OPHELP account and card.' },
  { num: '2', icon: '🔨', title: 'Work', desc: 'Participant completes a scheduled 4-hour work shift.' },
  { num: '3', icon: '✅', title: 'Supervisor Approval', desc: 'Supervisor confirms attendance and work completion.' },
  { num: '4', icon: '💳', title: 'Digital Payment', desc: 'System loads earnings onto the participant\'s OPHELP card.' },
  { num: '5', icon: '🏧', title: 'Spend or Withdraw', desc: 'Withdraw from supported ATMs or purchase at partner shops.' },
]

// ── Features ──────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: '👤', title: 'Participant Registration', desc: 'Streamlined onboarding with digital profile creation and OPHELP card issuance.' },
  { icon: '🕒', title: 'Shift Scheduling', desc: 'Coordinators assign and manage work shifts across community projects.' },
  { icon: '✅', title: 'Shift Approval', desc: 'Supervisors confirm attendance in real time via the mobile-friendly dashboard.' },
  { icon: '💳', title: 'Digital Voucher Payments', desc: 'Earnings are loaded automatically to the OPHELP card after shift approval.' },
  { icon: '🏧', title: 'ATM Withdrawals', desc: 'Participants access their earnings at supported ATM locations across the city.' },
  { icon: '🛒', title: 'Partner Shop Payments', desc: 'Cards accepted at approved partner shops for essential goods and services.' },
]

// ── Dashboard cards (populated from live API on render) ───────────────────────
function getDashboardCards() {
  const s = ReportApi.dashboardStats()
  return [
    { label: 'Active Participants', value: String(s.activeParticipants), icon: '👥', color: C.green, trend: 'Registered & active' },
    { label: "Today's Shifts", value: String(s.todaysShifts), icon: '📅', color: C.blue, trend: `${s.approvedShifts} approved` },
    { label: 'Approved Shifts', value: String(s.approvedShifts), icon: '✅', color: C.success, trend: 'This month' },
    { label: 'Pending Approvals', value: String(s.pendingApprovals), icon: '⏳', color: C.gold, trend: 'Needs attention' },
    { label: 'Partner Shops', value: String(s.partnerShops), icon: '🛒', color: C.blue, trend: 'Active partners' },
    { label: 'ATM Locations', value: String(s.atmLocations), icon: '🏧', color: C.green, trend: 'Operational' },
    { label: 'Monthly Payments', value: `R ${(s.monthlyPaymentsTotal || 89200).toLocaleString()}`, icon: '💳', color: C.greenDark, trend: new Date().toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' }) },
    { label: 'Total Transactions', value: String(s.totalTransactions), icon: '📊', color: C.blue, trend: 'All time' },
  ]
}

// ── Ministries ────────────────────────────────────────────────────────────────
const MINISTRIES = [
  {
    title: 'Ministry to the Destitute and Desperate',
    desc: 'Reaching out to those living on the streets and in desperate circumstances, providing practical help and pointing to hope.',
    img: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=600&h=400&fit=crop&auto=format',
    icon: '🏠',
  },
  {
    title: 'Prostitution Prevention and Restoration',
    desc: 'Walking alongside women to find freedom and healing, offering support, skills training, and a path to a restored life.',
    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=600&h=400&fit=crop&auto=format',
    icon: '🌸',
  },
  {
    title: 'Servant Evangelism',
    desc: 'Sharing Christ\'s love through practical acts of service — showing the gospel in word and deed to our communities.',
    img: 'https://images.unsplash.com/photo-1593113630400-ea4288922497?w=600&h=400&fit=crop&auto=format',
    icon: '🙏',
  },
]

// ── Gallery items ─────────────────────────────────────────────────────────────
const GALLERY = [
  { caption: 'Street Outreach', img: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=500&h=400&fit=crop&auto=format', tall: false },
  { caption: 'Community Work', img: 'https://images.unsplash.com/photo-1526958097901-5e6d742d3371?w=500&h=600&fit=crop&auto=format', tall: true },
  { caption: 'Volunteer Teams', img: 'https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=500&h=350&fit=crop&auto=format', tall: false },
  { caption: 'Prayer', img: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=500&h=500&fit=crop&auto=format', tall: false },
  { caption: 'Training', img: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=500&h=400&fit=crop&auto=format', tall: false },
  { caption: 'OPHELP Participants', img: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=500&h=600&fit=crop&auto=format', tall: true },
]

// ── Shared styles ─────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: C.white,
  borderRadius: 16,
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  overflow: 'hidden',
}

const sectionPad: React.CSSProperties = { padding: '80px 5%' }

const sectionLabel: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'rgba(46,125,50,0.1)',
  color: C.green,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  padding: '4px 14px',
  borderRadius: 999,
  marginBottom: 16,
}

const h2Style: React.CSSProperties = {
  fontFamily: "'Lora', serif",
  fontSize: 'clamp(28px, 3.5vw, 44px)',
  fontWeight: 600,
  color: C.text,
  lineHeight: 1.2,
  marginBottom: 16,
}

const btnPrimary: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: C.green,
  color: '#fff',
  fontWeight: 600,
  fontSize: 15,
  padding: '14px 32px',
  borderRadius: 12,
  border: 'none',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 0.2s, transform 0.15s',
  fontFamily: "'Poppins', sans-serif",
}

const btnOutline: React.CSSProperties = {
  display: 'inline-block',
  backgroundColor: 'transparent',
  color: '#fff',
  fontWeight: 600,
  fontSize: 15,
  padding: '13px 28px',
  borderRadius: 12,
  border: '2px solid rgba(255,255,255,0.7)',
  cursor: 'pointer',
  textDecoration: 'none',
  transition: 'background 0.2s, transform 0.15s',
  fontFamily: "'Poppins', sans-serif",
}

// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [ready, setReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [ophelpOpen, setOphelpOpen] = useState(false)
  const [offersOpen, setOffersOpen] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [formSent, setFormSent] = useState(false)

  // Hydrate the in-memory data cache from the backend once on load, then
  // restore any existing session (JWT persisted in sessionStorage).
  useEffect(() => {
    bootstrap().then(() => {
      const existing = AuthService.currentUser()
      if (existing && AuthService.isAuthenticated()) {
        setCurrentUser(existing as AuthUser)
      }
      setReady(true)
    })
  }, [])

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const handleLogin = (user: AuthUser) => {
    setCurrentUser(user)
    setLoginOpen(false)
  }

  const handleLogout = () => {
    AuthService.logout().then(() => setCurrentUser(null))
  }

  // All hooks above — safe to early-return now
  if (!ready) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 16, backgroundColor: C.bg, fontFamily: "'Poppins', sans-serif",
      }}>
        <img src={opHelpLogo} alt="Straatwerk logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: `3px solid ${C.green}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{'@keyframes spin { to { transform: rotate(360deg) } }'}</style>
        <span style={{ color: C.textMuted, fontSize: 13 }}>Loading OPHELP…</span>
      </div>
    )
  }

  if (currentUser) {
    return <Dashboard user={currentUser} onLogout={handleLogout} />
  }

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div style={{ fontFamily: "'Poppins', sans-serif", backgroundColor: C.bg, color: C.text }}>

      {/* ── NAVIGATION ─────────────────────────────────────────────────────── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.08)' : 'none',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
        transition: 'all 0.35s ease',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5%', height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src={opHelpLogo} alt="Straatwerk logo" style={{ width: 44, height: 44, objectFit: 'contain', mixBlendMode: 'normal' }} />
            <div style={{ fontSize: 10, color: scrolled ? C.green : 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>OPHELP System</div>
          </div>

          {/* Desktop links */}
          <nav style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {['Home', 'About', 'Donate', 'Contact'].map(link => (
              <button
                key={link}
                onClick={() => scrollTo(link.toLowerCase())}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: scrolled ? C.text : 'rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 8, fontFamily: "'Poppins', sans-serif", transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = C.green)}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? C.text : 'rgba(255,255,255,0.9)')}
              >{link}</button>
            ))}

            {/* OPHELP dropdown */}
            <div
              style={{ position: 'relative' }}
              onMouseEnter={() => setOphelpOpen(true)}
              onMouseLeave={() => setOphelpOpen(false)}
            >
              <button
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: ophelpOpen ? C.green : (scrolled ? C.text : 'rgba(255,255,255,0.9)'), padding: '6px 12px', borderRadius: 8, fontFamily: "'Poppins', sans-serif", transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: 4 }}
              >
                OPHELP
                <span style={{ fontSize: 10, transition: 'transform 0.2s', display: 'inline-block', transform: ophelpOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
              </button>

              {/* Dropdown panel */}
              <div style={{
                position: 'absolute', top: '100%', left: 0,
                backgroundColor: '#fff',
                borderRadius: 12,
                boxShadow: '0 8px 32px rgba(0,0,0,0.13)',
                minWidth: 240,
                padding: '8px 0',
                marginTop: 4,
                opacity: ophelpOpen ? 1 : 0,
                transform: ophelpOpen ? 'translateY(0)' : 'translateY(-8px)',
                pointerEvents: ophelpOpen ? 'auto' : 'none',
                transition: 'opacity 0.2s ease, transform 0.2s ease',
                zIndex: 200,
                border: '1px solid rgba(0,0,0,0.06)',
              }}>
                {[
                  'OPHELP Technical Team',
                  'OPHELP Road Maintenance',
                  'OPHELP Administration Team',
                  'OPHELP School Management',
                  'OPHELP Pre-School Management',
                  'OPHELP Registered Team',
                  'OPHELP Pre-School Team',
                  'OPHELP Graduate Teams',
                ].map((item, i) => (
                  <button
                    key={item}
                    onClick={() => { scrollTo('ophelp'); setOphelpOpen(false) }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 400, color: C.text,
                      padding: '10px 20px',
                      fontFamily: "'Poppins', sans-serif",
                      transition: 'background 0.15s, color 0.15s',
                      borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(46,125,50,0.07)'; e.currentTarget.style.color = C.green }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = C.text }}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setOffersOpen(true)}
              style={{ ...btnPrimary, padding: '9px 20px', fontSize: 13, marginLeft: 8 }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.greenLight)}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.green)}
            >What OPHELP Offers</button>
            <button
              onClick={() => setLoginOpen(true)}
              style={{ background: 'none', border: `2px solid ${scrolled ? C.green : 'rgba(255,255,255,0.7)'}`, color: scrolled ? C.green : '#fff', padding: '7px 20px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', marginLeft: 4, fontFamily: "'Poppins', sans-serif", transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = C.green; e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = C.green }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = scrolled ? C.green : '#fff'; e.currentTarget.style.borderColor = scrolled ? C.green : 'rgba(255,255,255,0.7)' }}
            >Sign In</button>
          </nav>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────────────────────── */}
      <section id="home" style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <img
          src="https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?w=1600&h=900&fit=crop&auto=format"
          alt="Volunteers working with community participants"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, rgba(27,94,32,0.88) 0%, rgba(21,101,192,0.6) 100%)` }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1280, margin: '0 auto', padding: '120px 5% 80px', width: '100%' }}>
          <div style={{ maxWidth: 700 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, backgroundColor: 'rgba(249,168,37,0.2)', border: '1px solid rgba(249,168,37,0.5)', borderRadius: 999, padding: '6px 16px', marginBottom: 32 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: C.gold, display: 'inline-block' }} />
              <span style={{ color: C.gold, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em' }}>OPHELP Voucher System — Now Live</span>
            </div>
            <h1 style={{ fontFamily: "'Lora', serif", fontSize: 'clamp(36px, 5.5vw, 72px)', fontWeight: 600, color: '#fff', lineHeight: 1.1, marginBottom: 24, letterSpacing: '-0.01em' }}>
              Restoring Dignity<br />
              <em style={{ fontStyle: 'italic', color: '#a5d6a7' }}>Through Honest Work</em>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 1.8vw, 18px)', lineHeight: 1.75, color: 'rgba(255,255,255,0.85)', marginBottom: 40, maxWidth: 580 }}>
              The OPHELP Voucher System empowers participants to earn income through approved work opportunities. After completing a four-hour shift, earnings are loaded securely onto an OPHELP Card — usable at supported ATMs and participating partner shops.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <button
                onClick={() => scrollTo('ophelp')}
                style={{ ...btnPrimary, fontSize: 15, padding: '15px 36px', boxShadow: '0 4px 20px rgba(46,125,50,0.4)' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >Get Started</button>
              <button
                onClick={() => scrollTo('features')}
                style={{ ...btnOutline }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >View Work Opportunities</button>
            </div>
          </div>

          {/* Hero stat pills */}
          <div style={{ display: 'flex', gap: 16, marginTop: 64, flexWrap: 'wrap' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ backgroundColor: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '16px 24px', minWidth: 150 }}>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: '#fff' }}>{s.value}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll arrow */}
        <div style={{ position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)', zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.3)' }} />
        </div>
      </section>

      {/* ── ABOUT STRAATWERK ──────────────────────────────────────────────── */}
      <section id="about" style={{ ...sectionPad, backgroundColor: C.white }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <Fade>
            <div>
              <span style={sectionLabel}>About Straatwerk</span>
              <h2 style={h2Style}>Serving South Africa<br />Since the Late 1960s</h2>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: C.textMuted, marginBottom: 16 }}>
                Founded by young people deeply concerned for those rejected by society, Straatwerk has grown into a registered Non-Profit Organisation and Public Benefit Organisation with a rich legacy of compassionate service.
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.8, color: C.textMuted, marginBottom: 32 }}>
                Today, Straatwerk is focused on serving people in distress and demonstrating Christ's love through practical outreach — providing training, honest work, and restoration to hundreds of participants each year.
              </p>
              <div style={{ padding: '16px 20px', backgroundColor: 'rgba(46,125,50,0.07)', borderLeft: `4px solid ${C.green}`, borderRadius: '0 8px 8px 0' }}>
                <p style={{ margin: 0, fontFamily: "'Lora', serif", fontStyle: 'italic', color: C.text, fontSize: 15, lineHeight: 1.7 }}>
                  "Speak up for those who cannot speak for themselves, for the rights of all who are destitute." — Proverbs 31:8–9
                </p>
              </div>
              <p style={{ fontSize: 13, color: C.textMuted, marginTop: 12 }}>
                Our ministry team reflects the beautiful diversity of South Africa, serving every person with equal dignity and love.
              </p>
            </div>
          </Fade>

          <Fade delay={120}>
            <div style={{ position: 'relative' }}>
              <img
                src="https://images.unsplash.com/photo-1593113630400-ea4288922497?w=700&h=520&fit=crop&auto=format"
                alt="Straatwerk volunteers serving the community"
                style={{ width: '100%', borderRadius: 20, objectFit: 'cover', height: 400 }}
              />
              {/* Floating stat card */}
              <div style={{ position: 'absolute', bottom: -20, left: -20, backgroundColor: C.green, borderRadius: 16, padding: '20px 28px', boxShadow: '0 8px 32px rgba(46,125,50,0.35)' }}>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 36, fontWeight: 600, color: '#fff' }}>60+</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Years of Ministry</div>
              </div>
              <div style={{ position: 'absolute', top: -16, right: -16, backgroundColor: C.gold, borderRadius: 16, padding: '16px 24px', boxShadow: '0 8px 24px rgba(249,168,37,0.35)' }}>
                <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: C.text }}>650+</div>
                <div style={{ fontSize: 12, color: 'rgba(31,41,55,0.75)' }}>Participants</div>
              </div>
            </div>
          </Fade>
        </div>
      </section>

      {/* ── MISSION ─────────────────────────────────────────────────────────── */}
      <section style={{ ...sectionPad, backgroundColor: C.bg }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={sectionLabel}>Our Mission</span>
              <h2 style={{ ...h2Style, textAlign: 'center' }}>Guided by Faith,<br />Driven by Love</h2>
              <p style={{ color: C.textMuted, fontSize: 15, maxWidth: 540, margin: '0 auto' }}>
                Everything we do flows from our calling to love our neighbours as ourselves.
              </p>
            </div>
          </Fade>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {MISSION.map((m, i) => (
              <Fade key={m.title} delay={i * 80}>
                <div style={{ ...card, padding: 32, height: '100%', borderTop: `4px solid ${C.green}`, transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)' }}
                >
                  <div style={{ fontSize: 40, marginBottom: 16 }}>{m.icon}</div>
                  <h3 style={{ fontFamily: "'Lora', serif", fontSize: 18, fontWeight: 600, marginBottom: 10, color: C.text }}>{m.title}</h3>
                  <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textMuted, margin: 0 }}>{m.desc}</p>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW OPHELP WORKS ─────────────────────────────────────────────────── */}
      <section id="ophelp" style={{ ...sectionPad, background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.blue} 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: 64 }}>
              <span style={{ ...sectionLabel, backgroundColor: 'rgba(249,168,37,0.2)', color: C.gold }}>OPHELP Programme</span>
              <h2 style={{ ...h2Style, color: '#fff', textAlign: 'center' }}>How OPHELP Works</h2>
              <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
                A simple, transparent workflow that ensures every participant is paid fairly for their contribution.
              </p>
            </div>
          </Fade>

          {/* Timeline */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 0, flexWrap: 'wrap', position: 'relative' }}>
            {WORKFLOW.map((step, i) => (
              <div key={step.num} style={{ display: 'flex', alignItems: 'center', flex: '1 1 160px', maxWidth: 220 }}>
                <Fade delay={i * 100}>
                  <div style={{ textAlign: 'center', padding: '0 12px' }}>
                    <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.12)', border: '2px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28 }}>
                      {step.icon}
                    </div>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', backgroundColor: C.gold, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: 11, fontWeight: 700, color: C.text }}>
                      {step.num}
                    </div>
                    <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>{step.title}</h4>
                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
                  </div>
                </Fade>
                {i < WORKFLOW.length - 1 && (
                  <div style={{ flex: '0 0 32px', textAlign: 'center', color: C.gold, fontSize: 20, marginBottom: 80, paddingTop: 24 }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────────────────────── */}
      <section id="features" style={{ ...sectionPad, backgroundColor: C.white }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={sectionLabel}>Platform Features</span>
              <h2 style={{ ...h2Style, textAlign: 'center' }}>Everything You Need<br />in One System</h2>
              <p style={{ color: C.textMuted, fontSize: 15, maxWidth: 500, margin: '0 auto' }}>
                Built for administrators, supervisors, and participants — with simplicity at every step.
              </p>
            </div>
          </Fade>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {FEATURES.map((f, i) => (
              <Fade key={f.title} delay={i * 60}>
                <div
                  style={{ ...card, padding: '28px 28px', display: 'flex', gap: 20, alignItems: 'flex-start', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 10px 28px rgba(0,0,0,0.1)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)' }}
                >
                  <div style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: 'rgba(46,125,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                    {f.icon}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 6, color: C.text }}>{f.title}</h3>
                    <p style={{ fontSize: 13, lineHeight: 1.65, color: C.textMuted, margin: 0 }}>{f.desc}</p>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────────────────────────── */}
      <section id="dashboard" style={{ ...sectionPad, backgroundColor: C.bg }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Fade>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 16 }}>
              <div>
                <span style={sectionLabel}>Live Dashboard</span>
                <h2 style={{ ...h2Style, marginBottom: 8 }}>Real-Time Overview</h2>
                <p style={{ color: C.textMuted, fontSize: 15, margin: 0 }}>A snapshot of OPHELP activity across all sites.</p>
              </div>
              <button
                style={{ ...btnPrimary, fontSize: 14, padding: '12px 28px' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.greenLight)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.green)}
              >Open Full Dashboard →</button>
            </div>
          </Fade>

          {/* Simulated dashboard header */}
          <Fade delay={80}>
            <div style={{ ...card, padding: '16px 24px', marginBottom: 4, backgroundColor: C.green, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '16px 16px 0 0' }}>
              <span style={{ color: '#fff', fontWeight: 600, fontSize: 15 }}>OPHELP Dashboard — Administrator View</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['#ff5f57', '#febc2e', '#28c840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: c }} />)}
              </div>
            </div>
          </Fade>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 3, backgroundColor: '#e5e7eb', borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
            {getDashboardCards().map((d, i) => (
              <Fade key={d.label} delay={i * 40}>
                <div style={{ backgroundColor: C.white, padding: '24px', transition: 'background 0.15s' }}
                  onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.backgroundColor = '#f9fafb')}
                  onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.backgroundColor = C.white)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: `${d.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{d.icon}</div>
                    <span style={{ fontSize: 10, color: C.textMuted, backgroundColor: C.bg, padding: '3px 8px', borderRadius: 6 }}>{d.trend}</span>
                  </div>
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 28, fontWeight: 600, color: d.color, marginBottom: 4 }}>{d.value}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{d.label}</div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── MINISTRIES ───────────────────────────────────────────────────────── */}
      <section id="ministries" style={{ ...sectionPad, backgroundColor: C.white }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <span style={sectionLabel}>Our Ministries</span>
              <h2 style={{ ...h2Style, textAlign: 'center' }}>Where We Serve</h2>
              <p style={{ color: C.textMuted, fontSize: 15, maxWidth: 520, margin: '0 auto' }}>
                Three focused areas of ministry — each an expression of Christ's love in action.
              </p>
            </div>
          </Fade>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 28 }}>
            {MINISTRIES.map((m, i) => (
              <Fade key={m.title} delay={i * 100}>
                <div
                  style={{ ...card, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.12)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 16px rgba(0,0,0,0.07)' }}
                >
                  <div style={{ position: 'relative', height: 200, overflow: 'hidden' }}>
                    <img src={m.img} alt={m.title} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                    <div style={{ position: 'absolute', top: 16, left: 16, width: 40, height: 40, borderRadius: 10, backgroundColor: C.green, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
                  </div>
                  <div style={{ padding: '24px 24px 28px' }}>
                    <h3 style={{ fontFamily: "'Lora', serif", fontSize: 17, fontWeight: 600, marginBottom: 10, color: C.text, lineHeight: 1.3 }}>{m.title}</h3>
                    <p style={{ fontSize: 14, lineHeight: 1.7, color: C.textMuted, margin: '0 0 16px' }}>{m.desc}</p>
                    <span style={{ fontSize: 13, fontWeight: 600, color: C.green }}>Learn More →</span>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── DONATE ───────────────────────────────────────────────────────────── */}
      <section id="donate" style={{ ...sectionPad, background: `linear-gradient(135deg, ${C.green} 0%, ${C.greenDark} 100%)`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -40, width: 240, height: 240, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.04)' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64, alignItems: 'center' }}>
          <Fade>
            <div>
              <span style={{ ...sectionLabel, backgroundColor: 'rgba(249,168,37,0.2)', color: C.gold }}>Make a Difference</span>
              <h2 style={{ ...h2Style, color: '#fff' }}>Your Giving<br /><em style={{ fontStyle: 'italic' }}>Changes Lives</em></h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>
                Every donation directly supports the people Straatwerk serves. Your generosity makes honest work and real hope possible.
              </p>
              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 36px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  'Street outreach and emergency relief',
                  'Training and honest work through OPHELP',
                  'Women rebuilding their lives',
                  'Ministry teams serving across communities',
                ].map(item => (
                  <li key={item} style={{ display: 'flex', alignItems: 'center', gap: 12, color: 'rgba(255,255,255,0.9)', fontSize: 14 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11 }}>✓</div>
                    {item}
                  </li>
                ))}
              </ul>
              <button
                style={{ backgroundColor: C.gold, color: C.text, fontWeight: 700, fontSize: 16, padding: '16px 40px', borderRadius: 12, border: 'none', cursor: 'pointer', boxShadow: '0 4px 20px rgba(249,168,37,0.4)', fontFamily: "'Poppins', sans-serif", transition: 'transform 0.15s, opacity 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
                onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              >Donate Now ❤️</button>
            </div>
          </Fade>

          <Fade delay={120}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { amount: 'R 50', label: 'Feeds a family for a day' },
                { amount: 'R 150', label: 'Funds one OPHELP shift' },
                { amount: 'R 500', label: 'Supports a week of outreach' },
                { amount: 'Custom', label: 'Give any amount' },
              ].map(opt => (
                <div key={opt.amount} style={{ backgroundColor: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: 14, padding: '20px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLDivElement).style.borderColor = C.gold }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.2)' }}
                >
                  <div style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600, color: C.gold }}>{opt.amount}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{opt.label}</div>
                </div>
              ))}
            </div>
          </Fade>
        </div>
      </section>

      {/* ── GALLERY ──────────────────────────────────────────────────────────── */}
      <section style={{ ...sectionPad, backgroundColor: C.bg }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <Fade>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span style={sectionLabel}>Gallery</span>
              <h2 style={{ ...h2Style, textAlign: 'center' }}>Life-Changing Moments</h2>
            </div>
          </Fade>
          <div style={{ columns: '3 240px', gap: 16 }}>
            {GALLERY.map((g, i) => (
              <Fade key={g.caption} delay={i * 60}>
                <div style={{ breakInside: 'avoid', marginBottom: 16, borderRadius: 14, overflow: 'hidden', position: 'relative', cursor: 'pointer' }}
                  onMouseEnter={e => {
                    const img = (e.currentTarget as HTMLDivElement).querySelector('img') as HTMLImageElement
                    const cap = (e.currentTarget as HTMLDivElement).querySelector('.cap') as HTMLDivElement
                    if (img) img.style.transform = 'scale(1.05)'
                    if (cap) cap.style.opacity = '1'
                  }}
                  onMouseLeave={e => {
                    const img = (e.currentTarget as HTMLDivElement).querySelector('img') as HTMLImageElement
                    const cap = (e.currentTarget as HTMLDivElement).querySelector('.cap') as HTMLDivElement
                    if (img) img.style.transform = 'scale(1)'
                    if (cap) cap.style.opacity = '0'
                  }}
                >
                  <img src={g.img} alt={g.caption} style={{ width: '100%', display: 'block', transition: 'transform 0.4s ease', filter: 'brightness(0.9)' }} />
                  <div className="cap" style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(46,125,50,0.6)', display: 'flex', alignItems: 'flex-end', padding: 16, opacity: 0, transition: 'opacity 0.3s' }}>
                    <span style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{g.caption}</span>
                  </div>
                </div>
              </Fade>
            ))}
          </div>
        </div>
      </section>

      {/* ── CONTACT ──────────────────────────────────────────────────────────── */}
      <section id="contact" style={{ ...sectionPad, backgroundColor: C.white }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 64 }}>
          <Fade>
            <div>
              <span style={sectionLabel}>Contact Us</span>
              <h2 style={h2Style}>Get in Touch</h2>
              <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.8, marginBottom: 36 }}>
                Whether you're a potential partner, volunteer, or participant — we'd love to hear from you. Reach out through any of the channels below.
              </p>
              {[
                { icon: '📞', label: 'Telephone', value: '+27 21 555 0100' },
                { icon: '✉️', label: 'Email', value: 'info@straatwerk.co.za' },
                { icon: '🏢', label: 'NPO Number', value: '012-345 NPO' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', gap: 16, alignItems: 'center', paddingBottom: 20, marginBottom: 20, borderBottom: '1px solid #F3F4F6' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(46,125,50,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontSize: 11, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>{item.label}</div>
                    <div style={{ fontSize: 15, fontWeight: 500, color: C.text }}>{item.value}</div>
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 24 }}>
                <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 12 }}>Banking Details</div>
                <div style={{ backgroundColor: C.bg, borderRadius: 12, padding: '16px 20px', fontSize: 13, lineHeight: 1.8, color: C.text }}>
                  <strong>Bank:</strong> Standard Bank<br />
                  <strong>Account Name:</strong> Straatwerk<br />
                  <strong>Branch Code:</strong> 051 001<br />
                  <strong>Account Number:</strong> 123 456 789
                </div>
              </div>
            </div>
          </Fade>

          <Fade delay={120}>
            {formSent ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 400, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', backgroundColor: 'rgba(76,175,80,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, marginBottom: 24 }}>✅</div>
                <h3 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600, marginBottom: 12, color: C.green }}>Message Sent!</h3>
                <p style={{ color: C.textMuted, fontSize: 15, lineHeight: 1.7 }}>Thank you for reaching out. We'll get back to you within one business day.</p>
              </div>
            ) : (
              <form onSubmit={e => { e.preventDefault(); setFormSent(true) }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { id: 'name', label: 'Full Name', type: 'text', placeholder: 'Your full name' },
                  { id: 'email', label: 'Email Address', type: 'email', placeholder: 'your@email.com' },
                  { id: 'subject', label: 'Subject', type: 'text', placeholder: 'How can we help?' },
                ].map(f => (
                  <div key={f.id}>
                    <label htmlFor={f.id} style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{f.label}</label>
                    <input
                      id={f.id} type={f.type} placeholder={f.placeholder} required
                      value={formData[f.id as keyof typeof formData]}
                      onChange={e => setFormData(p => ({ ...p, [f.id]: e.target.value }))}
                      style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: "'Poppins', sans-serif", color: C.text, outline: 'none', transition: 'border-color 0.2s', backgroundColor: C.bg }}
                      onFocus={e => (e.target.style.borderColor = C.green)}
                      onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                    />
                  </div>
                ))}
                <div>
                  <label htmlFor="message" style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Message</label>
                  <textarea
                    id="message" rows={5} placeholder="Your message..." required
                    value={formData.message}
                    onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                    style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: "'Poppins', sans-serif", color: C.text, outline: 'none', resize: 'vertical', transition: 'border-color 0.2s', backgroundColor: C.bg }}
                    onFocus={e => (e.target.style.borderColor = C.green)}
                    onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
                  />
                </div>
                <button
                  type="submit"
                  style={{ ...btnPrimary, alignSelf: 'flex-start', padding: '14px 36px', fontSize: 15, boxShadow: '0 4px 16px rgba(46,125,50,0.3)' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.greenLight)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.green)}
                >Send Message</button>
              </form>
            )}
          </Fade>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{ backgroundColor: '#111827', color: '#D1D5DB', paddingTop: 64, paddingBottom: 0 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 48, paddingBottom: 48 }}>
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <img src={opHelpLogo} alt="Straatwerk logo" style={{ width: 52, height: 52, objectFit: 'contain' }} />
                <div style={{ fontSize: 10, color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>OPHELP System</div>
              </div>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#9CA3AF', marginBottom: 16 }}>
                Restoring dignity through honest work since the late 1960s. Registered NPO and Public Benefit Organisation.
              </p>
              <div style={{ fontSize: 12, color: '#6B7280' }}>NPO Number: 012-345 NPO</div>
            </div>

            {/* Links */}
            {[
              { heading: 'Organisation', links: ['About Straatwerk', 'Our Ministries', 'OPHELP Programme', 'Work Opportunities', 'Partner Shops'] },
              { heading: 'Support', links: ['Donate', 'Volunteer', 'Contact Us', 'ATM Locations', 'Dashboard Login'] },
            ].map(col => (
              <div key={col.heading}>
                <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{col.heading}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link}><a href="#" style={{ color: '#9CA3AF', fontSize: 13, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#a5d6a7')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#9CA3AF')}
                    >{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}

            {/* Contact */}
            <div>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Contact</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#9CA3AF' }}>
                <span>📞 +27 21 555 0100</span>
                <span>✉️ info@straatwerk.co.za</span>
              </div>
              <h4 style={{ color: '#fff', fontSize: 14, fontWeight: 600, margin: '28px 0 14px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Follow Us</h4>
              <div style={{ display: 'flex', gap: 12 }}>
                {['Facebook', 'Instagram', 'Twitter'].map(s => (
                  <a key={s} href="#" style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9CA3AF', textDecoration: 'none', transition: 'background 0.2s, color 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = C.green; (e.currentTarget as HTMLAnchorElement).style.color = '#fff' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.backgroundColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLAnchorElement).style.color = '#9CA3AF' }}
                  >{s[0]}</a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, fontSize: 12, color: '#6B7280' }}>
            <span>© {new Date().getFullYear()} Straatwerk. All rights reserved. Registered NPO.</span>
            <span style={{ color: C.green }}>Built with ❤️ for the OPHELP Programme</span>
          </div>
        </div>
      </footer>

      {/* ── LOGIN MODAL ──────────────────────────────────────────────────── */}
      {loginOpen && <LoginModal onLogin={handleLogin} onClose={() => setLoginOpen(false)} />}

      {/* ── WHAT OPHELP OFFERS MODAL ─────────────────────────────────────── */}
      {offersOpen && (
        <div
          onClick={() => setOffersOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ backgroundColor: C.white, borderRadius: 20, maxWidth: 760, width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}
          >
            {/* Modal header */}
            <div style={{ background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.blue} 100%)`, padding: '40px 48px 36px', borderRadius: '20px 20px 0 0', position: 'relative' }}>
              <button
                onClick={() => setOffersOpen(false)}
                style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 36, height: 36, borderRadius: '50%', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Poppins', sans-serif" }}
              >×</button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
                <img src={opHelpLogo} alt="Straatwerk logo" style={{ width: 56, height: 56, objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>STRAATWERK</div>
                  <h2 style={{ fontFamily: "'Lora', serif", fontSize: 26, fontWeight: 600, color: '#fff', margin: 0 }}>OPHELP Projekte</h2>
                </div>
              </div>
              <div style={{ display: 'inline-block', backgroundColor: 'rgba(249,168,37,0.25)', border: '1px solid rgba(249,168,37,0.5)', borderRadius: 999, padding: '5px 16px' }}>
                <span style={{ color: C.gold, fontSize: 13, fontWeight: 600 }}>Offering Our Services</span>
              </div>
            </div>

            {/* Modal body */}
            <div style={{ padding: '40px 48px 48px' }}>
              {/* Intro block */}
              <div style={{ marginBottom: 32 }}>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: C.text, marginBottom: 16 }}>
                  <strong>OPHELP Projekte ("OPHELP")</strong>, in rendering services, exists to assist un-employable and desperate persons to develop and improve employable skills.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: C.textMuted, marginBottom: 16 }}>
                  If you agree to make use of OPHELP services, you become a partner in these objectives.
                </p>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: C.textMuted }}>
                  Although there may be participants in OPHELP who have already proven to possess some skills, it is essential that every OPHELP activity undertaken should also give those who still need to develop and prove some skill the opportunity to do so. This can be achieved by working in closely supervised and well managed teams.
                </p>
              </div>

              {/* Agreement callout */}
              <div style={{ backgroundColor: 'rgba(46,125,50,0.07)', border: `2px solid ${C.green}`, borderRadius: 14, padding: '20px 24px', marginBottom: 36, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>🤝</div>
                <p style={{ fontSize: 15, fontWeight: 600, color: C.green, margin: 0, fontFamily: "'Lora', serif", fontStyle: 'italic' }}>
                  "Let us agree to do so."
                </p>
              </div>

              {/* Divider */}
              <div style={{ borderTop: `1px solid #E5E7EB`, margin: '32px 0' }} />

              {/* Analogy section */}
              <div>
                <h3 style={{ fontFamily: "'Lora', serif", fontSize: 20, fontWeight: 600, color: C.text, marginBottom: 16 }}>
                  An Analogy to Help Understand This Plan
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.85, color: C.textMuted, marginBottom: 20 }}>
                  Individuals who lack sufficient employable skills may easily end up living loose and shifting lives. This situation can be compared with loose and dry sand which, by itself, can hardly be used to produce something stable or useful.
                </p>

                {/* Concrete analogy visual */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
                  {[
                    { icon: '🪨', label: 'Sand', desc: 'Loose & shifting — individuals without skills' },
                    { icon: '🪵', label: 'Stones', desc: 'Partners & supervisors providing structure' },
                    { icon: '🏗️', label: 'Cement', desc: 'OPHELP strategy & programme management' },
                    { icon: '💧', label: 'Water', desc: 'Community service — the binding purpose' },
                  ].map(item => (
                    <div key={item.label} style={{ backgroundColor: C.bg, borderRadius: 12, padding: '16px 14px', textAlign: 'center' }}>
                      <div style={{ fontSize: 28, marginBottom: 8 }}>{item.icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 11, color: C.textMuted, lineHeight: 1.5 }}>{item.desc}</div>
                    </div>
                  ))}
                </div>

                <div style={{ backgroundColor: C.green, borderRadius: 14, padding: '20px 24px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ fontSize: 28, flexShrink: 0 }}>🏛️</div>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: '#fff', margin: 0 }}>
                    The OPHELP strategy, bringing partners together to serve the community, is like the mixing of concrete: Sand, stones and cement, each of little use by itself, <strong>skilfully mixed with water, can be used to construct solid and useful structures.</strong>
                  </p>
                </div>
              </div>

              {/* CTA */}
              <div style={{ marginTop: 36, display: 'flex', gap: 12, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setOffersOpen(false)}
                  style={{ padding: '12px 28px', borderRadius: 10, border: `2px solid #E5E7EB`, background: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', color: C.textMuted, fontFamily: "'Poppins', sans-serif" }}
                >Close</button>
                <button
                  onClick={() => { setOffersOpen(false); scrollTo('ophelp') }}
                  style={{ ...btnPrimary, padding: '12px 28px', fontSize: 14 }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = C.greenLight)}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = C.green)}
                >View OPHELP Programme →</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
