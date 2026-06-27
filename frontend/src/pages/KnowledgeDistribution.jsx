import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  AlertTriangle, 
  RefreshCw, 
  Layers, 
  Grid, 
  PieChart as PieIcon, 
  ShieldCheck, 
  Info,
  Users
} from 'lucide-react';
import { Doughnut } from 'react-chartjs-2';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './KnowledgeDistribution.css';
import API_BASE_URL from '../config/api';

const KnowledgeDistribution = () => {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reposList, setReposList] = useState([]);
  const [selectedRepoId, setSelectedRepoId] = useState('');
  const [kdData, setKdData] = useState(null);

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
          const linkedRepos = data.data.filter(r => r.status === 'linked');
          setReposList(linkedRepos.length > 0 ? linkedRepos : data.data);
          if (data.data.length > 0) {
            setSelectedRepoId(linkedRepos.length > 0 ? linkedRepos[0]._id : data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Error loading repositories:', err);
      }
    };
    fetchRepos();
  }, [token]);

  // 2. Fetch Knowledge Distribution Analytics
  useEffect(() => {
    const fetchKdAnalytics = async () => {
      try {
        setLoading(true);
        setError('');
        
        let url = `${API_BASE_URL}/api/analytics/knowledge-distribution`;
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
          setKdData(data.data);
        } else {
          setError(data.message || 'Failed to fetch Knowledge Distribution analytics.');
        }
      } catch (err) {
        console.error('Network error loading Knowledge Distribution metrics:', err);
        setError('Network error fetching Knowledge Distribution analytics.');
      } finally {
        setLoading(false);
      }
    };

    fetchKdAnalytics();
  }, [selectedRepoId, token]);

  const handleRepoChange = (e) => {
    setSelectedRepoId(e.target.value);
  };

  const getRiskClass = (score) => {
    return score >= 75 ? 'risky' : 'healthy';
  };

  const getRiskText = (score) => {
    return score >= 75 ? 'Silo Risk: High' : 'Knowledge Status: Healthy';
  };

  // Helper for heatmap cell classes based on share percentage
  const getShadeClass = (val) => {
    if (val === 0) return 'shade-0';
    if (val <= 30) return 'shade-1';
    if (val <= 60) return 'shade-2';
    if (val <= 80) return 'shade-3';
    return 'shade-4';
  };

  const getRoleClass = (role) => {
    if (role.includes('Primary')) return 'primary';
    if (role.includes('Backup')) return 'backup';
    return 'secondary';
  };

  // Doughnut chart options & data
  const pieData = kdData ? {
    labels: kdData.knowledgeDistribution.map(d => d.name),
    datasets: [
      {
        data: kdData.knowledgeDistribution.map(d => d.value),
        backgroundColor: [
          'rgba(155, 109, 255, 0.8)',  // purple
          'rgba(79, 142, 247, 0.8)',   // blue
          'rgba(244, 114, 182, 0.8)',  // pink
          'rgba(16, 185, 129, 0.8)',   // green
          'rgba(251, 191, 36, 0.8)'    // yellow
        ],
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.05)'
      }
    ]
  } : null;

  const pieOptions = {
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
    cutout: '65%'
  };

  // Find unique list of contributors from heatmap data to draw columns
  const getContributorsList = () => {
    if (!kdData || !kdData.knowledgeHeatmap) return [];
    const list = new Set();
    kdData.knowledgeHeatmap.forEach(h => list.add(h.contributor));
    return Array.from(list);
  };

  // Group heatmap rows by module
  const getModulesList = () => {
    if (!kdData || !kdData.knowledgeHeatmap) return [];
    const list = new Set();
    kdData.knowledgeHeatmap.forEach(h => list.add(h.moduleName));
    return Array.from(list);
  };

  const contributorsList = getContributorsList();
  const modulesList = getModulesList();

  const getHeatmapCellValue = (mod, contrib) => {
    if (!kdData || !kdData.knowledgeHeatmap) return 0;
    const match = kdData.knowledgeHeatmap.find(h => h.moduleName === mod && h.contributor === contrib);
    return match ? match.value : 0;
  };

  return (
    <Layout
      pageTitle="Knowledge Distribution Dashboard"
      pageEyebrow="// analytics / knowledge"
      pageSubtitle="Monitor training nodes and distribution structures. Map modular redundancy across contributors."
    >
      <div className="knowledge-container">
        
        {/* Team View restricted notice */}
        {kdData && kdData.isTeamView && (
          <div className="team-view-banner">
            <Info size={16} />
            <span>Developer View Mode (Enforced Team View): Restricting scope to assigned project team members.</span>
          </div>
        )}

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

        {loading && !kdData ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p style={{ marginTop: '16px' }}>Generating Module Contributor Mappings...</p>
          </div>
        ) : kdData ? (
          <>
            {/* Top Row: Gauge & Pie */}
            <div className="knowledge-summary-grid">
              
              {/* Risk Gauge */}
              <div className="kd-risk-card card">
                <h3>Knowledge Concentration Risk</h3>
                <div className="risk-display">
                  <div className={`risk-ring ${getRiskClass(kdData.knowledgeRiskScore)}`}>
                    {kdData.knowledgeRiskScore}%
                  </div>
                  <span className="risk-desc" style={{ fontWeight: '600' }}>
                    {getRiskText(kdData.knowledgeRiskScore)}
                  </span>
                  <p className="risk-desc">
                    {kdData.knowledgeRiskScore >= 75
                      ? 'High Concentration detected in core modules. Knowledge sharing sessions recommended.'
                      : 'Knowledge is distributed across developers. Low redundancy risk profile.'}
                  </p>
                </div>
              </div>

              {/* Pie Distribution chart */}
              <div className="kd-pie-card card">
                <h3>Frontend Module Knowledge Distribution</h3>
                <div className="pie-holder">
                  <Doughnut data={pieData} options={pieOptions} />
                </div>
              </div>

            </div>

            {/* Knowledge Heatmap Card */}
            <div className="heatmap-card card">
              <h3>Module Knowledge Heatmap</h3>
              <div className="heatmap-grid" style={{ gridTemplateRows: `repeat(${modulesList.length + 1}, auto)` }}>
                {/* Headers */}
                <div className="heatmap-row">
                  <div className="heatmap-header-cell module-label">Architectural Module</div>
                  {contributorsList.map(c => (
                    <div className="heatmap-header-cell" key={c}>{c.split(' ')[0]}</div>
                  ))}
                </div>
                {/* Rows */}
                {modulesList.map(mod => (
                  <div className="heatmap-row" key={mod}>
                    <div className="heatmap-cell-module">{mod}</div>
                    {contributorsList.map(contrib => {
                      const val = getHeatmapCellValue(mod, contrib);
                      return (
                        <div 
                          className={`heatmap-cell-val ${getShadeClass(val)}`}
                          key={contrib}
                          title={`${contrib} owns ${val}% of ${mod}`}
                        >
                          {val}%
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Heatmap Legend */}
              <div className="heatmap-legend">
                <div className="legend-item">
                  <div className="legend-color shade-0" />
                  <span>No Knowledge (0%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color shade-1" />
                  <span>Minor contribution (1-30%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color shade-2" />
                  <span>Standard contribution (31-60%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color shade-3" />
                  <span>High ownership (61-80%)</span>
                </div>
                <div className="legend-item">
                  <div className="legend-color shade-4" />
                  <span>Silo concentration (&gt;80%)</span>
                </div>
              </div>
            </div>

            {/* Split layout: Modules Status & Ownership Matrix */}
            <div className="split-grid">
              
              {/* Module Status List */}
              <div className="modules-card card">
                <h3>Module Knowledge Status</h3>
                <div className="modules-list">
                  {kdData.moduleKnowledgeGraph && kdData.moduleKnowledgeGraph.map((module, idx) => (
                    <div className="module-card-item" key={idx}>
                      <div className="module-card-header">
                        <span className="module-card-title">{module.moduleName}</span>
                        <span className={`module-card-status ${module.status.toLowerCase()}`}>
                          {module.status}
                        </span>
                      </div>
                      <div className="contributors-tag-list">
                        {module.contributors && module.contributors.map((cTag, cIdx) => (
                          <span className="contrib-tag" key={cIdx}>{cTag}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ownership Matrix */}
              <div className="matrix-card card">
                <h3>Ownership Role Matrix</h3>
                <div className="matrix-table-wrapper">
                  <table className="matrix-table">
                    <thead>
                      <tr>
                        <th>Module</th>
                        <th>Contributor</th>
                        <th>Ownership Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kdData.ownershipMatrix && kdData.ownershipMatrix.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.moduleName}</td>
                          <td style={{ fontWeight: '600' }}>{item.contributor}</td>
                          <td>
                            <span className={`matrix-role-pill ${getRoleClass(item.role)}`}>
                              {item.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </>
        ) : null}

      </div>
    </Layout>
  );
};

export default KnowledgeDistribution;
