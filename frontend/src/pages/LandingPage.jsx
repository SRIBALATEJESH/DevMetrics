import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X, Rocket, Cpu, ShieldCheck, Heart, Award, ArrowRight } from 'lucide-react'
import './LandingPage.css'

// Helper for scroll reveal hooks
const useScrollReveal = (threshold = 0.1) => {
    const [revealed, setRevealed] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setRevealed(true);
                observer.unobserve(entry.target);
            }
        }, { threshold });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return [ref, revealed];
};

// Typewriter cycling text component
const Typewriter = () => {
    const words = ["Track", "Analyze", "Optimize", "Scale"];
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timer;
        const currentWord = words[currentWordIndex];
        const typingSpeed = isDeleting ? 40 : 100;

        if (!isDeleting && displayedText === currentWord) {
            timer = setTimeout(() => setIsDeleting(true), 2000);
        } else if (isDeleting && displayedText === "") {
            setIsDeleting(false);
            setCurrentWordIndex((prev) => (prev + 1) % words.length);
        } else {
            timer = setTimeout(() => {
                setDisplayedText(prev => 
                    isDeleting 
                        ? prev.substring(0, prev.length - 1) 
                        : currentWord.substring(0, prev.length + 1)
                );
            }, typingSpeed);
        }

        return () => clearTimeout(timer);
    }, [displayedText, isDeleting, currentWordIndex]);

    return (
        <span className="typewriter-text-wrapper">
            <span className="typewriter-text">{displayedText}</span>
            <span className="typewriter-cursor">|</span>
        </span>
    );
};

// Counter component that counts from 0 when visible
const Counter = ({ target, suffix = "" }) => {
    const [count, setCount] = useState(0);
    const [ref, revealed] = useScrollReveal(0.15);
    const targetNum = parseInt(target.replace(/[^0-9]/g, ''));

    useEffect(() => {
        if (!revealed) return;

        let start = 0;
        const end = targetNum;
        const duration = 2000;
        const totalSteps = 60;
        const stepTime = Math.floor(duration / totalSteps);
        const increment = Math.ceil(end / totalSteps);

        const timer = setInterval(() => {
            start += increment;
            if (start >= end) {
                setCount(end);
                clearInterval(timer);
            } else {
                setCount(start);
            }
        }, stepTime);

        return () => clearInterval(timer);
    }, [revealed, targetNum]);

    return (
        <div ref={ref} className="stat-value">
            {count.toLocaleString()}{suffix}
        </div>
    );
};

const projectCards = [
    { name: "Apollo Core Server", metric: "98.4% Health Score", badge: "Production", color: "var(--accent)" },
    { name: "Ares Telemetry Parser", metric: "450 deploys/week", badge: "Active", color: "var(--green)" },
    { name: "Hermes Notification Hub", metric: "1.4d Cycle Time", badge: "Staging", color: "var(--purple)" },
    { name: "Athena Security Validator", metric: "0 failure rate", badge: "Healthy", color: "var(--amber)" },
    { name: "Zeus Load Balancer", metric: "99.9% Uptime", badge: "Stable", color: "var(--red)" }
];

