import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  Mail,
  Phone,
  Edit,
  Download,
  TrendingUp,
  Calendar,
  Save,
  X,
  Settings,
  Lock,
  Bell,
  Palette,
  Shield,
  User,
  RotateCcw,
  Moon,
  Sun,
  Monitor,
  Smartphone,
  FileEdit,
  Trash2,
  Check
} from 'lucide-react'
import Layout from '../components/Layout'
import './EngineeringProfile.css'
import API_BASE_URL from '../config/api';

const EngineeringProfile = () => {
  const { user, token, updateUserLocal, fetchMe } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [achievements, setAchievements] = useState([])
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    team: 'Alpha Team',
    bio: 'Engineering contributor tracking on DevMetrics. Passionate about clean code and scalable design.'
  })

  const fetchAchievements = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/achievements/my`, {
        headers: {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        setAchievements(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching achievements:', err);
    }
  };

  useEffect(() => {
    if (user) {
      setProfile(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'developer',
        bio: user.bio || 'Engineering contributor tracking on DevMetrics.'
      }));
      setSettingsForm({
        theme: user.theme || 'dark',
        density: user.density || 'comfortable',
        taskAlerts: user.taskAlerts !== false,
        deadlineReminders: user.deadlineReminders !== false,
        projectUpdates: user.projectUpdates !== false,
        publicProfile: user.publicProfile !== false,
        showContributionScore: user.showContributionScore !== false,
        showActivityTimeline: user.showActivityTimeline !== false,
        password: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (fetchMe) {
      fetchMe().catch(err => console.error('fetchMe error:', err));
    }
    fetchAchievements();
  }, [token]);

  const [settingsSection, setSettingsSection] = useState('appearance')
  const [settingsForm, setSettingsForm] = useState({
    theme: 'dark',
    density: 'comfortable',
    taskAlerts: true,
    deadlineReminders: true,
    projectUpdates: true,
    publicProfile: true,
    showContributionScore: true,
    showActivityTimeline: true,
    password: '',
    confirmPassword: ''
  })

  const handleSettingsFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setSettingsForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveSettings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          theme: settingsForm.theme,
          density: settingsForm.density,
          taskAlerts: settingsForm.taskAlerts,
          deadlineReminders: settingsForm.deadlineReminders,
          projectUpdates: settingsForm.projectUpdates,
          publicProfile: settingsForm.publicProfile,
          showContributionScore: settingsForm.showContributionScore,
          showActivityTimeline: settingsForm.showActivityTimeline
        })
      });

      const data = await res.json();
      if (res.ok) {
        updateUserLocal(data.data);
        alert('Settings saved successfully!');
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving settings');
    }
  }

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset changes?')) {
      if (user) {
        setSettingsForm({
          theme: user.theme || 'dark',
          density: user.density || 'comfortable',
          taskAlerts: user.taskAlerts !== false,
          deadlineReminders: user.deadlineReminders !== false,
          projectUpdates: user.projectUpdates !== false,
          publicProfile: user.publicProfile !== false,
          showContributionScore: user.showContributionScore !== false,
          showActivityTimeline: user.showActivityTimeline !== false,
          password: '',
          confirmPassword: ''
        });

        // Reset previews
        const root = document.documentElement;
        if (user.theme === 'light') {
          root.classList.add('light-theme');
        } else if (user.theme === 'dark') {
          root.classList.remove('light-theme');
        } else {
          const sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          if (sysDark) root.classList.remove('light-theme');
          else root.classList.add('light-theme');
        }
        if (user.density === 'compact') {
          root.classList.add('density-compact');
        } else {
          root.classList.remove('density-compact');
        }
      }
    }
  }

  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [profileStats, setProfileStats] = useState({
    projectsCompleted: 0,
    tasksCompleted: 0,
    activeProjectsCount: 0,
    teamRank: '#5',
    contributionPct: 0,
    contributionScore: 85,
    productivityScore: 80,
    qualityScore: 85,
    collaborationScore: 90,
    repositoryScore: 85
  });

  const [performanceStats, setPerformanceStats] = useState({
    weeklyTasks: 3,
    weeklyHours: 35,
    weeklyReviews: 5,
    monthlyTasks: 12,
    monthlyHours: 140,
    monthlyPRs: 8
  });

  const [contributionData, setContributionData] = useState([
    { month: 'Jan', score: 78 },
    { month: 'Feb', score: 82 },
    { month: 'Mar', score: 79 },
    { month: 'Apr', score: 88 },
    { month: 'May', score: 92 },
    { month: 'Jun', score: 94 }
  ]);

  const [productivityData, setProductivityData] = useState([
    { day: 'Mon', tasks: 4 },
    { day: 'Tue', tasks: 7 },
    { day: 'Wed', tasks: 5 },
    { day: 'Thu', tasks: 8 },
    { day: 'Fri', tasks: 6 }
  ]);

  const [projects, setProjects] = useState([
    { name: 'Orion Platform', role: 'Lead Dev', progress: 85, contribution: 35 },
    { name: 'Attendance System', role: 'Full Stack', progress: 72, contribution: 45 },
    { name: 'Invoice Dashboard', role: 'Frontend', progress: 100, contribution: 28 }
  ]);

  const [tasks, setTasks] = useState({
    assigned: [
      { id: 1, title: 'Implement dark mode toggle', status: 'In Progress', priority: 'High' },
      { id: 2, title: 'Refactor authentication flow', status: 'Todo', priority: 'Medium' },
      { id: 3, title: 'Update API documentation', status: 'Review', priority: 'Low' }
    ],
    completed: [
      { id: 4, title: 'Build user profile page', status: 'Done', priority: 'High' },
      { id: 5, title: 'Fix payment integration bug', status: 'Done', priority: 'Critical' }
    ],
    pending: [
      { id: 6, title: 'Optimize database queries', status: 'Todo', priority: 'Medium' }
    ]
  });

  const [activities, setActivities] = useState([
    { type: 'Task Completed', title: 'Completed Login Module', project: 'Attendance System', time: 'Today, 10:24 AM', icon: '✅' },
    { type: 'Project Updated', title: 'Updated project milestones', project: 'Orion Platform', time: 'Today, 09:15 AM', icon: '📁' },
    { type: 'Report Generated', title: 'Generated weekly performance report', project: 'All', time: 'Yesterday, 04:32 PM', icon: '📈' },
    { type: 'Project Joined', title: 'Joined Invoice Dashboard', project: 'Invoice Dashboard', time: 'Last Week', icon: '🎉' }
  ]);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const headers = {
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        };

        // 1. Fetch tasks
        const tasksRes = await fetch(`${API_BASE_URL}/api/tasks`, { headers });
        const tasksData = await tasksRes.json();
        const rawTasks = tasksData.data || [];

        // Filter tasks assigned to current user
        const userTasks = rawTasks.filter(t => t.assignee && (t.assignee._id === user?.id || t.assignee === user?.id));
        const userCompletedTasks = userTasks.filter(t => t.status === 'done');
        const userAssignedTasks = userTasks.filter(t => ['todo', 'in progress', 'review'].includes(t.status));
        const userPendingTasks = userTasks.filter(t => t.status === 'todo');

        setTasks({
          assigned: userAssignedTasks.map((t, idx) => ({ id: t._id || idx, title: t.title, status: t.status === 'in progress' ? 'In Progress' : t.status === 'review' ? 'Review' : 'Todo', priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1) })),
          completed: userCompletedTasks.map((t, idx) => ({ id: t._id || idx, title: t.title, status: 'Done', priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1) })),
          pending: userPendingTasks.map((t, idx) => ({ id: t._id || idx, title: t.title, status: 'Todo', priority: t.priority.charAt(0).toUpperCase() + t.priority.slice(1) }))
        });

        // 2. Fetch projects
        const projectsRes = await fetch(`${API_BASE_URL}/api/projects`, { headers });
        const projectsData = await projectsRes.json();
        const rawProjects = projectsData.data || [];

        // Filter projects where user is involved (has at least one task assigned in the project)
        const userProjectIds = [...new Set(userTasks.map(t => t.project && (t.project._id || t.project)))].filter(Boolean);
        const userProjects = rawProjects.filter(p => userProjectIds.includes(p._id));

        const mappedProjects = userProjects.map(p => {
          // Calculate project progress: completed tasks in project / total tasks in project
          const projectTasks = rawTasks.filter(t => t.project && (t.project._id || t.project) === p._id);
          const totalTasksInProj = projectTasks.length;
          const completedTasksInProj = projectTasks.filter(t => t.status === 'done').length;
          const progress = totalTasksInProj > 0 ? Math.round((completedTasksInProj / totalTasksInProj) * 100) : 0;

          // Calculate user contribution: tasks assigned to user in project / total tasks in project
          const userTasksInProj = projectTasks.filter(t => t.assignee && (t.assignee._id === user?.id || t.assignee === user?.id));
          const contribution = totalTasksInProj > 0 ? Math.round((userTasksInProj.length / totalTasksInProj) * 100) : 0;

          return {
            name: p.title,
            role: user?.role === 'developer' ? 'Developer' : user?.role === 'tester' ? 'Tester' : user?.role === 'team lead' ? 'Lead Dev' : 'Contributor',
            progress,
            contribution: contribution || 20 // baseline fallback
          };
        });

        if (mappedProjects.length > 0) {
          setProjects(mappedProjects);
        }

        // 3. Fetch leaderboard for team rank
        const leadRes = await fetch(`${API_BASE_URL}/api/analytics/leaderboard`, { headers });
        const leadData = await leadRes.json();
        const leaderboard = leadData.data || [];

        const userRankIndex = leaderboard.findIndex(u => u.id === user?.id);
        const teamRank = userRankIndex !== -1 ? `#${userRankIndex + 1}` : '#1';

        // 4. Fetch user's individual contribution score
        let contributionScore = 92;
        let productivityScore = 88;
        let qualityScore = 85;
        let collaborationScore = 90;
        let repositoryScore = 85;
        try {
          const scoreRes = await fetch(`${API_BASE_URL}/api/analytics/user/`, { headers });
          const scoreData = await scoreRes.json();
          if (scoreData.data) {
            contributionScore = Math.round(scoreData.data.contributionScore);
            const stats = scoreData.data.stats || {};
            // Derive a dynamic productivity score from tasks completion rate & adherence
            productivityScore = Math.round((stats.deadlineAdherenceRate || 80) * 0.5 + (stats.completionRate || 80) * 0.5) || 85;
            // Derive a dynamic quality score from bugs fixed and resolution rates
            qualityScore = Math.max(60, Math.min(100, 70 + (stats.githubIssues || 0) * 6));
            // Derive a dynamic collaboration score from reviews and pull requests activity
            collaborationScore = Math.max(60, Math.min(100, 65 + (stats.githubReviews || 0) * 5 + (stats.githubPRs || 0) * 3));
          }
        } catch (e) {
          console.log('Error fetching user analytics:', e.message);
        }

        // Fetch Repository Health scores
        try {
          const repoRes = await fetch(`${API_BASE_URL}/api/analytics/repository-insights`, { headers });
          const repoData = await repoRes.json();
          const repos = repoData.data || [];
          if (repos.length > 0) {
            const healthSum = repos.reduce((sum, r) => sum + (r.healthScore || 100), 0);
            repositoryScore = Math.round(healthSum / repos.length);
          }
        } catch (e) {
          console.log('Error fetching repo insights:', e.message);
        }

        // Calculate stats
        const activeProjectsCount = userProjects.filter(p => p.status !== 'completed').length;
        const totalCompletedInWorkspace = rawTasks.filter(t => t.status === 'done').length;
        const userCompletedCount = userCompletedTasks.length;
        const contributionPct = totalCompletedInWorkspace > 0 ? Math.round((userCompletedCount / totalCompletedInWorkspace) * 100) : 40;

        setProfileStats({
          projectsCompleted: userProjects.filter(p => p.status === 'completed').length || mappedProjects.filter(p => p.progress === 100).length || (userCompletedCount > 0 ? Math.max(1, userProjects.filter(p => p.status === 'completed').length) : 0),
          tasksCompleted: userCompletedCount,
          activeProjectsCount: activeProjectsCount || mappedProjects.filter(p => p.progress < 100).length,
          teamRank,
          contributionPct: contributionPct || 35,
          contributionScore,
          productivityScore,
          qualityScore,
          collaborationScore,
          repositoryScore
        });

        // 5. Build contribution trend monthly data for last 6 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
          const d = new Date();
          d.setMonth(d.getMonth() - i);
          const mName = months[d.getMonth()];
          
          // Count completed tasks by user in this month
          const completedInMonth = userCompletedTasks.filter(t => {
            if (!t.completionDate) return false;
            const compDate = new Date(t.completionDate);
            return compDate.getMonth() === d.getMonth() && compDate.getFullYear() === d.getFullYear();
          }).length;

          // Compute score based on count
          const score = Math.min(65 + completedInMonth * 10, 100);
          monthlyData.push({ month: mName, score });
        }
        setContributionData(monthlyData);

        // 6. Build productivity weekly data
        const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const weeklyTaskCounts = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 };
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        userCompletedTasks.forEach(t => {
          if (t.completionDate) {
            const dayName = daysOfWeek[new Date(t.completionDate).getDay()];
            if (weeklyTaskCounts[dayName] !== undefined) {
              weeklyTaskCounts[dayName]++;
            }
          }
        });

        const updatedProdData = weekdays.map(day => ({
          day,
          tasks: weeklyTaskCounts[day] || (userCompletedCount > 0 ? 1 : 2) // baseline fallback so bars aren't empty
        }));
        setProductivityData(updatedProdData);

        // 7. Fetch activity logs
        const logRes = await fetch(`${API_BASE_URL}/api/activities`, { headers });
        const logData = await logRes.json();
        const logsList = logData.data || [];

        const mappedActivities = logsList.slice(0, 5).map((log, idx) => {
          let icon = '⚡';
          let type = 'Activity';
          const evLower = log.event.toLowerCase();
          if (evLower.includes('complete') || evLower.includes('done')) {
            icon = '✅';
            type = 'Task Completed';
          } else if (evLower.includes('project')) {
            icon = '📁';
            type = 'Project Updated';
          } else if (evLower.includes('report')) {
            icon = '📈';
            type = 'Report Generated';
          } else if (evLower.includes('login') || evLower.includes('session')) {
            icon = '🔒';
            type = 'Security Alert';
          } else if (evLower.includes('update') || evLower.includes('change')) {
            icon = '✍️';
            type = 'Profile Update';
          }

          // Format time
          const tDate = new Date(log.timestamp);
          const timeStr = tDate.toLocaleDateString() + ', ' + tDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return {
            type,
            title: log.event,
            project: log.metadata?.projectTitle || 'System',
            time: timeStr,
            icon
          };
        });

        // 8. Calculate weekly/monthly performance stats
        const now = Date.now();
        const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
        const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

        const weeklyTasks = userCompletedTasks.filter(t => t.completionDate && new Date(t.completionDate).getTime() > oneWeekAgo).length;
        const monthlyTasks = userCompletedTasks.filter(t => t.completionDate && new Date(t.completionDate).getTime() > oneMonthAgo).length;

        const userLogs = logsList.filter(l => l.user && (l.user._id === user?.id || l.user === user?.id));
        const weeklyReviews = userLogs.filter(l => {
          const isReview = l.event.toLowerCase().includes('review') || l.event.toLowerCase().includes('pr');
          const isRecent = new Date(l.timestamp).getTime() > oneWeekAgo;
          return isReview && isRecent;
        }).length;

        const monthlyPRs = userLogs.filter(l => {
          const isPR = l.event.toLowerCase().includes('merge') || l.event.toLowerCase().includes('pr');
          const isRecent = new Date(l.timestamp).getTime() > oneMonthAgo;
          return isPR && isRecent;
        }).length;

        setPerformanceStats({
          weeklyTasks: weeklyTasks || (userCompletedCount > 0 ? 1 : 2),
          weeklyHours: (weeklyTasks || 1) * 6.5 + 18,
          weeklyReviews: weeklyReviews || 3,
          monthlyTasks: monthlyTasks || (userCompletedCount > 0 ? userCompletedCount : 6),
          monthlyHours: (monthlyTasks || 1) * 6.5 + 75,
          monthlyPRs: monthlyPRs || 8
        });

        if (mappedActivities.length > 0) {
          setActivities(mappedActivities);
        }
      } catch (err) {
        console.error('Error loading profile metrics:', err.message);
      } finally {
        setLoadingMetrics(false);
      }
    };

    if (token || localStorage.getItem('token')) {
      fetchProfileData();
    }
  }, [token, user]);

  const POTENTIAL_BADGES = [
    {
      key: 'first-commit',
      title: 'First Code Sync',
      desc: 'Synced your first commit to DevMetrics',
      icon: '🥇'
    },
    {
      key: 'pr-machine',
      title: 'PR Machine',
      desc: 'Successfully merged 3 or more Pull Requests',
      icon: '🚀'
    },
    {
      key: 'bug-hunter',
      title: 'Bug Hunter',
      desc: 'Closed 3 or more bug issues',
      icon: '🐛'
    },
    {
      key: 'task-champion',
      title: 'Task Champion',
      desc: 'Completed 5 or more workspace tasks',
      icon: '🎯'
    },
    {
      key: 'collab-star',
      title: 'Collaboration Star',
      desc: 'Submitted 5 or more reviews or comments',
      icon: '💬'
    }
  ];

  const renderedBadges = POTENTIAL_BADGES.map(badge => {
    const isUnlocked = achievements.some(a => a.badgeKey === badge.key);
    const unlockedInfo = achievements.find(a => a.badgeKey === badge.key);
    return {
      ...badge,
      unlocked: isUnlocked,
      unlockedAt: unlockedInfo ? new Date(unlockedInfo.unlockedAt).toLocaleDateString() : null
    };
  });

  const handleProfileChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value })
  }

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          bio: profile.bio
        })
      });
      const data = await res.json();
      if (res.ok) {
        updateUserLocal(data.data);
        setActiveTab('overview');
      } else {
        alert(data.message || 'Failed to update profile');
      }
    } catch (err) {
      alert('Error saving profile');
    }
  }

  const handleExportReport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + ["Metric,Value",
         `Name,${profile.name}`,
         `Role,${profile.role}`,
         `Team,${profile.team}`,
         `Email,${profile.email}`,
         `Phone,${profile.phone}`,
         `Contribution Score,${profileStats.contributionScore}`,
         `Productivity Score,${profileStats.productivityScore}`,
         `Projects Completed,${profileStats.projectsCompleted}`,
         `Tasks Completed,${profileStats.tasksCompleted}`,
         `Active Projects,${profileStats.activeProjectsCount}`
        ].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${profile.name.toLowerCase().replace(' ', '_')}_profile_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  const contributionPoints = contributionData.map((d, i) => {
    const x = 40 + i * 88;
    const y = 165 - ((d.score - 40) / 60) * 135;
    return { x, y };
  });
  
  const contributionPath = `M 40 165 L ${contributionPoints.map(p => `${p.x} ${p.y}`).join(' L ')} L 480 165 Z`;
  const contributionLine = contributionPoints.map(p => `${p.x} ${p.y}`).join(' L ');

  return (
    <Layout
      pageTitle="Engineering Profile"
      pageEyebrow="// my profile"
      pageSubtitle="View and manage your engineering profile and performance metrics."
    >
      {activeTab !== 'contributions' && activeTab !== 'activity' && activeTab !== 'profile-settings' && (
        <>
          <div className="profile-header">
            <div className="profile-info">
              <div className="profile-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'U'
                )}
              </div>
              <div className="profile-details">
                <h1 className="profile-name">
                  {profile.name}
                  {user?.streakCount > 0 && (
                    <span className="streak-badge-animated" title={`${user.streakCount} Day Contribution Streak`}>
                      🔥 {user.streakCount} Day Streak
                    </span>
                  )}
                </h1>
                <div className="profile-meta">
                  <span className="profile-role">{profile.role}</span>
                  <span className="profile-divider">•</span>
                  <span className="profile-team">{profile.team}</span>
                </div>
                <div className="profile-contact">
                  <span className="contact-item"><Mail size={14} /> {profile.email}</span>
                  {profile.phone && <span className="contact-item"><Phone size={14} /> {profile.phone}</span>}
                </div>
                {user?.showContributionScore !== false && (
                  <div className="profile-scores">
                    <div className="score-item">
                      <div className="score-label">Contribution</div>
                      <div className="score-value">{profileStats.contributionScore}</div>
                    </div>
                    <div className="score-divider"></div>
                    <div className="score-item">
                      <div className="score-label">Productivity</div>
                      <div className="score-value">{profileStats.productivityScore}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="profile-actions">
              <button className="btn btn-ghost" onClick={() => setActiveTab('profile-settings')}><Edit size={16} /> Edit Profile</button>
              <button className="btn btn-primary" onClick={handleExportReport}><Download size={16} /> Export Profile Report</button>
            </div>
          </div>

          <div className="stats-grid" style={{ gridTemplateColumns: user?.showContributionScore !== false ? 'repeat(5, 1fr)' : 'repeat(4, 1fr)' }}>
            <div className="stat-card">
              <div className="stat-icon">📁</div>
              <div className="stat-content">
                <div className="stat-number">{profileStats.projectsCompleted}</div>
                <div className="stat-label">Projects Completed</div>
              </div>
            </div>
            <div className="stat-card highlight">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{profileStats.tasksCompleted}</div>
                <div className="stat-label">Tasks Completed</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <div className="stat-number">{profileStats.activeProjectsCount}</div>
                <div className="stat-label">Active Projects</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-number">{profileStats.teamRank}</div>
                <div className="stat-label">Team Rank</div>
              </div>
            </div>
            {user?.showContributionScore !== false && (
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-content">
                  <div className="stat-number">{profileStats.contributionPct}%</div>
                  <div className="stat-label">Contribution</div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      <div className="profile-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          Projects
        </button>
        {user?.showContributionScore !== false && (
          <button
            className={`tab-btn ${activeTab === 'contributions' ? 'active' : ''}`}
            onClick={() => setActiveTab('contributions')}
          >
            Contributions
          </button>
        )}
        {user?.showActivityTimeline !== false && (
          <button
            className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
            onClick={() => setActiveTab('activity')}
          >
            Activity Timeline
          </button>
        )}
        <button
          className={`tab-btn ${activeTab === 'profile-settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('profile-settings')}
        >
          Edit Profile
        </button>
      </div>
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <h2 className="section-subtitle">Engineering Performance Scorecards</h2>
            <div className="engineering-scorecards-grid">
              <div className="scorecard-card productivity">
                <div className="scorecard-header">
                  <span className="scorecard-title">Productivity Score</span>
                  <span className="scorecard-badge productivity-badge">Level A</span>
                </div>
                <div className="scorecard-value-display">
                  <span className="scorecard-value">{profileStats.productivityScore}</span>
                  <span className="scorecard-pct">/100</span>
                </div>
                <div className="scorecard-progress-bar">
                  <div className="scorecard-progress-fill" style={{ width: `${profileStats.productivityScore}%`, background: 'var(--accent-purple)' }}></div>
                </div>
                <span className="scorecard-desc">Completion & deadline adherence</span>
              </div>

              <div className="scorecard-card quality">
                <div className="scorecard-header">
                  <span className="scorecard-title">Code Quality</span>
                  <span className="scorecard-badge quality-badge">Level A</span>
                </div>
                <div className="scorecard-value-display">
                  <span className="scorecard-value">{profileStats.qualityScore}</span>
                  <span className="scorecard-pct">/100</span>
                </div>
                <div className="scorecard-progress-bar">
                  <div className="scorecard-progress-fill" style={{ width: `${profileStats.qualityScore}%`, background: 'var(--accent-red)' }}></div>
                </div>
                <span className="scorecard-desc">Defect resolution & bugs closed</span>
              </div>

              <div className="scorecard-card collaboration">
                <div className="scorecard-header">
                  <span className="scorecard-title">Collaboration</span>
                  <span className="scorecard-badge collaboration-badge">Level B+</span>
                </div>
                <div className="scorecard-value-display">
                  <span className="scorecard-value">{profileStats.collaborationScore}</span>
                  <span className="scorecard-pct">/100</span>
                </div>
                <div className="scorecard-progress-bar">
                  <div className="scorecard-progress-fill" style={{ width: `${profileStats.collaborationScore}%`, background: 'var(--accent-blue)' }}></div>
                </div>
                <span className="scorecard-desc">Reviews given and PR reviews</span>
              </div>

              <div className="scorecard-card repository">
                <div className="scorecard-header">
                  <span className="scorecard-title">Repository Health</span>
                  <span className="scorecard-badge repository-badge">Level A-</span>
                </div>
                <div className="scorecard-value-display">
                  <span className="scorecard-value">{profileStats.repositoryScore}</span>
                  <span className="scorecard-pct">/100</span>
                </div>
                <div className="scorecard-progress-bar">
                  <div className="scorecard-progress-fill" style={{ width: `${profileStats.repositoryScore}%`, background: 'var(--accent-teal)' }}></div>
                </div>
                <span className="scorecard-desc">Average health of project repos</span>
              </div>
            </div>

            <div className="charts-grid" style={{ gridTemplateColumns: user?.showContributionScore !== false ? 'repeat(2, 1fr)' : '1fr' }}>
              {user?.showContributionScore !== false && (
                <div className="card chart-card">
                  <div className="card-title">Contribution Trend</div>
                <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                  <svg viewBox="0 0 500 220" width="100%" height="100%">
                    <defs>
                      <linearGradient id="colorContribution" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <line x1="40" y1="30" x2="480" y2="30" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="75" x2="480" y2="75" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="120" x2="480" y2="120" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="165" x2="480" y2="165" stroke="var(--border)" strokeDasharray="3 3" />

                    <text x="30" y="34" fill="var(--text-muted)" fontSize="10" textAnchor="end">100</text>
                    <text x="30" y="79" fill="var(--text-muted)" fontSize="10" textAnchor="end">80</text>
                    <text x="30" y="124" fill="var(--text-muted)" fontSize="10" textAnchor="end">60</text>
                    <text x="30" y="169" fill="var(--text-muted)" fontSize="10" textAnchor="end">40</text>

                    <path
                      d={contributionPath}
                      fill="url(#colorContribution)"
                    />
                    <path
                      d={contributionLine}
                      fill="none"
                      stroke="var(--accent-blue)"
                      strokeWidth="3"
                    />

                    {contributionPoints.map((p, i) => (
                      <circle key={i} cx={p.x} cy={p.y} r="4" fill="var(--accent-blue)" stroke="var(--bg-surface)" strokeWidth="2" />
                    ))}

                    {contributionData.map((d, i) => (
                      <text key={i} x={40 + i * 88} y="190" fill="var(--text-muted)" fontSize="11" textAnchor="middle">{d.month}</text>
                    ))}
                  </svg>
                </div>
              </div>
              )}

              <div className="card chart-card">
                <div className="card-title">Productivity Trend</div>
                <div style={{ width: '100%', height: '220px', position: 'relative' }}>
                  <svg viewBox="0 0 500 220" width="100%" height="100%">
                    <line x1="40" y1="30" x2="480" y2="30" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="57" x2="480" y2="57" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="84" x2="480" y2="84" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="111" x2="480" y2="111" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="138" x2="480" y2="138" stroke="var(--border)" strokeDasharray="3 3" />
                    <line x1="40" y1="165" x2="480" y2="165" stroke="var(--border)" strokeDasharray="3 3" />

                    <text x="30" y="34" fill="var(--text-muted)" fontSize="10" textAnchor="end">10</text>
                    <text x="30" y="61" fill="var(--text-muted)" fontSize="10" textAnchor="end">8</text>
                    <text x="30" y="88" fill="var(--text-muted)" fontSize="10" textAnchor="end">6</text>
                    <text x="30" y="115" fill="var(--text-muted)" fontSize="10" textAnchor="end">4</text>
                    <text x="30" y="142" fill="var(--text-muted)" fontSize="10" textAnchor="end">2</text>
                    <text x="30" y="169" fill="var(--text-muted)" fontSize="10" textAnchor="end">0</text>

                    {productivityData.map((d, i) => {
                      const x = 68 + i * 90;
                      const height = (d.tasks / 10) * 135;
                      const y = 165 - height;
                      return (
                        <rect key={i} x={x} y={y} width="24" height={height} rx="4" fill="var(--accent-purple)" />
                      );
                    })}

                    {productivityData.map((d, i) => (
                      <text key={i} x={80 + i * 90} y="190" fill="var(--text-muted)" fontSize="11" textAnchor="middle">{d.day}</text>
                    ))}
                  </svg>
                </div>
              </div>
            </div>

            <div className="performance-grid">
              <div className="card performance-card">
                <div className="card-title"><Calendar size={18} /> Weekly Performance</div>
                <div className="performance-metrics">
                  <div className="metric-row">
                    <span>Tasks Completed</span>
                    <span className="metric-value">{performanceStats.weeklyTasks}</span>
                  </div>
                  <div className="metric-row">
                    <span>Hours Logged</span>
                    <span className="metric-value">{performanceStats.weeklyHours}</span>
                  </div>
                  <div className="metric-row">
                    <span>Code Reviews</span>
                    <span className="metric-value">{performanceStats.weeklyReviews}</span>
                  </div>
                </div>
              </div>
              <div className="card performance-card">
                <div className="card-title"><Calendar size={18} /> Monthly Performance</div>
                <div className="performance-metrics">
                  <div className="metric-row">
                    <span>Tasks Completed</span>
                    <span className="metric-value">{performanceStats.monthlyTasks}</span>
                  </div>
                  <div className="metric-row">
                    <span>Hours Logged</span>
                    <span className="metric-value">{performanceStats.monthlyHours}</span>
                  </div>
                  <div className="metric-row">
                    <span>PRs Merged</span>
                    <span className="metric-value">{performanceStats.monthlyPRs}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card achievements-section">
              <div className="card-title"><TrendingUp size={18} /> Achievements & Badges</div>
              <div className="achievements-grid">
                {renderedBadges.map((badge, index) => (
                  <div key={index} className={`achievement-card ${badge.unlocked ? 'unlocked' : 'locked'}`}>
                    <div className="achievement-icon-wrapper">
                      <div className="achievement-icon">{badge.icon}</div>
                      {!badge.unlocked && <div className="lock-overlay">🔒</div>}
                    </div>
                    <div className="achievement-info">
                      <div className="achievement-title">{badge.title}</div>
                      <div className="achievement-desc">{badge.desc}</div>
                      {badge.unlocked && (
                        <div className="achievement-unlocked-date">
                          Unlocked: {badge.unlockedAt}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="projects-tab">
            <div className="projects-list">
              {projects.map((project, index) => (
                <div key={index} className="project-card">
                  <div className="project-info">
                    <div className="project-name">{project.name}</div>
                    <div className="project-role">{project.role}</div>
                  </div>
                  <div className="project-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${project.progress}%` }}></div>
                    </div>
                    <div className="progress-label">{project.progress}% Complete</div>
                  </div>
                  <div className="project-contribution">
                    <div className="contribution-circle">
                      <svg viewBox="0 0 36 36">
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="rgba(79, 142, 247, 0.2)" strokeWidth="3" />
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="var(--accent-blue)" strokeWidth="3" strokeDasharray="100, 100" strokeDashoffset={100 - project.contribution} className="progress-ring" />
                      </svg>
                      <div className="contribution-value">{project.contribution}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'profile-settings' && (
          <div className="card profile-edit-card">
            <div className="edit-card-header">
              <h2 className="edit-card-title">Edit Profile</h2>
              <p className="edit-card-desc">Update your personal details and bio information.</p>
            </div>
            
            <div className="edit-card-content">
              {/* Left side: Avatar & Bio */}
              <div className="edit-left-col">
                <div className="edit-avatar-section">
                  <div className="profile-avatar edit-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))' }}>
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt={profile.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      profile.name ? profile.name.split(' ').map(n => n[0]).join('') : 'U'
                    )}
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => {
                    const fileInput = document.getElementById('edit-profile-file-input');
                    if (fileInput) fileInput.click();
                  }}>
                    Change Photo
                  </button>
                  <input
                    type="file"
                    id="edit-profile-file-input"
                    style={{ display: 'none' }}
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;

                      // Canvas compression helper
                      const reader = new FileReader();
                      reader.readAsDataURL(file);
                      reader.onload = (event) => {
                        const img = new Image();
                        img.src = event.target.result;
                        img.onload = async () => {
                          const canvas = document.createElement('canvas');
                          const MAX_WIDTH = 150;
                          const MAX_HEIGHT = 150;
                          let width = img.width;
                          let height = img.height;

                          if (width > height) {
                            if (width > MAX_WIDTH) {
                              height *= MAX_WIDTH / width;
                              width = MAX_WIDTH;
                            }
                          } else {
                            if (height > MAX_HEIGHT) {
                              width *= MAX_HEIGHT / height;
                              height = MAX_HEIGHT;
                            }
                          }
                          canvas.width = width;
                          canvas.height = height;
                          const ctx = canvas.getContext('2d');
                          ctx.drawImage(img, 0, 0, width, height);
                          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
                          
                          // Save profile picture
                          try {
                            const res = await fetch(`${API_BASE_URL}/api/users/${user.id}`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token || localStorage.getItem('token')}`
                              },
                              body: JSON.stringify({ profilePicture: compressedBase64 })
                            });
                            const data = await res.json();
                            if (res.ok) {
                              updateUserLocal(data.data);
                              alert('Profile picture updated successfully!');
                            } else {
                              alert(data.message || 'Failed to upload photo');
                            }
                          } catch (err) {
                            console.error(err);
                            alert('Error updating photo');
                          }
                        };
                      };
                    }}
                  />
                </div>

                <div className="profile-form-group" style={{ marginTop: '1.5rem', width: '100%' }}>
                  <label className="profile-form-label">Bio Description</label>
                  <textarea
                    name="bio"
                    value={profile.bio}
                    onChange={handleProfileChange}
                    className="profile-textarea"
                    placeholder="Tell us about yourself..."
                    rows="4"
                  />
                </div>
              </div>

              {/* Right side: Fields */}
              <div className="edit-right-col">
                <div className="profile-form-group">
                  <label className="profile-form-label">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={profile.name}
                    onChange={handleProfileChange}
                    className="profile-input"
                    placeholder="Full Name"
                  />
                </div>

                <div className="profile-form-row">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Role</label>
                    <input
                      type="text"
                      name="role"
                      value={profile.role}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="Role"
                      disabled={user?.role !== 'admin'}
                    />
                  </div>
                  <div className="profile-form-group">
                    <label className="profile-form-label">Team</label>
                    <input
                      type="text"
                      name="team"
                      value={profile.team}
                      onChange={handleProfileChange}
                      className="profile-input"
                      placeholder="Team"
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleProfileChange}
                    className="profile-input"
                    placeholder="Email Address"
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleProfileChange}
                    className="profile-input"
                    placeholder="Phone Number"
                  />
                </div>
              </div>
            </div>

            <div className="edit-card-actions">
              <button className="btn btn-ghost" onClick={() => setActiveTab('overview')}>
                <X size={16} /> Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab-container">
            <div className="settings-tab-layout">
              {/* Settings navigation sidebar */}
              <nav className="settings-tab-nav">
                <button
                  className={`settings-nav-btn ${settingsSection === 'appearance' ? 'active' : ''}`}
                  onClick={() => setSettingsSection('appearance')}
                >
                  <Palette size={16} />
                  <span>Appearance</span>
                </button>
                <button
                  className={`settings-nav-btn ${settingsSection === 'notifications' ? 'active' : ''}`}
                  onClick={() => setSettingsSection('notifications')}
                >
                  <Bell size={16} />
                  <span>Notifications</span>
                </button>
                <button
                  className={`settings-nav-btn ${settingsSection === 'security' ? 'active' : ''}`}
                  onClick={() => setSettingsSection('security')}
                >
                  <Lock size={16} />
                  <span>Security</span>
                </button>
                <button
                  className={`settings-nav-btn ${settingsSection === 'privacy' ? 'active' : ''}`}
                  onClick={() => setSettingsSection('privacy')}
                >
                  <Shield size={16} />
                  <span>Privacy</span>
                </button>
              </nav>

              {/* Settings content pane */}
              <div className="settings-tab-content">

                {settingsSection === 'appearance' && (
                  <div className="settings-pane-card">
                    <h3 className="pane-title">Appearance</h3>
                    <p className="pane-desc">Customize your interface theme and typography density.</p>

                    <h4 className="pane-subtitle">Theme Selection</h4>
                    <div className="theme-options-grid">
                      <div
                        className={`theme-box ${settingsForm.theme === 'dark' ? 'active' : ''}`}
                        onClick={() => {
                          setSettingsForm({ ...settingsForm, theme: 'dark' });
                          document.documentElement.classList.remove('light-theme');
                        }}
                      >
                        <Moon size={20} />
                        <span>Dark Mode</span>
                      </div>
                      <div
                        className={`theme-box ${settingsForm.theme === 'light' ? 'active' : ''}`}
                        onClick={() => {
                          setSettingsForm({ ...settingsForm, theme: 'light' });
                          document.documentElement.classList.add('light-theme');
                        }}
                      >
                        <Sun size={20} />
                        <span>Light Mode</span>
                      </div>
                      <div
                        className={`theme-box ${settingsForm.theme === 'system' ? 'active' : ''}`}
                        onClick={() => {
                          setSettingsForm({ ...settingsForm, theme: 'system' });
                          const root = document.documentElement;
                          const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                          if (systemPrefersDark) {
                            root.classList.remove('light-theme');
                          } else {
                            root.classList.add('light-theme');
                          }
                        }}
                      >
                        <Monitor size={20} />
                        <span>System Theme</span>
                      </div>
                    </div>

                    <h4 className="pane-subtitle" style={{ marginTop: '24px' }}>Dashboard Density</h4>
                    <div className="density-selector">
                      <button
                        className={`density-option-btn ${settingsForm.density === 'compact' ? 'active' : ''}`}
                        onClick={() => {
                          setSettingsForm({ ...settingsForm, density: 'compact' });
                          document.documentElement.classList.add('density-compact');
                        }}
                      >
                        Compact
                      </button>
                      <button
                        className={`density-option-btn ${settingsForm.density === 'comfortable' ? 'active' : ''}`}
                        onClick={() => {
                          setSettingsForm({ ...settingsForm, density: 'comfortable' });
                          document.documentElement.classList.remove('density-compact');
                        }}
                      >
                        Comfortable
                      </button>
                    </div>

                    <div className="settings-pane-actions" style={{ marginTop: '32px' }}>
                      <button className="btn btn-ghost" onClick={handleResetSettings}>
                        <RotateCcw size={16} />
                        Reset
                      </button>
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === 'notifications' && (
                  <div className="settings-pane-card">
                    <h3 className="pane-title">Notification Preferences</h3>
                    <p className="pane-desc">Select which events you would like to be notified about.</p>

                    <div className="toggles-list">
                      <div className="toggle-row-item">
                        <div className="toggle-row-info">
                          <span className="toggle-row-title">Task Assignment Alerts</span>
                          <span className="toggle-row-desc">Notify me whenever a new task is assigned.</span>
                        </div>
                        <label className="switch-input-wrap">
                          <input
                            type="checkbox"
                            name="taskAlerts"
                            checked={settingsForm.taskAlerts}
                            onChange={handleSettingsFormChange}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </div>

                      <div className="toggle-row-item">
                        <div className="toggle-row-info">
                          <span className="toggle-row-title">Deadline Reminders</span>
                          <span className="toggle-row-desc">Send alert reminders for upcoming due dates.</span>
                        </div>
                        <label className="switch-input-wrap">
                          <input
                            type="checkbox"
                            name="deadlineReminders"
                            checked={settingsForm.deadlineReminders}
                            onChange={handleSettingsFormChange}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </div>

                      <div className="toggle-row-item">
                        <div className="toggle-row-info">
                          <span className="toggle-row-title">Project Status Updates</span>
                          <span className="toggle-row-desc">Notify when projects reach key progression points.</span>
                        </div>
                        <label className="switch-input-wrap">
                          <input
                            type="checkbox"
                            name="projectUpdates"
                            checked={settingsForm.projectUpdates}
                            onChange={handleSettingsFormChange}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="settings-pane-actions" style={{ marginTop: '24px' }}>
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === 'security' && (
                  <div className="settings-pane-card">
                    <h3 className="pane-title">Security Preferences</h3>
                    <p className="pane-desc">Manage credentials and authentication details.</p>

                    <div className="settings-form-grid">
                      <div className="form-group-full">
                        <label className="settings-field-label">New Password</label>
                        <input
                          type="password"
                          name="password"
                          value={settingsForm.password}
                          onChange={handleSettingsFormChange}
                          className="settings-field-input"
                          placeholder="••••••••"
                        />
                      </div>
                      <div className="form-group-full">
                        <label className="settings-field-label">Confirm New Password</label>
                        <input
                          type="password"
                          name="confirmPassword"
                          value={settingsForm.confirmPassword}
                          onChange={handleSettingsFormChange}
                          className="settings-field-input"
                          placeholder="••••••••"
                        />
                      </div>
                    </div>

                    <div className="security-extra-list">
                      <div className="security-extra-row">
                        <div className="security-extra-info">
                          <span className="security-extra-title">Two-Factor Authentication (2FA)</span>
                          <span className="security-extra-desc">Enable 2FA via SMS or authenticator apps.</span>
                        </div>
                        <button className="btn btn-ghost btn-sm">Enable</button>
                      </div>
                    </div>

                    <div className="settings-pane-actions" style={{ marginTop: '24px' }}>
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <Save size={16} />
                        Update Password
                      </button>
                    </div>
                  </div>
                )}

                {settingsSection === 'privacy' && (
                  <div className="settings-pane-card">
                    <h3 className="pane-title">Privacy Settings</h3>
                    <p className="pane-desc">Manage your visibility to other team members.</p>

                    <div className="toggles-list">
                      <div className="toggle-row-item">
                        <div className="toggle-row-info">
                          <span className="toggle-row-title">Public Directory Profile</span>
                          <span className="toggle-row-desc">Allow team directory visitors to search and view your profile.</span>
                        </div>
                        <label className="switch-input-wrap">
                          <input
                            type="checkbox"
                            name="publicProfile"
                            checked={settingsForm.publicProfile}
                            onChange={handleSettingsFormChange}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </div>

                      <div className="toggle-row-item">
                        <div className="toggle-row-info">
                          <span className="toggle-row-title">Show Contribution Score</span>
                          <span className="toggle-row-desc">Display scores (Contribution/Productivity) on profile pages.</span>
                        </div>
                        <label className="switch-input-wrap">
                          <input
                            type="checkbox"
                            name="showContributionScore"
                            checked={settingsForm.showContributionScore}
                            onChange={handleSettingsFormChange}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </div>

                      <div className="toggle-row-item">
                        <div className="toggle-row-info">
                          <span className="toggle-row-title">Visible Activity Timeline</span>
                          <span className="toggle-row-desc">Share profile activity timeline updates in feed widgets.</span>
                        </div>
                        <label className="switch-input-wrap">
                          <input
                            type="checkbox"
                            name="showActivityTimeline"
                            checked={settingsForm.showActivityTimeline}
                            onChange={handleSettingsFormChange}
                          />
                          <span className="switch-slider"></span>
                        </label>
                      </div>
                    </div>

                    <div className="settings-pane-actions" style={{ marginTop: '24px' }}>
                      <button className="btn btn-primary" onClick={handleSaveSettings}>
                        <Save size={16} />
                        Save Changes
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'contributions' && user?.showContributionScore !== false && (
          <div className="contributions-tab">
            <div className="contributions-grid">
              <div className="card">
                <div className="card-title">Contribution Breakdown</div>
                <div className="contribution-breakdown">
                  <div className="breakdown-item">
                    <div className="breakdown-dot" style={{ background: 'var(--accent-blue)' }}></div>
                    <div className="breakdown-label">Code Commits</div>
                    <div className="breakdown-value">45%</div>
                  </div>
                  <div className="breakdown-item">
                    <div className="breakdown-dot" style={{ background: 'var(--accent-purple)' }}></div>
                    <div className="breakdown-label">Code Reviews</div>
                    <div className="breakdown-value">30%</div>
                  </div>
                  <div className="breakdown-item">
                    <div className="breakdown-dot" style={{ background: 'var(--accent-teal)' }}></div>
                    <div className="breakdown-label">Documentation</div>
                    <div className="breakdown-value">15%</div>
                  </div>
                  <div className="breakdown-item">
                    <div className="breakdown-dot" style={{ background: 'var(--accent-yellow)' }}></div>
                    <div className="breakdown-label">Meetings & Collaboration</div>
                    <div className="breakdown-value">10%</div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-title">Leaderboard Position</div>
                <div className="leaderboard-position">
                  <div className="rank-number">#1</div>
                  <div className="rank-label">Top Contributor</div>
                  <div className="rank-desc">Ahead of 4 other team members</div>
                </div>
              </div>
            </div>

            <div className="card radar-chart-card">
              <div className="card-title">Skills Radar</div>
              <div className="radar-placeholder">
                <div className="radar-dimension">
                  <span>Frontend</span>
                  <div className="radar-bar">
                    <div className="radar-fill" style={{ width: '90%' }}></div>
                  </div>
                </div>
                <div className="radar-dimension">
                  <span>Backend</span>
                  <div className="radar-bar">
                    <div className="radar-fill" style={{ width: '85%' }}></div>
                  </div>
                </div>
                <div className="radar-dimension">
                  <span>Code Quality</span>
                  <div className="radar-bar">
                    <div className="radar-fill" style={{ width: '92%' }}></div>
                  </div>
                </div>
                <div className="radar-dimension">
                  <span>Collaboration</span>
                  <div className="radar-bar">
                    <div className="radar-fill" style={{ width: '88%' }}></div>
                  </div>
                </div>
                <div className="radar-dimension">
                  <span>Communication</span>
                  <div className="radar-bar">
                    <div className="radar-fill" style={{ width: '80%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && user?.showActivityTimeline !== false && (
          <div className="activity-tab">
            <div className="activity-timeline">
              {activities.map((activity, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="activity-icon">{activity.icon}</span>
                      <span className="activity-type">{activity.type}</span>
                    </div>
                    <div className="timeline-title">{activity.title}</div>
                    <div className="timeline-meta">
                      <span className="activity-project">{activity.project}</span>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}

export default EngineeringProfile
