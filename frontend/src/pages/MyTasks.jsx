import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import Layout from '../components/Layout';
import './MyTasks.css';
import API_BASE_URL from '../config/api';

const MyTasks = () => {
  const { user, token } = useAuth();
  const { currentRole } = useRole();
  const role = currentRole?.toLowerCase();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyTasks = async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch(`${API_BASE_URL}/api/tasks?assignee=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();

      if (res.ok) {
        setTasks(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch tasks list.');
      }
    } catch (err) {
      setError('Network error. Cannot load tasks.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [user, token]);

  const getPriorityColor = (priority) => {
    const prio = priority ? priority.toLowerCase() : '';
    switch (prio) {
      case 'critical': return 'var(--accent-red)';
      case 'high': return 'var(--accent-red)';
      case 'medium': return 'var(--accent-yellow)';
      case 'low': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const getStatusColor = (status) => {
    const stat = status ? status.toLowerCase() : '';
    switch (stat) {
      case 'done': return 'var(--accent-green)';
      case 'in progress': return 'var(--accent-blue)';
      case 'review': return 'var(--accent-purple)';
      case 'todo': return 'var(--text-muted)';
      default: return 'var(--text-muted)';
    }
  };

  const handleMarkDone = async (taskId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: 'done', completionDate: new Date() })
      });

      if (res.ok) {
        fetchMyTasks();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to mark task as done');
      }
    } catch (err) {
      alert('Error updating task status');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          }
        });

        if (res.ok) {
          setTasks(tasks.filter(task => task._id !== taskId));
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to delete task');
        }
      } catch (err) {
        alert('Error deleting task');
      }
    }
  };

  return (
    <Layout
      pageTitle="My Tasks"
      pageSubtitle="View and manage all tasks assigned to you."
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading your tasks from database...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="task-table-full">
            <thead>
              <tr>
                <th>Task</th>
                <th>Project</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Deadline</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
                    No tasks assigned to you.
                  </td>
                </tr>
              ) : (
                tasks.map(task => (
                  <tr key={task._id}>
                    <td className="task-name-cell">{task.title}</td>
                    <td>{task.project ? task.project.title : 'N/A'}</td>
                    <td>
                      <span className="pill" style={{ background: `${getPriorityColor(task.priority)}20`, color: getPriorityColor(task.priority), textTransform: 'capitalize' }}>
                        {task.priority}
                      </span>
                    </td>
                    <td>
                      <span className="pill" style={{ background: `${getStatusColor(task.status)}20`, color: getStatusColor(task.status), textTransform: 'capitalize' }}>
                        {task.status}
                      </span>
                    </td>
                    <td>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'None'}</td>
                    <td>
                      {task.status !== 'done' && (
                        <button onClick={() => handleMarkDone(task._id)} className="btn btn-ghost btn-sm">
                          ✔️ Mark Done
                        </button>
                      )}
                      {['admin', 'project manager', 'team lead'].includes(role) && (
                        <button onClick={() => handleDeleteTask(task._id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--accent-red)' }}>
                          🗑️ Delete
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </Layout>
  );
};

export default MyTasks;
