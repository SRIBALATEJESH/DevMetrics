import React, { useState, useEffect } from 'react';
import { Award, Zap, MessageSquare, AlertCircle, RefreshCw, GitCommit, GitPullRequest } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leaderboard, setLeaderboard] = useState([]);
  const [period, setPeriod] = useState('all-time'); // 'weekly', 'monthly', 'all-time'
  const [error, setError] = useState('');

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch(`http://localhost:5000/api/analytics/leaderboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch leaderboard rankings.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error retrieving leaderboard.');
    } finally {
      setLoading(false);
    }
  };

  const refreshLeaderboard = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/analytics/leaderboard?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setLeaderboard(data.data || []);
      }
    } catch (err) {
      console.error('Error auto-refreshing leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    const handleRefresh = () => {
      console.log('[Leaderboard] Auto-refreshing leaderboard rankings...');
      refreshLeaderboard();
    };

    window.addEventListener('leaderboard_updated', handleRefresh);
    window.addEventListener('analytics_updated', handleRefresh);
    return () => {
      window.removeEventListener('leaderboard_updated', handleRefresh);
      window.removeEventListener('analytics_updated', handleRefresh);
    };
  }, [period, token]);

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  };

  // Top 3 winners
  const topThree = leaderboard.slice(0, 3);
  const remaining = leaderboard.slice(3);

  // Layout rank colors
  const rankColors = ['gold', 'silver', 'bronze'];

  return (
    <Layout
      pageTitle="Contributor Leaderboard"
      pageEyebrow=" analytics / rankings"
      pageSubtitle="Rank contributors based on overall engineering output and collaboration metrics."
    >
      <div className="leaderboard-page-container">
        {error && (
          <div className="error-banner">
            <ShieldAlertIcon size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Period Selector Tabs */}
        <div className="filters-header glass-card">
          <div className="period-tabs">
            {['weekly', 'monthly', 'all-time'].map(p => (
              <button
                key={p}
                className={`tab-btn ${period === p ? 'active' : ''}`}
                onClick={() => setPeriod(p)}
              >
                {p === 'all-time' ? 'All-Time' : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
          <button className="btn btn-ghost refresh-btn" onClick={fetchLeaderboard} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            Recalculate
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} style={{ color: 'var(--accent-green)' }} />
            <p>Re-indexing contributor standings...</p>
          </div>
        ) : (
          <>
            {/* Top 3 Podium Cards */}
            {topThree.length > 0 && (
              <div className="podium-row">
                {/* Second Place (Renders first on large layouts or centered) */}
                {topThree[1] && (
                  <div className="podium-card glass-card rank-2">
                    <div className="podium-badge silver">#2</div>
                    <div className="avatar-med" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                      {getInitials(topThree[1].name)}
                    </div>
                    <h4>{topThree[1].name}</h4>
                    <p className="role">{topThree[1].role}</p>
                    <div className="scores">
                      <span className="contrib">Index: <strong>{topThree[1].contributionScore}</strong></span>
                      <span className="collab">Collab: <strong>{topThree[1].collaborationScore}</strong></span>
                    </div>
                  </div>
                )}

                {/* First Place */}
                {topThree[0] && (
                  <div className="podium-card glass-card rank-1">
                    <div className="podium-badge gold">#1</div>
                    <div className="avatar-large" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                      {getInitials(topThree[0].name)}
                    </div>
                    <h4>{topThree[0].name}</h4>
                    <p className="role">{topThree[0].role}</p>
                    <div className="scores">
                      <span className="contrib">Index: <strong>{topThree[0].contributionScore}</strong></span>
                      <span className="collab">Collab: <strong>{topThree[0].collaborationScore}</strong></span>
                    </div>
                  </div>
                )}

                {/* Third Place */}
                {topThree[2] && (
                  <div className="podium-card glass-card rank-3">
                    <div className="podium-badge bronze">#3</div>
                    <div className="avatar-med" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                      {getInitials(topThree[2].name)}
                    </div>
                    <h4>{topThree[2].name}</h4>
                    <p className="role">{topThree[2].role}</p>
                    <div className="scores">
                      <span className="contrib">Index: <strong>{topThree[2].contributionScore}</strong></span>
                      <span className="collab">Collab: <strong>{topThree[2].collaborationScore}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* General Table */}
            <div className="leaderboard-table-card glass-card">
              <h3>All Contributor Standings</h3>
              <div className="table-wrapper">
                <table className="ranks-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Developer</th>
                      <th className="num-col">Contribution Index</th>
                      <th className="num-col">Collaboration Score</th>
                      <th className="num-col">Commits</th>
                      <th className="num-col">PRs</th>
                      <th className="num-col">Reviews</th>
                      <th className="num-col">Issues</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((item, idx) => (
                      <tr key={item.id} className={item.id === user.id ? 'highlight-current' : ''}>
                        <td>
                          <span className={`rank-num-circle ${idx < 3 ? rankColors[idx] : ''}`}>
                            #{idx + 1}
                          </span>
                        </td>
                        <td>
                          <div className="user-profile-cell">
                            <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                              {getInitials(item.name)}
                            </div>
                            <div className="name-details">
                              <span className="name">{item.name}</span>
                              <span className="role">{item.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="num-col bold-col">{item.contributionScore}</td>
                        <td className="num-col bold-col purple-col">{item.collaborationScore}</td>
                        <td className="num-col">{item.commits}</td>
                        <td className="num-col">{item.prs}</td>
                        <td className="num-col">{item.reviews}</td>
                        <td className="num-col">{item.issues}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
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

export default LeaderboardPage;
