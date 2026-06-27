import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  RefreshCw,
  Users,
  GitBranch,
  Share2,
  PieChart,
  Layers
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './BusFactorAnalytics.css';
import API_BASE_URL from '../config/api';

const BusFactorAnalytics = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reposList, setReposList] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [busData, setBusData] = useState(null);

  // 1. Fetch repositories list
  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok && data.data) {
          // Link only repos that are configured/linked
          const linkedRepos = data.data.filter(r => r.status === 'linked');
          setReposList(linkedRepos.length > 0 ? linkedRepos : data.data);
          if (data.data.length > 0) {
            setSelectedRepoId(linkedRepos.length > 0 ? linkedRepos[0]._id : data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching repositories:', err);
      }
    };
    fetchRepos();
  }, [token]);

  // 2. Fetch Bus Factor Analytics
  useEffect(() => {
    const fetchBusAnalytics = async () => {
      try {
        setLoading(true);
        setError('');

        let url = `${API_BASE_URL}/api/analytics/bus-factor`;
        if (selectedRepoId) {
          url += `?repositoryId=${selectedRepoId}`;
        }

        const res = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();

        if (res.ok && data.data) {
          setBusData(data.data);
        } else {
          setError(data.message || 'Failed to fetch Bus Factor analytics.');
        }
      } catch (err) {
        console.error('Network error loading Bus Factor metrics:', err);
        setError('Network error fetching Bus Factor analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchBusAnalytics();
  }, [selectedRepoId, token]);

  const handleRepoChange = (e) => {
    setSelectedRepoId(e.target.value);
  };

  const getBfScoreClass = (score) => {
    if (score === 1) return 'critical';
    if (score === 2) return 'high';
    return 'healthy';
  };

  const getBfScoreName = (score) => {
    if (score === 1) return 'Critical Risk';
    if (score === 2) return 'High Risk';
    if (score === 3) return 'Moderate';
    return 'Healthy';
  };

  const getPercentageColorClass = (percent) => {
    if (percent >= 75) return 'red';
    if (percent >= 40) return 'yellow';
    return 'blue';
  };

  // Doughnut chart options & data
  const doughnutData = busData ? {
    labels: busData.ownershipBreakdown.map(o => o.name),
    datasets: [
      {
        data: busData.ownershipBreakdown.map(o => o.value),
        backgroundColor: [
          'rgba(248, 113, 113, 0.8)',  // red
          'rgba(79, 142, 247, 0.8)',   // blue
          'rgba(168, 85, 247, 0.8)',   // purple
          'rgba(16, 185, 129, 0.8)',   // green
          'rgba(251, 191, 36, 0.8)'    // yellow
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }
    ]
  } : null;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#8f9cae',
          font: { size: 11, weight: '600' },
          boxWidth: 12
        }
      }
    },
    cutout: '70%'
  };

  // Calculate Node Positions on graph canvas statically/dynamically
  const getNodeStyles = (node, idx, total) => {
    if (idx === 0) {
      // primary center node
      return {
        top: 'calc(50% - 32px)',
        left: 'calc(50% - 32px)'
      };
    }
    // secondary satellite nodes arranged in circle
    const angle = (idx - 1) * (2 * Math.PI / (total - 1 || 1));
    const radius = 90; // distance from center
    const x = Math.round(radius * Math.cos(angle));
    const y = Math.round(radius * Math.sin(angle));

    return {
      top: `calc(50% - 24px + ${y}px)`,
      left: `calc(50% - 24px + ${x}px)`
    };
  };

  return (
    <Layout
      pageTitle="Bus Factor Analytics"
      pageEyebrow="bus-factor"
      pageSubtitle="Measure structural developer dependencies and single-source key contributors to prevent codebase silos."
    >
      <div className="bus-factor-container">

        {/* Repo Selector */}
        <div className="repo-selector-panel">
          <div className="label">SELECT TARGET REPOSITORY</div>
          <select value={selectedRepoId} onChange={handleRepoChange}>
            {reposList.map(repo => (
              <option key={repo._id} value={repo._id}>
                {repo.fullName}
              </option>
            ))}
            {reposList.length === 0 && (
              <option value="">No Repositories Linked</option>
            )}
          </select>
        </div>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {loading && !busData ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p style={{ marginTop: '16px' }}>Analyzing Contributor Ownership Matrices...</p>
          </div>
        ) : busData ? (
          <>
            {/* Summary Row */}
            <div className="bus-summary-grid">

              {/* Bus Factor score card */}
              <div className="bf-score-card card">
                <h3>Bus Factor Score</h3>
                <div className="score-display-holder">
                  <div className={`score-circle ${getBfScoreClass(busData.busFactorScore)}`}>
                    {busData.busFactorScore}
                  </div>
                  <span className={`score-status-text ${getBfScoreClass(busData.busFactorScore)}`}>
                    {getBfScoreName(busData.busFactorScore)}
                  </span>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', textAlign: 'center', maxWidth: '300px', margin: 0 }}>
                    {busData.busFactorScore === 1
                      ? "A single developer owns more than 50% of modifications. If John leaves, critical project modules are siloed."
                      : "Knowledge is distributed across multiple key contributors, rendering moderate project backup nodes."
                    }
                  </p>
                </div>
              </div>

              {/* Ownership Card */}
              <div className="bf-ownership-card card">
                <h3>Codebase Ownership Distribution</h3>
                <div className="ownership-chart-holder">
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
              </div>

            </div>

            {/* Visual Section (Graph & Matrix) */}
            <div className="visuals-grid">

              {/* Dependency Graph */}
              <div className="dependency-graph-card card">
                <h3>Contributor Overlap Graph</h3>
                <div className="graph-canvas">
                  {/* Satellites Lines */}
                  {busData.dependencyGraph.nodes && busData.dependencyGraph.nodes.map((node, idx) => {
                    if (idx === 0) return null;
                    const angle = (idx - 1) * (2 * Math.PI / (busData.dependencyGraph.nodes.length - 1 || 1));
                    const deg = angle * (180 / Math.PI);
                    return (
                      <div
                        key={`line-${idx}`}
                        className="graph-line"
                        style={{
                          width: '90px',
                          left: '50%',
                          top: '50%',
                          transform: `rotate(${deg}deg)`
                        }}
                      />
                    );
                  })}
                  {/* Satellites Nodes */}
                  {busData.dependencyGraph.nodes && busData.dependencyGraph.nodes.map((node, idx) => (
                    <div
                      key={node.id}
                      className={`node-element ${idx === 0 ? 'primary' : ''}`}
                      style={getNodeStyles(node, idx, busData.dependencyGraph.nodes.length)}
                    >
                      {node.id.split(' ')[0]}
                      <span>{node.val}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Critical Modules list */}
              <div className="critical-modules-card card">
                <h3>Silo Watchlist (Critical Modules)</h3>
                <div className="modules-list">
                  {busData.criticalModules && busData.criticalModules.map((mod, idx) => (
                    <div className="module-item" key={idx}>
                      <span className="module-name">{mod.name}</span>
                      <div className="module-meta">
                        <span className="module-owner">{mod.topContributor} ({mod.ownershipPercent}%)</span>
                        <span className="module-risk-pill">{mod.risk}</span>
                      </div>
                    </div>
                  ))}
                  {(!busData.criticalModules || busData.criticalModules.length === 0) && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
                      No critical single-contributor modules identified for this repository.
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Contributor Dependency Matrix */}
            <div className="matrix-card card">
              <h3>Contributor Dependency Matrix</h3>
              <div className="matrix-table-wrapper">
                <table className="matrix-table">
                  <thead>
                    <tr>
                      <th>Module / Repository</th>
                      <th>Contributor</th>
                      <th>Ownership %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {busData.contributorDependencyMatrix && busData.contributorDependencyMatrix.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.moduleName}</td>
                        <td style={{ fontWeight: '600' }}>{item.contributor}</td>
                        <td>
                          <div className="matrix-bar-wrapper">
                            <span className={getPercentageColorClass(item.ownershipPercent)}>
                              {item.ownershipPercent}%
                            </span>
                            <div className="matrix-bar">
                              <div
                                className={`matrix-bar-fill ${getPercentageColorClass(item.ownershipPercent)}`}
                                style={{ width: `${item.ownershipPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        ) : null}

      </div>
    </Layout>
  );
};

export default BusFactorAnalytics;
