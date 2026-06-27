import React, { useState, useEffect } from 'react';
import './CollaborationGraph.css';

const CollaborationGraph = ({ token }) => {
  const [data, setData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredNode, setHoveredNode] = useState(null);
  const [hoveredEdge, setHoveredEdge] = useState(null);

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:5000/api/analytics/collaboration-graph', {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const result = await res.json();
        if (res.ok) {
          setData(result.data || { nodes: [], edges: [] });
        } else {
          setError(result.message || 'Failed to fetch collaboration network.');
        }
      } catch (err) {
        setError('Network error fetching collaboration graph.');
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();
  }, [token]);

  if (loading) {
    return (
      <div className="graph-loading">
        <div className="loading-spinner"></div>
        <span>Calculating contribution connections...</span>
      </div>
    );
  }

  if (error) {
    return <div className="graph-error">⚠️ {error}</div>;
  }

  const { nodes, edges } = data;
  if (nodes.length === 0) {
    return <div className="graph-empty">No collaboration logs found in this workspace.</div>;
  }

  // Dimensions
  const width = 600;
  const height = 450;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 160;

  // Map nodes to coordinates on a circle
  const nodePositions = {};
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI - Math.PI / 2; // start from top
    nodePositions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
      angle
    };
  });

  // Check if an edge is connected to hoveredNode
  const isEdgeHighlighted = (edge) => {
    if (!hoveredNode) return false;
    return edge.source === hoveredNode || edge.target === hoveredNode;
  };

  return (
    <div className="collaboration-graph-container card">
      <div className="graph-header-info">
        <h3 className="graph-title">Team Collaboration Network</h3>
        <p className="graph-subtitle">
          Visualizing reviewer interactions. Hover over a team member to filter their reviews.
        </p>
      </div>

      <div className="graph-layout-body">
        <div className="graph-svg-wrapper">
          <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="graph-svg">
            <defs>
              <radialGradient id="graphCenterGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.15" />
                <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="edgeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.3" />
                <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="edgeGradientActive" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.8" />
                <stop offset="100%" stopColor="var(--accent-purple)" stopOpacity="0.8" />
              </linearGradient>
            </defs>

            {/* Background Glow */}
            <circle cx={centerX} cy={centerY} r={radius * 1.2} fill="url(#graphCenterGlow)" />
            <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="var(--border)" strokeWidth="1" strokeDasharray="4 8" opacity="0.3" />

            {/* Draw Edges */}
            {edges.map((edge, idx) => {
              const p1 = nodePositions[edge.source];
              const p2 = nodePositions[edge.target];
              if (!p1 || !p2) return null;

              const isHighlighted = isEdgeHighlighted(edge);
              const isActive = hoveredNode ? isHighlighted : true;
              const isHovered = hoveredEdge === edge;

              // Quadratic bezier curve bending towards center
              const pathString = `M ${p1.x} ${p1.y} Q ${centerX} ${centerY} ${p2.x} ${p2.y}`;

              return (
                <path
                  key={idx}
                  d={pathString}
                  fill="none"
                  stroke={isHighlighted || isHovered ? 'url(#edgeGradientActive)' : 'url(#edgeGradient)'}
                  strokeWidth={isHovered ? 4 : isHighlighted ? 3 : Math.min(1 + edge.weight, 5)}
                  className={`graph-edge ${isActive ? 'active' : 'dimmed'} ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredEdge(edge)}
                  onMouseLeave={() => setHoveredEdge(null)}
                />
              );
            })}

            {/* Draw Nodes */}
            {nodes.map((node) => {
              const pos = nodePositions[node.id];
              if (!pos) return null;

              const isHighlighted = hoveredNode === node.id;
              const isDimmed = hoveredNode && hoveredNode !== node.id && !edges.some(e => 
                (e.source === node.id && e.target === hoveredNode) || 
                (e.target === node.id && e.source === hoveredNode)
              );

              // Position label outside the circle
              const labelDistance = 30;
              const labelX = pos.x + labelDistance * Math.cos(pos.angle);
              const labelY = pos.y + labelDistance * Math.sin(pos.angle);
              const textAnchor = Math.cos(pos.angle) > 0.1 ? 'start' : Math.cos(pos.angle) < -0.1 ? 'end' : 'middle';

              return (
                <g
                  key={node.id}
                  className={`graph-node-group ${isDimmed ? 'dimmed' : ''} ${isHighlighted ? 'highlighted' : ''}`}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Outer Pulsing Glow on Hover */}
                  {isHighlighted && (
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r="22"
                      fill="none"
                      stroke="var(--accent-blue)"
                      strokeWidth="2"
                      className="node-pulse"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={isHighlighted ? 16 : 14}
                    fill="var(--bg-elevated)"
                    stroke={isHighlighted ? 'var(--accent-blue)' : 'var(--border)'}
                    strokeWidth="2"
                    className="graph-node"
                  />

                  {/* Initials Inside Node */}
                  <text
                    x={pos.x}
                    y={pos.y + 4}
                    textAnchor="middle"
                    fill="var(--text-primary)"
                    fontSize="10"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {node.name ? node.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'U'}
                  </text>

                  {/* Label outside circle */}
                  <text
                    x={labelX}
                    y={labelY + 4}
                    textAnchor={textAnchor}
                    fill={isHighlighted ? 'var(--accent-blue)' : 'var(--text-secondary)'}
                    fontSize="11"
                    fontWeight={isHighlighted ? 'bold' : 'normal'}
                    className="graph-node-label"
                  >
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {/* Info panel */}
        <div className="graph-tooltip-panel">
          {hoveredNode ? (
            (() => {
              const node = nodes.find(n => n.id === hoveredNode);
              const nodeEdges = edges.filter(e => e.source === hoveredNode || e.target === hoveredNode);
              const reviewCount = nodeEdges.reduce((sum, e) => sum + e.weight, 0);

              return (
                <div className="network-tooltip unlocked">
                  <div className="tooltip-avatar-row">
                    <div className="tooltip-avatar-initials">
                      {node.name ? node.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                    </div>
                    <div>
                      <div className="tooltip-name">{node.name}</div>
                      <div className="tooltip-role">{node.role}</div>
                    </div>
                  </div>
                  <div className="tooltip-stats">
                    <div className="tooltip-stat-item">
                      <span className="tooltip-stat-val">{nodeEdges.length}</span>
                      <span className="tooltip-stat-lbl">Connected Collaborators</span>
                    </div>
                    <div className="tooltip-stat-item">
                      <span className="tooltip-stat-val">{reviewCount}</span>
                      <span className="tooltip-stat-lbl">Total PR Reviews</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : hoveredEdge ? (
            (() => {
              const sourceNode = nodes.find(n => n.id === hoveredEdge.source);
              const targetNode = nodes.find(n => n.id === hoveredEdge.target);
              return (
                <div className="network-tooltip unlocked">
                  <div className="tooltip-connection-title">Review Connection</div>
                  <p className="tooltip-connection-desc">
                    <strong>{sourceNode?.name}</strong> and <strong>{targetNode?.name}</strong> collaborate on code reviews.
                  </p>
                  <div className="tooltip-stats">
                    <div className="tooltip-stat-item">
                      <span className="tooltip-stat-val">{hoveredEdge.weight}</span>
                      <span className="tooltip-stat-lbl">Code Reviews Completed</span>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div className="network-tooltip empty">
              <div className="tooltip-placeholder-icon">👥</div>
              <div className="tooltip-placeholder-title">Interactive Connection Panel</div>
              <p className="tooltip-placeholder-desc">
                Hover over developer nodes or connections to inspect code review collaboration scores and statistics.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborationGraph;
