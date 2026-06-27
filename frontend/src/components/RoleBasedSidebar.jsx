import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  CheckSquare,
  BarChart3,
  FileText,
  Activity,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Upload,
  PlusSquare,
  GitBranch,
  Link as LinkIcon,
  RefreshCw,
  Heart,
  Award,
  Database,
  MessageSquare,
  AlertCircle,
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRole } from '../context/RoleContext';

const iconMap = {
  'Dashboard': LayoutDashboard,
  'Projects': FolderKanban,
  'All Projects': FolderKanban,
  'My Projects': FolderKanban,
  'Assigned Projects': FolderKanban,
  'Create Project': PlusSquare,
  'Teams': Users,
  'Team Directory': Users,
  'My Team': Users,
  'Create Team': PlusSquare,
  'Tasks': CheckSquare,
  'Task Board': CheckSquare,
  'My Tasks': PlusSquare,
  'Create Task': PlusSquare,
  'Analytics': BarChart3,
  'Contribution Analytics': BarChart3,
  'My Contribution Analytics': BarChart3,
  'GitHub Analytics': BarChart3,
  'Engineering Health': Heart,
  'Developer Performance': User,
  'Leaderboard': Award,
  'Repository Insights': Database,
  'Review Analytics': MessageSquare,
  'Issue Analytics': AlertCircle,
  'Project Risk Analytics': ShieldAlert,
  'Bus Factor Analytics': AlertOctagon,
  'Knowledge Distribution': BookOpen,
  'Repository Management': GitBranch,
  'Repository Linking': LinkIcon,
  'Sync Center': RefreshCw,
  'Team Performance': TrendingUp,
  'Reports': FileText,
  'Project Reports': FileText,
  'Team Reports': FileText,
  'Export Center': Upload,
  'Activity Logs': Activity,
  'Notifications': Bell,
  'Profile': User,
  'Settings': Settings,
  'Admin Dashboard': ShieldCheck,
  'User Management': Shield,
  'Platform Health': Heart,
  'System Activity': Activity
};

const RoleBasedSidebar = () => {
  const { user, logout } = useAuth();
  const { getSidebarSections } = useRole();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [collapsedSections, setCollapsedSections] = useState({});

  const sidebarSections = getSidebarSections();

  const toggleSection = (sectionLabel) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionLabel]: !prev[sectionLabel]
    }));
  };

  const isActiveRoute = (path) => {
    if (path === '/all-projects' && location.pathname.startsWith('/project-details')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">D</div>
        <span className="logo-text">DevMetrics</span>
        <span className="logo-badge">Pro</span>
      </div>

      <div className="sidebar-content">
        {sidebarSections.map((section) => (
          <div key={section.label} className="sidebar-section">
            <button
              className="sidebar-section-header"
              onClick={() => toggleSection(section.label)}
            >
              <span className="sidebar-label">{section.label}</span>
              <ChevronDown
                size={14}
                className={`sidebar-chevron ${collapsedSections[section.label] ? 'collapsed' : ''}`}
              />
            </button>

            {!collapsedSections[section.label] && (
              <div className="sidebar-section-items">
                {section.items.map((item) => {
                  const Icon = iconMap[item.label] || FileText;
                  return (
                    <Link
                      key={item.path}
                      className={`nav-item ${isActiveRoute(item.path) ? 'active' : ''}`}
                      to={item.path}
                    >
                      <Icon className="nav-icon" size={18} />
                      <span className="nav-label">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar" style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--accent-blue), var(--accent-purple))', padding: 0 }}>
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'
            )}
          </div>
          <div className="user-info">
            <div className="user-name">{user?.name || 'Guest User'}</div>
            <div className="user-role">{user?.role || 'Guest'}</div>
          </div>
          {user ? (
            <button
              onClick={handleLogout}
              className="logout-button"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          ) : (
            <Link to="/login" className="logout-button" title="Login" style={{ color: 'var(--accent-blue)' }}>
              <LogOut size={18} style={{ transform: 'rotate(180deg)' }} />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
};

export default RoleBasedSidebar;
