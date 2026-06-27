import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Check, MailOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './ForgotPassword.css'

const ForgotPassword = () => {
  const { sendPasswordReset } = useAuth()
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await sendPasswordReset(email)
      setIsSubmitted(true)
    } catch (err) {
      // Handle Firebase error codes gracefully
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError(err.message || 'Failed to send reset email. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setLoading(true)
    try {
      await sendPasswordReset(email)
      alert('Password reset link resent successfully!')
    } catch (err) {
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email address.')
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else {
        setError(err.message || 'Failed to resend link. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-screen">
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
          <span className="eyebrow">Reset Password</span>
          <h1>Get back into your account.</h1>
          <p>Enter your email address and we'll send you a link to reset your password.</p>
        </div>

        <div className="illustration-wrap">
          <div className="dash-window">
            <div className="dash-titlebar">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              <div className="url">app.devmetrics.io/reset</div>
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
              <div className="t1">Link Sent</div>
              <div className="t2">Check your email</div>
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
            <div className="forgot-error">
              ⚠️ {error}
            </div>
          )}

          {isSubmitted ? (
            <>
              <div className="form-head">
                <div className="success-icon"><MailOpen size={48} strokeWidth={1.8} /></div>
                <h2>Check your inbox</h2>
                <p>We've sent a password reset link to <strong>{email}</strong>. Click the link in the email to set a new password.</p>
              </div>

              <div className="reset-info">
                <p>Didn't receive the email? Check your spam folder or try again.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleResend}
                  disabled={loading}
                >
                  {loading ? 'Resending...' : 'Resend Email'}
                </button>
                <button
                  type="button"
                  className="btn-ghost"
                  style={{ marginTop: '12px', width: '100%', display: 'block' }}
                  onClick={() => { setIsSubmitted(false); setError(''); }}
                >
                  Change Email / Try Again
                </button>
              </div>

              <div className="form-foot">
                <Link to="/login">Back to login</Link>
              </div>
            </>
          ) : (
            <>
              <div className="form-head">
                <h2>Forgot your password?</h2>
                <p>Enter your email address and we'll send you a link to reset your password.</p>
              </div>

              <form onSubmit={handleSubmit} className="form">
                <div className="field">
                  <label htmlFor="email">Email address</label>
                  <div className="input-wrap">
                    <Mail size={18} strokeWidth={1.8} className="input-icon" />
                    <input
                      id="email"
                      type="email"
                      placeholder="you@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>

                <div className="form-foot">
                  Remember your password? <Link to="/login">Log in</Link>
                </div>
              </form>
            </>
          )}
        </div>

        <div className="legal-foot">© 2026 DevMetrics, Inc. · <a href="#">Privacy</a> · <a href="#">Terms</a></div>
      </section>
    </div>
  )
}

export default ForgotPassword
