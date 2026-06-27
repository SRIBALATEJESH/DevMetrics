import React, { useState, useEffect } from 'react';
import './ProjectBurndown.css';
import API_BASE_URL from '../config/api';

const ProjectBurndown = ({ project, token }) => {
  const [burndownData, setBurndownData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  useEffect(() => {
    const fetchBurndown = async () => {
      if (!project || !project._id) return;
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/api/projects/${project._id}/burndown`, {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const result = await res.json();
        if (res.ok) {
          setBurndownData(result.data || []);
        } else {
          setError(result.message || 'Failed to fetch burn-down metrics.');
        }
      } catch (err) {
        setError('Network error fetching burn-down data.');
      } finally {
        setLoading(false);
      }
    };

    fetchBurndown();
  }, [project, token]);

  const milestones = project?.milestones || [];
  const completedMilestones = milestones.filter(m => m.completed).length;
  const milestoneProgress = milestones.length > 0 
    ? Math.round((completedMilestones / milestones.length) * 100) 
    : 0;

  // SVG Chart Calculations
  const width = 500;
  const height = 220;
  const paddingLeft = 40;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  let idealPath = '';
  let actualPath = '';
  const points = [];

  if (burndownData.length > 0) {
    const maxVal = Math.max(...burndownData.map(d => Math.max(d.ideal, d.actual)), 1);

    const getX = (index) => {
      if (burndownData.length <= 1) return paddingLeft + chartWidth / 2;
      return paddingLeft + (index / (burndownData.length - 1)) * chartWidth;
    };

    const getY = (value) => {
      return paddingTop + chartHeight - (value / maxVal) * chartHeight;
    };

    // Draw Ideal Line (Dashed)
    idealPath = `M ${getX(0)} ${getY(burndownData[0].ideal)} L ${getX(burndownData.length - 1)} ${getY(burndownData[burndownData.length - 1].ideal)}`;

    // Draw Actual Line (Glowing Solid)
    actualPath = burndownData.map((d, index) => {
      const x = getX(index);
      const y = getY(d.actual);
      
      points.push({
        x,
        y,
        date: d.date,
        actual: d.actual,
        ideal: d.ideal,
        idx: index
      });

      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  }

  return (
    <div className="burndown-container">
      {/* Milestones Panel */}
      <div className="milestones-panel card">
        <div className="panel-header-row">
          <h3 className="panel-title">Active Milestones & Phases</h3>
          <span className="progress-percentage">{milestoneProgress}% Done</span>
        </div>

        <div className="milestone-progress-bar">
          <div className="progress-fill" style={{ width: `${milestoneProgress}%` }}></div>
        </div>

        {milestones.length === 0 ? (
          <div className="empty-milestones">No milestones defined for this project.</div>
        ) : (
          <div className="milestones-checklist">
            {milestones.map((m, idx) => (
              <div key={idx} className={`milestone-item ${m.completed ? 'completed' : ''}`}>
                <div className={`milestone-checkbox ${m.completed ? 'checked' : ''}`}>
                  {m.completed && '✓'}
                </div>
                <div className="milestone-content">
                  <div className="milestone-title-text">{m.title}</div>
                  <div className="milestone-meta">
                    <span className={`milestone-tag ${m.type || 'feature'}`}>{m.type || 'feature'}</span>
                    {m.dueDate && (
                      <span className="milestone-due">
                        Due: {new Date(m.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Burn-down Chart Panel */}
      <div className="burndown-chart-panel card">
        <h3 className="panel-title">Sprint Burn-down Progress</h3>
        <p className="panel-subtitle">Remaining tasks versus ideal linear completion projection.</p>

        {loading ? (
          <div className="chart-loading">
            <div className="loading-spinner"></div>
            <span>Calculating sprint trajectories...</span>
          </div>
        ) : error ? (
          <div className="chart-error">⚠️ {error}</div>
        ) : burndownData.length === 0 ? (
          <div className="chart-empty">Seeding activities to compile graph. Please assign and complete tasks.</div>
        ) : (
          <div className="chart-wrapper">
            <svg viewBox={`0 0 ${width} ${height}`} width="100%" className="burndown-svg">
              {/* Grid Lines */}
              <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} stroke="var(--border)" strokeDasharray="2 4" opacity="0.4" />
              <line x1={paddingLeft} y1={paddingTop + chartHeight / 2} x2={width - paddingRight} y2={paddingTop + chartHeight / 2} stroke="var(--border)" strokeDasharray="2 4" opacity="0.4" />
              <line x1={paddingLeft} y1={paddingTop + chartHeight} x2={width - paddingRight} y2={paddingTop + chartHeight} stroke="var(--border)" opacity="0.6" />

              {/* Ideal Line */}
              <path d={idealPath} fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="4 6" opacity="0.7" />

              {/* Actual Line */}
              <path d={actualPath} fill="none" stroke="var(--accent-purple)" strokeWidth="3" className="glowing-line" />

              {/* Intersections and hover interactive dots */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoveredPoint?.idx === p.idx ? 6 : 4}
                  fill={hoveredPoint?.idx === p.idx ? 'var(--accent-purple)' : 'var(--bg-elevated)'}
                  stroke="var(--accent-purple)"
                  strokeWidth="2"
                  onMouseEnter={() => setHoveredPoint(p)}
                  onMouseLeave={() => setHoveredPoint(null)}
                  style={{ cursor: 'pointer', transition: 'all 0.15s' }}
                />
              ))}

              {/* X Axis Labels (first and last dates) */}
              <text x={paddingLeft} y={height - 15} fill="var(--text-muted)" fontSize="10" textAnchor="start">
                {burndownData[0]?.date}
              </text>
              <text x={width - paddingRight} y={height - 15} fill="var(--text-muted)" fontSize="10" textAnchor="end">
                {burndownData[burndownData.length - 1]?.date}
              </text>

              {/* Y Axis Labels (max value) */}
              <text x={paddingLeft - 8} y={paddingTop + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">
                {Math.max(...burndownData.map(d => Math.max(d.ideal, d.actual)), 1)}
              </text>
              <text x={paddingLeft - 8} y={paddingTop + chartHeight + 4} fill="var(--text-muted)" fontSize="10" textAnchor="end">
                0
              </text>
            </svg>

            {/* Live Chart Tooltip */}
            <div className="chart-tooltip-area">
              {hoveredPoint ? (
                <div className="chart-tooltip active">
                  <div className="tooltip-date">{hoveredPoint.date}</div>
                  <div className="tooltip-values">
                    <span className="tooltip-actual">Remaining Tasks: <strong>{hoveredPoint.actual}</strong></span>
                    <span className="tooltip-ideal">Ideal Progress: <strong>{hoveredPoint.ideal}</strong></span>
                  </div>
                </div>
              ) : (
                <div className="chart-tooltip placeholder">
                  Hover over the actual progress points to view task metrics for each date.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectBurndown;
