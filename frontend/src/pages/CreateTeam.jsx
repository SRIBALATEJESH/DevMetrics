import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import './CreateProject.css';

const CreateTeam = () => {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    teamName: '',
    lead: '',
    project: '',
    members: []
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
          setError('Failed to fetch users or projects list.');
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

    if (!formData.teamName || !formData.lead) {
      setError('Please provide team name and team lead.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        navigate('/team-directory');
      } else {
        setError(data.message || 'Failed to create team');
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

  const handleMemberToggle = (memberId) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(m => m !== memberId)
        : [...prev.members, memberId]
    }));
  };

  return (
    <Layout
      pageTitle="Create New Team"
      pageEyebrow="create team"
      pageSubtitle="Set up a new team and start collaborating."
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
            <label className="form-label">Team Name</label>
            <input
              type="text"
              name="teamName"
              value={formData.teamName}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Team Lead</label>
            <select
              name="lead"
              value={formData.lead}
              onChange={handleChange}
              className="form-select"
              required
            >
              <option value="">Select team lead</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assign to Project (Optional)</label>
            <select
              name="project"
              value={formData.project}
              onChange={handleChange}
              className="form-select"
            >
              <option value="">None</option>
              {projects.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Team Members</label>
            <div className="members-checkboxes">
              {users.map(member => (
                <label key={member._id} className="checkbox-label">
                  <input
                    type="checkbox"
                    className="chk"
                    checked={formData.members.includes(member._id)}
                    onChange={() => handleMemberToggle(member._id)}
                  />
                  <span>{member.name} ({member.role})</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Link to="/team-directory" className="btn btn-ghost">Cancel</Link>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default CreateTeam;
