import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import './LoginPage.css'
import API_BASE_URL from '../config/api';

const LoginPage = () => {
  const { user, loginWithAPI, loginWithGoogle, fetchMe, setNeedsRole } = useAuth()
  const navigate = useNavigate()

  // API login state
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [githubLoading, setGithubLoading] = useState(false)

  // Handle GitHub OAuth login callback (token in URL params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const githubToken = params.get('github_token');
    const githubError = params.get('github');
    const githubMessage = params.get('message');
    const githubNew = params.get('github_new') === 'true';

    if (githubToken) {
      // Store the token and fetch user profile
      localStorage.setItem('token', githubToken);
      fetchMe().then((userData) => {
        if (userData) {
          if (githubNew) {
            setNeedsRole(true);
          }
          navigate('/dashboard', { replace: true });
        } else {
          setError('Failed to fetch user profile after GitHub login.');
          localStorage.removeItem('token');
          navigate('/login', { replace: true });
        }
      }).catch(() => {
        setError('Failed to complete GitHub login.');
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      });
      return;
    }

    if (githubError === 'error') {
      setError(githubMessage || 'GitHub login failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, []);

  useEffect(() => {
    if (user) {
      navigate('/dashboard')
    }
  }, [user, navigate])

  // API login handler
  const handleAPILogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await loginWithAPI(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    setError('')
    setGoogleLoading(true)

    try {
      const result = await loginWithGoogle()
      // If needsRole is true, App.jsx will show the RoleSelectionModal
      // before navigating to dashboard
      if (!result.needsRole) {
        navigate('/dashboard')
      }
    } catch (err) {
      // Handle user-cancelled popup gracefully
      if (err.code === 'auth/popup-closed-by-user') {
        setGoogleLoading(false)
        return
      }
      setError(err.message || 'Google login failed. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  // GitHub Sign-In handler
  const handleGitHubLogin = () => {
    setError('')
    setGithubLoading(true)
    window.location.href = `${API_BASE_URL}/api/auth/github`;
  }

  return (
    <div className="screen">
      {/* LEFT: ILLUSTRATION */}
      <section className="left">
        <Link to="/" className="brand-mark" style={{ textDecoration: 'none' }}>
          <div className="logo-glyph">
            <svg viewBox="0 0 24 24" fill="none"><path d="M4 17L9 9L13 14L20 5" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div className="logo-word">Dev<b>Metrics</b></div>
        </Link>

        <div className="left-copy">
          <span className="eyebrow">Engineering Intelligence</span>
          <h1>See how your engineering org actually ships.</h1>
          <p>Deploy frequency, lead time, and incident trends pulled straight from your existing stack — no spreadsheets required.</p>
        </div>

        <div className="illustration-wrap">
          <div className="dash-window">
            <div className="dash-titlebar">
              <div className="dot"></div><div className="dot"></div><div className="dot"></div>
              <div className="url">app.devmetrics.io/deploys</div>
            </div>
            <div className="dash-body">
              <div className="dash-nav">
                <div className="nav-item active deploys-active"></div>
                <div className="nav-item"></div>
                <div className="nav-item"></div>
                <div className="nav-item"></div>
                <div className="nav-item"></div>
              </div>
              <div className="dash-main">
                <div className="dash-stats">
                  <div className="stat-card">
                    <div className="stat-label">Deploy Freq</div>
                    <div className="stat-value">14<span className="delta up">/day</span></div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Lead Time</div>
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
                    <path d="M0,55 L40,48 L80,52 L120,38 L160,42 L200,28 L240,33 L280,20 L320,26 L360,14 L400,18 L440,8 L480,12 L480,74 L0,74Z" fill="url(#g1)" />
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
              <div className="t1">Build passed</div>
              <div className="t2">main · 1m 42s</div>
            </div>
          </div>
        </div>

        <div className="left-foot">Trusted by engineering teams shipping at scale</div>
      </section>

      {/* RIGHT: LOGIN FORM */}
      <section className="right">
        <div className="form-col">
          <div className="form-head">
            <h2>Log in to DevMetrics</h2>
            <p>Welcome back. Enter your credentials to access the platform.</p>
          </div>

          {/* Error display */}
          {error && (
            <div className="login-error">
              ⚠️ {error}
            </div>
          )}

          {/* Google Sign-In Button */}
          <button
            className="google-btn"
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>

          {/* GitHub Sign-In Button */}
          <button
            className="github-btn"
            type="button"
            onClick={handleGitHubLogin}
            disabled={githubLoading}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {githubLoading ? 'Redirecting...' : 'Continue with GitHub'}
          </button>

          {/* Divider */}
          <div className="divider">
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleAPILogin}>
            <div className="field">
              <label htmlFor="login-email">Email Address</label>
              <div className="input-wrap">
                <Mail size={18} strokeWidth={1.8} className="input-icon" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                />
              </div>
            </div>

            <div className="field">
              <div className="label-row">
                <label htmlFor="login-password">Password</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <div className="input-wrap">
                <Lock size={18} strokeWidth={1.8} className="input-icon" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  style={{ paddingRight: '44px' }}
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

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="form-foot">
            Don't have an account? <Link to="/signup">Register</Link>
          </div>
        </div>

        <div className="legal-foot">© 2026 DevMetrics, Inc. · <a href="#">Privacy</a> · <a href="#">Terms</a></div>
      </section>
    </div>
  )
}

export default LoginPage
