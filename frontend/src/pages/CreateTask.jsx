import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './CreateTask.css';

const CreateTask = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    complexity: 'medium',
    priority: 'medium',
    assignee: '',
    deadline: '',
  });

  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsersAndProjects = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        const [usersRes, projectsRes] = await Promise.all([
          fetch('http://localhost:5000/api/users', { headers }),
          fetch('http://localhost:5000/api/projects', { headers })
        ]);

        const usersData = await usersRes.json();
        const projectsData = await projectsRes.json();

        if (usersRes.ok && projectsRes.ok) {
          setUsers(usersData.data || []);
          setProjects(projectsData.data || []);
        } else {
          setError('Failed to fetch lookup data for task creation.');
        }
      } catch (err) {
        setError('Network error fetching lookup details.');
      }
    };

    fetchUsersAndProjects();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title || !formData.project) {
      setError('Please provide task title and assign to a project.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        complexity: formData.complexity.toLowerCase(),
        priority: formData.priority.toLowerCase(),
        assignee: formData.assignee || undefined
      };

      const res = await fetch('http://localhost:5000/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok) {
        navigate('/task-board');
      } else {
        setError(data.message || 'Failed to create task');
      }
    } catch (err) {
      setError('Network error. Cannot connect to API server.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <Layout
      pageTitle="Create New Task"
      pageEyebrow=" create task"
      pageSubtitle="Add a new task to your project."
    >
      <div className="form-card">
        {error && (
          <div style={{
            padding: '10px 14px',
            background: 'rgba(248, 113, 113, 0.1)',
            border: '1px solid rgba(248, 113, 113, 0.3)',
            borderRadius: '8px',
            color: '#f87171',
            fontSize: '13px',
            marginBottom: '16px'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter task title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe the task"
              rows="4"
              required
            ></textarea>
          </div>

          <div className="form-group">
            <label className="form-label">Associated Project</label>
            <select
              name="project"
              value={formData.project}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select project</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Complexity</label>
              <select
                name="complexity"
                value={formData.complexity}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="form-select"
              >
                <option value="">Select assignee (Optional)</option>
                {users.map(u => (
                  <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="form-input"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <Link to="/task-board" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTask;
