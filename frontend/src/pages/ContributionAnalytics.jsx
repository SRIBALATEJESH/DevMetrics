import React, { useState, useEffect } from 'react';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './ContributionAnalytics.css';
import API_BASE_URL from '../config/api';

const ContributionAnalytics = () => {
  const { currentRole } = useRole();
  const { user, token } = useAuth();
  const role = currentRole?.toLowerCase();

  const isDev = role === 'developer';

  const [leaderboard, setLeaderboard] = useState([]);
  const [personalScore, setPersonalScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };

      if (isDev) {
        // Fetch personal scores
        const res = await fetch(`${API_BASE_URL}/api/analytics/user/`, { headers });
        const data = await res.json();
        if (res.ok) {
          setPersonalScore(data.data);
        } else {
          setError(data.message || 'Failed to fetch personal contribution score.');
        }
      } else {
        // Fetch leaderboard for managers/admins
        const res = await fetch(`${API_BASE_URL}/api/analytics/leaderboard`, { headers });
        const data = await res.json();
        if (res.ok) {
          setLeaderboard(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch leaderboard analytics.');
        }
      }
    } catch (err) {
      setError('Network error fetching analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [role, token]);

  // Construct contributors list for display/donut chart
  const getPersonalBreakdownList = () => {
    if (!personalScore) return [];
    const b = personalScore.breakdown || {};
    const score = personalScore.contributionScore || 1;

    if (b.isV2) {
      return [
        { name: 'Tasks Completed (40%)', value: b.taskWeighted || 0, color: 'var(--accent-blue)', percentage: Math.round(((b.taskWeighted || 0) / score) * 100) || 0 },
        { name: 'Commits Made (25%)', value: b.commitWeighted || 0, color: 'var(--accent-purple)', percentage: Math.round(((b.commitWeighted || 0) / score) * 100) || 0 },
        { name: 'PRs Merged (15%)', value: b.prWeighted || 0, color: 'var(--accent-teal)', percentage: Math.round(((b.prWeighted || 0) / score) * 100) || 0 },
        { name: 'Reviews Done (10%)', value: b.reviewWeighted || 0, color: 'var(--accent-pink)', percentage: Math.round(((b.reviewWeighted || 0) / score) * 100) || 0 },
        { name: 'Issues Resolved (10%)', value: b.issueWeighted || 0, color: 'var(--accent-yellow)', percentage: Math.round(((b.issueWeighted || 0) / score) * 100) || 0 },
      ];
    }

    return [
      { name: 'Tasks Completed (40%)', value: b.completionWeighted || 0, color: 'var(--accent-blue)', percentage: Math.round(((b.completionWeighted || 0) / score) * 100) || 0 },
      { name: 'Complexity (25%)', value: b.complexityWeighted || 0, color: 'var(--accent-purple)', percentage: Math.round(((b.complexityWeighted || 0) / score) * 100) || 0 },
      { name: 'Deadline Adherence (20%)', value: b.adherenceWeighted || 0, color: 'var(--accent-teal)', percentage: Math.round(((b.adherenceWeighted || 0) / score) * 100) || 0 },
      { name: 'Participation (15%)', value: b.participationWeighted || 0, color: 'var(--accent-green)', percentage: Math.round(((b.participationWeighted || 0) / score) * 100) || 0 },
    ];
  };

  const getLeaderboardBreakdownList = () => {
    // Just map top performers for a summary breakdown
    if (leaderboard.length === 0) return [];
    const topEntries = leaderboard.slice(0, 4);
    const totalScore = topEntries.reduce((sum, item) => sum + item.contributionScore, 0) || 1;
    return topEntries.map((entry, idx) => {
      const colors = ['var(--accent-blue)', 'var(--accent-purple)', 'var(--accent-teal)', 'var(--accent-green)'];
      return {
        name: entry.name,
        value: entry.contributionScore,
        color: colors[idx % colors.length],
        percentage: Math.round((entry.contributionScore / totalScore) * 100)
      };
    });
  };

  const contributors = isDev ? getPersonalBreakdownList() : getLeaderboardBreakdownList();
  const contributionScore = isDev
    ? (personalScore ? personalScore.contributionScore : 0)
    : (leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, entry) => sum + entry.contributionScore, 0) / leaderboard.length) : 0);

  // Conic gradient string
  const getConicGradient = () => {
    if (contributors.length === 0) return 'var(--border)';
    let currentPct = 0;
    const slices = contributors.map(c => {
      const start = currentPct;
      const end = currentPct + c.percentage;
      currentPct = end;
      return `${c.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${slices.join(', ')})`;
  };

  return (
    <Layout
      pageTitle={isDev ? "My Contribution Analytics" : "Contribution Analytics"}
      pageEyebrow={isDev ? " my contribution" : " contribution analytics"}
      pageSubtitle={isDev ? "Visualize your individual engineering contribution." : "Visualize team contributions with charts and leaderboards."}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Computing contribution index from database logs...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <>
          <div className="analytics-grid">
            <div className="card">
              <div className="card-title">{isDev ? "Your Contribution Breakdown" : "Top Performer Breakdown"}</div>
              <div className="donut-chart-container">
                <div className="donut-chart" style={{ background: getConicGradient() }}>
                  <div className="donut-inner"></div>
                </div>
                <div className="donut-legend">
                  {contributors.map((c, i) => (
                    <div key={i} className="legend-row">
                      <span className="legend-dot" style={{ background: c.color }}></span>
                      <span className="legend-name">{c.name}</span>
                      <span className="legend-percentage">{c.percentage}% ({c.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-title">{isDev ? "Your Contribution Score" : "Team Average Score"}</div>
              <div className="score-display">
                <div className="score-value">{contributionScore}</div>
                <div className="score-label">Overall Score</div>
              </div>
            </div>
          </div>

          {!isDev && (
            <div className="card" style={{ marginTop: '24px' }}>
              <div className="card-title">Engineering Contribution Leaderboard</div>
              <div className="leaderboard-list">
                {leaderboard.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No scored contributors found in database.
                  </div>
                ) : (
                  leaderboard.map((c, i) => (
                    <div key={c.id} className="leaderboard-item" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border)' }}>
                      <span className="leaderboard-rank" style={{ width: '40px', fontWeight: 'bold' }}>#{i + 1}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 'bold' }}>{c.name}</div>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{c.role}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="leaderboard-percentage" style={{ fontWeight: 'bold', color: 'var(--accent-blue)', fontSize: '18px' }}>{c.contributionScore}</div>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>score</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default ContributionAnalytics;
