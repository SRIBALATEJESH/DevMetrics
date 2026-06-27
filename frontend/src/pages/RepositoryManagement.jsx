import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  RefreshCw,
  GitFork,
  Star,
  Lock,
  Globe,
  Settings,
  Activity,
  AlertTriangle,
  Link as LinkIcon,
  CheckCircle,
  Users,
  X
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import './RepositoryManagement.css';
import API_BASE_URL from '../config/api';

const RepositoryManagement = ({ initialTab = 'catalog' }) => {
  const { token, user } = useAuth();
  const { currentRole } = useRole();
  const role = currentRole?.toLowerCase() || '';
  const navigate = useNavigate();

  // Role permissions
  const canModify = ['admin', 'project manager'].includes(role);

  const [activeTab, setActiveTab] = useState(initialTab);
  const [repos, setRepos] = useState([]);
  const [projects, setProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Contributors Modal State
  const [showContributorsModal, setShowContributorsModal] = useState(false);
  const [modalRepo, setModalRepo] = useState(null);
  const [contributors, setContributors] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Link Repository Modal State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedRepoToLink, setSelectedRepoToLink] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };

      // 1. Fetch repositories
      const repoRes = await fetch(`${API_BASE_URL}/api/auth/github/repositories`, { headers });
      const repoData = await repoRes.json();
      if (repoRes.ok) {
        setRepos(repoData.data || []);
      } else {
        setError(repoData.message || 'Failed to fetch repositories.');
      }

      // 2. Fetch projects (for linking)
      if (canModify) {
        const projRes = await fetch(`${API_BASE_URL}/api/projects`, { headers });
        const projData = await projRes.json();
        if (projRes.ok) {
          setProjects(projData.data || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Network error fetching repository information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [token, role]);

  const handleRefreshList = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };
      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/refresh`, {
        method: 'POST',
        headers
      });
      const data = await res.json();
      if (res.ok) {
        setRepos(data.data || []);
        setSuccessMsg('Repository list refreshed successfully!');
      } else {
        setError(data.message || 'Failed to refresh repository catalog.');
      }
    } catch (err) {
      setError('Network error refreshing repository list.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncRepository = async (repoId) => {
    try {
      setActionLoadingId(repoId);
      setError('');
      setSuccessMsg('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ repoId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Repository data synced successfully!`);
        fetchInitialData();
      } else {
        setError(data.message || 'Sync failed.');
      }
    } catch (err) {
      setError('Network error triggering repository sync.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenLinkModal = (repo) => {
    setSelectedRepoToLink(repo);
    setSelectedProjectId(repo.project?._id || repo.project || '');
    setShowLinkModal(true);
  };

  const handleLinkRepository = async () => {
    if (!selectedProjectId) {
      alert('Please select a project');
      return;
    }
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repoId: selectedRepoToLink._id,
          projectId: selectedProjectId
        })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Repository linked to project successfully!`);
        setShowLinkModal(false);
        fetchInitialData();
      } else {
        setError(data.message || 'Failed to link repository.');
      }
    } catch (err) {
      setError('Network error linking repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlinkRepository = async (repoId) => {
    if (!confirm('Are you sure you want to unlink this repository? Analytics history will remain, but future commits will not map to this project.')) return;
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };
      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/unlink`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ repoId })
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg(`Repository unlinked successfully!`);
        fetchInitialData();
      } else {
        setError(data.message || 'Failed to unlink repository.');
      }
    } catch (err) {
      setError('Network error unlinking repository.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewContributors = async (repo) => {
    setModalRepo(repo);
    setShowContributorsModal(true);
    setContributors([]);
    try {
      setModalLoading(true);
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };
      // Fetch user rankings which contains git stats or fetch dashboard analytics
      const res = await fetch(`${API_BASE_URL}/api/auth/github/analytics`, { headers });
      const data = await res.json();
      if (res.ok && data.data && data.data.leaderboard) {
        // filter contributors who have commits > 0 in general or map from mock
        const repoContributors = data.data.leaderboard.filter(c => c.commits > 0);
        setContributors(repoContributors);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  // Filter repos based on search query
  const filteredRepos = repos.filter(repo => {
    const query = searchQuery.toLowerCase();
    return (
      repo.name.toLowerCase().includes(query) ||
      repo.owner.toLowerCase().includes(query) ||
      (repo.language && repo.language.toLowerCase().includes(query)) ||
      (repo.project && repo.project.title && repo.project.title.toLowerCase().includes(query))
    );
  });

  const linkedRepos = repos.filter(repo => repo.status === 'linked');

  return (
    <Layout
      pageTitle={activeTab === 'sync' ? "Sync Center" : "Repository Management"}
      pageEyebrow={activeTab === 'sync' ? " github / sync" : " github / repositories"}
      pageSubtitle={activeTab === 'sync' ? "Trigger telemetry sync and track data fetch logs." : "Discover and manage GitHub repositories linked to DevMetrics."}
    >
      <div className="repo-management-container">
        {error && (
          <div className="alert-banner error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div className="alert-banner success">
            <CheckCircle size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <div className="tabs-header">
          <button
            className={`tab-btn ${activeTab === 'catalog' ? 'active' : ''}`}
            onClick={() => setActiveTab('catalog')}
          >
            Repository Catalog
          </button>
          <button
            className={`tab-btn ${activeTab === 'sync' ? 'active' : ''}`}
            onClick={() => setActiveTab('sync')}
          >
            Sync Center ({linkedRepos.length} Linked)
          </button>
        </div>

        {activeTab === 'catalog' ? (
          <div className="catalog-tab">
            <div className="catalog-toolbar">
              <div className="search-bar">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search repository, language, project..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {canModify && (
                <button
                  className="btn btn-secondary toolbar-btn"
                  onClick={handleRefreshList}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  Discover Repositories
                </button>
              )}
            </div>

            <div className="glass-table-wrapper">
              <table className="glass-table">
                <thead>
                  <tr>
                    <th>Repository Name</th>
                    <th>Language</th>
                    <th>Stars/Forks</th>
                    <th>Visibility</th>
                    <th>Linked Project</th>
                    <th>Last Synced</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading && repos.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        Discovering repository metadata...
                      </td>
                    </tr>
                  ) : filteredRepos.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                        No repositories found. Link a GitHub account or check search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRepos.map(repo => (
                      <tr key={repo._id}>
                        <td>
                          <div className="repo-identity-cell">
                            <span className="repo-name">{repo.name}</span>
                            <span className="repo-owner">{repo.owner}</span>
                          </div>
                        </td>
                        <td>
                          <span className="language-badge">{repo.language || 'N/A'}</span>
                        </td>
                        <td>
                          <div className="stats-cell">
                            <span className="stat"><Star size={13} /> {repo.stars}</span>
                            <span className="stat"><GitFork size={13} /> {repo.forks}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`visibility-badge ${repo.visibility}`}>
                            {repo.visibility === 'private' ? <Lock size={12} /> : <Globe size={12} />}
                            {repo.visibility}
                          </span>
                        </td>
                        <td>
                          {repo.status === 'linked' && repo.project ? (
                            <span className="project-link-badge">
                              {repo.project.title || 'Linked Project'}
                            </span>
                          ) : (
                            <span className="unlinked-placeholder">Unlinked</span>
                          )}
                        </td>
                        <td>
                          <span className="last-sync-date">
                            {repo.lastSync ? new Date(repo.lastSync).toLocaleString() : 'Never'}
                          </span>
                        </td>
                        <td>
                          <div className="actions-cell">
                            <button
                              className="btn btn-ghost btn-sm"
                              onClick={() => handleViewContributors(repo)}
                            >
                              <Users size={14} />
                              Contributors
                            </button>
                            {canModify && (
                              <>
                                {repo.status === 'linked' ? (
                                  <>
                                    <button
                                      className="btn btn-secondary btn-sm"
                                      onClick={() => handleSyncRepository(repo._id)}
                                      disabled={actionLoadingId === repo._id}
                                    >
                                      <RefreshCw size={14} className={actionLoadingId === repo._id ? 'spin' : ''} />
                                      Sync
                                    </button>
                                    <button
                                      className="btn btn-ghost danger btn-sm"
                                      onClick={() => handleUnlinkRepository(repo._id)}
                                    >
                                      Unlink
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleOpenLinkModal(repo)}
                                  >
                                    <LinkIcon size={14} />
                                    Link Project
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="sync-tab">
            <div className="sync-stats-summary">
              <div className="sync-stat-card">
                <div className="card-value">{linkedRepos.length}</div>
                <div className="card-label">Linked Repositories</div>
              </div>
              <div className="sync-stat-card">
                <div className="card-value">
                  {repos.filter(r => r.lastSync).length} / {repos.length}
                </div>
                <div className="card-label">Synced Repositories</div>
              </div>
              <div className="sync-stat-card">
                <div className="card-value">
                  {repos.length - linkedRepos.length}
                </div>
                <div className="card-label">Pending Linking</div>
              </div>
            </div>

            <div className="linked-repos-list-card">
              <h3>Active Synchronization Channels</h3>
              <p>Manual and automated synchronization pulls commits, issues, and PR statuses into the contribution engine.</p>

              <div className="channels-grid">
                {linkedRepos.length === 0 ? (
                  <div className="no-channels">
                    <AlertTriangle size={24} />
                    <p>No active synchronization channels. Link a repository to a project in the Catalog tab to configure telemetry syncing.</p>
                  </div>
                ) : (
                  linkedRepos.map(repo => (
                    <div key={repo._id} className="channel-card">
                      <div className="channel-header">
                        <div>
                          <h4 className="channel-title">{repo.fullName}</h4>
                          <span className="channel-project">Project: {repo.project?.title || 'Unknown'}</span>
                        </div>
                        <span className="channel-badge active">Active Sync</span>
                      </div>
                      <div className="channel-details">
                        <div className="detail-row">
                          <span>Default Branch:</span>
                          <strong>{repo.defaultBranch}</strong>
                        </div>
                        <div className="detail-row">
                          <span>Last Sync:</span>
                          <strong>{repo.lastSync ? new Date(repo.lastSync).toLocaleString() : 'Never'}</strong>
                        </div>
                      </div>
                      {canModify && (
                        <div className="channel-actions">
                          <button
                            className="btn btn-primary w-full"
                            onClick={() => handleSyncRepository(repo._id)}
                            disabled={actionLoadingId === repo._id}
                          >
                            <RefreshCw size={14} className={actionLoadingId === repo._id ? 'spin' : ''} />
                            Trigger Sync Now
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Contributors Modal */}
        {showContributorsModal && modalRepo && (
          <div className="modal-backdrop">
            <div className="glass-modal">
              <div className="modal-header">
                <h3>Contributors: {modalRepo.name}</h3>
                <button className="close-btn" onClick={() => setShowContributorsModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                {modalLoading ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    Fetching contributor git activity...
                  </div>
                ) : contributors.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No recorded contributors found for this repository in synced databases.
                  </div>
                ) : (
                  <div className="contributors-list">
                    {contributors.map(c => (
                      <div key={c.id} className="contributor-item">
                        <div className="contributor-avatar">
                          {c.avatar ? (
                            <img src={c.avatar} alt={c.name} />
                          ) : (
                            c.name.split(' ').map(n => n[0]).join('')
                          )}
                        </div>
                        <div className="contributor-identity">
                          <span className="contributor-name">{c.name}</span>
                          <span className="contributor-username">@{c.email.split('@')[0]}</span>
                        </div>
                        <div className="contributor-stats">
                          <div className="stat">
                            <span className="label">Commits</span>
                            <span className="val">{c.commits}</span>
                          </div>
                          <div className="stat">
                            <span className="label">PRs</span>
                            <span className="val">{c.prs}</span>
                          </div>
                          <div className="stat">
                            <span className="label">Score</span>
                            <span className="val highlight">{c.contributionScore}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Link Repository Modal */}
        {showLinkModal && selectedRepoToLink && (
          <div className="modal-backdrop">
            <div className="glass-modal link-modal">
              <div className="modal-header">
                <h3>Link Project to Repository</h3>
                <button className="close-btn" onClick={() => setShowLinkModal(false)}>
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                  Select which DevMetrics project is mapped to the codebase repository <strong>{selectedRepoToLink.fullName}</strong>.
                </p>
                <div className="form-group">
                  <label className="form-label">DevMetrics Project</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="">-- Select Project --</option>
                    {projects.map(p => (
                      <option key={p._id} value={p._id}>{p.title}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                  <button className="btn btn-ghost" onClick={() => setShowLinkModal(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleLinkRepository}>Link Repository</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RepositoryManagement;
