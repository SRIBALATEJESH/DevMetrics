import React, { useState, useEffect } from 'react';
import { User, Award, TrendingUp, Calendar, CheckCircle2, ChevronRight, Activity, GitCommit } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './DeveloperPerformanceDashboard.css';
import API_BASE_URL from '../config/api';

const DeveloperPerformanceDashboard = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [contributors, setContributors] = useState([]);
  const [selectedDeveloper, setSelectedDeveloper] = useState(null);
  const [devPeriods, setDevPeriods] = useState({ weekly: null, monthly: null, 'all-time': null });
  const [selectedPeriod, setSelectedPeriod] = useState('all-time');
  const [error, setError] = useState('');

  const isDev = user?.role?.toLowerCase() === 'developer';

  useEffect(() => {
    const fetchDeveloperSelfData = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const url = `${API_BASE_URL}/api/analytics/developers/${user.id}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          const list = data.data || [];
          const weekly = list.find(item => item.period === 'weekly') || null;
          const monthly = list.find(item => item.period === 'monthly') || null;
          const allTime = list.find(item => item.period === 'all-time') || null;
          setDevPeriods({ weekly, monthly, 'all-time': allTime });
          setSelectedDeveloper(allTime || weekly || monthly || list[0]);
        } else {
          setError(data.message || 'Failed to fetch developer performance data.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error loading developer performance analytics.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    const fetchAllContributors = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const url = `${API_BASE_URL}/api/analytics/developers`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          const list = data.data || [];
          setContributors(list);
          if (list.length > 0) {
            setSelectedDeveloper((prev) => {
              if (!prev) return list[0];
              const matched = list.find((d) => (d.user?._id || d.user) === (prev.user?._id || prev.user));
              return matched || list[0];
            });
          }
        } else {
          setError(data.message || 'Failed to fetch contributors performance.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error loading contributors analytics.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    if (isDev) {
      fetchDeveloperSelfData(true);
    } else {
      fetchAllContributors(true);
    }

    const handleRefresh = () => {
      console.log('[DeveloperPerformance] Auto-refreshing performance data...');
      if (isDev) {
        fetchDeveloperSelfData(false);
      } else {
        fetchAllContributors(false);
      }
    };

    window.addEventListener('analytics_updated', handleRefresh);
    window.addEventListener('leaderboard_updated', handleRefresh);
    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
      window.removeEventListener('leaderboard_updated', handleRefresh);
    };
  }, [token, isDev, user]);

  useEffect(() => {
    if (!selectedDeveloper || isDev) return;

    const fetchPeriods = async () => {
      try {
        const devId = selectedDeveloper.user?._id || selectedDeveloper.user;
        const url = `${API_BASE_URL}/api/analytics/developers/${devId}`;
        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          const list = data.data || [];
          const weekly = list.find(item => item.period === 'weekly') || null;
          const monthly = list.find(item => item.period === 'monthly') || null;
          const allTime = list.find(item => item.period === 'all-time') || null;
          setDevPeriods({ weekly, monthly, 'all-time': allTime });
        }
      } catch (err) {
        console.error('Failed to fetch developer periods:', err);
      }
    };

    fetchPeriods();
  }, [selectedDeveloper, token, isDev]);

  const activeDev = devPeriods[selectedPeriod] || selectedDeveloper;

  // Helper to format values
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  };

  const weeklyScore = devPeriods.weekly?.contributionScore || 0;
  const monthlyScore = devPeriods.monthly?.contributionScore || 0;
  const allTimeScore = devPeriods.allTime?.contributionScore || 0;

  // Real performance trends chart using weekly, monthly, and all-time scores
  const trendChartData = {
    labels: ['Weekly', 'Monthly', 'All-Time'],
    datasets: [
      {
        label: 'Contribution Score (V2)',
        data: [weeklyScore, monthlyScore, allTimeScore],
        borderColor: '#4f8ef7',
        backgroundColor: 'rgba(79, 142, 247, 0.1)',
        borderWidth: 2,
        tension: 0.3,
        fill: true,
        pointBackgroundColor: '#4f8ef7'
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#8f9cae', font: { size: 10 } },
        min: 0,
        max: 100
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8f9cae', font: { size: 10 } }
      }
    }
  };

  return (
    <Layout
      pageTitle={isDev ? "My Performance Dashboard" : "Developer Performance Dashboard"}
      pageEyebrow={isDev ? " my performance" : " team analytics"}
      pageSubtitle={isDev ? "Analyze your individual contributions, scoring parameters, and work timeline." : "Evaluate team contributors, productivity, and scoring distributions."}
    >
      <div className="developer-performance-container">
        {error && (
          <div className="error-banner">
            <ShieldAlertIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <RefreshCwIcon className="spin" size={32} />
            <p>Gathering developer scoring logs...</p>
          </div>
        ) : (
          <div className="performance-layout-grid">
            {/* Left Side: Developer Directory (Hide if single developer logged in) */}
            {!isDev && contributors.length > 0 && (
              <div className="developer-list-card glass-card">
                <h3>Contributors Directory</h3>
                <div className="list-container">
                  {contributors.map(item => (
                    <div
                      key={item._id}
                      className={`dev-list-item ${(selectedDeveloper?.user?._id || selectedDeveloper?.user) === (item.user?._id || item.user) ? 'active' : ''}`}
                      onClick={() => setSelectedDeveloper(item)}
                    >
                      <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                        {getInitials(item.name)}
                      </div>
                      <div className="info">
                        <span className="name">{item.name}</span>
                        <span className="role">{item.role || 'Developer'}</span>
                      </div>
                      <span className="score-badge">{item.contributionScore}</span>
                      <ChevronRight size={14} className="chevron" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Side: Active Developer Details Panel */}
            {activeDev ? (
              <div className="performance-details-panel">
                {/* Period Selector Tabs */}
                <div className="period-tabs-container">
                  <div className="period-tabs">
                    {['weekly', 'monthly', 'all-time'].map((p) => (
                      <button
                        key={p}
                        className={`period-tab-btn ${selectedPeriod === p ? 'active' : ''}`}
                        onClick={() => setSelectedPeriod(p)}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Profile Header Summary */}
                <div className="developer-hero-card glass-card">
                  <div className="hero-main">
                    <div className="avatar-large" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                      {getInitials(activeDev.name)}
                    </div>
                    <div className="identity">
                      <h2>{activeDev.name}</h2>
                      <p className="role-text">{activeDev.role || 'Developer'}</p>
                      <span className="score-label">Contribution Score V2: <strong className="highlight">{activeDev.contributionScore} / 100</strong></span>
                    </div>
                  </div>
                  <div className="hero-badge-col">
                    <div className="collab-badge">
                      <Award size={18} className="badge-icon" />
                      <div className="badge-details">
                        <span className="value">{activeDev.collaborationScore}</span>
                        <span className="label">Collaboration Score</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contribution Metrics Cards */}
                <div className="metrics-grid">
                  <div className="metric-box glass-card">
                    <span className="label">Tasks Score (40% weight)</span>
                    <strong className="value blue">{activeDev.tasksScore}%</strong>
                    <div className="bar-bg"><div className="fill blue" style={{ width: `${activeDev.tasksScore}%` }}></div></div>
                  </div>

                  <div className="metric-box glass-card">
                    <span className="label">Commits Score (25% weight)</span>
                    <strong className="value purple">{activeDev.commitsScore}%</strong>
                    <div className="bar-bg"><div className="fill purple" style={{ width: `${activeDev.commitsScore}%` }}></div></div>
                  </div>

                  <div className="metric-box glass-card">
                    <span className="label">PRs Score (15% weight)</span>
                    <strong className="value green">{activeDev.prScore}%</strong>
                    <div className="bar-bg"><div className="fill green" style={{ width: `${activeDev.prScore}%` }}></div></div>
                  </div>

                  <div className="metric-box glass-card">
                    <span className="label">Reviews Score (10% weight)</span>
                    <strong className="value pink">{activeDev.reviewScore}%</strong>
                    <div className="bar-bg"><div className="fill pink" style={{ width: `${activeDev.reviewScore}%` }}></div></div>
                  </div>

                  <div className="metric-box glass-card">
                    <span className="label">Issues Score (10% weight)</span>
                    <strong className="value yellow">{activeDev.issueScore}%</strong>
                    <div className="bar-bg"><div className="fill yellow" style={{ width: `${activeDev.issueScore}%` }}></div></div>
                  </div>
                </div>

                {/* Score Trend Chart */}
                <div className="trend-chart-card glass-card">
                  <div className="chart-header">
                    <h3>Performance Score Progress</h3>
                    <span className="subtext">Weekly dynamic tracking</span>
                  </div>
                  <div className="chart-container-large">
                    <Line data={trendChartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state glass-card" style={{ gridColumn: 'span 2' }}>
                <p>No developer stats found. Please perform a repository synchronization to recalculate contributors scores.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

// SVG icons
const ShieldAlertIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-red)' }}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

const RefreshCwIcon = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-green)' }}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default DeveloperPerformanceDashboard;