const LandingPage = () => {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [featuresRef, featuresRevealed] = useScrollReveal(0.1);

    return (
        <div className="landing-page-container">
            {/* Background Moving Grid and Shifting Radial Glows */}
            <div className="animated-background">
                <div className="dot-grid"></div>
                <div className="shifting-glow glow-1"></div>
                <div className="shifting-glow glow-2"></div>
                <div className="shifting-glow glow-3"></div>
            </div>

            {/* NAV */}
            <nav className="glass-nav">
                <div className="nav-container">
                    <a className="nav-logo" href="#">
                        <div className="logo-icon">D</div>
                        DevMetrics
                    </a>
                    <ul className="nav-links">
                        <li><a href="#features">Features</a></li>
                        <li><a href="#carousel-section">Projects</a></li>
                        <li><a href="#analytics">Mockup</a></li>
                        <li><a href="#stats-section">Metrics</a></li>
                    </ul>
                    <div className="nav-actions">
                        <Link to="/login" className="btn-ghost">Log In</Link>
                        <Link to="/signup" className="btn-primary">Get Started →</Link>
                    </div>
                    {/* Mobile Menu Toggle Button */}
                    <button 
                        className="menu-toggle" 
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        aria-label="Toggle navigation menu"
                    >
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Mobile Drawer */}
                <div className={`mobile-nav-menu ${mobileMenuOpen ? 'open' : ''}`}>
                    <ul className="mobile-nav-links">
                        <li><a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a></li>
                        <li><a href="#carousel-section" onClick={() => setMobileMenuOpen(false)}>Projects</a></li>
                        <li><a href="#analytics" onClick={() => setMobileMenuOpen(false)}>Mockup</a></li>
                        <li><a href="#stats-section" onClick={() => setMobileMenuOpen(false)}>Metrics</a></li>
                    </ul>
                    <div className="mobile-nav-actions">
                        <Link to="/login" className="btn-ghost" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                        <Link to="/signup" className="btn-primary" onClick={() => setMobileMenuOpen(false)}>Get Started →</Link>
                    </div>
                </div>
            </nav>

            {/* HERO SECTION */}
            <header className="hero-section">
                <div className="hero-container">
                    <div className="hero-content">
                        <div className="hero-badge">
                            <span className="dot"></span>Now with AI-Powered Intelligence · v2.1
                        </div>
                        <h1>
                            <Typewriter />
                            <br />
                            <em>Engineering Velocity</em>
                        </h1>
                        <p>
                            DevMetrics tracks, compiles, and unifies commits, PRs, review behavior, and task metrics directly from your stack. Turn Git activity into team intelligence.
                        </p>
                        <div className="hero-ctas">
                            <Link to="/signup" className="btn-hero-primary">
                                <span>Get Started Free</span> <ArrowRight size={16} />
                            </Link>
                            <a href="#analytics" className="btn-hero-secondary">
                                <span>Explore Mockup</span>
                            </a>
                        </div>
                    </div>

                    {/* Floating 3D mockup */}
                    <div className="hero-mockup-wrap">
                        <div className="dash-mockup">
                            <div className="dash-header">
                                <div className="titlebar-dots"><span className="red"></span><span className="yellow"></span><span className="green"></span></div>
                                <div className="mockup-url">app.devmetrics.io/dashboard</div>
                            </div>
                            <div className="mockup-body">
                                <div className="mockup-sidebar">
                                    <div className="sb-item active"></div>
                                    <div className="sb-item"></div>
                                    <div className="sb-item"></div>
                                    <div className="sb-item"></div>
                                </div>
                                <div className="mockup-main">
                                    <div className="mockup-widgets">
                                        <div className="widget-card">
                                            <span className="widget-lbl">VELOCITY</span>
                                            <div className="widget-val">42 <span className="up">↑12%</span></div>
                                        </div>
                                        <div className="widget-card">
                                            <span className="widget-lbl">LEAD TIME</span>
                                            <div className="widget-val">1.8d <span className="down">↓18%</span></div>
                                        </div>
                                        <div className="widget-card">
                                            <span className="widget-lbl">HEALTH INDEX</span>
                                            <div className="widget-val">94% <span className="up">↑3%</span></div>
                                        </div>
                                    </div>
                                    <div className="mockup-chart-card">
                                        <div className="chart-header-row">
                                            <span className="chart-title">Continuous Deployment Frequency</span>
                                            <span className="chart-legend">Sprint 24</span>
                                        </div>
                                        <div className="mockup-bars">
                                            <div className="m-bar" style={{ height: '35%' }}></div>
                                            <div className="m-bar" style={{ height: '58%' }}></div>
                                            <div className="m-bar" style={{ height: '42%' }}></div>
                                            <div className="m-bar" style={{ height: '76%' }}></div>
                                            <div className="m-bar" style={{ height: '62%' }}></div>
                                            <div className="m-bar" style={{ height: '94%' }}></div>
                                            <div className="m-bar" style={{ height: '81%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* ROTATING IMAGE CAROUSEL SECTION */}
            <section id="carousel-section" className="carousel-section">
                <div className="section-header-centered">
                    <span className="section-label">Live Workspace</span>
                    <h2>Track Active Repositories</h2>
                    <p className="section-sub">See how contribution indicators, branch activity, and test scores cycle in real-time.</p>
                </div>
                
                <div className="carousel-outer-wrap">
                    <div className="carousel-container">
                        <div className="carousel-track">
                            {[...projectCards, ...projectCards, ...projectCards].map((card, idx) => (
                                <div key={idx} className="carousel-card" style={{ '--accent-color': card.color }}>
                                    <div className="cc-header">
                                        <span className="cc-name">{card.name}</span>
                                        <span className="cc-badge">{card.badge}</span>
                                    </div>
                                    <div className="cc-body">
                                        <div className="cc-metric-lbl">Indicators</div>
                                        <div className="cc-metric">{card.metric}</div>
                                    </div>
                                    <div className="cc-chart">
                                        <svg viewBox="0 0 120 30" className="cc-chart-svg">
                                            <path d={`M0,${15 + Math.sin(idx) * 8} Q20,${5 + Math.cos(idx) * 10} 40,${20 + Math.sin(idx + 1) * 5} T80,${10 + Math.cos(idx + 2) * 8} T120,${15}`} fill="none" stroke={card.color} strokeWidth="2" strokeLinecap="round" />
                                        </svg>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURE SECTION */}
            <section id="features" ref={featuresRef} className="features-section">
                <div className="section-inner">
                    <span className="section-label">Core Engine</span>
                    <h2>Optimized for High-Output Teams</h2>
                    <p className="section-sub">Unify your lifecycle insights without the noise.</p>
                    
                    <div className="features-grid">
                        <div className={`feat-card ${featuresRevealed ? 'reveal-visible' : ''}`} style={{ transitionDelay: '0ms' }}>
                            <div className="feat-icon pulse-icon">
                                <Rocket size={24} />
                            </div>
                            <h3 className="feat-title">DORA Intelligence</h3>
                            <p className="feat-desc">Extract deployment frequency, failure rates, and MTTR automatically from production logs and pipelines.</p>
                        </div>
                        <div className={`feat-card ${featuresRevealed ? 'reveal-visible' : ''}`} style={{ transitionDelay: '200ms' }}>
                            <div className="feat-icon spin-icon">
                                <Cpu size={24} />
                            </div>
                            <h3 className="feat-title">Git Sync Engine</h3>
                            <p className="feat-desc">Link branches directly to boards. Sync and assign commits, pull requests, and code reviews automatically.</p>
                        </div>
                        <div className={`feat-card ${featuresRevealed ? 'reveal-visible' : ''}`} style={{ transitionDelay: '400ms' }}>
                            <div className="feat-icon bounce-icon">
                                <ShieldCheck size={24} />
                            </div>
                            <h3 className="feat-title">Team Isolation</h3>
                            <p className="feat-desc">Enforce role-based access. Keep developer contribution logs isolated and profiles secured with OAuth standards.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* DUMMY MOCKUP / ANALYTICS SECTION */}
            <section id="analytics" className="preview-section">
                <div className="section-inner">
                    <span className="section-label">Dashboard Preview</span>
                    <h2>Actionable Engineering Insights</h2>
                    <p className="section-sub">Get a granular look at team capacity, code hygiene, and DORA performance in one unified view.</p>
                    
                    <div className="preview-grid">
                        {/* Contribution Score */}
                        <div className="preview-card tall">
                            <div>
                                <span className="card-eyebrow">Individual Impact</span>
                                <h3 className="card-title">Contribution Score</h3>
                            </div>
                            <div className="score-ring">
                                <svg viewBox="0 0 100 100" width="100%" height="100%">
                                    <circle cx="50" cy="50" r="45" className="ring-bg" />
                                    <circle cx="50" cy="50" r="45" className="ring-fill" />
                                    <defs>
                                        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#a855f7" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="score-center">
                                    <div className="score-value">94</div>
                                    <div className="score-label">EXCELLENT</div>
                                </div>
                            </div>
                            <div className="score-breakdown">
                                <div className="score-row">
                                    <span className="score-row-label">Commits</span>
                                    <div className="score-bar-track"><div className="score-bar-fill" style={{ width: '88%', background: 'var(--accent)' }}></div></div>
                                    <span className="score-row-value">88</span>
                                </div>
                                <div className="score-row">
                                    <span className="score-row-label">PR Reviews</span>
                                    <div className="score-bar-track"><div className="score-bar-fill" style={{ width: '92%', background: 'var(--purple)' }}></div></div>
                                    <span className="score-row-value">92</span>
                                </div>
                                <div className="score-row">
                                    <span className="score-row-label">Task Resolve</span>
                                    <div className="score-bar-track"><div className="score-bar-fill" style={{ width: '95%', background: 'var(--green)' }}></div></div>
                                    <span className="score-row-value">95</span>
                                </div>
                            </div>
                        </div>

                        {/* Team Leaderboard */}
                        <div className="preview-card">
                            <span className="card-eyebrow">Collaboration</span>
                            <h3 className="card-title">Top Contributors</h3>
                            <div className="leaderboard-list">
                                <div className="lb-row">
                                    <span className="lb-rank">#1</span>
                                    <div className="lb-avatar" style={{ background: 'linear-gradient(135deg, #fbbf24, #f59e0b)' }}>B</div>
                                    <div className="lb-name">Balu <span className="lb-role">· PM</span></div>
                                    <span className="lb-score">98.4</span>
                                </div>
                                <div className="lb-row">
                                    <span className="lb-rank">#2</span>
                                    <div className="lb-avatar" style={{ background: 'linear-gradient(135deg, #4f8ef7, #9b6dff)' }}>J</div>
                                    <div className="lb-name">John <span className="lb-role">· Dev</span></div>
                                    <span className="lb-score">95.2</span>
                                </div>
                                <div className="lb-row">
                                    <span className="lb-rank">#3</span>
                                    <div className="lb-avatar" style={{ background: 'linear-gradient(135deg, #2dd4bf, #0d9488)' }}>P</div>
                                    <div className="lb-name">Priya <span className="lb-role">· Lead</span></div>
                                    <span className="lb-score">92.0</span>
                                </div>
                            </div>
                        </div>

                        {/* Engineering Health */}
                        <div className="preview-card">
                            <span className="card-eyebrow">Code Quality</span>
                            <h3 className="card-title">Repository Health</h3>
                            <div className="health-metrics">
                                <div className="health-metric">
                                    <div className="health-info">
                                        <div className="health-name">Test Coverage</div>
                                        <div className="health-bar-track"><div className="health-bar-fill" style={{ width: '94%', background: 'var(--green)' }}></div></div>
                                    </div>
                                    <span className="health-value" style={{ color: 'var(--green)' }}>94%</span>
                                </div>
                                <div className="health-metric">
                                    <div className="health-info">
                                        <div className="health-name">Docs Coverage</div>
                                        <div className="health-bar-track"><div className="health-bar-fill" style={{ width: '82%', background: 'var(--accent)' }}></div></div>
                                    </div>
                                    <span className="health-value" style={{ color: 'var(--accent)' }}>82%</span>
                                </div>
                                <div className="health-metric">
                                    <div className="health-info">
                                        <div className="health-name">Lint Adherence</div>
                                        <div className="health-bar-track"><div className="health-bar-fill" style={{ width: '99%', background: 'var(--purple)' }}></div></div>
                                    </div>
                                    <span className="health-value" style={{ color: 'var(--purple)' }}>99%</span>
                                </div>
                            </div>
                        </div>

                        {/* Sparkline DORA stats */}
                        <div className="preview-card wide-card">
                            <span className="card-eyebrow">Delivery Frequency</span>
                            <h3 className="card-title">Weekly Deployments Trend</h3>
                            <div className="sparkline-wrap">
                                <div className="sparkline-header">
                                    <span className="sparkline-value">42</span>
                                    <span className="sparkline-delta">↑ 23% MoM</span>
                                </div>
                                <div className="mini-chart">
                                    <div className="chart-bars">
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '35%', background: 'var(--accent)' }}></div><span className="bar-day">M</span></div>
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '55%', background: 'var(--accent)' }}></div><span className="bar-day">T</span></div>
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '42%', background: 'var(--accent)' }}></div><span className="bar-day">W</span></div>
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '78%', background: 'var(--purple)' }}></div><span className="bar-day">T</span></div>
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '60%', background: 'var(--accent)' }}></div><span className="bar-day">F</span></div>
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '94%', background: 'var(--green)' }}></div><span className="bar-day">S</span></div>
                                        <div className="bar-col"><div className="bar-fill" style={{ height: '80%', background: 'var(--accent)' }}></div><span className="bar-day">S</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS COUNTER SECTION */}
            <section id="stats-section" className="stats-section">
                <div className="stripes-bg"></div>
                <div className="stats-inner">
                    <div className="stat-card">
                        <Counter target="12000" suffix="+" />
                        <span className="stat-label">Developers Tracked</span>
                    </div>
                    <div className="stat-card">
                        <Counter target="340" suffix="+" />
                        <span className="stat-label">Enterprise Projects</span>
                    </div>
                    <div className="stat-card">
                        <Counter target="99" suffix=".9%" />
                        <span className="stat-label">Uptime SLA</span>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="footer-wrap">
                <div className="footer-inner">
                    <div className="footer-top">
                        <div className="footer-brand">
                            <div className="nav-logo">
                                <div className="logo-icon">D</div>
                                DevMetrics
                            </div>
                            <p>Premium developer analytics and intelligence dashboard framework.</p>
                        </div>
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <ul>
                                <li><a href="#">DORA Stats</a></li>
                                <li><a href="#">Security</a></li>
                                <li><a href="#">GitHub App</a></li>
                            </ul>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <ul>
                                <li><a href="#">Docs</a></li>
                                <li><a href="#">APIs</a></li>
                                <li><a href="#">Pricing</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <div className="footer-copy">© 2026 DevMetrics, Inc. All rights reserved.</div>
                        <div className="footer-badges">
                            <span className="footer-badge">SOC2 CERTIFIED</span>
                            <span className="footer-badge">GDPR COMPLIANT</span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage
