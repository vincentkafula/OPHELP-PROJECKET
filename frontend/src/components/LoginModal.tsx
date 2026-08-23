import { useState } from 'react'
import opHelpLogo from '@/imports/Ophelp_Final_Logo.png'
import { AuthService } from '@/lib/auth'
import type { UserRole } from '@/lib/types'

export type { UserRole }

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
  roleLabel: string
  avatar: string
}

const DEMO_HINTS = [
  { role: 'Administrator', email: 'admin@ophelp.org', password: 'Admin@123' },
  { role: 'Foreman', email: 'foreman@ophelp.org', password: 'Foreman@123' },
  { role: 'Day Admin', email: 'dayadmin@ophelp.org', password: 'DayAdmin@123' },
  { role: 'Operation Office', email: 'opoffice@ophelp.org', password: 'OpOffice@123' },
  { role: 'Op. Management', email: 'opmanage@ophelp.org', password: 'OpManage@123' },
  { role: 'OPHELP Store', email: 'store@ophelp.org', password: 'Store@123' },
  { role: 'Project Manager', email: 'projman@ophelp.org', password: 'ProjMan@123' },
  { role: 'Head Office', email: 'headoffice@ophelp.org', password: 'HeadOffice@123' },
  { role: 'Partner', email: 'partner@ophelp.org', password: 'Partner@123' },
  { role: 'Team Member', email: 'team@ophelp.org', password: 'Team@123' },
]

const C = {
  green: '#2E7D32',
  greenLight: '#43A047',
  greenDark: '#1B5E20',
  blue: '#1565C0',
  gold: '#F9A825',
  text: '#1F2937',
  textMuted: '#6B7280',
  bg: '#F5F7FA',
  danger: '#E53935',
}

interface Props {
  onLogin: (user: AuthUser) => void
  onClose: () => void
}

export default function LoginModal({ onLogin, onClose }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const result = await AuthService.login(email, password)
      if (result.success && result.user) {
        onLogin(result.user as AuthUser)
      } else {
        setError(result.error ?? 'Invalid email or password.')
      }
    } catch {
      setError('Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 400, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ backgroundColor: '#fff', borderRadius: 20, width: '100%', maxWidth: 460, boxShadow: '0 32px 80px rgba(0,0,0,0.25)', overflow: 'hidden' }}
      >
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg, ${C.greenDark} 0%, ${C.blue} 100%)`, padding: '36px 40px 28px', position: 'relative', textAlign: 'center' }}>
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 32, height: 32, borderRadius: '50%', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit' }}>×</button>
          <img src={opHelpLogo} alt="Straatwerk" style={{ width: 64, height: 64, objectFit: 'contain', marginBottom: 12 }} />
          <h2 style={{ fontFamily: "'Lora', serif", fontSize: 22, fontWeight: 600, color: '#fff', margin: '0 0 4px' }}>Welcome Back</h2>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>Sign in to your OPHELP dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: '32px 40px 36px' }}>
          {error && (
            <div style={{ backgroundColor: 'rgba(229,57,53,0.08)', border: '1px solid rgba(229,57,53,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              <span style={{ fontSize: 13, color: C.danger }}>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email Address</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="your@ophelp.org"
              style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: "'Poppins', sans-serif", color: C.text, outline: 'none', transition: 'border-color 0.2s', backgroundColor: C.bg, boxSizing: 'border-box' }}
              onFocus={e => (e.target.style.borderColor = C.green)}
              onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Enter your password"
                style={{ width: '100%', padding: '12px 44px 12px 16px', borderRadius: 10, border: '2px solid #E5E7EB', fontSize: 14, fontFamily: "'Poppins', sans-serif", color: C.text, outline: 'none', transition: 'border-color 0.2s', backgroundColor: C.bg, boxSizing: 'border-box' }}
                onFocus={e => (e.target.style.borderColor = C.green)}
                onBlur={e => (e.target.style.borderColor = '#E5E7EB')}
              />
              <button type="button" onClick={() => setShowPassword(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, fontSize: 16 }}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginBottom: 24 }}>
            <button type="button" style={{ background: 'none', border: 'none', color: C.green, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500 }}>Forgot password?</button>
          </div>

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '14px', backgroundColor: loading ? C.greenLight : C.green, color: '#fff', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: loading ? 'wait' : 'pointer', fontFamily: "'Poppins', sans-serif", transition: 'background 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? (
              <><span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} /> Signing in...</>
            ) : 'Sign In'}
          </button>

          {/* Demo hint */}
          <div style={{ marginTop: 24, backgroundColor: C.bg, borderRadius: 10, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: C.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Demo Accounts</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
              {DEMO_HINTS.map(u => (
                <button key={u.email} type="button" onClick={() => { setEmail(u.email); setPassword(u.password) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 11, color: C.green, fontFamily: 'inherit', padding: '2px 0', fontWeight: 500 }}>
                  → {u.role}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
