import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  GitPullRequest,
  CheckSquare,
  AlertCircle,
  TrendingUp,
  Award,
  Database,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Line, Bar, Radar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './GithubAnalytics.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const GithubAnalyticsDashboard = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [commitTimeframe, setCommitTimeframe] = useState('daily'); // daily, weekly, monthly

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };
      const res = await fetch('http://localhost:5000/api/auth/github/analytics', { headers });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data.data);
      } else {
        setError(data.message || 'Failed to fetch GitHub analytics dashboard.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching GitHub analytics.');
    } finally {
      setLoading(false);
    }
  };

  const refreshAnalytics = async () => {
    try {
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };
      const res = await fetch('http://localhost:5000/api/auth/github/analytics', { headers });
      const data = await res.json();
      if (res.ok) {
        setAnalytics(data.data);
      }
    } catch (err) {
      console.error('Error auto-refreshing GitHub analytics:', err);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleRefresh = () => {
      console.log('[GithubAnalytics] Auto-refreshing GitHub analytics...');
      refreshAnalytics();
    };

    window.addEventListener('analytics_updated', handleRefresh);
    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
    };
  }, [token]);

  if (loading && !analytics) {
    return (
      <Layout pageTitle="GitHub Analytics" pageEyebrow=" github / analytics" pageSubtitle="Aggregating repository contribution metrics...">
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" style={{ marginBottom: '16px' }} />
          <p>Compiling commit logs, PRs, reviews, and issues activity...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout pageTitle="GitHub Analytics" pageEyebrow=" github / analytics" pageSubtitle="Display GitHub contribution metrics.">
        <div className="alert-banner error" style={{ margin: '40px auto', maxWidth: '600px' }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      </Layout>
    );
  }

  const { kpis, commitActivity, prActivity, reviewActivity, issueActivity, leaderboard, personalBreakdown } = analytics;

  // 1. Commit Activity Chart options & data
  const commitsData = commitActivity[commitTimeframe];
  const commitChartData = {
    labels: commitsData.labels,
    datasets: [
      {
        label: 'Commits',
        data: commitsData.counts,
        borderColor: '#4f8ef7',
        backgroundColor: 'rgba(79, 142, 247, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#4f8ef7',
        pointHoverRadius: 6
      }
    ]
  };

  const commitChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1e28',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8b90a0', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#8b90a0', font: { size: 10 }, stepSize: 5 } }
    }
  };

  // 2. PR Activity Chart options & data
  const prChartData = {
    labels: ['PRs Created', 'PRs Merged', 'PRs Closed'],
    datasets: [
      {
        label: 'Pull Requests',
        data: [prActivity.created, prActivity.merged, prActivity.closed],
        backgroundColor: [
          'rgba(79, 142, 247, 0.75)', // blue
          'rgba(16, 185, 129, 0.75)', // green
          'rgba(239, 68, 68, 0.75)'   // red
        ],
        borderColor: [
          '#4f8ef7',
          '#10b981',
          '#ef4444'
        ],
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const prChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1e28',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8b90a0', font: { size: 11 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#8b90a0', font: { size: 10 }, stepSize: 2 } }
    }
  };

  // 3. Review Activity Chart options & data
  const reviewChartData = {
    labels: reviewActivity.weeklyReviews.labels,
    datasets: [
      {
        label: 'Reviews Submitted',
        data: reviewActivity.weeklyReviews.counts,
        borderColor: '#a855f7', // purple
        backgroundColor: 'rgba(168, 85, 247, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointBackgroundColor: '#a855f7',
        pointHoverRadius: 6
      }
    ]
  };

  const reviewChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a1e28',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1
      }
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#8b90a0', font: { size: 10 } } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#8b90a0', font: { size: 10 }, stepSize: 2 } }
    }
  };

  // 4. Issue Resolution Rate doughnut data
  const issueDoughnutData = {
    labels: ['Closed', 'Opened'],
    datasets: [
      {
        data: [issueActivity.closed, issueActivity.opened],
        backgroundColor: ['rgba(16, 185, 129, 0.75)', 'rgba(245, 158, 11, 0.75)'],
        borderColor: ['#10b981', '#f59e0b'],
        borderWidth: 1,
        weight: 1
      }
    ]
  };

  const issueDoughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { display: false }
    }
  };

  // 5. Personal breakdown charts
  const pb = personalBreakdown.breakdown || {};
  const radarData = {
    labels: ['Tasks Completed', 'Commits Made', 'PRs Merged', 'Reviews Done', 'Issues Resolved'],
    datasets: [
      {
        label: 'Contribution Index V2',
        data: [
          pb.taskScore || 0,
          pb.commitScore || 0,
          pb.prScore || 0,
          pb.reviewScore || 0,
          pb.issueScore || 0
        ],
        backgroundColor: 'rgba(79, 142, 247, 0.15)',
        borderColor: '#4f8ef7',
        borderWidth: 2,
        pointBackgroundColor: '#4f8ef7',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#4f8ef7'
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        pointLabels: { color: '#8b90a0', font: { size: 10, weight: '600' } },
        ticks: { display: false },
        min: 0,
        max: 100
      }
    },
    plugins: {
      legend: { display: false }
    }
  };

  // 6. Pie chart dataset for weighted final score contribution
  const weightedBreakdownData = {
    labels: ['Tasks Weighted (40%)', 'Commits Weighted (25%)', 'PRs Weighted (15%)', 'Reviews Weighted (10%)', 'Issues Weighted (10%)'],
    datasets: [
      {
        data: [
          pb.taskWeighted || 0,
          pb.commitWeighted || 0,
          pb.prWeighted || 0,
          pb.reviewWeighted || 0,
          pb.issueWeighted || 0
        ],
        backgroundColor: [
          'rgba(79, 142, 247, 0.75)',
          'rgba(168, 85, 247, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(236, 72, 153, 0.75)',
          'rgba(245, 158, 11, 0.75)'
        ],
        borderColor: ['#4f8ef7', '#a855f7', '#10b981', '#ec4899', '#f59e0b'],
        borderWidth: 1
      }
    ]
  };

  const weightedBreakdownOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#8b90a0', boxWidth: 10, font: { size: 9 } }
      }
    }
  };

  return (
    <Layout
      pageTitle="GitHub Analytics"
      pageEyebrow="// analytics / github"
      pageSubtitle="Analyze developer git activities, review behaviors, and resolution indexes."
    >
      <div className="github-analytics-dashboard">
        {/* Refresh button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchAnalytics}>
            <RefreshCw size={14} />
            Reload Analytics
          </button>
        </div>

        {/* KPI Cards */}
        <div className="kpis-row">
          <div className="kpi-card glass-card">
            <div className="card-top">
              <span className="card-title">Connected Repos</span>
              <Database size={16} className="card-icon blue" />
            </div>
            <div className="card-value">{kpis.totalRepos}</div>
            <span className="card-trend text-muted">Active channels</span>
          </div>

          <div className="kpi-card glass-card">
            <div className="card-top">
              <span className="card-title">Total Commits</span>
              <GitCommit size={16} className="card-icon purple" />
            </div>
            <div className="card-value">{kpis.totalCommits}</div>
            <span className="card-trend text-green">+14% vs last week</span>
          </div>

          <div className="kpi-card glass-card">
            <div className="card-top">
              <span className="card-title">Pull Requests</span>
              <GitPullRequest size={16} className="card-icon green" />
            </div>
            <div className="card-value">{kpis.totalPRs}</div>
            <span className="card-trend text-blue">Created across repo</span>
          </div>

          <div className="kpi-card glass-card">
            <div className="card-top">
              <span className="card-title">Code Reviews</span>
              <Award size={16} className="card-icon pink" />
            </div>
            <div className="card-value">{kpis.totalReviews}</div>
            <span className="card-trend text-purple">Submitted reviews</span>
          </div>

          <div className="kpi-card glass-card">
            <div className="card-top">
              <span className="card-title">Issues Closed</span>
              <CheckSquare size={16} className="card-icon yellow" />
            </div>
            <div className="card-value">{kpis.totalIssuesClosed}</div>
            <span className="card-trend text-yellow">{kpis.resolutionRate}% resolution rate</span>
          </div>
        </div>

        {/* Charts Row 1 */}
        <div className="charts-grid-row">
          {/* Commit Activity */}
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h3>Commit Activity</h3>
              <div className="timeframe-selectors">
                <button className={`selector-btn ${commitTimeframe === 'daily' ? 'active' : ''}`} onClick={() => setCommitTimeframe('daily')}>Daily</button>
                <button className={`selector-btn ${commitTimeframe === 'weekly' ? 'active' : ''}`} onClick={() => setCommitTimeframe('weekly')}>Weekly</button>
                <button className={`selector-btn ${commitTimeframe === 'monthly' ? 'active' : ''}`} onClick={() => setCommitTimeframe('monthly')}>Monthly</button>
              </div>
            </div>
            <div className="chart-container">
              <Line data={commitChartData} options={commitChartOptions} />
            </div>
          </div>

          {/* Pull Request Stages */}
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h3>Pull Request Stages</h3>
            </div>
            <div className="chart-container">
              <Bar data={prChartData} options={prChartOptions} />
            </div>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="charts-grid-row">
          {/* Reviews Submitted */}
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h3>Code Review Activity</h3>
            </div>
            <div className="chart-container-split">
              <div className="chart-subcontainer flex-grow-1">
                <Line data={reviewChartData} options={reviewChartOptions} />
              </div>
              <div className="top-reviewers-list">
                <h4>Top Peer Reviewers</h4>
                {reviewActivity.reviewsPerUser.length === 0 ? (
                  <span className="no-data">No peer reviews found</span>
                ) : (
                  reviewActivity.reviewsPerUser.map((item, idx) => (
                    <div key={item.username} className="reviewer-row">
                      <span className="rank">#{idx + 1}</span>
                      <span className="username">@{item.username}</span>
                      <strong className="count">{item.count} reviews</strong>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Issue Resolution Rate */}
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h3>Issue Resolution Rates</h3>
            </div>
            <div className="chart-container-split">
              <div className="chart-subcontainer flex-grow-1" style={{ position: 'relative' }}>
                <Doughnut data={issueDoughnutData} options={issueDoughnutOptions} />
                <div className="doughnut-center-label">
                  <span className="value">{issueActivity.resolutionRate}%</span>
                  <span className="label">Resolved</span>
                </div>
              </div>
              <div className="issue-breakdown-details">
                <div className="detail-item text-green">
                  <span>Closed Issues</span>
                  <strong>{issueActivity.closed}</strong>
                </div>
                <div className="detail-item text-yellow">
                  <span>Open Issues</span>
                  <strong>{issueActivity.opened}</strong>
                </div>
                <div className="detail-item">
                  <span>Total Backlog</span>
                  <strong>{issueActivity.closed + issueActivity.opened}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contribution Scoring breakdown & Leaderboard */}
        <div className="breakdown-leaderboard-row">
          {/* Contribution V2 Score Profile */}
          <div className="scoring-breakdown-card glass-card">
            <h3>Your Contribution Score V2</h3>
            <p>Weightings: Tasks 40%, Commits 25%, PRs 15%, Reviews 10%, Issues 10%.</p>

            <div className="charts-split">
              <div className="chart-radial">
                <Radar data={radarData} options={radarOptions} />
              </div>
              <div className="chart-radial">
                <Doughnut data={weightedBreakdownData} options={weightedBreakdownOptions} />
              </div>
            </div>

            <div className="overall-score-indicator">
              <span>Weighted Contribution Index</span>
              <strong className="score-badge">{personalBreakdown.contributionScore} / 100</strong>
            </div>
          </div>

          {/* Top Contributors Grid */}
          <div className="leaderboard-card glass-card">
            <h3>Contributors Leaderboard</h3>
            <p>Score rankings calculated using the Phase 1.1 V2 contribution engine.</p>

            <div className="leaderboard-table-wrapper">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Developer</th>
                    <th>Score</th>
                    <th>Commits</th>
                    <th>PRs</th>
                    <th>Reviews</th>
                    <th>Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((item, idx) => (
                    <tr key={item.id} className={item.id === user.id ? 'highlight-current' : ''}>
                      <td>
                        <strong className="rank-num">#{idx + 1}</strong>
                      </td>
                      <td>
                        <div className="dev-cell">
                          <div className="dev-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                            {item.avatar ? (
                              <img src={item.avatar} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              item.name.split(' ').map(n => n[0]).join('')
                            )}
                          </div>
                          <div className="dev-identity">
                            <span className="dev-name">{item.name}</span>
                            <span className="dev-role">{item.role}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong className="score-val">{item.contributionScore}</strong>
                      </td>
                      <td>{item.commits}</td>
                      <td>{item.prs}</td>
                      <td>{item.reviews}</td>
                      <td>{item.issues}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GithubAnalyticsDashboard;
