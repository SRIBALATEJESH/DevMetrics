import React, { useState, useEffect } from 'react';
import { Database, GitCommit, GitPullRequest, AlertCircle, RefreshCw, Star, GitFork, ShieldAlert } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './RepositoryInsights.css';

const RepositoryInsights = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInsights = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const res = await fetch('http://localhost:5000/api/analytics/repository-insights', {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          const list = data.data || [];
          setInsights(list);
          if (list.length > 0) {
            setSelectedRepo((prev) => {
              if (!prev) return list[0];
              const matched = list.find((r) => (r.repository?._id || r.repository) === (prev.repository?._id || prev.repository));
              return matched || list[0];
            });
          }
        } else {
          setError(data.message || 'Failed to fetch repository insights.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error retrieving repository insights.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchInsights(true);

    const handleRefresh = () => {
      console.log('[RepositoryInsights] Auto-refreshing repo insights...');
      fetchInsights(false);
    };

    window.addEventListener('analytics_updated', handleRefresh);
    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
    };
  }, [token]);

  const activeRepo = selectedRepo || insights[0];

  // Language Doughnut Setup
  const getLanguageData = (dist) => {
    if (!dist) return { labels: [], datasets: [] };
    const labels = Object.keys(dist);
    const data = Object.values(dist);

    return {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            'rgba(79, 142, 247, 0.8)',
            'rgba(168, 85, 247, 0.8)',
            'rgba(16, 185, 129, 0.8)',
            'rgba(245, 158, 11, 0.8)'
          ],
          borderColor: 'transparent',
          borderWidth: 0
        }
      ]
    };
  };

  // Mock Commit Trend Chart data
  const commitTrendData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [
      {
        label: 'Commit Count',
        data: activeRepo ? [activeRepo.commitCount - 15, activeRepo.commitCount - 11, activeRepo.commitCount - 8, activeRepo.commitCount - 4, activeRepo.commitCount - 2, activeRepo.commitCount] : [20, 24, 28, 30, 32, 35],
        borderColor: '#a855f7',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#a855f7'
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
      pageTitle="Repository Insights"
      pageEyebrow=" analytics / repositories"
      pageSubtitle="Deep-dive into branch commit frequency, pull request processing rates, and code languages."
    >
      <div className="repository-insights-container">
        {error && (
          <div className="error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <RefreshCwIcon className="spin" size={32} />
            <p>Indexing repository metrics...</p>
          </div>
        ) : (
          <>
            {/* Top Selector Panel */}
            <div className="repo-selector-panel glass-card">
              <span className="label">Select Repository:</span>
              <div className="select-buttons">
                {insights.map(i => (
                  <button
                    key={i._id}
                    className={`selector-btn ${activeRepo?._id === i._id ? 'active' : ''}`}
                    onClick={() => setSelectedRepo(i)}
                  >
                    {i.name}
                  </button>
                ))}
              </div>
            </div>

            {activeRepo ? (
              <>
                {/* Repository Header summary */}
                <div className="repo-header-card glass-card">
                  <div className="header-left">
                    <div className="repo-icon-wrapper">
                      <Database size={28} />
                    </div>
                    <div className="identity">
                      <h2>{activeRepo.repository?.fullName || activeRepo.name}</h2>
                      <p>{activeRepo.repository?.description || 'No description provided.'}</p>
                    </div>
                  </div>
                  <div className="repo-stats-pills">
                    <span className="pill stars"><Star size={14} /> {activeRepo.repository?.stars || 0} Stars</span>
                    <span className="pill forks"><GitFork size={14} /> {activeRepo.repository?.forks || 0} Forks</span>
                  </div>
                </div>

                {/* KPIs Row */}
                <div className="kpis-row">
                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Total Commits</span>
                      <div className="card-icon purple"><GitCommit size={16} /></div>
                    </div>
                    <div className="card-value">{activeRepo.commitCount}</div>
                    <span className="card-trend text-purple">All commits logged</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Pull Requests</span>
                      <div className="card-icon green"><GitPullRequest size={16} /></div>
                    </div>
                    <div className="card-value">
                      {activeRepo.mergedPullRequests + activeRepo.openPullRequests + activeRepo.closedPullRequests}
                    </div>
                    <span className="card-trend text-green">{activeRepo.mergedPullRequests} merged</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Open Issues</span>
                      <div className="card-icon yellow"><AlertCircle size={16} /></div>
                    </div>
                    <div className="card-value">{activeRepo.openIssues}</div>
                    <span className="card-trend text-yellow">{activeRepo.closedIssues} closed</span>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="charts-grid-row">
                  <div className="chart-card glass-card">
                    <div className="chart-header">
                      <h3>Commit Frequency</h3>
                      <span className="subtext">Commits trajectory index</span>
                    </div>
                    <div className="chart-container">
                      <Line data={commitTrendData} options={chartOptions} />
                    </div>
                  </div>

                  <div className="chart-card glass-card languages-card">
                    <div className="chart-header">
                      <h3>Language Distribution</h3>
                      <span className="subtext">Percentage codebase map</span>
                    </div>
                    <div className="donut-row">
                      <div className="donut-container">
                        <Doughnut data={getLanguageData(activeRepo.languageDistribution)} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
                      </div>
                      <div className="legend-labels">
                        {activeRepo.languageDistribution && Object.entries(activeRepo.languageDistribution).map(([lang, pct], idx) => {
                          const colors = ['#4f8ef7', '#a855f7', '#10b981', '#f59e0b'];
                          return (
                            <div key={lang} className="legend-item">
                              <span className="color-dot" style={{ background: colors[idx % colors.length] }}></span>
                              <span className="lang-name">{lang}</span>
                              <span className="pct">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state glass-card">
                <p>No repository insights discovered. Complete the repository linking process and sync data to populate these insights.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

// SVG Refresh Icon
const RefreshCwIcon = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-green)' }}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default RepositoryInsights;
