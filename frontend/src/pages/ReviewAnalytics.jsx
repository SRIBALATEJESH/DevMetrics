import React, { useState, useEffect } from 'react';
import { MessageSquare, Award, TrendingUp, CheckCircle, RefreshCw, BarChart2, ShieldAlert } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './ReviewAnalytics.css';
import API_BASE_URL from '../config/api';

const ReviewAnalytics = () => {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reviewsList, setReviewsList] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');

  const isDev = user?.role?.toLowerCase() === 'developer';

  useEffect(() => {
    const fetchReviews = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const url = isDev
          ? `${API_BASE_URL}/api/analytics/reviews/${user.id}`
          : `${API_BASE_URL}/api/analytics/reviews`;

        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          const list = data.data ? (Array.isArray(data.data) ? data.data : [data.data]) : [];
          setReviewsList(list);
          if (list.length > 0) {
            setSelectedUser((prev) => {
              if (!prev) return list[0];
              const matched = list.find((u) => (u.user?._id || u.user) === (prev.user?._id || prev.user));
              return matched || list[0];
            });
          }
        } else {
          setError(data.message || 'Failed to fetch code review analytics.');
        }
      } catch (err) {
        console.error(err);
        setError('Network error retrieving review metrics.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchReviews(true);

    const handleRefresh = () => {
      console.log('[ReviewAnalytics] Auto-refreshing review analytics...');
      fetchReviews(false);
    };

    window.addEventListener('analytics_updated', handleRefresh);
    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
    };
  }, [token, isDev, user]);

  const activeMetrics = selectedUser || reviewsList[0];

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('');
  };

  // Mock Review Trend Chart
  const reviewTrendData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [
      {
        label: 'Reviews Submitted',
        data: activeMetrics ? [
          Math.max(0, activeMetrics.reviewsGiven - 4),
          Math.max(0, activeMetrics.reviewsGiven - 3),
          Math.max(0, activeMetrics.reviewsGiven - 2),
          Math.max(0, activeMetrics.reviewsGiven - 1),
          activeMetrics.reviewsGiven,
          activeMetrics.reviewsGiven + 1
        ] : [1, 2, 3, 4, 5, 5],
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.3,
        fill: false,
        pointBackgroundColor: '#10b981'
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
      pageTitle={isDev ? "My Review Analytics" : "Review Analytics"}
      pageEyebrow={isDev ? " my reviews" : " team code reviews"}
      pageSubtitle={isDev ? "Track your code reviews submitted, comments, turnaround velocity, and acceptance rates." : "Track peer review metrics, review completion rates, and feedback velocity."}
    >
      <div className="review-analytics-container">
        {error && (
          <div className="error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <RefreshCwIcon className="spin" size={32} />
            <p>Retrieving peer review data...</p>
          </div>
        ) : (
          <div className="reviews-layout-grid">
            {/* Left Side Selector (Admin/PM/TL only) */}
            {!isDev && reviewsList.length > 0 && (
              <div className="users-list-card glass-card">
                <h3>Developer Review Index</h3>
                <div className="list-container">
                  {reviewsList.map(item => (
                    <div
                      key={item._id}
                      className={`user-list-item ${activeMetrics?._id === item._id ? 'active' : ''}`}
                      onClick={() => setSelectedUser(item)}
                    >
                      <div className="avatar" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                        {getInitials(item.user?.name || item.githubUsername)}
                      </div>
                      <div className="info">
                        <span className="name">{item.user?.name || item.githubUsername}</span>
                        <span className="count">{item.reviewsGiven} reviews given</span>
                      </div>
                      <ChevronRightIcon size={14} className="chevron" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Right Side Metrics details */}
            {activeMetrics ? (
              <div className="review-details-panel">
                {/* Hero Header */}
                <div className="review-hero-card glass-card">
                  <div className="hero-main">
                    <div className="avatar-large" style={{ background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                      {getInitials(activeMetrics.user?.name || activeMetrics.githubUsername)}
                    </div>
                    <div className="identity">
                      <h2>{activeMetrics.user?.name || activeMetrics.githubUsername}</h2>
                      <p className="github-handle">GitHub: @{activeMetrics.githubUsername}</p>
                    </div>
                  </div>
                  <div className="acceptance-badge">
                    <CheckCircle size={18} className="icon" />
                    <div className="info">
                      <span className="value">{activeMetrics.acceptanceRate}%</span>
                      <span className="label">Acceptance Rate</span>
                    </div>
                  </div>
                </div>

                {/* KPIs */}
                <div className="kpis-row">
                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Reviews Given</span>
                      <div className="card-icon green"><MessageSquare size={16} /></div>
                    </div>
                    <div className="card-value">{activeMetrics.reviewsGiven}</div>
                    <span className="card-trend text-green">Outgoing reviews</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Reviews Received</span>
                      <div className="card-icon blue"><BarChart2 size={16} /></div>
                    </div>
                    <div className="card-value">{activeMetrics.reviewsReceived}</div>
                    <span className="card-trend text-blue">Incoming reviews</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Avg Turnaround</span>
                      <div className="card-icon purple"><TrendingUp size={16} /></div>
                    </div>
                    <div className="card-value">{activeMetrics.averageTurnaroundTime} hrs</div>
                    <span className="card-trend text-purple">PR resolution speed</span>
                  </div>
                </div>

                {/* Trend Chart */}
                <div className="trend-chart-card glass-card">
                  <div className="chart-header">
                    <h3>Review Submission Trend</h3>
                    <span className="subtext">Weekly commits peer reviewed</span>
                  </div>
                  <div className="chart-container-large">
                    <Line data={reviewTrendData} options={chartOptions} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state glass-card" style={{ gridColumn: 'span 2' }}>
                <p>No peer review metrics discoverable. Complete repository syncing to extract developer code reviews.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

// SVG Icons
const ChevronRightIcon = ({ size, className }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
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

export default ReviewAnalytics;
