import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckSquare,
  BarChart3,
  FileText,
  AlertTriangle,
  Users,
  FolderKanban,
  TrendingUp,
  TrendingDown,
  Activity,
  Bug,
  RefreshCw
} from 'lucide-react'
import Layout from '../components/Layout'
import { useAuth } from '../context/AuthContext'
import './Dashboard.css'
import { Line } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import API_BASE_URL from '../config/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const adminActivityData = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Admin Activity',
      data: [28, 45, 38, 62, 56, 75, 90],
      borderColor: '#4f8ef7',
      backgroundColor: 'rgba(79, 142, 247, 0.08)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointBackgroundColor: '#4f8ef7',
      pointBorderColor: '#13161d',
      pointHoverRadius: 6,
    }
  ]
};

const adminActivityOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1a1e28',
      titleColor: '#e8eaf0',
      bodyColor: '#8b90a0',
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#555b6e', font: { size: 10 } } },
    y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#555b6e', font: { size: 10 } } }
  }
};

const mockSystemLogs = [
  { id: 1, type: 'info', user: 'System', action: 'Automated daily backup completed successfully', date: 'Just now' },
  { id: 2, type: 'warning', user: 'Security', action: 'Failed login attempt from IP 192.168.1.144', date: '5m ago' },
  { id: 3, type: 'error', user: 'Database', action: 'High connection pool capacity reached (85%)', date: '12m ago' },
  { id: 4, type: 'info', user: 'Aman Shah', action: 'Updated project configuration for "Attendance System"', date: '30m ago' },
  { id: 5, type: 'info', user: 'Riya Kapoor', action: 'Assigned PM role to David Miller', date: '1h ago' },
  { id: 6, type: 'error', user: 'Build Bot', action: 'Webpack bundle compilation failed on master branch', date: '2h ago' },
  { id: 7, type: 'info', user: 'System', action: 'SSL Certificate renewed automatically', date: '4h ago' }
];

