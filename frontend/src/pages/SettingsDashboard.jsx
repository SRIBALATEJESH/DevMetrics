import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User,
  UserCircle,
  Lock,
  Bell,
  Palette,
  Shield,
  Link2,
  FolderKanban,
  Users,
  Save,
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  GitFork,
  Mail,
  Smartphone,
  FileEdit,
  Trash2,
  LogOut
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'
import './SettingsDashboard.css'
import API_BASE_URL from '../config/api';

const SettingsDashboard = () => {
  const { user, token, updateUserLocal, logout, fetchMe, connectGoogleAccount, disconnectGoogleWithAPI } = useAuth()
  const { currentRole } = useRole()
  const role = currentRole?.toLowerCase()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  // Security Core Functionality States
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSessionsList, setShowSessionsList] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [securityLogs, setSecurityLogs] = useState([]);

  // Change Security Form Input
  const handleSecurityFormChange = (e) => {
    setSecurityForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  // Change Password Call
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    if (securityForm.newPassword.length < 6) {
      alert('Password must be at least 6 characters long');
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: securityForm.currentPassword,
          newPassword: securityForm.newPassword
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(user.hasPassword === false ? 'Password set successfully!' : 'Password updated successfully!');
        updateUserLocal({ hasPassword: true });
        setSecurityForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowPasswordForm(false);
        if (showHistory) fetchSecurityLogs();
      } else {
        alert(data.message || 'Failed to update password');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating password');
    }
  };

  // Fetch Active Sessions
  const fetchActiveSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/sessions`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSessions(data.data || []);
      } else {
        console.error('Failed to retrieve active sessions');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Revoke Device Session
  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to revoke this session and log out that device?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        alert('Session revoked successfully!');
        fetchActiveSessions();
        if (showHistory) fetchSecurityLogs();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to revoke session');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Fetch Security Activity History
  const fetchSecurityLogs = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}/security-logs`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setSecurityLogs(data.data || []);
      } else {
        console.error('Failed to retrieve security logs');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const togglePasswordForm = () => {
    setShowPasswordForm(!showPasswordForm);
  };

  const toggleSessionsList = () => {
    if (!showSessionsList) {
      fetchActiveSessions();
    }
    setShowSessionsList(!showSessionsList);
  };

  const toggleHistory = () => {
    if (!showHistory) {
      fetchSecurityLogs();
    }
    setShowHistory(!showHistory);
  };

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const handleConnectGitHub = () => {
    window.location.href = `${API_BASE_URL}/api/auth/github/connect?token=${token || localStorage.getItem('token')}`;
  };

  const handleDisconnectGitHub = async () => {
    if (!confirm('Are you sure you want to disconnect your GitHub account?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/github/disconnect`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        alert('GitHub disconnected successfully!');
        updateUserLocal({
          githubConnected: false,
          githubUsername: '',
          githubId: '',
          githubAvatar: '',
          githubAccessToken: ''
        });
      } else {
        alert(data.message || 'Failed to disconnect GitHub account');
      }
    } catch (err) {
      console.error(err);
      alert('Error disconnecting GitHub account');
    }
  };

  const handleConnectGoogle = async () => {
    try {
      await connectGoogleAccount();
      alert('Google account connected successfully!');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        return; // user closed popup gracefully
      }
      alert(err.message || 'Error connecting Google account');
    }
  };

  const handleDisconnectGoogle = async () => {
    if (!confirm('Are you sure you want to disconnect your Google account?')) return;
    try {
      await disconnectGoogleWithAPI();
      alert('Google account disconnected successfully!');
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error disconnecting Google account');
    }
  };

  const [activeSection, setActiveSection] = useState('profile')
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    bio: '',
    theme: 'dark',
    density: 'comfortable',
    publicProfile: true,
    showContributionScore: true,
    showActivityTimeline: true,
    taskAlerts: true,
    deadlineReminders: true,
    projectUpdates: true,
    contributionUpdates: true,
    emailNotifications: false
  })

  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        bio: user.bio || '',
        theme: user.theme || 'dark',
        density: user.density || 'comfortable',
        publicProfile: user.publicProfile !== false,
        showContributionScore: user.showContributionScore !== false,
        showActivityTimeline: user.showActivityTimeline !== false,
        taskAlerts: user.taskAlerts !== false,
        deadlineReminders: user.deadlineReminders !== false,
        projectUpdates: user.projectUpdates !== false,
        contributionUpdates: user.contributionUpdates !== false,
        emailNotifications: !!user.emailNotifications
      });
    }
  }, [user]);

  // Handle GitHub OAuth Redirect Callback parameters
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const githubStatus = queryParams.get('github');
    if (githubStatus === 'success') {
      if (fetchMe) {
        fetchMe().then(() => {
          alert('GitHub account connected successfully!');
          navigate('/settings', { replace: true });
        }).catch(err => {
          console.error(err);
          navigate('/settings', { replace: true });
        });
      }
    } else if (githubStatus === 'error') {
      const message = queryParams.get('message') || 'Failed to connect GitHub';
      alert(`GitHub connection failed: ${message}`);
      navigate('/settings', { replace: true });
    }
  }, [window.location.search, fetchMe, navigate]);

  const [projectSettings, setProjectSettings] = useState({
    autoArchive: true,
    slackWebhook: '',
    defaultBranch: 'main',
    notificationThreshold: 'realtime'
  })

  const [teamSettings, setTeamSettings] = useState({
    teamName: 'Team Alpha',
    standupTime: '10:00',
    weeklyReportDay: 'friday',
    teamCapacity: 8
  })

  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: <UserCircle size={20} /> },
    { id: 'account', label: 'Account Settings', icon: <User size={20} /> },
    { id: 'security', label: 'Security', icon: <Lock size={20} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={20} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={20} /> },
    { id: 'privacy', label: 'Privacy', icon: <Shield size={20} /> },
    { id: 'connected', label: 'Connected Accounts', icon: <Link2 size={20} /> }
  ]

  if (role === 'admin' || role === 'project manager') {
    sections.splice(2, 0, { id: 'project', label: 'Project Settings', icon: <FolderKanban size={20} /> })
  }
  if (role === 'admin' || role === 'team lead') {
    sections.splice(role === 'admin' ? 3 : 2, 0, { id: 'team', label: 'Team Settings', icon: <Users size={20} /> })
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleThemeChange = (newTheme) => {
    setFormData(prev => ({ ...prev, theme: newTheme }));
    const root = document.documentElement;
    if (newTheme === 'light') {
      root.classList.add('light-theme');
    } else if (newTheme === 'dark') {
      root.classList.remove('light-theme');
    } else if (newTheme === 'system') {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (systemPrefersDark) {
        root.classList.remove('light-theme');
      } else {
        root.classList.add('light-theme');
      }
    }
  };

  const handleDensityChange = (newDensity) => {
    setFormData(prev => ({ ...prev, density: newDensity }));
    const root = document.documentElement;
    if (newDensity === 'compact') {
      root.classList.add('density-compact');
    } else {
      root.classList.remove('density-compact');
    }
  };

  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 150;
          const MAX_HEIGHT = 150;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const compressedBase64 = await compressImage(file);
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ profilePicture: compressedBase64 })
      });

      const data = await res.json();
      if (res.ok) {
        updateUserLocal(data.data);
      } else {
        alert(data.message || 'Failed to upload photo');
      }
    } catch (err) {
      console.error(err);
      alert('Error compressing or uploading photo');
    }
  };

  const handlePhotoRemove = async () => {
    if (!user?.profilePicture) return;
    if (!confirm('Are you sure you want to remove your profile picture?')) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ profilePicture: '' })
      });

      const data = await res.json();
      if (res.ok) {
        updateUserLocal(data.data);
      } else {
        alert(data.message || 'Failed to remove photo');
      }
    } catch (err) {
      console.error(err);
      alert('Error removing photo');
    }
  };

  const handleSave = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          bio: formData.bio,
          theme: formData.theme,
          density: formData.density,
          publicProfile: formData.publicProfile,
          showContributionScore: formData.showContributionScore,
          showActivityTimeline: formData.showActivityTimeline,
          taskAlerts: formData.taskAlerts,
          deadlineReminders: formData.deadlineReminders,
          projectUpdates: formData.projectUpdates,
          contributionUpdates: formData.contributionUpdates,
          emailNotifications: formData.emailNotifications
        })
      });

      const data = await res.json();
      if (res.ok) {
        updateUserLocal(data.data);
        alert('Settings saved successfully!');
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Network error saving settings');
    }
  }

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all changes?')) {
      if (user) {
        setFormData({
          fullName: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          bio: user.bio || '',
          theme: user.theme || 'dark',
          density: user.density || 'comfortable',
          publicProfile: user.publicProfile !== false,
          showContributionScore: user.showContributionScore !== false,
          showActivityTimeline: user.showActivityTimeline !== false,
          taskAlerts: user.taskAlerts !== false,
          deadlineReminders: user.deadlineReminders !== false,
          projectUpdates: user.projectUpdates !== false,
          contributionUpdates: user.contributionUpdates !== false,
          emailNotifications: !!user.emailNotifications
        });

        // Reset previews
        const root = document.documentElement;
        // theme
        if (user.theme === 'light') {
          root.classList.add('light-theme');
        } else if (user.theme === 'dark') {
          root.classList.remove('light-theme');
        } else {
          const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (sysDark) root.classList.remove('light-theme');
          else root.classList.add('light-theme');
        }
        // density
        if (user.density === 'compact') {
          root.classList.add('density-compact');
        } else {
          root.classList.remove('density-compact');
        }
      }
    }
  }

  return (
    <Layout
      pageTitle="Settings"
      pageEyebrow=" settings"
      pageSubtitle="Manage your account, preferences, and security settings."
    >
      <div className="settings-layout">
        <nav className="settings-nav">
          <div className="settings-nav-header">Settings</div>
          {sections.map(section => (
            <button
              key={section.id}
              className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span className="settings-nav-icon">{section.icon}</span>
              <span>{section.label}</span>
            </button>
          ))}
          <div className="settings-nav-divider"></div>
          <button className="settings-nav-item danger" onClick={handleLogout}>
            <span className="settings-nav-icon"><LogOut size={20} /></span>
            <span>Sign Out</span>
          </button>
        </nav>

        <div className="settings-content">
          {activeSection === 'profile' && (
            <div className="settings-section">
              <h1 className="section-title">Profile Settings</h1>
              <p className="section-description">Manage your profile information and preferences.</p>

              <div className="settings-card">
                <div className="profile-picture-section">
                  <div className="profile-avatar-large" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={formData.fullName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      formData.fullName ? formData.fullName.split(' ').map(n => n[0]).join('') : 'U'
                    )}
                  </div>
                  <div className="profile-picture-actions">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                      accept="image/*"
                    />
                    <button className="btn btn-ghost" onClick={() => fileInputRef.current?.click()}>
                      <FileEdit size={16} /> Upload Photo
                    </button>
                    <button className="btn btn-ghost danger" onClick={handlePhotoRemove} disabled={!user?.profilePicture}>
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>

                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="input-with-icon">
                      <Mail size={16} />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <div className="input-with-icon">
                      <Smartphone size={16} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="form-input"
                      />
                    </div>
                  </div>
                  <div className="form-group full-width">
                    <label className="form-label">Bio</label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="form-textarea"
                      rows={4}
                    />
                  </div>
                </div>

                <div className="settings-actions">
                  <button className="btn btn-ghost" onClick={handleReset}><RotateCcw size={16} /> Reset</button>
                  <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="settings-section">
              <h1 className="section-title">Security Settings</h1>
              <p className="section-description">Secure your account with these security options.</p>

              <div className="settings-card">
                {/* Password card item */}
                <div className="security-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="security-item-info">
                      <div className="security-item-title">{user.hasPassword === false ? 'Set Password' : 'Change Password'}</div>
                      <div className="security-item-desc">{user.hasPassword === false ? 'Create a local password to enable email sign-in or disconnect Google.' : 'Update your password to keep your account secure.'}</div>
                    </div>
                    <button className="btn btn-ghost" onClick={togglePasswordForm}>
                      {showPasswordForm ? 'Cancel' : (user.hasPassword === false ? 'Set Password' : 'Change')}
                    </button>
                  </div>

                  {showPasswordForm && (
                    <form onSubmit={handlePasswordChange} style={{ marginTop: '12px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                      <div className="form-grid" style={{ gridTemplateColumns: '1fr', gap: '16px' }}>
                        {user.hasPassword !== false && (
                          <div className="form-group">
                            <label className="form-label">Current Password</label>
                            <input
                              type="password"
                              name="currentPassword"
                              value={securityForm.currentPassword}
                              onChange={handleSecurityFormChange}
                              className="form-input"
                              required
                            />
                          </div>
                        )}
                        <div className="form-group">
                          <label className="form-label">New Password</label>
                          <input
                            type="password"
                            name="newPassword"
                            value={securityForm.newPassword}
                            onChange={handleSecurityFormChange}
                            className="form-input"
                            required
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Confirm New Password</label>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={securityForm.confirmPassword}
                            onChange={handleSecurityFormChange}
                            className="form-input"
                            required
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                        <button type="button" className="btn btn-ghost" onClick={() => setShowPasswordForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary">{user.hasPassword === false ? 'Set Password' : 'Update Password'}</button>
                      </div>
                    </form>
                  )}
                </div>

                {/* 2FA item */}
                <div className="security-item" style={{ padding: '20px 0' }}>
                  <div className="security-item-info">
                    <div className="security-item-title">Two-Factor Authentication</div>
                    <div className="security-item-desc">Add an extra layer of security to your account.</div>
                    <div className="security-badge disabled">Disabled</div>
                  </div>
                  <button className="btn btn-primary" disabled>Enable</button>
                </div>

                {/* Active Sessions item */}
                <div className="security-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="security-item-info">
                      <div className="security-item-title">Active Sessions</div>
                      <div className="security-item-desc">Manage devices that are currently logged in.</div>
                    </div>
                    <button className="btn btn-ghost" onClick={toggleSessionsList}>
                      {showSessionsList ? 'Hide Sessions' : 'View Sessions'}
                    </button>
                  </div>

                  {showSessionsList && (
                    <div style={{ marginTop: '12px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                      {sessions.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No active sessions found.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {sessions.map(s => (
                            <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {s.device} {s.isCurrent && <span style={{ color: 'var(--accent-blue)', fontSize: '11px', fontWeight: '500', marginLeft: '6px' }}>(This device)</span>}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  IP: {s.ip} • Last Active: {new Date(s.lastActive).toLocaleString()}
                                </div>
                              </div>
                              {!s.isCurrent && (
                                <button className="btn btn-ghost danger btn-sm" onClick={() => handleRevokeSession(s.id)}>Revoke</button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Login History item */}
                <div className="security-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px', padding: '20px 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div className="security-item-info">
                      <div className="security-item-title">Login History</div>
                      <div className="security-item-desc">Review recent login attempts and activity.</div>
                    </div>
                    <button className="btn btn-ghost" onClick={toggleHistory}>
                      {showHistory ? 'Hide History' : 'View History'}
                    </button>
                  </div>

                  {showHistory && (
                    <div style={{ marginTop: '12px', padding: '20px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
                      {securityLogs.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)', fontSize: '13px', textAlign: 'center' }}>No security events logged.</div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {securityLogs.map(log => (
                            <div key={log._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
                              <div>
                                <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                  {log.event}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                  IP: {log.metadata?.ip || 'N/A'} • Device: {log.metadata?.device || 'N/A'}
                                </div>
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                {new Date(log.timestamp).toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h1 className="section-title">Notification Preferences</h1>
              <p className="section-description">Choose which notifications you want to receive.</p>

              <div className="settings-card">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Task Assignment Alerts</div>
                    <div className="toggle-desc">Get notified when you're assigned a new task.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="taskAlerts"
                      checked={formData.taskAlerts}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Deadline Reminders</div>
                    <div className="toggle-desc">Get reminders for upcoming task deadlines.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="deadlineReminders"
                      checked={formData.deadlineReminders}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Project Updates</div>
                    <div className="toggle-desc">Get notified about changes to your projects.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="projectUpdates"
                      checked={formData.projectUpdates}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Contribution Score Updates</div>
                    <div className="toggle-desc">Get notified when your contribution score changes.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="contributionUpdates"
                      checked={formData.contributionUpdates}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Email Notifications</div>
                    <div className="toggle-desc">Receive notifications via email.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="emailNotifications"
                      checked={formData.emailNotifications}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="settings-actions">
                  <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="settings-section">
              <h1 className="section-title">Appearance</h1>
              <p className="section-description">Customize how DevMetrics looks and feels.</p>

              <div className="settings-card">
                <h3 className="subsection-title">Theme</h3>
                <div className="theme-options">
                  <div
                    className={`theme-option ${formData.theme === 'dark' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('dark')}
                  >
                    <div className="theme-preview dark"></div>
                    <div className="theme-label"><Moon size={16} /> Dark Mode</div>
                  </div>
                  <div
                    className={`theme-option ${formData.theme === 'light' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('light')}
                  >
                    <div className="theme-preview light"></div>
                    <div className="theme-label"><Sun size={16} /> Light Mode</div>
                  </div>
                  <div
                    className={`theme-option ${formData.theme === 'system' ? 'active' : ''}`}
                    onClick={() => handleThemeChange('system')}
                  >
                    <div className="theme-preview system"></div>
                    <div className="theme-label"><Monitor size={16} /> System Theme</div>
                  </div>
                </div>

                <h3 className="subsection-title">Dashboard Density</h3>
                <div className="density-options">
                  <button
                    className={`density-btn ${formData.density === 'compact' ? 'active' : ''}`}
                    onClick={() => handleDensityChange('compact')}
                  >
                    Compact
                  </button>
                  <button
                    className={`density-btn ${formData.density === 'comfortable' ? 'active' : ''}`}
                    onClick={() => handleDensityChange('comfortable')}
                  >
                    Comfortable
                  </button>
                </div>

                <div className="settings-actions">
                  <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'privacy' && (
            <div className="settings-section">
              <h1 className="section-title">Privacy Settings</h1>
              <p className="section-description">Control your privacy and what others can see.</p>

              <div className="settings-card">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Public Profile</div>
                    <div className="toggle-desc">Allow other team members to view your profile.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="publicProfile"
                      checked={formData.publicProfile}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Show Contribution Score</div>
                    <div className="toggle-desc">Display your contribution score on your profile.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="showContributionScore"
                      checked={formData.showContributionScore}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Show Activity Timeline</div>
                    <div className="toggle-desc">Display your activity timeline to other members.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="showActivityTimeline"
                      checked={formData.showActivityTimeline}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                <div className="settings-actions">
                  <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Changes</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'connected' && (
            <div className="settings-section">
              <h1 className="section-title">Connected Accounts</h1>
              <p className="section-description">Connect your favorite tools and services.</p>

              <div className="settings-card">
                <div className="connected-account-card">
                  <div className="connected-account-icon" style={{ overflow: 'hidden', padding: 0 }}>
                    {user?.githubConnected && user.githubAvatar ? (
                      <img src={user.githubAvatar} alt="GitHub avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <GitFork size={28} />
                    )}
                  </div>
                  <div className="connected-account-info">
                    <div className="connected-account-name">GitHub</div>
                    <div className={`connected-account-status ${user?.githubConnected ? 'connected' : 'not-connected'}`}>
                      {user?.githubConnected ? '✓ Connected' : 'Not Connected'}
                    </div>
                    {user?.githubConnected && (
                      <div style={{ marginTop: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div><span style={{ color: 'var(--text-muted)' }}>Username:</span> <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user.githubUsername}</span></div>
                        <div><span style={{ color: 'var(--text-muted)' }}>GitHub ID:</span> <span style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{user.githubId}</span></div>
                      </div>
                    )}
                  </div>
                  {user?.githubConnected ? (
                    <button className="btn btn-ghost danger" onClick={handleDisconnectGitHub}><LogOut size={16} /> Disconnect</button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleConnectGitHub}><Link2 size={16} /> Connect</button>
                  )}
                </div>
                <div className="connected-account-card">
                  <div className="connected-account-icon google">
                    <svg viewBox="0 0 24 24" width={28} height={28}>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                  </div>
                  <div className="connected-account-info">
                    <div className="connected-account-name">Google</div>
                    <div className={`connected-account-status ${user?.authProvider === 'google' ? 'connected' : 'not-connected'}`}>
                      {user?.authProvider === 'google' ? '✓ Connected' : 'Not Connected'}
                    </div>
                  </div>
                  {user?.authProvider === 'google' ? (
                    <button className="btn btn-ghost danger" onClick={handleDisconnectGoogle}><LogOut size={16} /> Disconnect</button>
                  ) : (
                    <button className="btn btn-primary" onClick={handleConnectGoogle}><Link2 size={16} /> Connect</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'project' && (
            <div className="settings-section">
              <h1 className="section-title">Project Settings</h1>
              <p className="section-description">Configure preferences and integrations for your projects.</p>

              <div className="settings-card">
                <div className="toggle-item">
                  <div className="toggle-info">
                    <div className="toggle-title">Auto-Archive Completed Projects</div>
                    <div className="toggle-desc">Automatically archive projects once they reach 100% completion.</div>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      checked={projectSettings.autoArchive}
                      onChange={(e) => setProjectSettings({ ...projectSettings, autoArchive: e.target.checked })}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="form-grid" style={{ marginTop: '24px' }}>
                  <div className="form-group full-width">
                    <label className="form-label">Slack Webhook URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={projectSettings.slackWebhook}
                      onChange={(e) => setProjectSettings({ ...projectSettings, slackWebhook: e.target.value })}
                      placeholder="https://hooks.slack.com/services/..."
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Default Git Branch</label>
                    <input
                      type="text"
                      className="form-input"
                      value={projectSettings.defaultBranch}
                      onChange={(e) => setProjectSettings({ ...projectSettings, defaultBranch: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notification Threshold</label>
                    <select
                      className="form-select"
                      value={projectSettings.notificationThreshold}
                      onChange={(e) => setProjectSettings({ ...projectSettings, notificationThreshold: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="realtime">Realtime Alerts</option>
                      <option value="daily">Daily Digest</option>
                      <option value="weekly">Weekly Digest</option>
                    </select>
                  </div>
                </div>

                <div className="settings-actions" style={{ marginTop: '32px' }}>
                  <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Project Settings</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'team' && (
            <div className="settings-section">
              <h1 className="section-title">Team Settings</h1>
              <p className="section-description">Manage your engineering team rules, name, and workspace preferences.</p>

              <div className="settings-card">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Team Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={teamSettings.teamName}
                      onChange={(e) => setTeamSettings({ ...teamSettings, teamName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Daily Standup Time</label>
                    <input
                      type="time"
                      className="form-input"
                      value={teamSettings.standupTime}
                      onChange={(e) => setTeamSettings({ ...teamSettings, standupTime: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Weekly Report Day</label>
                    <select
                      className="form-select"
                      value={teamSettings.weeklyReportDay}
                      onChange={(e) => setTeamSettings({ ...teamSettings, weeklyReportDay: e.target.value })}
                      style={{
                        width: '100%',
                        background: 'var(--bg-base)',
                        border: '1px solid var(--border)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        fontSize: '15px',
                        color: 'var(--text-primary)',
                        outline: 'none'
                      }}
                    >
                      <option value="monday">Monday</option>
                      <option value="thursday">Thursday</option>
                      <option value="friday">Friday</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Team Capacity Limit (Members)</label>
                    <input
                      type="number"
                      className="form-input"
                      value={teamSettings.teamCapacity}
                      onChange={(e) => setTeamSettings({ ...teamSettings, teamCapacity: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="settings-actions" style={{ marginTop: '32px' }}>
                  <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> Save Team Settings</button>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'account' && (
            <div className="settings-section">
              <h1 className="section-title">Account Settings</h1>
              <p className="section-description">Manage your account details and preferences.</p>
              <div className="settings-card">
                <div className="placeholder-section">
                  <div className="placeholder-icon">⚙️</div>
                  <div className="placeholder-text">Account settings panel</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default SettingsDashboard
