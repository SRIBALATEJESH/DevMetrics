import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import './TeamReports.css';
import API_BASE_URL from '../config/api';

const TeamReports = () => {
  const { token } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const registerReportInDB = async (title, format) => {
    try {
      await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title,
          type: 'team',
          format
        })
      });
    } catch (err) {
      console.error('Failed to log report in database', err);
    }
  };

  useEffect(() => {
    const fetchReportData = async () => {
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
          setError('Failed to fetch real-time reporting data from database.');
        }
      } catch (err) {
        setError('Network error fetching report data.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [token]);

  // Compute live team performance metrics
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
      totalMembers: memberIds.length,
      tasksCompleted,
      totalTeamTasks,
      completionRate,
      productivity
    };
  });

  const downloadPDFReport = async () => {
    const title = `Team Productivity Report - ${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    await registerReportInDB(title, 'pdf');

    let teamSummaryText = '';
    computedTeams.forEach((team, index) => {
      teamSummaryText += `
${index + 1}. TEAM: ${team.name}
-----------------------------
- Lead: ${team.lead}
- Total Members: ${team.totalMembers}
- Tasks Completed: ${team.tasksCompleted} / ${team.totalTeamTasks}
- Completion Rate: ${team.completionRate}%
- Productivity Score: ${team.productivity}%
`;
    });

    const reportText = `=========================================
TEAM PRODUCTIVITY REPORT (REAL-TIME SUMMARY)
Generated: ${new Date().toLocaleDateString()}
=========================================

1. OVERALL METRICS SUMMARY
-------------------------
- Total Teams Monitored: ${computedTeams.length}
- Average Productivity: ${computedTeams.length > 0 ? Math.round(computedTeams.reduce((sum, t) => sum + t.productivity, 0) / computedTeams.length) : 0}%
- Average Completion Rate: ${computedTeams.length > 0 ? Math.round(computedTeams.reduce((sum, t) => sum + t.completionRate, 0) / computedTeams.length) : 0}%

2. DETAILED TEAM REPORT${teamSummaryText}
=========================================
End of Report
`;
    const element = document.createElement("a");
    const file = new Blob([reportText], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "team_productivity_report.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const downloadExcelReport = async () => {
    const title = `Team Metrics Spreadsheet - ${new Date().toLocaleDateString().replace(/\//g, '-')}`;
    await registerReportInDB(title, 'excel');

    const csvRows = [
      "Team Name,Lead Name,Members Count,Tasks Completed,Total Tasks,Completion Rate %,Productivity Score %"
    ];

    computedTeams.forEach(team => {
      csvRows.push(`"${team.name}","${team.lead}",${team.totalMembers},${team.tasksCompleted},${team.totalTeamTasks},${team.completionRate},${team.productivity}`);
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "team_productivity_metrics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Layout
      pageTitle="Team Reports"
      pageEyebrow="// team reports"
      pageSubtitle="Generate and download dynamic team productivity reports from database."
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Fetching real-time team database records...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--accent-red)' }}>
          ⚠️ {error}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <h3 className="section-title" style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)' }}>Live Productivity Preview</h3>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={downloadPDFReport}>
                📄 Download PDF Summary
              </button>
              <button className="btn btn-primary" onClick={downloadExcelReport}>
                📊 Download CSV Spreadsheet
              </button>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', width: '100%', overflowX: 'auto' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Team Name</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)' }}>Team Lead</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>Members</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>Tasks Completed</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>Completion Rate</th>
                    <th style={{ padding: '12px 8px', color: 'var(--text-muted)', textAlign: 'center' }}>Productivity</th>
                  </tr>
                </thead>
                <tbody>
                  {computedTeams.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>No team records found.</td>
                    </tr>
                  ) : (
                    computedTeams.map((team, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 8px', fontWeight: '600' }}>{team.name}</td>
                        <td style={{ padding: '12px 8px' }}>{team.lead}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>{team.totalMembers}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center' }}>{team.tasksCompleted} / {team.totalTeamTasks}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600' }}>{team.completionRate}%</td>
                        <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: '600', color: 'var(--accent-blue)' }}>{team.productivity}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
};

export default TeamReports;
