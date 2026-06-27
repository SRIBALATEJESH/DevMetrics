import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { Star } from 'lucide-react'
import CollaborationGraph from '../components/CollaborationGraph'
import ProjectBurndown from '../components/ProjectBurndown'
import './ProjectDetails.css'

const ProjectDetails = () => {
  const { id } = useParams()
  const { token, user, fetchMe } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [teams, setTeams] = useState([])
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isFavorited, setIsFavorited] = useState(false)

  // Update isFavorited state when user context or project ID changes
  useEffect(() => {
    if (user && user.favoriteProjects) {
      const isFav = user.favoriteProjects.some(p => (p._id || p) === id);
      setIsFavorited(isFav);
    }
  }, [user, id]);

  const toggleFavorite = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/projects/${id}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        await fetchMe();
      }
    } catch (err) {
      console.error('Error favoriting project:', err);
    }
  };

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        setError('');
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        const [projRes, tasksRes, teamsRes, timelineRes] = await Promise.all([
          fetch(`http://localhost:5000/api/projects/${id}`, { headers }),
          fetch(`http://localhost:5000/api/tasks?project=${id}`, { headers }),
          fetch(`http://localhost:5000/api/teams?project=${id}`, { headers }),
          fetch(`http://localhost:5000/api/timeline/project/${id}`, { headers })
        ]);

        const projData = await projRes.json();
        const tasksData = await tasksRes.json();
        const teamsData = await teamsRes.json();
        const timelineData = await timelineRes.json();

        if (projRes.ok) {
          setProject(projData.data);
          setTasks(tasksData.data || []);
          setTeams(teamsData.data || []);
          setTimeline(timelineData.data || []);
        } else {
          setError(projData.message || 'Failed to retrieve project details');
        }
      } catch (err) {
        setError('Network error fetching project details');
      } finally {
        setLoading(false);
      }
    };

    fetchProjectDetails();
  }, [id, token]);

  if (loading) {
    return (
      <Layout pageTitle="Project Details" pageSubtitle="Loading project details...">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Retrieving project logs and metadata from database...
        </div>
      </Layout>
    );
  }

  if (error || !project) {
    return (
      <Layout pageTitle="Project Details" pageSubtitle="Error">
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error || 'Project not found.'}
          <div style={{ marginTop: '20px' }}>
            <Link to="/all-projects" className="btn btn-primary">Back to Projects List</Link>
          </div>
        </div>
      </Layout>
    );
  }

  const completionRate = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100)
    : 0;

  return (
    <Layout
      pageTitle={project.title}
      pageEyebrow={`// status: ${project.status}`}
      pageSubtitle={project.description || 'No description provided.'}
    >
      <div className="header-card">
        <div>
          <div className="eyebrow">
            <span className={`dot ${project.status === 'active' ? 'active' : ''}`}></span>
            {project.status.toUpperCase()}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="proj-name">{project.title}</div>
            <button
              onClick={toggleFavorite}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: isFavorited ? 'var(--accent-yellow)' : 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s',
                marginTop: '4px'
              }}
              title={isFavorited ? 'Remove from Starred' : 'Star Project'}
            >
              <Star size={20} fill={isFavorited ? 'var(--accent-yellow)' : 'none'} />
            </button>
          </div>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
            Manager: <strong>{project.owner ? project.owner.name : 'Unknown'}</strong>
          </div>
        </div>
        <div className="health-block">
          <div className="health-ring">




            <div className="health-num">{completionRate}<span>/ 100</span></div>
          </div>
          <div className="health-tag">Completion</div>
        </div>
      </div>

      <div className="tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div
          className={`tab ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          Tasks ({tasks.length})
        </div>
        <div
          className={`tab ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Teams ({teams.length})
        </div>
        <div
          className={`tab ${activeTab === 'timeline' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeline')}
        >
          Timeline ({timeline.length})
        </div>
        <div
          className={`tab ${activeTab === 'burndown' ? 'active' : ''}`}
          onClick={() => setActiveTab('burndown')}
        >
          Milestones & Burn-down
        </div>
        <div
          className={`tab ${activeTab === 'collaboration' ? 'active' : ''}`}
          onClick={() => setActiveTab('collaboration')}
        >
          Collaboration Graph
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="panel">
          <div className="grid">
            <div className="card">
              <div className="card-title">Completion</div>
              <div className="stat-big">{completionRate}%</div>
            </div>
            <div className="card">
              <div className="card-title">Priority</div>
              <div className="stat-big" style={{
                textTransform: 'capitalize',
                color: project.priority === 'critical' ? '#ef4444' : project.priority === 'high' ? '#f97316' : project.priority === 'medium' ? '#3b82f6' : '#9ca3af'
              }}>{project.priority || 'medium'}</div>
            </div>
            <div className="card">
              <div className="card-title">Assigned Teams</div>
              <div className="stat-big">{teams.length}</div>
            </div>
            <div className="card">
              <div className="card-title">Total Tasks</div>
              <div className="stat-big">{tasks.length}</div>
            </div>
            <div className="card" style={{ gridColumn: 'span 2' }}>
              <div className="card-title">Timeline</div>
              <div style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                Start Date: <strong>{project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'}</strong>
              </div>
              <div style={{ marginTop: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                End Date: <strong>{project.endDate ? new Date(project.endDate).toLocaleDateString() : 'None'}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="panel">
          <div className="tasks-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {tasks.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No tasks assigned to this project yet.
              </div>
            ) : (
              tasks.map(task => (
                <div key={task._id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{task.title}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Assignee: {task.assignee ? task.assignee.name : 'Unassigned'} | Priority: <span style={{ textTransform: 'capitalize' }}>{task.priority}</span> | Complexity: <span style={{ textTransform: 'capitalize' }}>{task.complexity}</span>
                    </div>
                  </div>
                  <div style={{
                    padding: '6px 12px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    background: task.status === 'done' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)',
                    color: task.status === 'done' ? 'var(--accent-green)' : 'var(--accent-yellow)'
                  }}>
                    {task.status}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="panel">
          <div className="grid team-grid">
            {teams.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No teams assigned to this project yet.
              </div>
            ) : (
              teams.map(team => (
                <div key={team._id} className="card person-card" style={{ padding: '16px' }}>
                  <div className="p-name" style={{ fontWeight: 'bold', fontSize: '16px' }}>{team.teamName}</div>
                  <div className="p-role" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Lead: {team.lead ? team.lead.name : 'None'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                    Members: {team.members ? team.members.map(m => m.name).join(', ') : 'None'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="panel animate-fade-in">
          <div className="project-timeline-stream" style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative', paddingLeft: '20px', marginTop: '10px' }}>
            {/* Vertical Line */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '9px',
              bottom: '15px',
              width: '2px',
              background: 'var(--border)'
            }}></div>

            {timeline.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                No events logged for this project timeline yet.
              </div>
            ) : (
              timeline.map((event, index) => (
                <div key={event.id || index} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', position: 'relative', zIndex: '2' }}>
                  {/* Circle Indicator */}
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: event.completed ? 'var(--accent-green)' : 'var(--bg-elevated)',
                    border: `2px solid ${event.category === 'success' ? 'var(--accent-green)' : event.type === 'project_created' ? 'var(--accent-blue)' : 'var(--border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginTop: '4px',
                    flexShrink: 0
                  }}>
                    {event.completed && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff' }} />}
                  </div>

                  <div className="card" style={{ flex: '1', padding: '16px', background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '15px', color: 'var(--text-primary)' }}>{event.title}</span>
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', marginBottom: '0', lineHeight: '1.4' }}>
                      {event.description}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'burndown' && (
        <div className="panel animate-fade-in">
          <ProjectBurndown project={project} token={token} />
        </div>
      )}

      {activeTab === 'collaboration' && (
        <div className="panel animate-fade-in">
          <CollaborationGraph token={token} />
        </div>
      )}
    </Layout>
  )
}

export default ProjectDetails
