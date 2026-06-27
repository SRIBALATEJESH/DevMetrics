import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { GitCommit, GitPullRequest, AlertCircle, FileText, CheckCircle2, Link2, PlusCircle, RefreshCw, Trophy } from 'lucide-react';
import './UniversalTimeline.css';

const UniversalTimeline = () => {
  const { token } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dropdown filtering states
  const [eventFilter, setEventFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/timeline', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setEvents(data.data || []);
      } else {
        setError(data.message || 'Failed to load timeline events');
      }
    } catch (err) {
      setError('Network error loading timeline events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
  }, [token]);

  // Filter events based on selected dropdown criteria
  const getFilteredEvents = () => {
    return events.filter(e => {
      // 1. Search Query
      const matchesSearch = e.event.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (e.user ? e.user.name.toLowerCase().includes(searchQuery.toLowerCase()) : 'system'.includes(searchQuery.toLowerCase()));

      // 2. Role Filter
      let matchesRole = true;
      if (roleFilter !== 'all') {
        const userRole = e.user ? e.user.role.toLowerCase() : 'system';
        matchesRole = userRole === roleFilter.toLowerCase();
      }

      // 3. Event Filter
      let matchesEvent = true;
      if (eventFilter !== 'all') {
        const txt = e.event.toLowerCase();
        if (eventFilter === 'auth') {
          matchesEvent = txt.includes('login') || txt.includes('register') || txt.includes('logged in') || txt.includes('session');
        } else if (eventFilter === 'project') {
          matchesEvent = txt.includes('project');
        } else if (eventFilter === 'task') {
          matchesEvent = txt.includes('task');
        } else if (eventFilter === 'github') {
          matchesEvent = txt.includes('commit') || txt.includes('push') || txt.includes('pull request') || txt.includes('pr ') || txt.includes('sync');
        } else if (eventFilter === 'achievement') {
          matchesEvent = txt.includes('achievement') || txt.includes('unlocked') || txt.includes('badge');
        }
      }

      return matchesSearch && matchesRole && matchesEvent;
    });
  };

  // Map event details to custom icons & categories
  const getEventIcon = (eventText) => {
    const txt = eventText.toLowerCase();
    if (txt.includes('commit') || txt.includes('push')) return <GitCommit size={16} className="timeline-icon-svg commit" />;
    if (txt.includes('pr ') || txt.includes('pull request')) return <GitPullRequest size={16} className="timeline-icon-svg pr" />;
    if (txt.includes('issue')) return <AlertCircle size={16} className="timeline-icon-svg issue" />;
    if (txt.includes('report') || txt.includes('export')) return <FileText size={16} className="timeline-icon-svg report" />;
    if (txt.includes('completed') || txt.includes('finish') || txt.includes('closed')) return <CheckCircle2 size={16} className="timeline-icon-svg success" />;
    if (txt.includes('link') || txt.includes('connect')) return <Link2 size={16} className="timeline-icon-svg link" />;
    if (txt.includes('created') || txt.includes('add')) return <PlusCircle size={16} className="timeline-icon-svg create" />;
    if (txt.includes('achievement') || txt.includes('unlocked') || txt.includes('trophy')) return <Trophy size={16} className="timeline-icon-svg trophy" />;
    return <RefreshCw size={16} className="timeline-icon-svg default" />;
  };

  const getEventTime = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getEventDate = (timestamp) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Group events by date
  const groupEventsByDate = () => {
    const groups = {};
    const filtered = getFilteredEvents();
    filtered.forEach(e => {
      const dateStr = getEventDate(e.timestamp);
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(e);
    });
    return groups;
  };

  const groupedEvents = groupEventsByDate();

  return (
    <Layout
      pageTitle="Universal Timeline"
      pageEyebrow=" activity timeline"
      pageSubtitle="Track every commit, milestone, task update, and system event in real-time."
    >
      <div className="universal-timeline-container">
        <div className="timeline-actions glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
            <h3 style={{ margin: 0 }}>Central Engineering Stream</h3>
            <button className="btn btn-ghost refresh-btn" onClick={fetchTimeline} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} />
              Refresh
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
            <input
              type="text"
              placeholder="Search user or action..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: '1 1 200px',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            />
            <select
              value={eventFilter}
              onChange={(e) => setEventFilter(e.target.value)}
              style={{
                flex: '1 1 150px',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="all">All Events</option>
              <option value="auth">Logins & Registrations</option>
              <option value="project">Project Events</option>
              <option value="task">Task Events</option>
              <option value="github">Commits, PRs & Syncs</option>
              <option value="achievement">Achievements</option>
            </select>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              style={{
                flex: '1 1 150px',
                padding: '8px 12px',
                fontSize: '13px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: '6px',
                color: 'var(--text-primary)',
                outline: 'none'
              }}
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="project manager">Project Manager</option>
              <option value="team lead">Team Lead</option>
              <option value="developer">Developer</option>
              <option value="tester">Tester</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <RefreshCw className="spin" size={32} />
            <p>Reconstructing activity trail...</p>
          </div>
        ) : error ? (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <div className="empty-timeline glass-card">
            <p>No activity logs found matching the selected filters.</p>
          </div>
        ) : (
          <div className="timeline-stream">
            {Object.keys(groupedEvents).map((date, idx) => (
              <div key={idx} className="timeline-day-group">
                <div className="timeline-day-header">{date}</div>
                <div className="timeline-day-events">
                  {groupedEvents[date].map((event) => (
                    <div key={event._id} className="timeline-item">
                      <div className="timeline-time">{getEventTime(event.timestamp)}</div>
                      <div className="timeline-badge-container">
                        {getEventIcon(event.event)}
                      </div>
                      <div className="timeline-body glass-card">
                        <div className="timeline-content">
                          <span className="user-name">{event.user ? event.user.name : 'System'}</span>
                          <span className="action-text">{event.event}</span>
                        </div>
                        <div className="timeline-meta">
                          <span className="user-role">{event.user ? event.user.role : 'System'}</span>
                          {event.metadata?.repositoryName && (
                            <span className="repo-tag">@{event.metadata.repositoryName}</span>
                          )}
                          {event.metadata?.projectName && (
                            <span className="project-tag">Proj: {event.metadata.projectName}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default UniversalTimeline;
