import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  TrendingUp,
  Activity,
  RefreshCw,
  FolderKanban,
  Users,
  CheckSquare,
  MessageSquare,
  AlertOctagon
} from 'lucide-react';
import { Line, Radar } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './ProjectRiskAnalytics.css';

const ProjectRiskAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [projectsList, setProjectsList] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [riskData, setRiskData] = useState(null);

  // 1. Fetch all projects to populate dropdown
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/projects', {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          setProjectsList(data.data);
          if (data.data.length > 0) {
            setSelectedProjectId(data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading projects list:', err);
      }
    };
    fetchProjects();
  }, [token]);

  // 2. Fetch project risk data for the selected project
  useEffect(() => {
    const fetchRiskAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        let url = 'http://localhost:5000/api/analytics/project-risk';
        if (selectedProjectId) {
          url += `?projectId=${selectedProjectId}`;
        }

        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();

        if (res.ok && data.data) {
          setRiskData(data.data);
        } else {
          setError(data.message || 'Failed to fetch project risk metrics.');
        }
      } catch (err) {
        console.error('Network error loading risk metrics:', err);
        setError('Network error fetching project risk analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchRiskAnalytics();
  }, [selectedProjectId, token]);

  const handleProjectChange = (e) => {
    setSelectedProjectId(e.target.value);
  };

  // Helper classes for colors
  const getRiskColor = (score) => {
    if (score >= 75) return 'red';
    if (score >= 50) return 'yellow';
    return 'green';
  };

  const getRiskLevelName = (score) => {
    if (score >= 75) return 'Critical';
    if (score >= 50) return 'High';
    if (score >= 30) return 'Moderate';
    return 'Low';
  };

  // Radar chart options & data
  const radarData = riskData ? {
    labels: ['Task Risk', 'Review Risk', 'Issue Risk', 'Team Risk', 'Knowledge Risk'],
    datasets: [
      {
        label: 'Risk Exposure',
        data: [
          riskData.riskBreakdown.taskRisk,
          riskData.riskBreakdown.reviewRisk,
          riskData.riskBreakdown.issueRisk,
          riskData.riskBreakdown.teamRisk,
          riskData.riskBreakdown.knowledgeRisk
        ],
        backgroundColor: 'rgba(248, 113, 113, 0.2)',
        borderColor: 'var(--accent-red, #f87171)',
        borderWidth: 2,
        pointBackgroundColor: 'var(--accent-red, #f87171)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'var(--accent-red, #f87171)'
      }
    ]
  } : null;

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      r: {
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
        pointLabels: { color: '#8f9cae', font: { size: 10, weight: '600' } },
        ticks: { display: false },
        min: 0,
        max: 100
      }
    }
  };

  // Line chart options & data
  const trendData = riskData ? {
    labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6'],
    datasets: [
      {
        label: 'Risk Score',
        data: riskData.riskTrend || [50, 52, 55, 58, 60, 62],
        fill: true,
        backgroundColor: 'rgba(79, 142, 247, 0.08)',
        borderColor: 'var(--accent-blue, #4f8ef7)',
        borderWidth: 2.5,
        tension: 0.4,
        pointBackgroundColor: 'var(--accent-blue, #4f8ef7)',
        pointBorderColor: '#fff'
      }
    ]
  } : null;

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
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

  // Render Gauge ring parameters
  const score = riskData?.projectRiskScore || 0;
  const colorClass = getRiskColor(score);
  const strokeDashoffset = 502 - (502 * score) / 100; // 502 is circumference (2 * pi * r, r=80)

  return (
    <Layout
      pageTitle="Project Risk Analytics"
      pageEyebrow=" analytics / risk"
      pageSubtitle="Predict and prevent failure nodes in your engineering cycle with high-fidelity telemetry risks."
    >
      <div className="project-risk-container">

        {/* Project Selector */}
        <div className="project-selector-panel">
          <div className="label">SELECT TARGET PROJECT</div>
          <select value={selectedProjectId} onChange={handleProjectChange}>
            {projectsList.map(proj => (
              <option key={proj._id} value={proj._id}>
                {proj.title}
              </option>
            ))}
            {projectsList.length === 0 && (
              <option value="">No Projects Linked</option>
            )}
          </select>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && !riskData ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p style={{ marginTop: '16px' }}>Running Risk Aggregation Algorithms...</p>
          </div>
        ) : riskData ? (
          <>
            {/* Risk Summary Grid */}
            <div className="risk-summary-grid">

              {/* Radial Score Gauge */}
              <div className="risk-gauge-card card">
                <h3>Overall Risk Score</h3>
                <div className="gauge-wrapper">
                  <svg className="gauge-svg" viewBox="0 0 200 200">
                    <circle className="gauge-bg" cx="100" cy="100" r="80" />
                    <circle
                      className={`gauge-fill ${colorClass}`}
                      cx="100"
                      cy="100"
                      r="80"
                      strokeDasharray="502"
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>
                  <div className="gauge-center-text">
                    <span className="gauge-value">{score}</span>
                    <span className={`gauge-label ${colorClass}`}>
                      {getRiskLevelName(score)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="risk-trend-card card">
                <h3>6-Week Risk Trend</h3>
                <div className="chart-holder">
                  <Line data={trendData} options={trendOptions} />
                </div>
              </div>

              {/* Radar Breakdown */}
              <div className="risk-breakdown-card card">
                <h3>Risk Factor Breakdown</h3>
                <div className="chart-holder">
                  <Radar data={radarData} options={radarOptions} />
                </div>
              </div>

            </div>

            {/* Critical Modules and Other Projects */}
            <div className="modules-grid">

              {/* Critical Modules */}
              <div className="critical-modules-card card">
                <h3>Critical Modules Risk Level</h3>
                <div className="modules-list">
                  {riskData.criticalModules && riskData.criticalModules.map((module, idx) => (
                    <div className="module-item" key={idx}>
                      <div className="module-header">
                        <span className="module-name">{module.name}</span>
                        <span className={`module-badge ${module.riskLevel.toLowerCase()}`}>
                          {module.riskLevel}
                        </span>
                      </div>
                      <div className="module-body-grid">
                        <div className="stat-box">
                          <span className="label">Open Issues</span>
                          <span className="value">{module.issuesCount}</span>
                        </div>
                        <div className="stat-box">
                          <span className="label">Reviews</span>
                          <span className="value">{module.reviewsCount}</span>
                        </div>
                        <div className="stat-box">
                          <span className="label">Contributors</span>
                          <span className="value">{module.contributorsCount}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!riskData.criticalModules || riskData.criticalModules.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No modules identified for this project.
                    </div>
                  )}
                </div>
              </div>

              {/* Other High Risk Projects */}
              <div className="high-risk-projects-card card">
                <h3>High Risk Watchlist (Other Projects)</h3>
                <div className="projects-list">
                  {riskData.highRiskProjects && riskData.highRiskProjects.map((proj, idx) => (
                    <div className="project-item" key={idx}>
                      <span className="project-title">{proj.title}</span>
                      <div className="project-risk-score-pill">
                        <span className={`score ${getRiskColor(proj.riskScore)}`}>
                          {proj.riskScore}%
                        </span>
                        <span className="level-text">Risk Score</span>
                      </div>
                    </div>
                  ))}
                  {(!riskData.highRiskProjects || riskData.highRiskProjects.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                      No other projects currently meet the high risk profile threshold.
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        ) : null}

      </div>
    </Layout>
  );
};

export default ProjectRiskAnalytics;
