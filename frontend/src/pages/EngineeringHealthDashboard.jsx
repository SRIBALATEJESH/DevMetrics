import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Heart, TrendingUp, CheckSquare, Users } from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './EngineeringHealthDashboard.css';

const EngineeringHealthDashboard = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchHealth = async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        const res = await fetch('http://localhost:5000/api/analytics/engineering-health', {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          const list = data.data || [];
          setHealthData(list);
          if (list.length > 0) {
            setSelectedProject((prev) => {
              if (!prev) return list[0];
              const matched = list.find((p) => (p.project?._id || p.project) === (prev.project?._id || prev.project));
              return matched || list[0];
            });
          }
        } else {
          setError(data.message || 'Failed to fetch engineering health analytics');
        }
      } catch (err) {
        console.error(err);
        setError('Network error loading engineering health data.');
      } finally {
        if (showLoading) setLoading(false);
      }
    };

    fetchHealth(true);

    const handleRefresh = () => {
      console.log('[EngineeringHealth] Auto-refreshing health metrics...');
      fetchHealth(false);
    };

    window.addEventListener('analytics_updated', handleRefresh);
    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
    };
  }, [token]);

  const activeProj = selectedProject || healthData[0];

  // Helper to format score class names
  const getScoreColorClass = (score) => {
    if (score >= 85) return 'text-green';
    if (score >= 70) return 'text-blue';
    if (score >= 50) return 'text-yellow';
    return 'text-red';
  };

  // Mock trends for charts if selection exists
  const lineChartData = {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [
      {
        label: 'Engineering Health Score',
        data: activeProj ? [activeProj.healthScore - 6, activeProj.healthScore - 4, activeProj.healthScore - 2, activeProj.healthScore - 1, activeProj.healthScore + 1, activeProj.healthScore] : [75, 78, 80, 82, 85, 84],
        fill: true,
        backgroundColor: 'rgba(16, 185, 129, 0.06)',
        borderColor: 'var(--accent-green, #10b981)',
        borderWidth: 2,
        tension: 0.4,
        pointBackgroundColor: 'var(--accent-green, #10b981)'
      }
    ]
  };

  const barChartData = {
    labels: ['Productivity', 'Code Activity', 'Review Activity', 'Issue Resolution', 'Team Participation'],
    datasets: [
      {
        label: 'Breakdown Value',
        data: activeProj ? [
          activeProj.productivity,
          activeProj.codeActivity,
          activeProj.reviewActivity,
          activeProj.issueResolution,
          activeProj.participation
        ] : [80, 85, 70, 75, 90],
        backgroundColor: [
          'rgba(79, 142, 247, 0.75)',
          'rgba(168, 85, 247, 0.75)',
          'rgba(16, 185, 129, 0.75)',
          'rgba(236, 72, 153, 0.75)',
          'rgba(245, 158, 11, 0.75)'
        ],
        borderWidth: 0,
        borderRadius: 6
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
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
      pageTitle="Engineering Health Dashboard"
      pageEyebrow="analytics / health"
      pageSubtitle="Monitor comprehensive team effectiveness, software delivery health, and quality indicators."
    >
      <div className="engineering-health-container">
        {error && (
          <div className="error-banner">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <RefreshCwIcon className="spin" size={32} />
            <p>Evaluating engineering health metrics...</p>
          </div>
        ) : (
          <>
            {/* Top Selector Panel */}
            <div className="project-selector-panel glass-card">
              <span className="label">Select Project Analysis:</span>
              <div className="select-buttons">
                {healthData.map(h => (
                  <button
                    key={h._id}
                    className={`selector-btn ${activeProj?._id === h._id ? 'active' : ''}`}
                    onClick={() => setSelectedProject(h)}
                  >
                    {h.projectName}
                  </button>
                ))}
              </div>
            </div>

            {activeProj ? (
              <>
                {/* KPIs Row */}
                <div className="kpis-row">
                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Overall Health</span>
                      <div className="card-icon green"><Heart size={16} /></div>
                    </div>
                    <div className={`card-value ${getScoreColorClass(activeProj.healthScore)}`}>
                      {activeProj.healthScore}%
                    </div>
                    <span className="card-trend text-green">Stable Trend</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Team Productivity</span>
                      <div className="card-icon blue"><CheckSquare size={16} /></div>
                    </div>
                    <div className="card-value">{activeProj.productivity}%</div>
                    <span className="card-trend text-blue">Task adherence high</span>
                  </div>

                  <div className="kpi-card glass-card">
                    <div className="card-top">
                      <span className="card-title">Participation Rate</span>
                      <div className="card-icon purple"><Users size={16} /></div>
                    </div>
                    <div className="card-value">{activeProj.participation}%</div>
                    <span className="card-trend text-purple">High engagement</span>
                  </div>
                </div>

                {/* Charts Grid */}
                <div className="charts-grid-row">
                  <div className="chart-card glass-card">
                    <div className="chart-header">
                      <h3>Engineering Health Trend</h3>
                      <span className="subtext">Weekly scoring updates</span>
                    </div>
                    <div className="chart-container">
                      <Line data={lineChartData} options={chartOptions} />
                    </div>
                  </div>

                  <div className="chart-card glass-card">
                    <div className="chart-header">
                      <h3>Health Category Breakdown</h3>
                      <span className="subtext">Metrics comparison out of 100</span>
                    </div>
                    <div className="chart-container">
                      <Bar data={barChartData} options={chartOptions} />
                    </div>
                  </div>
                </div>

                {/* Health Breakdowns Details Table */}
                <div className="health-details-card glass-card">
                  <h3>Metrics Summary Analysis</h3>
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="label">Delivery Productivity (25% weight)</span>
                      <strong className="value">{activeProj.productivity}/100</strong>
                      <div className="progress-bar">
                        <div className="fill blue" style={{ width: `${activeProj.productivity}%` }}></div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="label">Code Base Activity (25% weight)</span>
                      <strong className="value">{activeProj.codeActivity}/100</strong>
                      <div className="progress-bar">
                        <div className="fill purple" style={{ width: `${activeProj.codeActivity}%` }}></div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="label">Peer Review Activity (20% weight)</span>
                      <strong className="value">{activeProj.reviewActivity}/100</strong>
                      <div className="progress-bar">
                        <div className="fill green" style={{ width: `${activeProj.reviewActivity}%` }}></div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="label">Issue Backlog Resolution (15% weight)</span>
                      <strong className="value">{activeProj.issueResolution}/100</strong>
                      <div className="progress-bar">
                        <div className="fill pink" style={{ width: `${activeProj.issueResolution}%` }}></div>
                      </div>
                    </div>

                    <div className="detail-item">
                      <span className="label">Team Collaboration Level (15% weight)</span>
                      <strong className="value">{activeProj.participation}/100</strong>
                      <div className="progress-bar">
                        <div className="fill yellow" style={{ width: `${activeProj.participation}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state glass-card">
                <p>No project health data discovered. Sync your linked repositories first to populate the analytics collections.</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

// Simple spin icon
const RefreshCwIcon = ({ className, size }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--accent-green)' }}>
    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <path d="M3 3v5h5" />
    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
    <path d="M16 16h5v5" />
  </svg>
);

export default EngineeringHealthDashboard;
