import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import Layout from '../components/Layout';
import './TaskBoard.css';

const TaskBoard = () => {
  const { user, token } = useAuth();
  const { currentRole } = useRole();
  const role = currentRole?.toLowerCase();
  const isManagement = ['admin', 'project manager', 'team lead'].includes(role);

  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const columns = [
    { id: 'todo', title: 'Todo', color: 'var(--text-muted)' },
    { id: 'in progress', title: 'In Progress', color: 'var(--accent-blue)' },
    { id: 'review', title: 'Review', color: 'var(--accent-yellow)' },
    { id: 'done', title: 'Done', color: 'var(--accent-green)' },
  ];

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };

      const res = await fetch('http://localhost:5000/api/tasks', { headers });
      const data = await res.json();

      if (res.ok) {
        setTasks(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch tasks board.');
      }
    } catch (err) {
      setError('Network error. Cannot retrieve tasks.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/users', {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchTasks();
    if (isManagement) {
      fetchUsers();
    }
  }, [token, role]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        fetchTasks();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update task status');
      }
    } catch (err) {
      alert('Error updating task status');
    }
  };

  const handleAssigneeChange = async (taskId, newAssigneeId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ assignee: newAssigneeId || null })
      });
      if (res.ok) {
        fetchTasks();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to assign task');
      }
    } catch (err) {
      alert('Error assigning task');
    }
  };

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

  // Group tasks by their status
  const tasksByStatus = {
    'todo': [],
    'in progress': [],
    'review': [],
    'done': []
  };

  tasks.forEach(task => {
    const status = task.status ? task.status.toLowerCase() : 'todo';

    if (tasksByStatus[status]) {
      tasksByStatus[status].push(task);
    } else {
      tasksByStatus['todo'].push(task);
    }
  });

  return (
    <Layout
      pageTitle="Task Board"
      pageEyebrow=" task board"
      pageSubtitle="Visualize your workflow with this Kanban board."
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading task board from database...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map(column => (
            <div key={column.id} className="kanban-column">
              <div className="column-header">
                <div className="column-title">
                  <span className="column-dot" style={{ background: column.color }}></span>
                  {column.title}
                </div>
                <span className="column-count">{tasksByStatus[column.id].length}</span>
              </div>
              <div className="column-tasks">
                {tasksByStatus[column.id].length === 0 ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '12px' }}>
                    No tasks.
                  </div>
                ) : (
                  tasksByStatus[column.id].map(task => {
                    const isAssignee = task.assignee && (task.assignee._id === user?.id || task.assignee === user?.id);
                    const canUpdateStatus = isManagement || isAssignee;

                    return (
                      <div key={task._id} className="task-card">
                        <div className="task-title">{task.title}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                          Project: {task.project ? task.project.title : 'None'}
                        </div>
                        <div className="task-meta">
                          <span className="task-priority" style={{ color: getPriorityColor(task.priority), textTransform: 'capitalize' }}>{task.priority}</span>
                          {!isManagement && (
                            <span className="task-assignee">
                              Assignee: {task.assignee ? (task.assignee.name || task.assignee) : 'Unassigned'}
                            </span>
                          )}
                        </div>

                        <div className="task-dropdown-container">
                          {isManagement && (
                            <div className="task-dropdown-row">
                              <span className="task-dropdown-label">Assignee</span>
                              <select
                                value={task.assignee?._id || task.assignee || ''}
                                onChange={(e) => handleAssigneeChange(task._id, e.target.value)}
                                className="task-dropdown-select"
                              >
                                <option value="">Unassigned</option>
                                {users.map(u => (
                                  <option key={u._id} value={u._id}>{u.name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="task-dropdown-row">
                            <span className="task-dropdown-label">Status</span>
                            {canUpdateStatus ? (
                              <select
                                value={task.status ? task.status.toLowerCase() : 'todo'}
                                onChange={(e) => handleStatusChange(task._id, e.target.value)}
                                className="task-dropdown-select"
                              >
                                <option value="todo">Todo</option>
                                <option value="in progress">In Progress</option>
                                <option value="review">Review</option>
                                <option value="done">Done</option>
                              </select>
                            ) : (
                              <div style={{
                                padding: '4px 8px',
                                fontSize: '11px',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid var(--border)',
                                borderRadius: '4px',
                                color: 'var(--text-muted)',
                                textTransform: 'capitalize'
                              }}>
                                {task.status} (Read Only)
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
};

export default TaskBoard;
