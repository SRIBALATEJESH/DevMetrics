import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';
import API_BASE_URL from '../config/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AdminDashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    projects: 0,
    teams: 0,
    tasks: 0,
    users: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        const [projRes, teamRes, taskRes, userRes, logsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects`, { headers }),
          fetch(`${API_BASE_URL}/api/teams`, { headers }),
          fetch(`${API_BASE_URL}/api/tasks`, { headers }),
          fetch(`${API_BASE_URL}/api/users`, { headers }),
          fetch(`${API_BASE_URL}/api/activities`, { headers })
        ]);

        const projData = await projRes.json();
        const teamData = await teamRes.json();
        const taskData = await taskRes.json();
        const userData = await userRes.json();
        const logsData = await logsRes.json();

        if (projRes.ok && teamRes.ok && taskRes.ok && userRes.ok) {
          setStats({
            projects: projData.data ? projData.data.length : 0,
            teams: teamData.data ? teamData.data.length : 0,
            tasks: taskData.data ? taskData.data.length : 0,
            users: userData.data ? userData.data.length : 0
          });
          setLogs(logsData.data ? logsData.data.slice(0, 10) : []);
        } else {
          setError('Failed to retrieve full system statistics.');
        }
      } catch (err) {
        setError('Network error fetching admin metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [token]);

  const barData = {
    labels: ['Projects', 'Teams', 'Tasks', 'Users'],
    datasets: [
      {
        label: 'Count',
        data: [stats.projects, stats.teams, stats.tasks, stats.users],
        backgroundColor: 'hsla(210, 70%, 60%, 0.7)',
        borderColor: 'hsla(210, 70%, 55%, 1)',
        borderWidth: 1,
      },
    ],
  };

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'System Load %',
        data: [12, 18, 14, 25, 20, 22, 30],
        borderColor: 'hsla(210, 70%, 55%, 1)',
        backgroundColor: 'rgba(79, 142, 247, 0.08)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const pieData = {
    labels: ['Completed Tasks', 'Active Tasks'],
    datasets: [
      {
        data: [stats.tasks > 0 ? 60 : 0, stats.tasks > 0 ? 40 : 0],
        backgroundColor: [
          'hsla(120, 70%, 55%, 0.8)',
          'hsla(30, 80%, 60%, 0.8)',
        ],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Layout
      pageTitle="Admin Insights"
      pageEyebrow=" system analytics"
      pageSubtitle="Detailed charts, system metrics, and real-time event logs."
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Aggregating global system metadata from database...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <div className="admin-dashboard">
          <div className="admin-dashboard__grid">
            <div className="admin-dashboard__card">
              <h2>System Load Chart</h2>
              <div style={{ height: 220, position: 'relative' }}>
                <Line data={lineData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />
              </div>
            </div>
            <div className="admin-dashboard__card">
              <h2>System Logs Feed</h2>
              <div style={{ height: 220, overflowY: 'auto', paddingRight: '4px' }} className="logs-feed-container">
                {logs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No logs recorded.
                  </div>
                ) : (
                  logs.map((log) => (
                    <div key={log._id} className="log-feed-item">
                      <div className="log-badge-container">
                        <span className={`log-badge info`}>
                          info
                        </span>
                        <span>
                          <strong>{log.user ? log.user.name : 'System'}:</strong> {log.event}
                        </span>
                      </div>
                      <span className="log-time">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="admin-dashboard__grid" style={{ marginTop: '20px' }}>
            <div className="admin-dashboard__card">
              <h2>Database Collections Overview</h2>
              <div style={{ height: 220, position: 'relative' }}>
                <Bar data={barData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }} />
              </div>
            </div>
            <div className="admin-dashboard__card">
              <h2>Global Task Distribution</h2>
              <div style={{ height: 220, position: 'relative' }}>
                <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: false }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
