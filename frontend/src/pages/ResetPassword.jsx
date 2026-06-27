import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { Lock, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './ResetPassword.css'

const ResetPassword = () => {
  const { resetPassword } = useAuth()
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setLoading(true)

    try {
      await resetPassword(token, password)
      setIsSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.message || 'Failed to reset password. The link may have expired or is invalid.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-screen">
      {/* LEFT: ILLUSTRATION */}
      <section className="left">
        <Link to="/" className="brand-mark">
          <div className="logo-glyph">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M4 17L9 9L13 14L20 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="logo-word">Dev<b>Metrics</b></div>
        </Link>

        <div className="left-copy">
          <span className="eyebrow">Secure Access</span>
          <h1>Reset engineering account.</h1>
          <p>Please enter your new password below. Make sure it is secure and unique.</p>
        </div>

        <div className="illustration-wrap">
          <div className="dash-window">
            <div className="dash-titlebar">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              <div className="url">app.devmetrics.io/reset-confirm</div>
            </div>
            <div className="dash-body">
              <div className="dash-nav">
                <div className="nav-item active reset-active"></div>
                <div className="nav-item"></div>
                <div className="nav-item"></div>
                <div className="nav-item"></div>
                <div className="nav-item"></div>
              </div>
              <div className="dash-main">
                <div className="dash-stats">
                  <div className="stat-card">
                    <div className="stat-label">DEPLOY FREQ</div>
                    <div className="stat-value">14<span className="delta up">/day</span></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">LEAD TIME</div>
                    <div className="stat-value">2.4<span className="delta up">−18%</span></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">MTTR</div>
                    <div className="stat-value">38m<span className="delta warn">+4%</span></div>
                  </div>
                </div>
                <div className="chart-card">
                  <div className="chart-head">
                    <span className="chart-title">Deploys per week</span>
                    <span className="chart-tag">↑ 23% MoM</span>
                  </div>
                  <svg width="100%" height="74" viewBox="0 0 480 74" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6E76F2" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#6E76F2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path d="M0,55 L40,48 L80,52 L120,38 L160,42 L200,28 L240,33 L280,20 L320,26 L360,14 L400,18 L440,8 L480,12 L480,74 L0,74 Z" fill="url(#g1)" />
                    <path d="M0,55 L40,48 L80,52 L120,38 L160,42 L200,28 L240,33 L280,20 L320,26 L360,14 L400,18 L440,8 L480,12" fill="none" stroke="#6E76F2" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="floating-badge">
            <div className="icon">
              <Check size={28} strokeWidth={2.5} />
            </div>
            <div className="text">
              <div className="t1">Secure Vault</div>
              <div className="t2">Credentials encrypted</div>
            </div>
          </div>
        </div>

        <div className="left-foot">Trusted by engineering teams shipping at scale</div>
      </section>

      {/* RIGHT: FORM */}
      <section className="right">
        <div className="form-col">
          {/* Error display */}
          {error && (
            <div className="reset-error">
              ⚠️ {error}
            </div>
          )}

          {isSuccess ? (
            <>
              <div className="form-head">
                <div className="success-icon"><ShieldCheck size={48} strokeWidth={1.8} /></div>
                <h2>Password Reset Successfully</h2>
                <p>Your password has been updated in both the local database and Firebase Auth. Redirecting to login...</p>
              </div>
            </>
          ) : (
            <>
              <div className="form-head">
                <h2>Set a new password</h2>
                <p>Choose a secure, strong password with at least 6 characters.</p>
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="field">
                  <label htmlFor="password">New Password</label>
                  <div className="input-wrap">
                    <Lock size={18} strokeWidth={1.8} className="input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <div className="input-wrap">
                    <Lock size={18} strokeWidth={1.8} className="input-icon" />
                    <input
                      id="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="password-toggle"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <div className="legal-foot">© 2026 DevMetrics, Inc. · <a href="#">Privacy</a> · <a href="#">Terms</a></div>
      </section>
    </div>
  )
}

export default ResetPassword
