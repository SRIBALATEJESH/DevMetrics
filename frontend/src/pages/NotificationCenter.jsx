import React, { useState, useEffect } from 'react'
import {
  Search,
  CheckCircle2,
  Bell,
  FolderKanban,
  Users,
  CheckSquare,
  BarChart3,
  FileText,
  User,
  Eye,
  Trash2,
  Clock,
  AlertTriangle,
  GitCommit,
  Inbox,
  BellDot,
  ClipboardList,
  AlertOctagon,
  Server
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import './NotificationCenter.css'

const NotificationCenter = () => {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState('all')
  const [selectedNotification, setSelectedNotification] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')

  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('http://localhost:5000/api/notifications', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setNotifications(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch notifications.');
      }
    } catch (err) {
      setError('Network error fetching notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [token]);

  const getNotificationIcon = (type) => {
    let glowClass = 'blue-glow';
    let icon = <Bell size={18} />;

    if (type === 'task') {
      glowClass = 'teal-glow';
      icon = <CheckSquare size={18} />;
    } else if (type === 'project') {
      glowClass = 'blue-glow';
      icon = <FolderKanban size={18} />;
    } else if (type === 'team') {
      glowClass = 'purple-glow';
      icon = <Users size={18} />;
    } else if (type === 'system') {
      glowClass = 'red-glow';
      icon = <AlertOctagon size={18} />;
    }

    return (
      <div className={`notification-icon-wrapper ${glowClass}`}>
        {icon}
      </div>
    );
  };

  const getDetailsGlowClass = (type) => {
    if (type === 'task') return 'teal-glow';
    if (type === 'project') return 'blue-glow';
    if (type === 'team') return 'purple-glow';
    if (type === 'system') return 'red-glow';
    return 'blue-glow';
  };

  const getPriority = (type) => {
    if (type === 'system') return 'Urgent';
    if (type === 'task') return 'High';
    if (type === 'project') return 'Medium';
    return 'Low';
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'Low': return 'var(--accent-teal)'
      case 'Medium': return 'var(--accent-yellow)'
      case 'High': return '#ef4444'
      case 'Urgent': return '#dc2626'
      default: return 'var(--accent-blue)'
    }
  }

  const mappedNotifications = notifications.map(n => ({
    id: n._id,
    type: n.type,
    title: n.type ? (n.type.charAt(0).toUpperCase() + n.type.slice(1) + ' Alert') : 'Alert',
    description: n.message,
    user: { name: 'System Log', initials: 'SYS' },
    time: new Date(n.createdAt).toLocaleString(),
    priority: getPriority(n.type),
    read: n.isRead,
    project: null,
    task: null
  }));

  const filteredNotifications = mappedNotifications.filter(notification => {
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'unread' && !notification.read) ||
      (activeTab === 'read' && notification.read) ||
      (activeTab === 'system' && notification.type === 'system')

    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesPriority = filterPriority === 'all' || notification.priority === filterPriority

    return matchesTab && matchesSearch && matchesPriority
  })

  const unreadCount = mappedNotifications.filter(n => !n.read).length
  const taskAlertsCount = mappedNotifications.filter(n => n.type === 'task').length
  const systemAlertsCount = mappedNotifications.filter(n => n.type === 'system').length

  const handleMarkRead = async (notificationId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      if (res.ok) {
        setNotifications(notifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        ))
      }
    } catch (err) {
      console.error('Error marking notification read', err);
    }
  }

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    try {
      await Promise.all(unread.map(n =>
        fetch(`http://localhost:5000/api/notifications/${n._id}/read`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        })
      ));
      fetchNotifications();
    } catch (err) {
      console.error('Error marking all read', err);
    }
  }

  const handleDeleteNotification = async (notificationId) => {
    if (confirm('Are you sure you want to delete this notification?')) {
      try {
        const res = await fetch(`http://localhost:5000/api/notifications/${notificationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        if (res.ok) {
          setNotifications(notifications.filter(n => n._id !== notificationId))
          if (selectedNotification?.id === notificationId) {
            setSelectedNotification(null)
          }
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to delete notification');
        }
      } catch (err) {
        alert('Error deleting notification');
      }
    }
  }

  return (
    <Layout
      pageTitle="Notification Center"
      pageEyebrow=" notifications"
      pageSubtitle="Stay updated with the latest activity in your workspace."
    >
      <div className={`notifications-layout ${selectedNotification ? 'has-selected' : ''}`}>
        <div className="notifications-main">
          <div className="notifications-header">
            <h1 className="notifications-title">Notification Center</h1>
            <div className="notifications-actions">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={16} />
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="filter-dropdown">
                <select
                  className="filter-select"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="Urgent">Urgent</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
              <button className="btn btn-ghost" onClick={handleMarkAllRead}><CheckCircle2 size={16} /> Mark All Read</button>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Loading notifications from database...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
              ⚠️ {error}
            </div>
          ) : (
            <div className="notifications-main-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-glow blue-glow">
                    <Inbox size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{mappedNotifications.length}</div>
                    <div className="stat-label">Total Notifications</div>
                  </div>
                </div>
                <div className="stat-card highlight">
                  <div className="stat-icon-glow purple-glow">
                    <BellDot size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{unreadCount}</div>
                    <div className="stat-label">Unread Notifications</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-glow teal-glow">
                    <ClipboardList size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{taskAlertsCount}</div>
                    <div className="stat-label">Task Alerts</div>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon-glow red-glow">
                    <AlertOctagon size={20} />
                  </div>
                  <div className="stat-content">
                    <div className="stat-number">{systemAlertsCount}</div>
                    <div className="stat-label">System Alerts</div>
                  </div>
                </div>
              </div>

              <div className="notifications-tabs">
                <button
                  className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`}
                  onClick={() => setActiveTab('unread')}
                >
                  Unread
                  {unreadCount > 0 && <span className="tab-count">{unreadCount}</span>}
                </button>
                <button
                  className={`tab-btn ${activeTab === 'read' ? 'active' : ''}`}
                  onClick={() => setActiveTab('read')}
                >
                  Read
                </button>
                <button
                  className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
                  onClick={() => setActiveTab('system')}
                >
                  System Alerts
                </button>
              </div>

              <div className="notifications-list">
                {filteredNotifications.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon-glow">
                      <Inbox size={32} />
                    </div>
                    <div className="empty-title">No notifications found</div>
                    <div className="empty-desc">Try adjusting your filters or search query</div>
                  </div>
                ) : filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-card ${!notification.read ? 'unread' : ''} ${selectedNotification?.id === notification.id ? 'selected' : ''}`}
                    onClick={() => {
                      setSelectedNotification(notification)
                      if (!notification.read) {
                        handleMarkRead(notification.id)
                      }
                    }}
                  >
                    <div className="notification-icon">{getNotificationIcon(notification.type)}</div>
                    <div className="notification-content">
                      <div className="notification-header">
                        <div className="notification-title">{notification.title}</div>
                        <span
                          className="priority-badge"
                          style={{ backgroundColor: getPriorityColor(notification.priority) + '20', color: getPriorityColor(notification.priority) }}
                        >
                          {notification.priority}
                        </span>
                      </div>
                      <div className="notification-description">{notification.description}</div>
                      <div className="notification-meta">
                        <div className="notification-user">
                          <div className="user-avatar-small">{notification.user.initials}</div>
                          <span>{notification.user.name}</span>
                        </div>
                        <span className="notification-time">{notification.time}</span>
                      </div>
                    </div>
                    {!notification.read && <div className="unread-indicator"></div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {selectedNotification && (
          <div className="notification-details-panel">
            <div className="details-header">
              <div className="details-title">Notification Details</div>
              <button
                className="close-btn"
                onClick={() => setSelectedNotification(null)}
              >
                ✕
              </button>
            </div>

            <div className="details-content">
              <div className={`details-icon ${getDetailsGlowClass(selectedNotification.type)}`}>
                {selectedNotification.type === 'task' && <CheckSquare size={26} />}
                {selectedNotification.type === 'project' && <FolderKanban size={26} />}
                {selectedNotification.type === 'team' && <Users size={26} />}
                {selectedNotification.type === 'system' && <AlertOctagon size={26} />}
                {!selectedNotification.type && <Bell size={26} />}
              </div>
              <h2 className="details-heading">{selectedNotification.title}</h2>
              <p className="details-desc">{selectedNotification.description}</p>

              <div className="details-meta">
                <div className="meta-item">
                  <span className="meta-label">Priority</span>
                  <span
                    className="priority-badge"
                    style={{ backgroundColor: getPriorityColor(selectedNotification.priority) + '20', color: getPriorityColor(selectedNotification.priority) }}
                  >
                    {selectedNotification.priority}
                  </span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Time</span>
                  <span className="meta-value">{selectedNotification.time}</span>
                </div>
              </div>

              <div className="details-actions">
                <button className="btn btn-danger" onClick={() => handleDeleteNotification(selectedNotification.id)}><Trash2 size={16} /> Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default NotificationCenter
