import { createContext, useContext } from 'react';
import { useAuth } from './AuthContext';


const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const { user } = useAuth();
  const currentRole = user?.role;

  // Role definitions aligned with RBAC_Design.md specifications
  const roles = {
    admin: {
      name: 'Admin',
      allowedRoutes: [
        '/dashboard',
        '/all-projects',
        '/create-project',
        '/project-details',
        '/project-details/:id?',
        '/team-directory',
        '/create-team',
        '/task-board',
        '/my-tasks',
        '/create-task',
        '/contribution-analytics',
        '/team-performance',
        '/project-reports',
        '/team-reports',
        '/export-center',
        '/activity-logs',
        '/engineering-profile',
        '/notification-center',
        '/dashboard/all-projects',
        '/dashboard/all-teams',
        '/settings',
        '/settings/github',
        '/github/repositories',
        '/github/linking',
        '/projects/:projectId/repository',
        '/github/sync',
        '/github/analytics',
        '/dashboard/admin-charts',
        '/engineering-health',
        '/developers',
        '/leaderboard',
        '/repository-insights',
        '/reviews',
        '/issues',
        '/project-risk',
        '/bus-factor',
        '/knowledge-distribution'
      ],
      sidebarSections: [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard', path: '/dashboard' }
          ]
        },
        {
          label: 'Project Management',
          items: [
            { label: 'All Projects', path: '/all-projects' },
            { label: 'Create Project', path: '/create-project' }
          ]
        },
        {
          label: 'Team Management',
          items: [
            { label: 'Team Directory', path: '/team-directory' },
            { label: 'Create Team', path: '/create-team' }
          ]
        },
        {
          label: 'Task Management',
          items: [
            { label: 'Task Board', path: '/task-board' },
            { label: 'My Tasks', path: '/my-tasks' },
            { label: 'Create Task', path: '/create-task' }
          ]
        },
        {
          label: 'Analytics',
          items: [
            { label: 'Contribution Analytics', path: '/contribution-analytics' },
            { label: 'Team Performance', path: '/team-performance' },
            { label: 'GitHub Analytics', path: '/github/analytics' },
            { label: 'Engineering Health', path: '/engineering-health' },
            { label: 'Developer Performance', path: '/developers' },
            { label: 'Leaderboard', path: '/leaderboard' },
            { label: 'Repository Insights', path: '/repository-insights' },
            { label: 'Review Analytics', path: '/reviews' },
            { label: 'Issue Analytics', path: '/issues' },
            { label: 'Project Risk Analytics', path: '/project-risk' },
            { label: 'Bus Factor Analytics', path: '/bus-factor' },
            { label: 'Knowledge Distribution', path: '/knowledge-distribution' }
          ]
        },
        {
          label: 'GitHub',
          items: [
            { label: 'Repository Management', path: '/github/repositories' },
            { label: 'Repository Linking', path: '/github/linking' },
            { label: 'Sync Center', path: '/github/sync' }
          ]
        },
        {
          label: 'Reports',
          items: [
            { label: 'Project Reports', path: '/project-reports' },
            { label: 'Team Reports', path: '/team-reports' },
            { label: 'Export Center', path: '/export-center' }
          ]
        },
        {
          label: 'Activity',
          items: [
            { label: 'Activity Logs', path: '/activity-logs' },
            { label: 'Notifications', path: '/notification-center' }
          ]
        },
        {
          label: 'Account',
          items: [
            { label: 'Profile', path: '/engineering-profile' },
            { label: 'Settings', path: '/settings' }
          ]
        },
        {
          label: 'Admin Tools',
          items: [
            { label: 'Admin Dashboard', path: '/dashboard/admin-charts' }
          ]
        }
      ]
    },
    'project manager': {
      name: 'Project Manager',
      allowedRoutes: [
        '/dashboard',
        '/all-projects',
        '/create-project',
        '/project-details',
        '/project-details/:id?',
        '/team-directory',
        '/create-team',
        '/task-board',
        '/my-tasks',
        '/create-task',
        '/contribution-analytics',
        '/team-performance',
        '/project-reports',
        '/team-reports',
        '/export-center',
        '/engineering-profile',
        '/notification-center',
        '/settings',
        '/settings/github',
        '/github/repositories',
        '/github/linking',
        '/projects/:projectId/repository',
        '/github/sync',
        '/github/analytics',
        '/engineering-health',
        '/developers',
        '/leaderboard',
        '/repository-insights',
        '/reviews',
        '/issues',
        '/project-risk',
        '/bus-factor',
        '/knowledge-distribution'
      ],
      sidebarSections: [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard', path: '/dashboard' }
          ]
        },
        {
          label: 'Project Management',
          items: [
            { label: 'My Projects', path: '/all-projects' },
            { label: 'Create Project', path: '/create-project' }
          ]
        },
        {
          label: 'Team Management',
          items: [
            { label: 'Team Directory', path: '/team-directory' },
            { label: 'Create Team', path: '/create-team' }
          ]
        },
        {
          label: 'Task Management',
          items: [
            { label: 'Task Board', path: '/task-board' },
            { label: 'My Tasks', path: '/my-tasks' },
            { label: 'Create Task', path: '/create-task' }
          ]
        },
        {
          label: 'Analytics',
          items: [
            { label: 'Contribution Analytics', path: '/contribution-analytics' },
            { label: 'Team Performance', path: '/team-performance' },
            { label: 'GitHub Analytics', path: '/github/analytics' },
            { label: 'Engineering Health', path: '/engineering-health' },
            { label: 'Developer Performance', path: '/developers' },
            { label: 'Leaderboard', path: '/leaderboard' },
            { label: 'Repository Insights', path: '/repository-insights' },
            { label: 'Review Analytics', path: '/reviews' },
            { label: 'Issue Analytics', path: '/issues' },
            { label: 'Project Risk Analytics', path: '/project-risk' },
            { label: 'Bus Factor Analytics', path: '/bus-factor' },
            { label: 'Knowledge Distribution', path: '/knowledge-distribution' }
          ]
        },
        {
          label: 'GitHub',
          items: [
            { label: 'Repository Management', path: '/github/repositories' },
            { label: 'Repository Linking', path: '/github/linking' },
            { label: 'Sync Center', path: '/github/sync' }
          ]
        },
        {
          label: 'Reports',
          items: [
            { label: 'Project Reports', path: '/project-reports' },
            { label: 'Team Reports', path: '/team-reports' },
            { label: 'Export Center', path: '/export-center' }
          ]
        },
        {
          label: 'Activity',
          items: [
            { label: 'Notifications', path: '/notification-center' }
          ]
        },
        {
          label: 'Account',
          items: [
            { label: 'Profile', path: '/engineering-profile' },
            { label: 'Settings', path: '/settings' }
          ]
        }
      ]
    },
    'team lead': {
      name: 'Team Lead',
      allowedRoutes: [
        '/dashboard',
        '/all-projects',
        '/project-details',
        '/project-details/:id?',
        '/team-directory',
        '/task-board',
        '/my-tasks',
        '/contribution-analytics',
        '/team-performance',
        '/project-reports',
        '/team-reports',
        '/engineering-profile',
        '/notification-center',
        '/settings',
        '/settings/github',
        '/github/repositories',
        '/github/analytics',
        '/engineering-health',
        '/developers',
        '/leaderboard',
        '/repository-insights',
        '/reviews',
        '/issues',
        '/project-risk',
        '/bus-factor',
        '/knowledge-distribution'
      ],
      sidebarSections: [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard', path: '/dashboard' }
          ]
        },
        {
          label: 'Project Management',
          items: [
            { label: 'Assigned Projects', path: '/all-projects' }
          ]
        },
        {
          label: 'Team Management',
          items: [
            { label: 'My Team', path: '/team-directory' }
          ]
        },
        {
          label: 'Task Management',
          items: [
            { label: 'Task Board', path: '/task-board' },
            { label: 'My Tasks', path: '/my-tasks' }
          ]
        },
        {
          label: 'Analytics',
          items: [
            { label: 'Contribution Analytics', path: '/contribution-analytics' },
            { label: 'Team Performance', path: '/team-performance' },
            { label: 'GitHub Analytics', path: '/github/analytics' },
            { label: 'Engineering Health', path: '/engineering-health' },
            { label: 'Developer Performance', path: '/developers' },
            { label: 'Leaderboard', path: '/leaderboard' },
            { label: 'Repository Insights', path: '/repository-insights' },
            { label: 'Review Analytics', path: '/reviews' },
            { label: 'Issue Analytics', path: '/issues' },
            { label: 'Project Risk Analytics', path: '/project-risk' },
            { label: 'Bus Factor Analytics', path: '/bus-factor' },
            { label: 'Knowledge Distribution', path: '/knowledge-distribution' }
          ]
        },
        {
          label: 'Reports',
          items: [
            { label: 'Project Reports', path: '/project-reports' },
            { label: 'Team Reports', path: '/team-reports' }
          ]
        },
        {
          label: 'Activity',
          items: [
            { label: 'Notifications', path: '/notification-center' }
          ]
        },
        {
          label: 'Account',
          items: [
            { label: 'Profile', path: '/engineering-profile' },
            { label: 'Settings', path: '/settings' }
          ]
        }
      ]
    },
    developer: {
      name: 'Developer',
      allowedRoutes: [
        '/dashboard',
        '/all-projects',
        '/project-details',
        '/project-details/:id?',
        '/task-board',
        '/my-tasks',
        '/contribution-analytics',
        '/engineering-profile',
        '/notification-center',
        '/settings',
        '/settings/github',
        '/github/repositories',
        '/github/analytics',
        '/developers',
        '/leaderboard',
        '/repository-insights',
        '/reviews',
        '/project-reports',
        '/knowledge-distribution'
      ],
      sidebarSections: [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard', path: '/dashboard' }
          ]
        },
        {
          label: 'Project Management',
          items: [
            { label: 'Assigned Projects', path: '/all-projects' }
          ]
        },
        {
          label: 'Task Management',
          items: [
            { label: 'Task Board', path: '/task-board' },
            { label: 'My Tasks', path: '/my-tasks' }
          ]
        },
        {
          label: 'Analytics',
          items: [
            { label: 'My Contribution Analytics', path: '/contribution-analytics' },
            { label: 'GitHub Analytics', path: '/github/analytics' },
            { label: 'Developer Performance', path: '/developers' },
            { label: 'Leaderboard', path: '/leaderboard' },
            { label: 'Repository Insights', path: '/repository-insights' },
            { label: 'Review Analytics', path: '/reviews' },
            { label: 'Knowledge Distribution', path: '/knowledge-distribution' }
          ]
        },
        {
          label: 'Reports',
          items: [
            { label: 'My Report', path: '/project-reports' }
          ]
        },
        {
          label: 'Activity',
          items: [
            { label: 'Notifications', path: '/notification-center' }
          ]
        },
        {
          label: 'Account',
          items: [
            { label: 'Profile', path: '/engineering-profile' },
            { label: 'Settings', path: '/settings' }
          ]
        }
      ]
    },
    tester: {
      name: 'Tester',
      allowedRoutes: [
        '/dashboard',
        '/all-projects',
        '/project-details',
        '/project-details/:id?',
        '/task-board',
        '/my-tasks',
        '/engineering-profile',
        '/notification-center',
        '/settings',
        '/settings/github',
        '/github/analytics',
        '/leaderboard',
        '/repository-insights',
        '/reviews',
        '/project-reports',
        '/contribution-analytics',
        '/project-risk'
      ],
      sidebarSections: [
        {
          label: 'Overview',
          items: [
            { label: 'Dashboard', path: '/dashboard' }
          ]
        },
        {
          label: 'Project Management',
          items: [
            { label: 'Assigned Projects', path: '/all-projects' }
          ]
        },
        {
          label: 'Task Management',
          items: [
            { label: 'Task Board', path: '/task-board' },
            { label: 'My Tasks', path: '/my-tasks' }
          ]
        },
        {
          label: 'Analytics',
          items: [
            { label: 'My Contribution Analytics', path: '/contribution-analytics' },
            { label: 'GitHub Analytics', path: '/github/analytics' },
            { label: 'Leaderboard', path: '/leaderboard' },
            { label: 'Repository Insights', path: '/repository-insights' },
            { label: 'Review Analytics', path: '/reviews' },
            { label: 'Project Risk Analytics', path: '/project-risk' }
          ]
        },
        {
          label: 'Reports',
          items: [
            { label: 'My Report', path: '/project-reports' }
          ]
        },
        {
          label: 'Activity',
          items: [
            { label: 'Notifications', path: '/notification-center' }
          ]
        },
        {
          label: 'Account',
          items: [
            { label: 'Profile', path: '/engineering-profile' },
            { label: 'Settings', path: '/settings' }
          ]
        }
      ]
    }
  };

  // Dynamic patch to inject Universal Timeline to all roles
  Object.keys(roles).forEach(r => {
    if (!roles[r].allowedRoutes.includes('/timeline')) {
      roles[r].allowedRoutes.push('/timeline');
    }
    const activitySection = roles[r].sidebarSections.find(s => s.label === 'Activity');
    if (activitySection) {
      const hasTimelineItem = activitySection.items.some(i => i.path === '/timeline');
      if (!hasTimelineItem) {
        activitySection.items.unshift({ label: 'System Activity', path: '/timeline' });
      }
    } else {
      roles[r].sidebarSections.push({
        label: 'Activity',
        items: [{ label: 'System Activity', path: '/timeline' }]
      });
    }
  });

  const hasAccess = (path) => {
    if (!currentRole) return false;
    const roleConfig = roles[currentRole.toLowerCase()];
    if (!roleConfig) return false;

    if (roleConfig.allowedRoutes.includes(path)) return true;

    return roleConfig.allowedRoutes.some(route => {
      if (!route.includes(':')) return false;
      const routeParts = route.split('/');
      const pathParts = path.split('/');
      if (routeParts.length !== pathParts.length) return false;

      return routeParts.every((part, index) => {
        if (part.startsWith(':')) return true;
        return part === pathParts[index];
      });
    });
  };

  const getSidebarSections = () => {
    if (!currentRole) return [];
    const roleConfig = roles[currentRole.toLowerCase()];
    return roleConfig?.sidebarSections || [];
  };

  const getSidebarItems = () => {
    if (!currentRole) return [];
    const roleConfig = roles[currentRole.toLowerCase()];
    return (roleConfig?.sidebarSections || []).flatMap(section => section.items);
  };

  return (
    <RoleContext.Provider value={{ hasAccess, getSidebarSections, getSidebarItems, currentRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
