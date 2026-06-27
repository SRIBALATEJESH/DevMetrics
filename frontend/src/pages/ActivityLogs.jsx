import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import Layout from '../components/Layout';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const { token } = useAuth();
  const { currentRole } = useRole();
  const role = currentRole?.toLowerCase();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters & Pagination State
  const [actionFilter, setActionFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const isAdmin = role === 'admin';

  const getFilteredLogs = () => {
    return logs.filter(log => {
      // 1. Text Search by Username
      const matchesUser = log.user
        ? log.user.name.toLowerCase().includes(searchQuery.toLowerCase())
        : 'system'.includes(searchQuery.toLowerCase());

      // 2. Action Type Filter
      let matchesAction = true;
      if (actionFilter === 'login') {
        matchesAction = log.event.toLowerCase().includes('logged in') || log.event.toLowerCase().includes('register');
      } else if (actionFilter === 'logout') {
        matchesAction = log.event.toLowerCase().includes('logout') || log.event.toLowerCase().includes('revoked');
      } else if (actionFilter === 'password') {
        matchesAction = log.event.toLowerCase().includes('password');
      }

      // 3. Role Filter
      let matchesRole = true;
      if (roleFilter !== 'all') {
        const userRole = log.user ? log.user.role.toLowerCase() : 'system';
        matchesRole = userRole === roleFilter.toLowerCase();
      }

      return matchesUser && matchesAction && matchesRole;
    });
  };

  useEffect(() => {
    const fetchLogs = async () => {
      if (!isAdmin) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError('');
        const res = await fetch('http://localhost:5000/api/activities', {
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        if (res.ok) {
          setLogs(data.data || []);
        } else {
          setError(data.message || 'Failed to fetch activity logs');
        }
      } catch (err) {
        setError('Network error fetching activity logs');
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [token, role, isAdmin]);

  // Pagination indexing
  const filteredLogs = getFilteredLogs();
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  return (
    <Layout
      pageTitle="Activity Logs"
      pageEyebrow=" activity logs"
      pageSubtitle="Complete audit trail of all project activities."
    >
      <div className="card" style={{ padding: '24px', width: '100%', overflow: 'hidden' }}>
        <div className="card-title">Recent Activity</div>

        {isAdmin && !loading && !error && (
          <div style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ flex: '1 1 200px' }}>
              <input
                type="text"
                placeholder="Search username…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="form-input"
                style={{ padding: '8px 12px', fontSize: '13px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%', color: 'var(--text-primary)', outline: 'none' }}
              />
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '13px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="all">All Actions</option>
                <option value="login">Logins & Registrations</option>
                <option value="logout">Logouts & Sessions</option>
                <option value="password">Password Changes</option>
              </select>
            </div>
            <div style={{ flex: '1 1 150px' }}>
              <select
                value={roleFilter}
                onChange={(e) => { setRoleFilter(e.target.value); setCurrentPage(1); }}
                className="form-select"
                style={{ padding: '8px 12px', fontSize: '13px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', width: '100%', color: 'var(--text-primary)', outline: 'none' }}
              >
                <option value="all">All Roles</option>
                <option value="admin">Admin</option>
                <option value="project manager">Project Manager</option>
                <option value="team lead">Team Lead</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester</option>
              </select>
            </div>
          </div>
        )}

        {!isAdmin ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}>
            ⚠️ Access Denied: Project Manager, Team Lead, Developer, and Tester roles do not have permission to view general system audit trails.
          </div>
        ) : loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
            Loading audit trails from database...
          </div>
        ) : error ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-red)' }}>
            ⚠️ {error}
          </div>
        ) : (
          <>
            <div className="table-responsive" style={{ overflowX: 'auto', width: '100%' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>User</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Action</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Role</th>
                    <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontWeight: '600' }}>Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {currentLogs.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                        No activity logs found matching the filters.
                      </td>
                    </tr>
                  ) : (
                    currentLogs.map((log) => (
                      <tr key={log._id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div className="log-avatar" style={{ width: '28px', height: '28px', fontSize: '11px', margin: 0 }}>
                            {log.user ? log.user.name.charAt(0) : 'S'}
                          </div>
                          <span style={{ fontWeight: '600' }}>{log.user ? log.user.name : 'System'}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{log.event}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className="log-project" style={{ textTransform: 'capitalize', fontSize: '11px', display: 'inline-block' }}>
                            {log.user ? log.user.role : 'System'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="btn btn-ghost"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ActivityLogs;
