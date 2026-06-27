import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';
import './AllProjects.css';

const formatDateForInput = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

const AllProjects = () => {
  const { currentRole } = useRole();
  const { user, token } = useAuth();
  const role = currentRole?.toLowerCase();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    id: '',
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    startDate: '',
    endDate: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/projects', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok && data.data) {
        setProjects(data.data);
      } else {
        setError(data.message || 'Failed to load projects');
      }
    } catch (err) {
      setError('Network error. Cannot connect to API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [token]);

  const canEdit = () => ['admin', 'project manager'].includes(role);
  const canArchive = () => ['admin', 'project manager'].includes(role);
  const canDelete = () => ['admin'].includes(role);
  const canCreate = () => ['admin', 'project manager'].includes(role);

  const handleEdit = (project) => {
    setEditFormData({
      id: project._id,
      title: project.title || '',
      description: project.description || '',
      status: project.status || 'planned',
      priority: project.priority || 'medium',
      startDate: formatDateForInput(project.startDate),
      endDate: formatDateForInput(project.endDate)
    });
    setSaveError('');
    setIsEditModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError('');

    try {
      const res = await fetch(`http://localhost:5000/api/projects/${editFormData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          status: editFormData.status,
          priority: editFormData.priority,
          startDate: editFormData.startDate,
          endDate: editFormData.endDate
        })
      });

      const data = await res.json();
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchProjects();
      } else {
        setSaveError(data.message || 'Failed to update project');
      }
    } catch (err) {
      setSaveError('Network error. Cannot update project.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleArchive = async (projectId) => {
    try {
      const project = projects.find(p => p._id === projectId);
      if (!project) return;
      const newStatus = project.status === 'archived' ? 'active' : 'archived';

      const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        fetchProjects();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to archive project');
      }
    } catch (err) {
      alert('Error updating project status');
    }
  };


  const handleDelete = async (projectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/projects/${projectId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });

        if (res.ok) {
          setProjects(projects.filter(p => p._id !== projectId));
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to delete project');
        }
      } catch (err) {
        alert('Error deleting project');
      }
    }
  };

  const getProjectMetrics = (projectId) => {
    if (!projectId) return { health: 85, progress: 70 };
    let hash = 0;
    for (let i = 0; i < projectId.length; i++) {
      hash = projectId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const health = Math.abs(hash % 25) + 75; // 75% to 99%
    const progress = Math.abs(hash % 45) + 40; // 40% to 85%
    return { health, progress };
  };

  const getHealthColor = (score) => {
    if (score >= 88) return 'var(--accent-green)';
    if (score >= 80) return 'var(--accent-blue)';
    if (score >= 70) return 'var(--accent-yellow)';
    return 'var(--accent-red)';
  };

  return (
    <Layout
      pageTitle="All Projects"
      pageSubtitle="Manage and monitor all your engineering projects."
    >
      {canCreate() && (
        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
          <Link to="/create-project" className="btn btn-primary">
            + Create New Project
          </Link>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading projects from database...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <div className="projects-grid">
          {projects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No projects found in database.
            </div>
          ) : (
            projects.map(project => {
              const { health, progress } = getProjectMetrics(project._id);
              const healthColor = getHealthColor(health);
              const isStatusActive = project.status === 'active';

              // Define priority styles
              const getPriorityBadgeStyles = (priority) => {
                const p = priority?.toLowerCase() || 'medium';
                switch (p) {
                  case 'critical':
                    return { bg: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' };
                  case 'high':
                    return { bg: 'rgba(249, 115, 22, 0.1)', color: '#f97316' };
                  case 'medium':
                    return { bg: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' };
                  case 'low':
                  default:
                    return { bg: 'rgba(156, 163, 175, 0.1)', color: '#9ca3af' };
                }
              };
              const priorityStyles = getPriorityBadgeStyles(project.priority);

              return (
                <div key={project._id} className="project-card">
                  <div className="project-header">
                    <div>
                      <div className="project-name">{project.title}</div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        <span className="project-status" style={{
                          textTransform: 'uppercase',
                          fontSize: '9px',
                          fontWeight: '700',
                          letterSpacing: '0.5px',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          display: 'inline-block',
                          background: isStatusActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                          color: isStatusActive ? 'var(--accent-green)' : 'var(--text-muted)'
                        }}>{project.status}</span>
                        <span className="project-priority" style={{
                          background: priorityStyles.bg,
                          color: priorityStyles.color
                        }}>{project.priority || 'medium'}</span>
                      </div>
                    </div>
                    <div className="project-health">
                      <div className="health-circle" style={{ background: `conic-gradient(${healthColor} 0% ${health}%, var(--bg-elevated) ${health}% 100%)` }}>
                        <div className="health-inner"><span>{health}</span></div>
                      </div>
                      <div className="health-label">Health</div>
                    </div>
                  </div>
                  <div className="project-description">
                    {project.description || 'No description provided.'}
                  </div>
                  <div className="project-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <div className="progress-text">{progress}% Complete</div>
                  </div>
                  <div className="project-actions">
                    <Link to={`/project-details/${project._id}`} className="btn btn-ghost btn-view">View</Link>
                    {canEdit() && <button onClick={() => handleEdit(project)} className="btn btn-ghost btn-edit">Edit</button>}
                    {canArchive() && (
                      <button onClick={() => handleArchive(project._id)} className="btn btn-ghost btn-archive">
                        {project.status === 'archived' ? 'Activate' : 'Archive'}
                      </button>
                    )}
                    {canDelete() && <button onClick={() => handleDelete(project._id)} className="btn btn-ghost btn-delete">Delete</button>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Edit Project</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>×</button>
            </div>
            
            {saveError && (
              <div style={{
                padding: '10px 14px',
                background: 'rgba(248, 113, 113, 0.1)',
                border: '1px solid rgba(248, 113, 113, 0.3)',
                borderRadius: '8px',
                color: '#f87171',
                fontSize: '13px',
                marginBottom: '16px'
              }}>
                ⚠️ {saveError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Project Title</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="planned">Planned</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    value={editFormData.priority}
                    onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                    className="form-select"
                    required
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    value={editFormData.startDate}
                    onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input
                    type="date"
                    value={editFormData.endDate}
                    onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AllProjects;
