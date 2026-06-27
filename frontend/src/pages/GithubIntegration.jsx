import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GitFork,
  LogOut,
  RefreshCw,
  Users,
  BookOpen,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './GithubIntegration.css';

const GithubIntegration = () => {
  const { user, token, updateUserLocal, fetchMe } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [error, setError] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/github/profile', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok && data.connected) {
        setProfileData(data.data);
      } else {
        setProfileData(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch GitHub profile integration status.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.githubConnected) {
      fetchProfile();
    } else {
      setProfileData(null);
    }
  }, [user]);

  // Handle OAuth callback parameters in settings/github
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const githubStatus = queryParams.get('github');
    if (githubStatus === 'success') {
      if (fetchMe) {
        fetchMe().then(() => {
          navigate('/settings/github', { replace: true });
        });
      }
    } else if (githubStatus === 'error') {
      const message = queryParams.get('message') || 'Failed to connect GitHub';
      setError(message);
      navigate('/settings/github', { replace: true });
    }
  }, [window.location.search]);

  const handleConnect = () => {
    window.location.href = `http://localhost:5000/api/auth/github/connect?token=${token || localStorage.getItem('token')}`;
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account? This will halt contribution score sync.')) return;
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/github/disconnect', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        updateUserLocal({
          githubConnected: false,
          githubUsername: '',
          githubId: '',
          githubAvatar: '',
          githubAccessToken: ''
        });
        setProfileData(null);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to disconnect GitHub');
      }
    } catch (err) {
      setError('Network error disconnecting GitHub account.');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/auth/github/repositories/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        await fetchProfile();
        if (fetchMe) await fetchMe();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to sync GitHub profile');
      }
    } catch (err) {
      setError('Network error syncing GitHub profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      pageTitle="GitHub Integration"
      pageEyebrow="  settings / github"
      pageSubtitle="Link your GitHub account to sync commits, pull requests, reviews, and issues into DevMetrics."
    >
      <div className="github-integration-container">
        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="glass-card main-card">
          <div className="status-header">
            <div className="status-label">
              <span className={`status-dot ${user?.githubConnected ? 'active' : ''}`}></span>
              <span className="status-text">
                {user?.githubConnected ? 'Account Connected' : 'Disconnected'}
              </span>
            </div>
            {profileData && (
              <span className="last-sync-time">
                Last synced: {profileData.lastSync ? new Date(profileData.lastSync).toLocaleString() : 'Never'}
              </span>
            )}
          </div>

          {user?.githubConnected && profileData ? (
            <div className="profile-details-view">
              <div className="profile-main">
                <div className="github-avatar-wrapper">
                  <img src={profileData.avatarUrl || user.githubAvatar} alt="GitHub avatar" className="github-avatar" />
                  <div className="platform-icon"><GitFork size={14} /></div>
                </div>
                <div className="profile-identity">
                  <h2>{profileData.name || user.name}</h2>
                  <p className="github-username">@{profileData.username || user.githubUsername}</p>
                  {profileData.email && <p className="github-email">{profileData.email}</p>}
                </div>
              </div>

              <div className="profile-stats-grid">
                <div className="stat-box">
                  <Users className="stat-icon" size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{profileData.followers || 0}</span>
                    <span className="stat-label">Followers</span>
                  </div>
                </div>
                <div className="stat-box">
                  <Users className="stat-icon" size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{profileData.following || 0}</span>
                    <span className="stat-label">Following</span>
                  </div>
                </div>
                <div className="stat-box">
                  <BookOpen className="stat-icon" size={20} />
                  <div className="stat-info">
                    <span className="stat-value">{profileData.publicRepos || 0}</span>
                    <span className="stat-label">Repositories</span>
                  </div>
                </div>
              </div>

              <div className="action-buttons">
                <button
                  className="btn btn-primary"
                  onClick={handleSyncProfile}
                  disabled={loading}
                >
                  <RefreshCw size={16} className={loading ? 'spin' : ''} />
                  Sync Profile Details
                </button>
                <button
                  className="btn btn-ghost danger"
                  onClick={handleDisconnect}
                  disabled={loading}
                >
                  <LogOut size={16} />
                  Disconnect GitHub
                </button>
              </div>
            </div>
          ) : (
            <div className="disconnected-view">
              <div className="disconnected-illustration">
                <GitFork size={48} className="pulse-icon" />
              </div>
              <h3>Connect to GitHub</h3>
              <p>
                Connect your account to pull repository contributions (Commits, Pull Requests, Reviews, and Issues).
                This data directly feeds into your DevMetrics contribution index and leaderboards.
              </p>
              <button
                className="btn btn-primary large-connect-btn"
                onClick={handleConnect}
                disabled={loading}
              >
                <CheckCircle size={18} />
                Link GitHub Account
              </button>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default GithubIntegration;
