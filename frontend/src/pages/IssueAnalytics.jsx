import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, RefreshCw, BarChart2, ShieldAlert, Sparkles } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './IssueAnalytics.css';

const IssueAnalytics = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [issuesData, setIssuesData] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  const isDev = user?.role?.toLowerCase() === 'developer';

  const fetchIssues = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/analytics/issues', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.data || [];
        setIssuesData(list);
        if (list.length > 0) {
          // If developer, find their own record first. Else default to first item
          const devRec = isDev ? list.find(l => l.user?._id === user.id) : null;
          setSelectedUser(devRec || list[0]);
        }
      } else {
        setError(data.message || 'Failed to fetch issue resolution metrics.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error retrieving issue analytics.');
    } finally {
      setLoading(false);
    }
  };

  const refreshIssues = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/analytics/issues', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        const list = data.data || [];
        setIssuesData(list);
        if (list.length > 0) {
          setSelectedUser((prev) => {
            if (!prev) {
              const devRec = isDev ? list.find(l => l.user?._id === user.id) : null;
              return devRec || list[0];
            }
            const matched = list.find((u) => (u.user?._id || u.user) === (prev.user?._id || prev.user));
            return matched || list[0];
          });
        }
      }
    } catch (err) {
      console.error('Error auto-refreshing issue analytics:', err);
    }
  };

  useEffect(() => {
    fetchIssues();

    const handleRefresh = () => {
      console.log('[IssueAnalytics] Auto-refreshing issue analytics...');
      refreshIssues();
    };

    window.addEventListener('analytics_updated', handleRefresh);
    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
    };
  }, [token]);

  const activeMetrics = selectedUser || issuesData[0];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  };

  // Sort list for Bug Fix Leaderboard (bugsFixed descending)
  const bugFixLeaderboard = [...issuesData]
    .sort((a, b) => b.bugsFixed - a.bugsFixed)
    .slice(0, 5);

  // Mock Issue Trend Chart data
  const issueTrendData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [
      {
        label: 'Issues Resolved',
        data: activeMetrics ? [
          Math.max(0, activeMetrics.closedIssuesCount - 3),
          Math.max(0, activeMetrics.closedIssuesCount - 2),
          Math.max(0, activeMetrics.closedIssuesCount - 1),
          activeMetrics.closedIssuesCount,
          activeMetrics.closedIssuesCount + 1,
          activeMetrics.closedIssuesCount + 2
        ] : [2, 3, 5, 4, 6, 7],
        borderColor: '#ec4899',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#ec4899'
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
        ticks: { color: '#8f9cae', font: { size: 10 } }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#8f9cae', font: { size: 10 } }
      }
    }
  };

  return (
    <Layout
      pageTitle="Issue Analytics"
      pageEyebrow=" analytics / issue-tracking"
      pageSubtitle="Measure bug-fixing turnaround, backlog resolution speed, and issue close rates."
    >
      <div className="issue-analytics-container">
        {error && (
          <div className="error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} style={{ color: 'var(--accent-green)' }} />
            <p>Analyzing backlog resolution logs...</p>
          </div>
        ) : (
          <div className="issues-main-layout">
            {/* Top Selector Panel */}
            <div className="repo-selector-panel glass-card">
              <span className="label">Select Contributor Analysis:</span>
              <div className="select-buttons">
                {issuesData.map(i => (
                  <button
                    key={i._id}
                    className={`selector-btn ${activeMetrics?._id === i._id ? 'active' : ''}`}
                    onClick={() => setSelectedUser(i)}
                  >
                    {i.user?.name || i.githubUsername}
                  </button>
                ))}
              </div>
            </div>

            {activeMetrics ? (
              <>
                {/* KPIs Row */}
                <div className="kpis-row">
                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Open Issues</span>
                      <div className="card-icon pink"><AlertCircle size={16} /></div>
                    </div>
                    <div className="card-value">{activeMetrics.openIssuesCount}</div>
                    <span className="card-trend text-pink">Currently assigned</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Issues Resolved</span>
                      <div className="card-icon green"><CheckCircle size={16} /></div>
                    </div>
                    <div className="card-value">{activeMetrics.closedIssuesCount}</div>
                    <span className="card-trend text-green">Closed issues count</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title text-yellow">Avg Resolution Speed</span>
                      <div className="card-icon yellow"><Clock size={16} /></div>
                    </div>
                    <div className="card-value">{activeMetrics.averageResolutionTime} hrs</div>
                    <span className="card-trend text-yellow">Time from open to close</span>
                  </div>
                </div>

                {/* Main Content Split: Chart vs Bug Fix Leaderboard */}
                <div className="issues-split-row">
                  <div className="chart-card glass-card">
                    <div className="chart-header">
                      <h3>Issue Resolution Velocity</h3>
                      <span className="subtext">Issues closed trajectory</span>
                    </div>
                    <div className="chart-container-large">
                      <Line data={issueTrendData} options={chartOptions} />
                    </div>
                  </div>

                  {/* Bug Fix Leaderboard */}
                  <div className="bug-leaderboard-card glass-card">
                    <div className="card-header-flex">
                      <Sparkles size={16} className="text-yellow" />
                      <h3>Bug Fix Leaderboard</h3>
                    </div>
                    <p className="card-subtitle">Ranks developers based on total bug-related tickets closed.</p>

                    <div className="leaderboard-items">
                      {bugFixLeaderboard.map((item, idx) => (
                        <div key={item._id} className="bug-leader-item">
                          <span className="rank-num">#{idx + 1}</span>
                          <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                            {getInitials(item.user?.name || item.githubUsername)}
                          </div>
                          <span className="name">{item.user?.name || item.githubUsername}</span>
                          <strong className="bugs-count">{item.bugsFixed} bugs fixed</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state glass-card">
                <p>No issue metrics found. Perform a database sync on linked repositories first to initialize issue data structures.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default IssueAnalytics;
