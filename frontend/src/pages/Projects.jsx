import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import './Dashboard.css'

// Sample projects data
const sampleProjects = [
  {
    id: 1,
    name: 'Orion Platform',
    manager: 'Riya Kapoor',
    progress: 68,
    members: [
      { initials: 'RK', color: '#ff8a65' },
      { initials: 'AS', color: '#6c63ff' },
      { initials: 'NV', color: '#3ddc97' },
      { initials: 'PD', color: '#f5b942' },
      { initials: 'SK', color: '#8b80ff' }
    ],
    healthScore: 86,
    status: 'active'
  },
  {
    id: 2,
    name: 'Nebula Dashboard',
    manager: 'Aman Shah',
    progress: 45,
    members: [
      { initials: 'AS', color: '#6c63ff' },
      { initials: 'NV', color: '#3ddc97' },
      { initials: 'PD', color: '#f5b942' }
    ],
    healthScore: 72,
    status: 'active'
  },
  {
    id: 3,
    name: 'Aurora UI Kit',
    manager: 'Neha Verma',
    progress: 100,
    members: [
      { initials: 'NV', color: '#3ddc97' },
      { initials: 'SK', color: '#8b80ff' }
    ],
    healthScore: 95,
    status: 'completed'
  },
  {
    id: 4,
    name: 'Pulsar Analytics',
    manager: 'Pranav Desai',
    progress: 22,
    members: [
      { initials: 'PD', color: '#f5b942' },
      { initials: 'RK', color: '#ff8a65' }
    ],
    healthScore: 58,
    status: 'active'
  },
  {
    id: 5,
    name: 'Stellar Infrastructure',
    manager: 'Sara Khan',
    progress: 90,
    members: [
      { initials: 'SK', color: '#8b80ff' },
      { initials: 'AS', color: '#6c63ff' }
    ],
    healthScore: 88,
    status: 'archived'
  }
]

