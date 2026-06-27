import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useRole } from '../context/RoleContext';
import { useAuth } from '../context/AuthContext';
import './TeamDirectory.css';
import API_BASE_URL from '../config/api';

const TeamDirectory = () => {
  const { currentRole } = useRole();
  const { token, user: currentUser } = useAuth();
  const role = currentRole?.toLowerCase();

  const [teams, setTeams] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showAddMember, setShowAddMember] = useState(null);
  const [newMemberId, setNewMemberId] = useState('');

  const fetchTeamsAndUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const headers = {
        'Authorization': `Bearer ${token || localStorage.getItem('token')}`
      };

      // 1. Fetch Teams
      const teamsRes = await fetch(`${API_BASE_URL}/api/teams`, { headers });
      const teamsData = await teamsRes.json();

      // 2. Fetch Users (for assignment)
      const usersRes = await fetch(`${API_BASE_URL}/api/users`, { headers });
      const usersData = await usersRes.json();

      if (teamsRes.ok && usersRes.ok) {
        setTeams(teamsData.data || []);
        setUsers(usersData.data || []);
      } else {
        setError(teamsData.message || usersData.message || 'Failed to fetch team directories');
      }
    } catch (err) {
      setError('Network error. Cannot retrieve team info.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamsAndUsers();
  }, [token]);

  const canCreate = () => ['admin', 'project manager'].includes(role);
  const canEdit = () => ['admin', 'project manager', 'team lead'].includes(role);
  const canAssignLead = () => ['admin', 'project manager'].includes(role);

  const handleAddMember = async (teamId) => {
    if (!newMemberId) return;
    const team = teams.find(t => t._id === teamId);
    if (!team) return;

    // Check if user is already a member
    const isAlreadyMember = team.members.some(m => m._id === newMemberId);
    if (isAlreadyMember) {
      alert('User is already in this team.');
      return;
    }

    try {
      const updatedMembers = [...team.members.map(m => m._id), newMemberId];

      const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ members: updatedMembers })
      });

      if (res.ok) {
        setNewMemberId('');
        setShowAddMember(null);
        fetchTeamsAndUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to add member');
      }
    } catch (err) {
      alert('Error adding team member');
    }
  };

  const handleRemoveMember = async (teamId, memberId, memberName) => {
    if (confirm(`Are you sure you want to remove ${memberName}?`)) {
      const team = teams.find(t => t._id === teamId);
      if (!team) return;

      try {
        const updatedMembers = team.members.map(m => m._id).filter(id => id !== memberId);

        const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token || localStorage.getItem('token')}`
          },
          body: JSON.stringify({ members: updatedMembers })
        });

        if (res.ok) {
          fetchTeamsAndUsers();
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to remove member');
        }
      } catch (err) {
        alert('Error removing team member');
      }
    }
  };

  const handleAssignLead = async (teamId, newLeadId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/teams/${teamId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ lead: newLeadId })
      });

      if (res.ok) {
        fetchTeamsAndUsers();
      } else {
        const data = await res.json();
        alert(data.message || 'Failed to update lead');
      }
    } catch (err) {
      alert('Error updating team lead');
    }
  };

  const filteredTeams = teams.filter(team => {
    if (role === 'admin' || role === 'project manager') return true;
    return team.members.some(m => m._id === currentUser?.id) || (team.lead && team.lead._id === currentUser?.id);
  });

  return (
    <Layout
      pageTitle="Team Directory"
      pageEyebrow=" team directory"
      pageSubtitle="Manage your engineering teams and their performance."
    >
      {canCreate() && (
        <div style={{ marginBottom: '24px', textAlign: 'right' }}>
          <Link to="/create-team" className="btn btn-primary">
            + Create New Team
          </Link>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading team directories...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <div className="teams-grid">
          {filteredTeams.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No teams found in database.
            </div>
          ) : (
            filteredTeams.map(team => (
              <div key={team._id} className="team-card">
                <div className="team-header">
                  <div className="team-avatar">{team.teamName ? team.teamName.charAt(0) : 'T'}</div>
                  <div>
                    <div className="team-name">{team.teamName}</div>
                    <div className="team-lead">Lead: {team.lead ? team.lead.name : 'Unassigned'}</div>
                  </div>
                </div>
                <div className="team-stats">
                  <div className="stat-item">
                    <div className="stat-value">{team.members ? team.members.length : 0}</div>
                    <div className="stat-label">Members</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{team.project ? '1' : '0'}</div>
                    <div className="stat-label">Projects</div>
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  Project: <strong>{team.project ? team.project.title : 'None'}</strong>
                </div>

                {/* Team Members List */}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <strong>Team Members</strong>
                    {canEdit() && (
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setShowAddMember(showAddMember === team._id ? null : team._id)}
                      >
                        + Add Member
                      </button>
                    )}
                  </div>

                  {showAddMember === team._id && (
                    <div style={{ marginBottom: '12px', display: 'flex', gap: '8px' }}>
                      <select
                        value={newMemberId}
                        onChange={(e) => setNewMemberId(e.target.value)}
                        style={{ flex: 1, padding: '8px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-primary)' }}
                      >
                        <option value="">Select a user</option>
                        {users.map(u => (
                          <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                        ))}
                      </select>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => handleAddMember(team._id)}
                      >
                        Add
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {team.members && team.members.map(member => (
                      <div key={member._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <span>{member.name}</span>
                          <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: '8px', textTransform: 'capitalize' }}>({member.role})</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {(!team.lead || member._id !== team.lead._id) && canAssignLead() && (
                            <button
                              style={{ fontSize: '11px', color: 'var(--accent-purple)', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => handleAssignLead(team._id, member._id)}
                            >
                              Make Lead
                            </button>
                          )}
                          {canEdit() && (
                            <button
                              style={{ fontSize: '11px', color: 'var(--accent-red)', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => handleRemoveMember(team._id, member._id, member.name)}
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </Layout>
  );
};

export default TeamDirectory;