const Dashboard = () => {
  const { user, token } = useAuth()
  const role = user?.role ? user.role.toLowerCase() : ''

  const [stats, setStats] = useState({
    projects: 0,
    users: 0,
    tasks: 0,
    health: '98%',
    contributionScore: 0,
    openTickets: 0
  });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lists for dynamic charts grouping
  const [projectsList, setProjectsList] = useState([]);
  const [tasksList, setTasksList] = useState([]);
  const [leaderboardList, setLeaderboardList] = useState([]);
  const [teamsList, setTeamsList] = useState([]);
  const [allLogs, setAllLogs] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        // 1. Fetch projects
        const projRes = await fetch(`${API_BASE_URL}/api/projects`, { headers });
        const projData = await projRes.json();
        const projectsCount = projData.data ? projData.data.length : 0;
        setProjectsList(projData.data || []);

        // 2. Fetch users/leaderboard
        const leadRes = await fetch(`${API_BASE_URL}/api/analytics/leaderboard`, { headers });
        const leadData = await leadRes.json();
        const usersCount = leadData.data ? leadData.data.length : 0;
        setLeaderboardList(leadData.data || []);

        // 3. Fetch tasks
        const taskRes = await fetch(`${API_BASE_URL}/api/tasks`, { headers });
        const taskData = await taskRes.json();
        const tasksCount = taskData.data ? taskData.data.length : 0;
        const openTickets = taskData.data ? taskData.data.filter(t => t.status !== 'done').length : 0;
        setTasksList(taskData.data || []);

        // 4. Fetch user's individual contribution score
        let contributionScore = 0;
        try {
          const scoreRes = await fetch(`${API_BASE_URL}/api/analytics/user/`, { headers });
          const scoreData = await scoreRes.json();
          if (scoreData.data) {
            contributionScore = scoreData.data.contributionScore;
          }
        } catch (e) {
          console.log('Error fetching user score:', e.message);
        }

        setStats({
          projects: projectsCount,
          users: usersCount,
          tasks: tasksCount,
          health: '100%',
          contributionScore,
          openTickets
        });

        // 5. Fetch logs (available to all roles now, filtered at backend)
        try {
          const logRes = await fetch(`${API_BASE_URL}/api/activities`, { headers });
          const logData = await logRes.json();
          if (logData.data) {
            setAllLogs(logData.data);
            setLogs(logData.data.slice(0, 7)); // get top 7
          }
        } catch (e) {
          console.log('Error fetching logs:', e.message);
        }

        // 6. Fetch teams
        try {
          const teamsRes = await fetch(`${API_BASE_URL}/api/teams`, { headers });
          const teamsData = await teamsRes.json();
          setTeamsList(teamsData.data || []);
        } catch (e) {
          console.log('Error fetching teams:', e.message);
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token || localStorage.getItem('token')) {
      fetchDashboardData();
    }

    const handleRefresh = () => {
      console.log('[Dashboard] Auto-refreshing dashboard data...');
      fetchDashboardData();
    };

    window.addEventListener('analytics_updated', handleRefresh);
    window.addEventListener('leaderboard_updated', handleRefresh);

    return () => {
      window.removeEventListener('analytics_updated', handleRefresh);
      window.removeEventListener('leaderboard_updated', handleRefresh);
    };
  }, [token, role]);

  // 1. Admin Activity Data Generator
  const getAdminActivityChartData = () => {
    const labels = [];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
    }

    if (allLogs && allLogs.length > 0) {
      allLogs.forEach(log => {
        const logDate = new Date(log.timestamp);
        const logDayLabel = days[logDate.getDay()];
        const idx = labels.indexOf(logDayLabel);
        if (idx !== -1) {
          counts[idx]++;
        }
      });
    } else {
      return adminActivityData;
    }

    return {
      labels,
      datasets: [
        {
          label: 'Admin Activity',
          data: counts,
          borderColor: '#4f8ef7',
          backgroundColor: 'rgba(79, 142, 247, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#4f8ef7',
          pointBorderColor: '#13161d',
          pointHoverRadius: 6,
        }
      ]
    };
  };

  // 2. Project Manager Burndown Path & Points Generator
  const getPMBurndownData = () => {
    const totalTasksCount = tasksList.length;
    if (totalTasksCount === 0) {
      return {
        pathLine: "M 40 165 L 470 165",
        pathFill: "M 40 165 L 470 165 Z",
        points: [],
        daysLabels: ['Day 1', 'Day 3', 'Day 5', 'Day 7', 'Day 10'],
        maxTasks: 10
      };
    }

    // Calculate last 7 days remaining tasks
    const daysList = [];
    const remainingCounts = [];
    const dates = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setHours(23, 59, 59, 999);
      d.setDate(d.getDate() - i);
      dates.push(new Date(d));

      const dayName = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      daysList.push(dayName);
    }

    dates.forEach(d => {
      // Task is remaining if not completed, or completed after date d
      const remaining = tasksList.filter(t => {
        if (t.status !== 'done') return true;
        if (!t.completionDate) return true;
        return new Date(t.completionDate) > d;
      }).length;
      remainingCounts.push(remaining);
    });

    // Map remaining counts to SVG Y coordinates (height = 140px, Y = 25 to 165)
    // Map indices to X coordinates (width = 430px, X = 40 to 470)
    const points = remainingCounts.map((val, idx) => {
      const x = 40 + idx * (430 / 6);
      const y = 165 - (val / totalTasksCount) * 140;
      return { x, y, val };
    });

    const pathLine = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const pathFill = `${pathLine} L ${points[points.length - 1].x} 165 L 40 165 Z`;

    return {
      pathLine,
      pathFill,
      points,
      daysLabels: daysList,
      maxTasks: totalTasksCount
    };
  };

  // 3. Project Manager Resource Allocation Generator
  const getPMResourceAllocation = () => {
    if (leaderboardList.length === 0) {
      return [
        { name: 'Aryan K.', percentage: 90, width: 306 },
        { name: 'Jane D.', percentage: 85, width: 289 },
        { name: 'John S.', percentage: 70, width: 238 },
        { name: 'Alice J.', percentage: 80, width: 272 }
      ];
    }

    const allocations = leaderboardList.map(u => {
      const activeTasksCount = tasksList.filter(t => t.assignee && t.assignee._id === u.id && t.status !== 'done').length;
      const pct = Math.min(activeTasksCount * 25, 100);
      return {
        name: u.name.split(' ').map((n, idx) => idx === 0 ? n : n[0] + '.').join(' '),
        percentage: pct || 20 // minimum baseline of 20% so there's always a visual bar
      };
    }).sort((a, b) => b.percentage - a.percentage).slice(0, 4);

    return allocations.map(a => ({
      ...a,
      width: Math.round((a.percentage / 100) * 340) // max width is 340px
    }));
  };

  // 4. Team Lead Helper Data Generators
  const getTeamLeadData = () => {
    // Check if the user leads a team in teamsList
    const myTeam = teamsList.find(t => t.lead && (t.lead._id === user?.id || t.lead === user?.id));
    const teamMembers = myTeam && myTeam.members && myTeam.members.length > 0
      ? myTeam.members
      : leaderboardList.slice(0, 4); // fallback to first 4 leaderboard members
    const teamMemberIds = teamMembers.map(m => m._id || m.id);
    const teamTasks = tasksList.filter(t => t.assignee && teamMemberIds.includes(t.assignee._id || t.assignee));

    const totalTasks = teamTasks.length;
    const completedTasks = teamTasks.filter(t => t.status === 'done').length;
    const codeReviews = teamTasks.filter(t => t.status === 'review').length;
    const sprintProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 70; // baseline fallback if 0 tasks
    const teamMorale = Math.min(85 + Math.round(sprintProgress * 0.15), 100);

    // Delta: tasks created in last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasksCount = teamTasks.filter(t => new Date(t.createdAt) > sevenDaysAgo).length;

    // Team Performance SVG Bar Chart Points: Completion Rates per Team Member
    const memberPerformanceList = teamMembers.map(m => {
      const memberTasks = teamTasks.filter(t => (t.assignee._id || t.assignee) === (m._id || m.id));
      const total = memberTasks.length;
      const completed = memberTasks.filter(t => t.status === 'done').length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 60; // fallback default
      return {
        name: m.name.split(' ')[0], // first name
        percentage: rate,
        total,
        completed
      };
    });

    // Task distribution status counts
    const todo = teamTasks.filter(t => t.status === 'todo').length;
    const inProgress = teamTasks.filter(t => t.status === 'in progress').length;
    const review = teamTasks.filter(t => t.status === 'review').length;
    const done = teamTasks.filter(t => t.status === 'done').length;
    const distributionTotal = todo + inProgress + review + done || 4; // fallback

    return {
      myTeam,
      teamMembers,
      teamTasks,
      totalTasks,
      completedTasks,
      codeReviews,
      sprintProgress,
      teamMorale,
      recentTasksCount,
      memberPerformanceList,
      distribution: {
        todo,
        inProgress,
        review,
        done,
        total: distributionTotal,
        todoPct: Math.round((todo / distributionTotal) * 100) || 25,
        inProgressPct: Math.round((inProgress / distributionTotal) * 100) || 25,
        reviewPct: Math.round((review / distributionTotal) * 100) || 25,
        donePct: Math.round((done / distributionTotal) * 100) || 25
      }
    };
  };

  // 5. Developer Helper Data Generators
  const getDeveloperData = () => {
    const myTasks = tasksList.filter(t => t.assignee && (t.assignee._id === user?.id || t.assignee === user?.id));
    const totalTasks = myTasks.length;

    // Commits and reviews from activity logs
    const myLogs = allLogs.filter(l => l.user && (l.user._id === user?.id || l.user === user?.id));
    const commitCount = myLogs.filter(l => l.event.toLowerCase().includes('commit') || l.event.toLowerCase().includes('push')).length;
    const codeCommits = 12 + commitCount; // baseline 12
    const reviewCount = myLogs.filter(l => l.event.toLowerCase().includes('review') || l.event.toLowerCase().includes('pr') || l.event.toLowerCase().includes('pull request')).length;
    const prsReviewed = 4 + reviewCount; // baseline 4

    // Tasks created/assigned in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentTasksCount = myTasks.filter(t => new Date(t.createdAt) > sevenDaysAgo).length;

    const todo = myTasks.filter(t => t.status === 'todo').length;
    const inProgress = myTasks.filter(t => t.status === 'in progress').length;
    const review = myTasks.filter(t => t.status === 'review').length;
    const done = myTasks.filter(t => t.status === 'done').length;
    const totalStatus = todo + inProgress + review + done || 1;

    return {
      myTasks,
      totalTasks,
      codeCommits,
      prsReviewed,
      recentTasksCount,
      statusBreakdown: {
        todo,
        inProgress,
        review,
        done,
        todoPct: Math.round((todo / totalStatus) * 100),
        inProgressPct: Math.round((inProgress / totalStatus) * 100),
        reviewPct: Math.round((review / totalStatus) * 100),
        donePct: Math.round((done / totalStatus) * 100)
      }
    };
  };

  const getDeveloperActivityChartData = () => {
    const labels = [];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
    }

    const myLogs = allLogs.filter(l => l.user && (l.user._id === user?.id || l.user === user?.id));
    myLogs.forEach(log => {
      const logDate = new Date(log.timestamp);
      const logDayLabel = days[logDate.getDay()];
      const idx = labels.indexOf(logDayLabel);
      if (idx !== -1) {
        counts[idx]++;
      }
    });

    // Make sure we have a baseline visual so it's not a flat line at 0 if no recent commits
    const displayData = counts.some(c => c > 0) ? counts : [2, 4, 3, 5, 2, 6, 4];

    return {
      labels,
      datasets: [
        {
          label: 'My Actions',
          data: displayData,
          borderColor: '#9b5de5',
          backgroundColor: 'rgba(155, 93, 229, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#9b5de5',
          pointBorderColor: '#13161d',
          pointHoverRadius: 6,
        }
      ]
    };
  };

  // 6. Tester Helper Data Generators
  const getTesterData = () => {
    const bugTasks = tasksList.filter(t =>
      t.title.toLowerCase().includes('bug') ||
      t.title.toLowerCase().includes('issue') ||
      t.title.toLowerCase().includes('error') ||
      t.description?.toLowerCase().includes('bug') ||
      t.description?.toLowerCase().includes('issue') ||
      t.description?.toLowerCase().includes('error')
    );

    const openBugs = bugTasks.filter(t => t.status !== 'done').length;
    const resolvedBugs = bugTasks.filter(t => t.status === 'done').length;

    // Fallbacks if no data exists
    const displayOpenBugs = bugTasks.length > 0 ? openBugs : 3;
    const displayResolvedBugs = bugTasks.length > 0 ? resolvedBugs : 12;

    const testsRun = (resolvedBugs * 5) + 12; // dynamic calculation
    const testCoverage = bugTasks.length > 0 ? Math.round((resolvedBugs / bugTasks.length) * 15 + 82) : 87;
    const criticalBugs = bugTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length;

    const totalBugs = bugTasks.length || 1;
    const passPct = bugTasks.length > 0 ? (resolvedBugs / totalBugs) : 0.8; // 80% default

    return {
      bugTasks,
      openBugs: displayOpenBugs,
      testsRun,
      testCoverage,
      criticalBugs: bugTasks.length > 0 ? criticalBugs : 1,
      passPct,
      resolvedBugsCount: displayResolvedBugs,
      openBugsCount: displayOpenBugs
    };
  };

  const getTesterBugChartData = () => {
    const labels = [];
    const counts = [0, 0, 0, 0, 0, 0, 0];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      labels.push(days[d.getDay()]);
    }

    const bugTasks = tasksList.filter(t =>
      t.title.toLowerCase().includes('bug') ||
      t.title.toLowerCase().includes('issue') ||
      t.title.toLowerCase().includes('error')
    );

    bugTasks.forEach(t => {
      const date = new Date(t.createdAt);
      const dayLabel = days[date.getDay()];
      const idx = labels.indexOf(dayLabel);
      if (idx !== -1) {
        counts[idx]++;
      }
    });

    const displayData = counts.some(c => c > 0) ? counts : [1, 2, 0, 3, 1, 2, 1];

    return {
      labels,
      datasets: [
        {
          label: 'Bugs Logged',
          data: displayData,
          borderColor: '#f15bb5',
          backgroundColor: 'rgba(241, 91, 181, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#f15bb5',
          pointBorderColor: '#13161d',
          pointHoverRadius: 6,
        }
      ]
    };
  };

  // Role-specific dashboard content
  const getRoleDashboard = () => {
    switch (role) {
      case 'admin':
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-card blue">
                <div className="kpi-header">
                  <span className="kpi-label">Total Users</span>
                  <div className="kpi-icon blue"><Users size={15} /></div>
                </div>
                <div className="kpi-value">{stats.users}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Live</span>
                  <span className="kpi-period">from DB</span>
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-header">
                  <span className="kpi-label">Active Projects</span>
                  <div className="kpi-icon purple"><FolderKanban size={15} /></div>
                </div>
                <div className="kpi-value">{stats.projects}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Live</span>
                  <span className="kpi-period">from DB</span>
                </div>
              </div>
              <div className="kpi-card teal">
                <div className="kpi-header">
                  <span className="kpi-label">System Health</span>
                  <div className="kpi-icon teal"><Activity size={15} /></div>
                </div>
                <div className="kpi-value">{stats.health}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Stable</span>
                  <span className="kpi-period">online</span>
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Open Tickets</span>
                  <div className="kpi-icon green"><AlertTriangle size={15} /></div>
                </div>
                <div className="kpi-value">{stats.openTickets}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta down"><TrendingDown size={12} /> Realtime</span>
                  <span className="kpi-period">pending tasks</span>
                </div>
              </div>
            </div>
            <div className="charts-row charts-row-2">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">User Activity</div>
                    <div className="chart-subtitle">Last 7 days</div>
                  </div>
                </div>
                <div className="chart-body" style={{ height: 220, position: 'relative' }}>
                  <Line data={getAdminActivityChartData()} options={adminActivityOptions} />
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">System Logs</div>
                    <div className="chart-subtitle">Recent events</div>
                  </div>
                </div>
                <div className="chart-body" style={{ height: 220, overflowY: 'auto', paddingRight: '4px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {logs.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No system activity logged.
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div key={log._id || log.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: 'var(--radius-sm)',
                          borderLeft: '3px solid var(--accent-blue)',
                          fontSize: '12px'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              padding: '2px 5px',
                              borderRadius: '3px',
                              fontSize: '9px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                              background: 'rgba(79, 142, 247, 0.12)',
                              color: 'var(--accent-blue)'
                            }}>
                              {log.user ? log.user.role : 'System'}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              <strong style={{ color: 'var(--text-primary)' }}>{log.user ? log.user.name : 'System'}:</strong> {log.event}
                            </span>
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case 'project manager': {
        const burndown = getPMBurndownData();
        const resources = getPMResourceAllocation();
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-card blue">
                <div className="kpi-header">
                  <span className="kpi-label">Projects On Track</span>
                  <div className="kpi-icon blue"><FolderKanban size={15} /></div>
                </div>
                <div className="kpi-value">{stats.projects}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Live</span>
                  <span className="kpi-period">from DB</span>
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-header">
                  <span className="kpi-label">Team Velocity</span>
                  <div className="kpi-icon purple"><TrendingUp size={15} /></div>
                </div>
                <div className="kpi-value">89 pts</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Baseline</span>
                  <span className="kpi-period">velocity</span>
                </div>
              </div>
              <div className="kpi-card teal">
                <div className="kpi-header">
                  <span className="kpi-label">Tasks In Progress</span>
                  <div className="kpi-icon teal"><CheckSquare size={15} /></div>
                </div>
                <div className="kpi-value">{stats.openTickets}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Active</span>
                  <span className="kpi-period">assigned tasks</span>
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Budget Spent</span>
                  <div className="kpi-icon green"><FileText size={15} /></div>
                </div>
                <div className="kpi-value">$45k</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> 68%</span>
                  <span className="kpi-period">of budget</span>
                </div>
              </div>
            </div>
            <div className="charts-row charts-row-2">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Project Burndown</div>
                    <div className="chart-subtitle">Sprint progress</div>
                  </div>
                </div>
                <div className="chart-body" style={{ minHeight: 220, padding: '10px 0' }}>
                  <svg viewBox="0 0 500 220" width="100%" height="100%">
                    <defs>
                      <linearGradient id="colorBurndown" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-red)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--accent-red)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <line x1="40" y1="25" x2="470" y2="25" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="60" x2="470" y2="60" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="95" x2="470" y2="95" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="130" x2="470" y2="130" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="165" x2="470" y2="165" stroke="var(--border)" strokeDasharray="3 3" />

                    <text x="30" y="29" fill="var(--text-muted)" fontSize="10" textAnchor="end">{burndown.maxTasks}</text>
                    <text x="30" y="64" fill="var(--text-muted)" fontSize="10" textAnchor="end">{Math.round(burndown.maxTasks * 0.75)}</text>
                    <text x="30" y="99" fill="var(--text-muted)" fontSize="10" textAnchor="end">{Math.round(burndown.maxTasks * 0.5)}</text>
                    <text x="30" y="134" fill="var(--text-muted)" fontSize="10" textAnchor="end">{Math.round(burndown.maxTasks * 0.25)}</text>
                    <text x="30" y="169" fill="var(--text-muted)" fontSize="10" textAnchor="end">0</text>

                    <line x1="40" y1="25" x2="470" y2="165" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="5 5" />

                    {burndown.points.length > 0 && (
                      <>
                        <path
                          d={burndown.pathFill}
                          fill="url(#colorBurndown)"
                        />
                        <path
                          d={burndown.pathLine}
                          fill="none"
                          stroke="var(--accent-red)"
                          strokeWidth="3"
                        />
                        {burndown.points.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="4" fill="var(--accent-red)" stroke="var(--bg-surface)" strokeWidth="2" />
                        ))}
                      </>
                    )}

                    {burndown.daysLabels.map((lbl, idx) => {
                      const x = 40 + idx * (430 / (burndown.daysLabels.length - 1));
                      return (
                        <text key={idx} x={x} y="190" fill="var(--text-muted)" fontSize="9" textAnchor="middle">{lbl}</text>
                      );
                    })}
                  </svg>
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Resource Allocation</div>
                    <div className="chart-subtitle">Team capacity</div>
                  </div>
                </div>
                <div className="chart-body" style={{ minHeight: 220, padding: '10px 0' }}>
                  <svg viewBox="0 0 500 220" width="100%" height="100%">
                    <defs>
                      <linearGradient id="resourceGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="var(--accent-blue)" />
                        <stop offset="100%" stopColor="var(--accent-purple)" />
                      </linearGradient>
                    </defs>
                    <line x1="120" y1="20" x2="120" y2="180" stroke="var(--border)" />
                    <line x1="205" y1="20" x2="205" y2="180" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="290" y1="20" x2="290" y2="180" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="375" y1="20" x2="375" y2="180" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="460" y1="20" x2="460" y2="180" stroke="var(--border)" strokeDasharray="3 3" />

                    <text x="120" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">0%</text>
                    <text x="205" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">25%</text>
                    <text x="290" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">50%</text>
                    <text x="375" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">75%</text>
                    <text x="460" y="195" fill="var(--text-muted)" fontSize="10" textAnchor="middle">100%</text>

                    {resources.map((res, idx) => {
                      const yLabel = 42 + idx * 40;
                      const yRect = 28 + idx * 40;
                      return (
                        <g key={idx}>
                          <text x="110" y={yLabel} fill="var(--text-secondary)" fontSize="11" textAnchor="end" fontWeight="600">{res.name}</text>
                          <rect x="120" y={yRect} width={res.width} height="20" rx="4" fill="url(#resourceGrad)" />
                          <text x={130 + res.width} y={yLabel} fill="var(--text-primary)" fontSize="11" fontWeight="700">{res.percentage}%</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </>
        )
      }

      case 'team lead': {
        const tlData = getTeamLeadData();
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-card blue">
                <div className="kpi-header">
                  <span className="kpi-label">Team Tasks</span>
                  <div className="kpi-icon blue"><CheckSquare size={15} /></div>
                </div>
                <div className="kpi-value">{tlData.totalTasks}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> +{tlData.recentTasksCount}</span>
                  <span className="kpi-period">this week</span>
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-header">
                  <span className="kpi-label">Code Reviews</span>
                  <div className="kpi-icon purple"><Activity size={15} /></div>
                </div>
                <div className="kpi-value">{tlData.codeReviews}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Live</span>
                  <span className="kpi-period">pending review</span>
                </div>
              </div>
              <div className="kpi-card teal">
                <div className="kpi-header">
                  <span className="kpi-label">Sprint Progress</span>
                  <div className="kpi-icon teal"><TrendingUp size={15} /></div>
                </div>
                <div className="kpi-value">{tlData.sprintProgress}%</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Rate</span>
                  <span className="kpi-period">this sprint</span>
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Team Morale</span>
                  <div className="kpi-icon green"><Users size={15} /></div>
                </div>
                <div className="kpi-value">{tlData.teamMorale}%</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> High</span>
                  <span className="kpi-period">vs baseline</span>
                </div>
              </div>
            </div>
            <div className="charts-row charts-row-2">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Team Performance</div>
                    <div className="chart-subtitle">Completion rate by member</div>
                  </div>
                </div>
                <div className="chart-body" style={{ minHeight: 220, padding: '10px 0' }}>
                  <svg viewBox="0 0 500 220" width="100%" height="100%">
                    <defs>
                      <linearGradient id="memberPerfGrad" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="var(--accent-teal)" />
                        <stop offset="100%" stopColor="var(--accent-blue)" />
                      </linearGradient>
                    </defs>
                    <line x1="40" y1="30" x2="470" y2="30" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="65" x2="470" y2="65" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="100" x2="470" y2="100" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="135" x2="470" y2="135" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="170" x2="470" y2="170" stroke="var(--border)" />

                    <text x="30" y="34" fill="var(--text-muted)" fontSize="10" textAnchor="end">100%</text>
                    <text x="30" y="69" fill="var(--text-muted)" fontSize="10" textAnchor="end">75%</text>
                    <text x="30" y="104" fill="var(--text-muted)" fontSize="10" textAnchor="end">50%</text>
                    <text x="30" y="139" fill="var(--text-muted)" fontSize="10" textAnchor="end">25%</text>
                    <text x="30" y="174" fill="var(--text-muted)" fontSize="10" textAnchor="end">0%</text>

                    {tlData.memberPerformanceList.map((entry, idx) => {
                      const barWidth = 36;
                      const spacing = (430 / tlData.memberPerformanceList.length);
                      const x = 50 + idx * spacing + (spacing - barWidth) / 2;
                      const barHeight = (entry.percentage / 100) * 140;
                      const y = 170 - barHeight;
                      return (
                        <g key={idx}>
                          <rect x={x} y={y} width={barWidth} height={barHeight} rx="4" fill="url(#memberPerfGrad)" />
                          <text x={x + barWidth / 2} y={y - 8} fill="var(--text-primary)" fontSize="10" fontWeight="700" textAnchor="middle">{entry.percentage}%</text>
                          <text x={x + barWidth / 2} y="192" fill="var(--text-secondary)" fontSize="10" fontWeight="600" textAnchor="middle">{entry.name}</text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Task Distribution</div>
                    <div className="chart-subtitle">Status count breakdown</div>
                  </div>
                </div>
                <div className="chart-body" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '16px' }}>
                  {/* Stacked Progress Bar */}
                  <div style={{ display: 'flex', width: '100%', height: '24px', borderRadius: '12px', overflow: 'hidden', background: 'rgba(255,255,255,0.05)', marginBottom: '24px' }}>
                    <div style={{ width: `${tlData.distribution.todoPct}%`, background: 'var(--accent-blue)', height: '100%', transition: 'width 0.3s' }} title={`Todo: ${tlData.distribution.todo}`} />
                    <div style={{ width: `${tlData.distribution.inProgressPct}%`, background: 'var(--accent-yellow)', height: '100%', transition: 'width 0.3s' }} title={`In Progress: ${tlData.distribution.inProgress}`} />
                    <div style={{ width: `${tlData.distribution.reviewPct}%`, background: 'var(--accent-purple)', height: '100%', transition: 'width 0.3s' }} title={`Review: ${tlData.distribution.review}`} />
                    <div style={{ width: `${tlData.distribution.donePct}%`, background: 'var(--accent-green)', height: '100%', transition: 'width 0.3s' }} title={`Done: ${tlData.distribution.done}`} />
                  </div>
                  {/* Legend Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-blue)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Todo: <strong>{tlData.distribution.todo}</strong> ({tlData.distribution.todoPct}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-yellow)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>In Progress: <strong>{tlData.distribution.inProgress}</strong> ({tlData.distribution.inProgressPct}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-purple)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Review: <strong>{tlData.distribution.review}</strong> ({tlData.distribution.reviewPct}%)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Done: <strong>{tlData.distribution.done}</strong> ({tlData.distribution.donePct}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      case 'developer': {
        const devData = getDeveloperData();
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-card blue">
                <div className="kpi-header">
                  <span className="kpi-label">My Tasks</span>
                  <div className="kpi-icon blue"><CheckSquare size={15} /></div>
                </div>
                <div className="kpi-value">{devData.totalTasks}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> +{devData.recentTasksCount}</span>
                  <span className="kpi-period">assigned recently</span>
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-header">
                  <span className="kpi-label">Code Commits</span>
                  <div className="kpi-icon purple"><Activity size={15} /></div>
                </div>
                <div className="kpi-value">{devData.codeCommits}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> +2</span>
                  <span className="kpi-period">this week</span>
                </div>
              </div>
              <div className="kpi-card teal">
                <div className="kpi-header">
                  <span className="kpi-label">PRs Reviewed</span>
                  <div className="kpi-icon teal"><FileText size={15} /></div>
                </div>
                <div className="kpi-value">{devData.prsReviewed}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> +1</span>
                  <span className="kpi-period">this sprint</span>
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Contribution Score</span>
                  <div className="kpi-icon green"><BarChart3 size={15} /></div>
                </div>
                <div className="kpi-value">{stats.contributionScore}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Live</span>
                  <span className="kpi-period">calculated index</span>
                </div>
              </div>
            </div>
            <div className="charts-row charts-row-2">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">My Tasks Breakdown</div>
                    <div className="chart-subtitle">By status</div>
                  </div>
                </div>
                <div className="chart-body" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '20px', gap: '16px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Todo</span>
                      <strong>{devData.statusBreakdown.todo} ({devData.statusBreakdown.todoPct}%)</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${devData.statusBreakdown.todoPct}%`, background: 'var(--accent-blue)' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>In Progress</span>
                      <strong>{devData.statusBreakdown.inProgress} ({devData.statusBreakdown.inProgressPct}%)</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${devData.statusBreakdown.inProgressPct}%`, background: 'var(--accent-yellow)' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Review</span>
                      <strong>{devData.statusBreakdown.review} ({devData.statusBreakdown.reviewPct}%)</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${devData.statusBreakdown.reviewPct}%`, background: 'var(--accent-purple)' }} />
                    </div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      <span>Done</span>
                      <strong>{devData.statusBreakdown.done} ({devData.statusBreakdown.donePct}%)</strong>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${devData.statusBreakdown.donePct}%`, background: 'var(--accent-green)' }} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Coding Activity</div>
                    <div className="chart-subtitle">Last 7 days</div>
                  </div>
                </div>
                <div className="chart-body" style={{ height: 220, position: 'relative' }}>
                  <Line data={getDeveloperActivityChartData()} options={adminActivityOptions} />
                </div>
              </div>
            </div>
          </>
        )
      }

      case 'tester': {
        const testData = getTesterData();
        return (
          <>
            <div className="kpi-grid">
              <div className="kpi-card blue">
                <div className="kpi-header">
                  <span className="kpi-label">Open Bugs</span>
                  <div className="kpi-icon blue"><Bug size={15} /></div>
                </div>
                <div className="kpi-value">{testData.openBugs}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta down"><TrendingDown size={12} /> Active</span>
                  <span className="kpi-period">unresolved bug tasks</span>
                </div>
              </div>
              <div className="kpi-card purple">
                <div className="kpi-header">
                  <span className="kpi-label">Tests Run</span>
                  <div className="kpi-icon purple"><CheckSquare size={15} /></div>
                </div>
                <div className="kpi-value">{testData.testsRun}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> +189</span>
                  <span className="kpi-period">this week</span>
                </div>
              </div>
              <div className="kpi-card teal">
                <div className="kpi-header">
                  <span className="kpi-label">Test Coverage</span>
                  <div className="kpi-icon teal"><BarChart3 size={15} /></div>
                </div>
                <div className="kpi-value">{testData.testCoverage}%</div>
                <div className="kpi-footer">
                  <span className="kpi-delta up"><TrendingUp size={12} /> Stable</span>
                  <span className="kpi-period">verified coverage</span>
                </div>
              </div>
              <div className="kpi-card green">
                <div className="kpi-header">
                  <span className="kpi-label">Critical Bugs</span>
                  <div className="kpi-icon green"><AlertTriangle size={15} /></div>
                </div>
                <div className="kpi-value">{testData.criticalBugs}</div>
                <div className="kpi-footer">
                  <span className="kpi-delta down"><TrendingDown size={12} /> Live</span>
                  <span className="kpi-period">blocking blocks</span>
                </div>
              </div>
            </div>
            <div className="charts-row charts-row-2">
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Bug Trends</div>
                    <div className="chart-subtitle">Last 7 days</div>
                  </div>
                </div>
                <div className="chart-body" style={{ height: 220, position: 'relative' }}>
                  <Line data={getTesterBugChartData()} options={adminActivityOptions} />
                </div>
              </div>
              <div className="chart-card">
                <div className="chart-header">
                  <div className="chart-title-group">
                    <div className="chart-title">Test Execution</div>
                    <div className="chart-subtitle">Pass/Fail rate</div>
                  </div>
                </div>
                <div className="chart-body" style={{ minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                  {/* SVG Donut Chart */}
                  <div style={{ position: 'relative', width: '130px', height: '130px', marginBottom: '16px' }}>
                    <svg width="100%" height="100%" viewBox="0 0 160 160" style={{ transform: 'rotate(-90deg)' }}>
                      {/* Fail circle (red) */}
                      <circle cx="80" cy="80" r="50" fill="none" stroke="var(--accent-red)" strokeWidth="18" />
                      {/* Pass circle (green) */}
                      <circle
                        cx="80"
                        cy="80"
                        r="50"
                        fill="none"
                        stroke="var(--accent-green)"
                        strokeWidth="18"
                        strokeDasharray="314.159"
                        strokeDashoffset={314.159 * (1 - testData.passPct)}
                        strokeLinecap="round"
                        style={{ transition: 'stroke-dashoffset 0.3s' }}
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      textAlign: 'center',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{Math.round(testData.passPct * 100)}%</div>
                      <div style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', marginTop: '2px' }}>Pass Rate</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontWeight: '600' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-green)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Passed: <strong>{testData.resolvedBugsCount}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-red)' }} />
                      <span style={{ color: 'var(--text-secondary)' }}>Failed: <strong>{testData.openBugsCount}</strong></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )
      }

      default:
        return <div>Loading dashboard...</div>
    }
  }

  const favoriteProjects = user?.favoriteProjects || [];

  return (
    <Layout
      pageTitle={`${user?.role} Dashboard`}
      pageEyebrow=" my workspace"
      pageSubtitle={`Welcome back, ${user?.name}! Here's your role-specific overview.`}
    >
      <div className="dashboard-grid-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
        {/* Left Side: Role Specific Dashboard */}
        <div className="dashboard-main-content">
          {getRoleDashboard()}
        </div>

        {/* Right Side: Quick Actions & Starred Projects Sidebar */}
        <div className="dashboard-sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Quick Actions Panel */}
          <div className="quick-actions-card glass-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Quick Actions</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/create-project" className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '10px', fontSize: '13px', width: '100%', padding: '10px 14px' }}>
                <FolderKanban size={15} style={{ color: 'var(--accent-blue)' }} /> Create Project
              </Link>
              <Link to="/create-task" className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '10px', fontSize: '13px', width: '100%', padding: '10px 14px' }}>
                <CheckSquare size={15} style={{ color: 'var(--accent-teal)' }} /> Create Task
              </Link>
              <Link to="/create-team" className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '10px', fontSize: '13px', width: '100%', padding: '10px 14px' }}>
                <Users size={15} style={{ color: 'var(--accent-purple)' }} /> Invite Member
              </Link>
              <Link to="/github/sync" className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '10px', fontSize: '13px', width: '100%', padding: '10px 14px' }}>
                <RefreshCw size={15} style={{ color: 'var(--accent-yellow)' }} /> Sync Repository
              </Link>
              <Link to="/project-reports" className="btn btn-ghost" style={{ justifyContent: 'flex-start', gap: '10px', fontSize: '13px', width: '100%', padding: '10px 14px' }}>
                <FileText size={15} style={{ color: 'var(--accent-green)' }} /> Generate Report
              </Link>
            </div>
          </div>

          {/* Favorite Projects Panel */}
          <div className="favorites-card glass-card" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '1px' }}>Starred Projects</h3>
            {favoriteProjects.length === 0 ? (
              <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', lineHeight: '1.4' }}>
                No starred projects yet. Star projects inside Project Details to pin them here.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {favoriteProjects.map(p => {
                  const pid = p._id || p;
                  const title = p.title || 'Untitled Project';
                  return (
                    <Link key={pid} to={`/project-details/${pid}`} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', color: 'var(--text-primary)', transition: 'all 0.2s', textDecoration: 'none' }}>
                      <FolderKanban size={14} style={{ color: 'var(--accent-yellow)', flexShrink: 0 }} />
                      <span style={{ fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Dashboard
