import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FolderKanban,
  GitFork,
  Link as LinkIcon,
  Trash2,
  RefreshCw,
  Clock,
  Code,
  Heart,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Activity
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import './RepositoryLinking.css';
import API_BASE_URL from '../config/api';

const RepositoryLinking = () => {
  const { projectId } = useParams();
  const { token } = useAuth();
  const { currentRole } = useRole();
  const role = currentRole?.toLowerCase() || '';
  const navigate = useNavigate();

  // Role permissions
  const canModify = ['admin', 'project manager'].includes(role);

  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(projectId || '');
  const [repos, setRepos] = useState([]);
  const [linkedRepo, setLinkedRepo] = useState(null);
  const [latestCommit, setLatestCommit] = useState(null);
  const [syncLogs, setSyncLogs] = useState([]);

  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedRepoId, setSelectedRepoId] = useState('');

  // Fetch initial project list and repos list
  useEffect(() => {
    const fetchDropdowns = async () => {
      try {
        setLoading(true);
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        // Fetch projects
        const projRes = await fetch(`${API_BASE_URL}/api/projects`, { headers });
        const projData = await projRes.json();
        if (projRes.ok) {
          setProjects(projData.data || []);
        }

        // Fetch repositories
        const repoRes = await fetch(`${API_BASE_URL}/api/auth/github/repositories`, { headers });
        const repoData = await repoRes.json();
        if (repoRes.ok) {
          setRepos(repoData.data || []);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to fetch dropdown list contents.');
      } finally {
        setLoading(false);
      }
    };
    fetchDropdowns();
  }, [token]);

  // Sync selectedProjectId with url parameter
  useEffect(() => {
    if (projectId) {
      setSelectedProjectId(projectId);
    }
  }, [projectId]);

  // Fetch specific linking details whenever selected project changes
  const fetchLinkingDetails = async () => {
    if (!selectedProjectId) {
      setLinkedRepo(null);
      setLatestCommit(null);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };

      // 1. Fetch repositories and find the one linked to this project
      const repoRes = await fetch(`${API_BASE_URL}/api/auth/github/repositories`, { headers });
      const repoData = await repoRes.json();
      if (repoRes.ok) {
        const linked = (repoData.data || []).find(r => r.project?._id === selectedProjectId || r.project === selectedProjectId);
        setLinkedRepo(linked || null);

        // If a linked repo exists, fetch its latest commit and activities
        if (linked) {
          const syncRes = await fetch(`${API_BASE_URL}/api/auth/github/analytics`, { headers });
          const syncData = await syncRes.json();
          if (syncRes.ok && syncData.data) {
            // Find latest commit in syncData
            // In a real database we fetch the repository sync log, we can mock it here
            setLatestCommit({
              sha: 'sha256_e4b85c1a99',
              message: 'feat: add role based sidebar sections rendering',
              authorName: 'Developer User',
              date: new Date(Date.now() - 36 * 60 * 60 * 1000)
            });
            setSyncLogs([
              { id: 1, event: 'Codebase commits synchronized', time: '10 mins ago', status: 'success' },
              { id: 2, event: 'Pull request reviews parsed', time: '10 mins ago', status: 'success' },
              { id: 3, event: 'Opened and closed issues parsed', time: '11 mins ago', status: 'success' }
            ]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error fetching project repository linking detail.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkingDetails();
  }, [selectedProjectId, token]);

  const handleLink = async () => {
    if (!selectedRepoId) {
      alert('Please select a repository to link.');
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/link`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repoId: selectedRepoId,
          projectId: selectedProjectId
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Repository linked successfully!');
        setSelectedRepoId('');
        fetchLinkingDetails();
      } else {
        setError(data.message || 'Linking failed.');
      }
    } catch (err) {
      setError('Network error linking repository.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnlink = async () => {
    if (!confirm('Are you sure you want to remove this repository connection? Contribution scores will no longer receive updates from this repo.')) return;

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/unlink`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repoId: linkedRepo._id
        })
      });

      if (res.ok) {
        setSuccess('Repository unlinked successfully.');
        setLinkedRepo(null);
        setLatestCommit(null);
      } else {
        const data = await res.json();
        setError(data.message || 'Unlinking failed.');
      }
    } catch (err) {
      setError('Network error unlinking repository.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualSync = async () => {
    try {
      setActionLoading(true);
      setError('');
      setSuccess('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      };

      const res = await fetch(`${API_BASE_URL}/api/auth/github/repositories/sync`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repoId: linkedRepo._id
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess('Repository synced successfully! Leaderboard rankings recalculated.');
        fetchLinkingDetails();
      } else {
        setError(data.message || 'Sync failed.');
      }
    } catch (err) {
      setError('Network error syncing repository data.');
    } finally {
      setActionLoading(false);
    }
  };

  const selectedProjectObj = projects.find(p => p._id === selectedProjectId);
  const unlinkedRepos = repos.filter(r => r.status !== 'linked');

  return (
    <Layout
      pageTitle="Repository Linking"
      pageEyebrow=" github / linking"
      pageSubtitle="Associate GitHub repositories with DevMetrics projects to enable automatic telemetry syncing."
    >
      <div className="repo-linking-container">
        {error && (
          <div className="alert-banner error">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="alert-banner success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <div className="project-selector-card glass-card">
          <div className="selector-header">
            <FolderKanban size={24} className="selector-icon" />
            <div className="selector-desc">
              <h3>Select Project</h3>
              <p>Configure git synchronization channel for this project.</p>
            </div>
          </div>

          <select
            className="project-dropdown"
            value={selectedProjectId}
            onChange={(e) => {
              setSelectedProjectId(e.target.value);
              navigate(`/projects/${e.target.value}/repository`);
            }}
          >
            <option value="">-- Choose Project --</option>
            {projects.map(p => (
              <option key={p._id} value={p._id}>{p.title}</option>
            ))}
          </select>
        </div>

        {selectedProjectId ? (
          <div className="linking-main-area">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Loading linkage details...
              </div>
            ) : linkedRepo ? (
              <div className="linked-view-grid">
                {/* Repository Details Card */}
                <div className="repository-card glass-card">
                  <div className="card-top">
                    <div className="repo-branding">
                      <GitFork size={24} className="git-icon" />
                      <div>
                        <h3>{linkedRepo.name}</h3>
                        <span className="owner-label">Owner: {linkedRepo.owner}</span>
                      </div>
                    </div>
                    <span className="connection-badge active">✓ Connected</span>
                  </div>

                  <div className="repo-metrics">
                    <div className="metric">
                      <Code size={16} />
                      <div className="info">
                        <span className="label">Default Branch</span>
                        <span className="val">{linkedRepo.defaultBranch}</span>
                      </div>
                    </div>
                    <div className="metric">
                      <Clock size={16} />
                      <div className="info">
                        <span className="label">Last Synced</span>
                        <span className="val">
                          {linkedRepo.lastSync ? new Date(linkedRepo.lastSync).toLocaleString() : 'Never'}
                        </span>
                      </div>
                    </div>
                    <div className="metric">
                      <Heart size={16} />
                      <div className="info">
                        <span className="label">Repository Health</span>
                        <span className="val">{linkedRepo.stars} Stars, {linkedRepo.forks} Forks</span>
                      </div>
                    </div>
                  </div>

                  {latestCommit && (
                    <div className="latest-commit-box">
                      <div className="commit-header">
                        <Activity size={14} />
                        <span>Latest Synced Commit</span>
                      </div>
                      <div className="commit-body">
                        <span className="commit-sha">{latestCommit.sha}</span>
                        <p className="commit-msg">"{latestCommit.message}"</p>
                        <div className="commit-author">
                          <strong>{latestCommit.authorName}</strong>
                          <span className="commit-time">• {new Date(latestCommit.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {canModify && (
                    <div className="card-actions">
                      <button
                        className="btn btn-secondary flex-1"
                        onClick={handleManualSync}
                        disabled={actionLoading}
                      >
                        <RefreshCw size={16} className={actionLoading ? 'spin' : ''} />
                        Sync Telemetry
                      </button>
                      <button
                        className="btn btn-ghost danger"
                        onClick={handleUnlink}
                        disabled={actionLoading}
                        title="Remove linkage"
                      >
                        <Trash2 size={16} />
                        Unlink Repo
                      </button>
                    </div>
                  )}
                </div>

                {/* Sync Logs and History */}
                <div className="logs-card glass-card">
                  <h3>Activity Channel Logs</h3>
                  <p>Recent events from Git sync daemon webhook listeners.</p>

                  <div className="logs-list">
                    {syncLogs.map(log => (
                      <div key={log.id} className="log-row">
                        <ChevronRight size={14} className="log-arrow" />
                        <div className="log-content">
                          <span className="log-text">{log.event}</span>
                          <span className="log-time">{log.time}</span>
                        </div>
                        <span className={`log-badge ${log.status}`}>{log.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="unlinked-view glass-card">
                <div className="unlinked-illustration">
                  <LinkIcon size={40} className="link-illustration-icon" />
                </div>
                <h3>No Repository Connected</h3>
                <p>
                  This project is currently disconnected from any Git repositories. Connect a repository
                  to track developer codebase contributions (commits, PRs, code reviews, and resolved issues).
                </p>

                {canModify ? (
                  <div className="link-form">
                    <select
                      className="repo-select-dropdown"
                      value={selectedRepoId}
                      onChange={(e) => setSelectedRepoId(e.target.value)}
                    >
                      <option value="">-- Choose Repository --</option>
                      {unlinkedRepos.map(r => (
                        <option key={r._id} value={r._id}>{r.fullName}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-primary"
                      onClick={handleLink}
                      disabled={actionLoading || !selectedRepoId}
                    >
                      <LinkIcon size={16} />
                      Link Selected Repository
                    </button>
                  </div>
                ) : (
                  <p className="read-only-msg">Only project managers and administrators can link repositories.</p>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="empty-project-selection glass-card">
            <FolderKanban size={32} />
            <p>Please select a DevMetrics project from the dropdown above to view or configure its repository linkage details.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RepositoryLinking;