const Projects = () => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredProjects = sampleProjects.filter(project => {
    const matchesFilter = activeFilter === 'all' || project.status === activeFilter
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) || project.manager.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getHealthColor = (score) => {
    if (score >= 80) return 'var(--accent-green)'
    if (score >= 60) return 'var(--accent-yellow)'
    return 'var(--accent-red)'
  }

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">D</div>
          <span className="logo-text">DevMetrics</span>
          <span className="logo-badge">Pro</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Workspace</div>

          <Link className="nav-item" to="/dashboard">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><rect x="2" y="2" width="7" height="7" rx="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5"/></svg>
            Dashboard
          </Link>

          <Link className="nav-item active" to="/projects">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/></svg>
            Projects
            <span className="nav-badge">12</span>
          </Link>

          <Link className="nav-item" to="#">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 14.094A5.973 5.973 0 004 17v1H1v-1a3 3 0 013.75-2.906z"/></svg>
            Teams
          </Link>

          <Link className="nav-item" to="#">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/></svg>
            Tasks
            <span className="nav-badge">47</span>
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">Intelligence</div>

          <Link className="nav-item" to="#">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z"/></svg>
            Analytics
          </Link>

          <Link className="nav-item" to="#">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-2-6a1 1 0 10-2 0v3a1 1 0 102 0V5z" clipRule="evenodd"/></svg>
            Reports
          </Link>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-label">System</div>

          <Link className="nav-item" to="#">
            <svg className="nav-icon" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379-1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/></svg>
            Settings
          </Link>
        </div>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">AK</div>
            <div className="user-info">
              <div className="user-name">Aryan Kumar</div>
              <div className="user-role">Engineering Lead</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" style={{color:'var(--text-muted)', flexShrink:'0'}}><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"/></svg>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        {/* HEADER */}
        <header className="header">
          <div className="header-breadcrumb">
            DevMetrics
            <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" style={{color:'var(--text-muted)'}}><path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"/></svg>
            <span>Projects</span>
          </div>
          <div className="header-spacer"></div>
          <div className="header-search" style={{width: '300px'}}>
            <svg className="search-icon" width="14" height="14" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd"/></svg>
            <input 
              type="text" 
              placeholder="Search Project" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Link to="/projects/create" className="btn btn-primary" style={{marginLeft: '16px'}}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd"/></svg>
            Create Project
          </Link>
        </header>

        {/* CONTENT */}
        <div className="content">
          {/* PAGE HEADER */}
          <div className="page-header">
            <div className="page-title-group">
              <div className="page-eyebrow">// workspace</div>
              <div className="page-title">Projects</div>
              <div className="page-subtitle">Manage all your projects in one place</div>
            </div>
          </div>

          {/* FILTERS */}
          <div className="seg" style={{width: 'fit-content', marginBottom: '24px'}}>
            <div 
              className={`seg-item ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All <span>{sampleProjects.length}</span>
            </div>
            <div 
              className={`seg-item ${activeFilter === 'active' ? 'active' : ''}`}
              onClick={() => setActiveFilter('active')}
            >
              Active <span>{sampleProjects.filter(p => p.status === 'active').length}</span>
            </div>
            <div 
              className={`seg-item ${activeFilter === 'completed' ? 'active' : ''}`}
              onClick={() => setActiveFilter('completed')}
            >
              Completed <span>{sampleProjects.filter(p => p.status === 'completed').length}</span>
            </div>
            <div 
              className={`seg-item ${activeFilter === 'archived' ? 'active' : ''}`}
              onClick={() => setActiveFilter('archived')}
            >
              Archived <span>{sampleProjects.filter(p => p.status === 'archived').length}</span>
            </div>
          </div>

          {/* PROJECT CARDS GRID */}
          <div className="grid" style={{gridTemplateColumns: 'repeat(3, 1fr)'}}>
            {filteredProjects.map(project => (
              <Link to={`/projects/${project.id}`} key={project.id} className="card" style={{textDecoration: 'none', cursor: 'pointer', transition: 'all 0.2s'}}>
                <div className="card-title">
                  {project.name}
                  <span 
                    style={{
                      fontSize: '11px',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      textTransform: 'capitalize',
                      background: project.status === 'active' ? 'rgba(61, 220, 151, 0.1)' : project.status === 'completed' ? 'rgba(108, 99, 255, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                      color: project.status === 'active' ? 'var(--accent-green)' : project.status === 'completed' ? 'var(--accent-blue)' : 'var(--text-muted)'
                    }}
                  >
                    {project.status}
                  </span>
                </div>
                
                <div style={{marginBottom: '16px'}}>
                  <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Manager</span>
                  <div style={{fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginTop: '4px'}}>{project.manager}</div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
                    <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Progress</span>
                    <span style={{fontSize: '14px', fontWeight: '700', color: 'var(--accent-blue)'}}>{project.progress}%</span>
                  </div>
                  <div className="progress-track" style={{height: '8px'}}>
                    <div className="progress-fill" style={{width: `${project.progress}%`}}></div>
                  </div>
                </div>

                <div style={{marginBottom: '16px'}}>
                  <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Members</span>
                  <div style={{display: 'flex', marginTop: '8px', gap: '8px'}}>
                    {project.members.slice(0, 4).map((member, idx) => (
                      <div 
                        key={idx}
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: '#fff',
                          background: member.color
                        }}
                      >
                        {member.initials}
                      </div>
                    ))}
                    {project.members.length > 4 && (
                      <div 
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '12px',
                          fontWeight: '700',
                          color: 'var(--text-primary)',
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        +{project.members.length - 4}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                  <div>
                    <span style={{fontSize: '12px', color: 'var(--text-muted)'}}>Health Score</span>
                    <div style={{
                      fontSize: '28px', 
                      fontWeight: '700', 
                      fontFamily: 'var(--font-mono)',
                      color: getHealthColor(project.healthScore)
                    }}>
                      {project.healthScore}
                    </div>
                  </div>
                  <div className="health-ring" style={{width: '64px', height: '64px'}}>
                    <div className="health-num" style={{fontSize: '16px'}}>
                      {project.healthScore}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* STATUS BAR */}
        <div className="status-bar">
          <div className="status-item"><span className="status-dot"></span>All systems operational</div>
          <div className="status-item">Last synced 2s ago</div>
          <div className="status-spacer"></div>
          <div className="status-item">v2.4.1</div>
        </div>
      </main>
    </div>
  )
}

export default Projects
