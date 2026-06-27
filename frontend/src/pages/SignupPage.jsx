import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Lock, Eye, EyeOff, Plus, Briefcase, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './SignupPage.css'

const roleMap = {
  pm: 'project manager',
  lead: 'team lead',
  dev: 'developer',
  qa: 'tester'
};

const SignupPage = () => {
  const { registerWithAPI, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [fullName, setFullName] = useState('')
  const [emailValue, setEmailValue] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [role, setRole] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const hashString = (str) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return hash;
  };

  const getRoleMetrics = (selectedRole) => {
    switch (selectedRole) {
      case 'pm':
        return [
          { name: 'Sprint Velocity', val: 88 },
          { name: 'DORA Adherence', val: 94 }
        ];
      case 'lead':
        return [
          { name: 'Team Performance', val: 92 },
          { name: 'Code Review Speed', val: 85 }
        ];
      case 'dev':
        return [
          { name: 'Coding Efficiency', val: 95 },
          { name: 'Build Success Rate', val: 90 }
        ];
      case 'qa':
        return [
          { name: 'Test Coverage', val: 96 },
          { name: 'Defect Density', val: 87 }
        ];
      default:
        return [
          { name: 'System Authentication', val: 40 },
          { name: 'Profile Initialization', val: 30 }
        ];
    }
  };

  const updateStrength = (val) => {
    const segs = [document.getElementById('s1'), document.getElementById('s2'), document.getElementById('s3'), document.getElementById('s4')]
    if (!segs[0]) return

    segs.forEach(s => s.style.background = 'var(--border)')
    if (!val) return

    let score = 0
    if (val.length >= 8) score++
    if (/[A-Z]/.test(val)) score++
    if (/[0-9]/.test(val)) score++
    if (/[^A-Za-z0-9]/.test(val)) score++

    const colors = ['#f87171', '#fbbf24', '#22c55e', '#22c55e']
    for (let i = 0; i < score; i++) {
      segs[i].style.background = colors[score - 1]
    }
  }

  const checkMatch = () => {
    const hint = document.getElementById('match-hint')
    if (!confirmPassword) {
      hint.textContent = ''
      hint.className = 'hint'
      return
    }
    if (password === confirmPassword) {
      hint.textContent = '✓ Passwords match'
      hint.className = 'hint ok'
    } else {
      hint.textContent = '✗ Passwords don\'t match'
      hint.className = 'hint err'
    }
  }

  const handleSubmit = async () => {
    setError('')

    if (!fullName || !emailValue || !password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (!role) {
      setError('Please select a role')
      return
    }

    setLoading(true)
    try {
      const mappedRole = roleMap[role] || 'developer'
      await registerWithAPI(fullName, emailValue, password, mappedRole)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await loginWithGoogle()
      if (!result.needsRole) {
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.code === 'auth/popup-closed-by-user') {
        setLoading(false)
        return
      }
      setError(err.message || 'Google sign-in failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="page">
      {/* LEFT PANEL */}
      <div className="left-panel">
        <Link to="/" className="wordmark">
          <div className="wordmark-icon">
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 14l4-4 3 3 4-5 3 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="wordmark-name">DevMetrics</span>
        </Link>

        <div className="hero-block">
          <span className="eyebrow">Engineering Intelligence</span>
          <h1 className="hero-heading">Ship faster.<br /><em>Ship smarter.</em></h1>
          <p className="hero-sub">Pull deploy frequency, lead time, and incident trends directly from your existing stack — no spreadsheets, no manual tracking.</p>
        </div>

        <div className="stats-row">
          <div className="stat">
            <div className="stat-value">14 <span>↑23%</span></div>
            <div className="stat-label">Deploys / day</div>
          </div>
          <div className="stat">
            <div className="stat-value">2.4h</div>
            <div className="stat-label">Lead time</div>
          </div>
          <div className="stat">
            <div className="stat-value">38m</div>
            <div className="stat-label">MTTR</div>
          </div>
        </div>

        {/* Interactive Live-Generating Developer Access Pass */}
        <div className="live-card-container">
          <div className="live-card-title-badge">
            <span className="pulse-dot"></span> LIVE IDENTITY PREVIEW
          </div>
          <div className={`live-dev-card role-${role || 'default'}`}>
            <div className="live-card-glow"></div>
            <div className="live-card-header">
              <span className="live-card-tag">SYSTEM ACCESS PASS</span>
              <span className="live-card-serial">
                DM-{fullName ? Math.abs(hashString(fullName)).toString(16).toUpperCase().substring(0, 6) : 'XXXXXX'}
              </span>
            </div>
            
            <div className="live-card-body">
              <div className="live-avatar-wrap">
                <div className={`live-avatar-circle role-${role || 'default'}`}>
                  {fullName ? fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) : '?'}
                </div>
              </div>
              
              <div className="live-details">
                <div className="live-name">{fullName || 'Your Name'}</div>
                <div className="live-role-badge">
                  {role ? roleMap[role].toUpperCase() : 'AWAITING ROLE SELECTION'}
                </div>
                <div className="live-metrics">
                  {getRoleMetrics(role).map((m, idx) => (
                    <div key={idx} className="live-metric-item">
                      <div className="metric-meta">
                        <span className="metric-name">{m.name}</span>
                        <span className="metric-val">{m.val}%</span>
                      </div>
                      <div className="metric-bar-bg">
                        <div className="metric-bar-fill" style={{ width: `${m.val}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="live-card-footer">
              <span className="footer-status">
                STATUS: {fullName && role ? 'READY TO INITIALIZE' : 'AWAITING DATA INPUT'}
              </span>
              <span className="footer-date">ISSUED: JUN 2026</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="card">
          {/* Mobile Logo */}
          <Link to="/" className="mobile-logo">
            <div className="wordmark-icon">
              <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 14l4-4 3 3 4-5 3 3" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="wordmark-name">DevMetrics</span>
          </Link>

          <div className="card-header">
            <div className="card-title">Create your account</div>
            <div className="card-sub">Start shipping with confidence. Free 14-day trial, no card needed.</div>
          </div>

          {/* Google Sign-In */}
          <button type="button" className="btn-social" onClick={handleGoogle} style={{ width: '100%' }}>
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="divider">or sign up with email</div>

          {/* Error display */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(248, 113, 113, 0.1)',
              border: '1px solid rgba(248, 113, 113, 0.3)',
              borderRadius: '8px',
              color: '#f87171',
              fontSize: '13px',
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <div className="form">
            {/* Full Name */}
            <div className="field">
              <label htmlFor="fullname">Full Name</label>
              <div className="input-wrap">
                <User size={18} strokeWidth={1.8} className="input-icon" />
                <input id="fullname" type="text" placeholder="Alex Johnson" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
            </div>

            {/* Email */}
            <div className="field">
              <label htmlFor="email">Work Email</label>
              <div className="input-wrap">
                <Mail size={18} strokeWidth={1.8} className="input-icon" />
                <input id="email" type="email" placeholder="you@company.com" autoComplete="email" value={emailValue} onChange={(e) => setEmailValue(e.target.value)} />
              </div>
            </div>

            {/* Password + Confirm */}
            <div className="field-row">
              <div className="field">
                <label htmlFor="password">Password</label>
                <div className="input-wrap">
                  <Lock size={18} strokeWidth={1.8} className="input-icon" />
                  <input
                    className="pw-input"
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 chars"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); updateStrength(e.target.value) }}
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowPassword(!showPassword)}
                    title="Show password"
                  >
                    {showPassword ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>
                <div className="strength-bar">
                  <div className="strength-seg" id="s1"></div>
                  <div className="strength-seg" id="s2"></div>
                  <div className="strength-seg" id="s3"></div>
                  <div className="strength-seg" id="s4"></div>
                </div>
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirm</label>
                <div className="input-wrap">
                  <Lock size={18} strokeWidth={1.8} className="input-icon" />
                  <input
                    className="pw-input"
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Repeat"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); checkMatch() }}
                  />
                  <button
                    type="button"
                    className="toggle-pw"
                    onClick={() => setShowConfirm(!showConfirm)}
                    title="Show password"
                  >
                    {showConfirm ? <EyeOff size={16} strokeWidth={1.8} /> : <Eye size={16} strokeWidth={1.8} />}
                  </button>
                </div>
                <div className="hint" id="match-hint"></div>
              </div>
            </div>

            {/* Role */}
            <div className="field">
              <label htmlFor="role-select">Your role</label>
              <div className="input-wrap">
                <Briefcase size={18} strokeWidth={1.8} className="input-icon" />
                <select
                  id="role-select"
                  className="role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="" disabled>Select your role...</option>
                  <option value="pm">Project Manager</option>
                  <option value="lead">Team Lead</option>
                  <option value="dev">Developer</option>
                  <option value="qa">Tester</option>
                </select>
                <ChevronDown size={16} strokeWidth={1.8} className="select-arrow" />
              </div>
            </div>

            {/* Submit */}
            <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
              <Plus size={16} strokeWidth={2.2} />
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="terms">
              By creating an account you agree to our
              <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
            </div>
          </div>

          <div className="card-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignupPage
