import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';
import Layout from '../components/Layout';
import './TeamPerformance.css';
import API_BASE_URL from '../config/api';

const TeamPerformance = () => {
  const { token, user: currentUser } = useAuth();
  const { currentRole } = useRole();
  const role = currentRole?.toLowerCase();

  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        setError('');
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        const [teamsRes, tasksRes, leadRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/teams`, { headers }),
          fetch(`${API_BASE_URL}/api/tasks`, { headers }),
          fetch(`${API_BASE_URL}/api/analytics/leaderboard`, { headers })
        ]);

        const teamsData = await teamsRes.json();
        const tasksData = await tasksRes.json();
        const leadData = await leadRes.json();

        if (teamsRes.ok && tasksRes.ok && leadRes.ok) {
          setTeams(teamsData.data || []);
          setTasks(tasksData.data || []);
          setLeaderboard(leadData.data || []);
        } else {
          setError('Failed to fetch team performance statistics.');
        }
      } catch (err) {
        setError('Network error fetching team metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, [token]);

  // Compute metrics for each team
  const computedTeams = teams.map(team => {
    const memberIds = team.members ? team.members.map(m => m._id) : [];

    // 1. Get tasks assigned to any member of this team
    const teamTasks = tasks.filter(t => t.assignee && memberIds.includes(t.assignee._id));
    const totalTeamTasks = teamTasks.length;
    const tasksCompleted = teamTasks.filter(t => t.status === 'done').length;
    const completionRate = totalTeamTasks > 0 ? Math.round((tasksCompleted / totalTeamTasks) * 100) : 0;

    // 2. Productivity: average contribution score of all members of this team
    const teamScores = leaderboard.filter(entry => memberIds.includes(entry.id));
    const productivity = teamScores.length > 0
      ? Math.round(teamScores.reduce((sum, entry) => sum + entry.contributionScore, 0) / teamScores.length)
      : 80; // default benchmark

    return {
      name: team.teamName,
      lead: team.lead ? team.lead.name : 'Unassigned',
      leadId: team.lead ? team.lead._id : null,
      members: team.members || [],
      tasksCompleted,
      totalTeamTasks,
      completionRate,
      productivity
    };
  });

  // Filter based on user access
  const filteredTeams = computedTeams.filter(t => {
    if (role === 'admin' || role === 'project manager') return true;

    // Check membership or lead status
    return t.members.some(m => m._id === currentUser?.id) || t.leadId === currentUser?.id;
  });

  const totalTasks = filteredTeams.reduce((sum, t) => sum + t.tasksCompleted, 0);
  const avgProductivity = filteredTeams.length > 0
    ? Math.round(filteredTeams.reduce((sum, t) => sum + t.productivity, 0) / filteredTeams.length)
    : 0;
  const avgCompletion = filteredTeams.length > 0
    ? Math.round(filteredTeams.reduce((sum, t) => sum + t.completionRate, 0) / filteredTeams.length)
    : 0;

  return (
    <Layout
      pageTitle="Team Performance"
      pageEyebrow=" team performance"
      pageSubtitle="Track performance metrics across all teams."
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Computing team performance metrics from database...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <>
          <div className="kpi-grid">
            <div className="kpi-card blue">
              <div className="kpi-header">
                <span className="kpi-label">Total Tasks Completed</span>
              </div>
              <div className="kpi-value">{totalTasks}</div>
            </div>
            <div className="kpi-card purple">
              <div className="kpi-header">
                <span className="kpi-label">Average Productivity</span>
              </div>
              <div className="kpi-value">{avgProductivity}%</div>
            </div>
            <div className="kpi-card teal">
              <div className="kpi-header">
                <span className="kpi-label">Completion Rate</span>
              </div>
              <div className="kpi-value">{avgCompletion}%</div>
            </div>
          </div>

          <h3 className="section-title" style={{ margin: '32px 0 16px', fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Team Metrics</h3>
          <div className="team-metrics-grid">
            {filteredTeams.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No assigned teams found in database.
              </div>
            ) : (
              filteredTeams.map((team, i) => (
                <div key={i} className="team-metric-card">
                  <div className="team-card-header">
                    <div className="team-card-name">{team.name}</div>
                    <div className="team-card-lead">Lead: <strong>{team.lead}</strong></div>
                  </div>
                  <div className="team-card-stats">
                    <div className="team-card-stat">
                      <span className="stat-label">Tasks</span>
                      <span className="stat-number">{team.tasksCompleted} / {team.totalTeamTasks}</span>
                    </div>
                    <div className="team-card-stat">
                      <span className="stat-label">Productivity</span>
                      <span className="stat-number">{team.productivity}%</span>
                    </div>
                    <div className="team-card-stat">
                      <span className="stat-label">Completion</span>
                      <span className="stat-number">{team.completionRate}%</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </Layout>
  );
};

export default TeamPerformance;
