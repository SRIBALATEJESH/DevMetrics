# DevMetrics Phase-1 RBAC System Design
## Role-Based Access Control System
---

## 1. User Roles & Responsibilities

### Role: Admin
| Attribute | Details |
|-----------|---------|
| **Description** | Full platform access and control. Manages users, teams, projects, and system settings. |
| **Responsibilities** | - Manage all users (add/remove/assign roles)<br>- Manage all teams and projects<br>- Configure platform settings<br>- Monitor all activity logs<br>- Access all analytics and reports |
| **Allowed Actions** | All actions across all modules |
| **Restricted Actions** | None |

### Role: Project Manager (PM)
| Attribute | Details |
|-----------|---------|
| **Description** | Manages projects, tasks, and team allocation. Tracks project progress and generates reports. |
| **Responsibilities** | - Create and manage assigned projects<br>- Assign tasks to team members<br>- Monitor project progress and health<br>- Generate project reports<br>- View team performance |
| **Allowed Actions** | - Create/edit/delete own projects<br>- Assign tasks<br>- View and export project reports<br>- Manage project settings |
| **Restricted Actions** | - Manage users/roles<br>- System-wide settings<br>- Other teams' projects |

### Role: Team Lead (TL)
| Attribute | Details |
|-----------|---------|
| **Description** | Leads a specific team, manages team tasks and performance. |
| **Responsibilities** | - Manage team's tasks and workload<br>- Monitor team's contributions<br>- Coordinate with project managers<br>- View team performance analytics |
| **Allowed Actions** | - View and edit assigned projects<br>- Manage team tasks<br>- View team reports |
| **Restricted Actions** | - Create/delete projects<br>- Manage other teams<br>- System settings |

### Role: Developer
| Attribute | Details |
|-----------|---------|
| **Description** | Writes code, contributes to projects, manages own tasks. |
| **Responsibilities** | - Complete assigned tasks<br>- View project details<br>- Update task progress<br>- View own contribution analytics |
| **Allowed Actions** | - View assigned projects/tasks<br>- Update own tasks<br>- View own contribution stats |
| **Restricted Actions** | - Create/edit/delete projects<br>- Manage teams/users<br>- Generate reports |

### Role: Tester
| Attribute | Details |
|-----------|---------|
| **Description** | Tests software, manages test tasks, reports bugs. |
| **Responsibilities** | - Execute test tasks<br>- Report and track bugs<br>- View test-related project details |
| **Allowed Actions** | - View assigned projects/tasks<br>- Update test tasks<br>- View test-related analytics |
| **Restricted Actions** | - Create/edit/delete projects<br>- Manage teams/users<br>- Generate reports |

---

## 2. Permission Matrix
| Screen | Admin | PM | TL | Developer | Tester |
|--------|-------|----|----|-----------|--------|
| **Login** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Register** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Forgot Password** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard** | ✅ Full | ✅ PM View | ✅ TL View | ✅ Dev View | ✅ Tester View |
| **Projects** | ✅ Full | ✅ Full (own) | ✅ View/Edit | ✅ View | ✅ View |
| **Create Project** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Project Details** | ✅ Full | ✅ Full (own) | ✅ View/Edit | ✅ View | ✅ View |
| **Team Directory** | ✅ Full | ✅ View | ✅ View (own team) | ✅ View (own team) | ✅ View (own team) |
| **Create Team** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Task Board** | ✅ Full | ✅ Full (own projects) | ✅ View/Edit (team) | ✅ View/Edit (own) | ✅ View/Edit (own) |
| **My Tasks** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Create Task** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Contribution Analytics** | ✅ Full | ✅ View | ✅ View (team) | ✅ View (own) | ✅ View (own) |
| **Team Performance** | ✅ Full | ✅ View | ✅ View (own team) | ❌ | ❌ |
| **Project Reports** | ✅ Full | ✅ Full | ✅ View | ❌ | ❌ |
| **Team Reports** | ✅ Full | ✅ View | ✅ View (own team) | ❌ | ❌ |
| **Export Center** | ✅ Full | ✅ Full (own projects) | ❌ | ❌ | ❌ |
| **Activity Logs** | ✅ Full | ✅ View (own projects) | ✅ View (team) | ❌ | ❌ |
| **Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Settings** | ✅ Full | ✅ Project Settings | ✅ Team Settings | ✅ Personal | ✅ Personal |

---

## 3. Role-Based Sidebar Navigation
### Admin Sidebar
```
├── Dashboard
├── Projects
│   ├── All Projects
│   └── Create Project
├── Teams
│   ├── Team Directory
│   └── Create Team
├── Tasks
│   ├── Task Board
│   ├── My Tasks
│   └── Create Task
├── Analytics
│   ├── Contribution Analytics
│   └── Team Performance
├── Reports
│   ├── Project Reports
│   ├── Team Reports
│   └── Export Center
├── Activity Logs
├── Notifications
├── Profile
└── Settings
```

### Project Manager (PM) Sidebar
```
├── Dashboard
├── Projects
│   ├── My Projects
│   └── Create Project
├── Tasks
│   ├── Task Board
│   ├── My Tasks
│   └── Create Task
├── Analytics
│   ├── Contribution Analytics
│   └── Team Performance
├── Reports
│   ├── Project Reports
│   ├── Team Reports
│   └── Export Center
├── Notifications
├── Profile
└── Settings
```

### Team Lead (TL) Sidebar
```
├── Dashboard
├── Projects
│   └── Assigned Projects
├── Teams
│   └── My Team
├── Tasks
│   ├── Task Board
│   ├── My Tasks
│   └── Create Task
├── Analytics
│   ├── Contribution Analytics
│   └── Team Performance
├── Reports
│   └── Team Reports
├── Notifications
├── Profile
└── Settings
```

### Developer Sidebar
```
├── Dashboard
├── Projects
│   └── Assigned Projects
├── Tasks
│   ├── Task Board
│   └── My Tasks
├── Analytics
│   └── My Contribution Analytics
├── Notifications
├── Profile
└── Settings
```

### Tester Sidebar
```
├── Dashboard
├── Projects
│   └── Assigned Projects
├── Tasks
│   ├── Task Board
│   └── My Tasks
├── Notifications
├── Profile
└── Settings
```

---

## 4. Mermaid User Journey Diagrams
### Admin User Journey
```mermaid
journey
    title Admin User Journey
    section Authentication
      Login: 5: Admin
      Verify Role: 5: Admin
    section Platform Management
      View Dashboard: 5: Admin
      Manage Projects: 5: Admin
      Manage Teams: 4: Admin
      Manage Users: 5: Admin
    section Analytics & Reports
      View All Analytics: 5: Admin
      Generate Reports: 5: Admin
      Export Data: 5: Admin
```

### Project Manager User Journey
```mermaid
journey
    title Project Manager User Journey
    section Authentication
      Login: 5: PM
    section Project Management
      View PM Dashboard: 5: PM
      Create Project: 5: PM
      Manage Project Tasks: 5: PM
    section Reporting
      View Project Reports: 4: PM
      Export Project Data: 5: PM
    section Team Coordination
      View Team Performance: 4: PM
```

### Team Lead User Journey
```mermaid
journey
    title Team Lead User Journey
    section Authentication
      Login: 5: TL
    section Team Management
      View TL Dashboard: 5: TL
      View Assigned Projects: 4: TL
      Manage Team Tasks: 5: TL
    section Analytics
      View Team Contribution: 4: TL
```

### Developer User Journey
```mermaid
journey
    title Developer User Journey
    section Authentication
      Login: 5: Developer
    section Daily Work
      View Dev Dashboard: 5: Developer
      View Assigned Tasks: 5: Developer
      Update Task Progress: 5: Developer
    section Analytics
      View Own Contribution: 4: Developer
```

### Tester User Journey
```mermaid
journey
    title Tester User Journey
    section Authentication
      Login: 5: Tester
    section Testing Work
      View Tester Dashboard: 5: Tester
      View Test Tasks: 5: Tester
      Update Test Task Status: 5: Tester
```

---

## 5. Mermaid Navigation Flow Diagrams
### Admin Navigation Flow
```mermaid
graph TD
    A[Login] --> B[Admin Dashboard]
    B --> C1[Projects]
    B --> C2[Teams]
    B --> C3[Tasks]
    B --> C4[Analytics]
    B --> C5[Reports]
    B --> C6[Activity Logs]
    B --> C7[Notifications]
    B --> C8[Profile]
    B --> C9[Settings]
    
    C1 --> D1[All Projects]
    C1 --> D2[Create Project]
    C1 --> D3[Project Details]
    
    C2 --> E1[Team Directory]
    C2 --> E2[Create Team]
    
    C3 --> F1[Task Board]
    C3 --> F2[My Tasks]
    C3 --> F3[Create Task]
    
    C4 --> G1[Contribution Analytics]
    C4 --> G2[Team Performance]
    
    C5 --> H1[Project Reports]
    C5 --> H2[Team Reports]
    C5 --> H3[Export Center]
```

### Project Manager Navigation Flow
```mermaid
graph TD
    A[Login] --> B[PM Dashboard]
    B --> C1[My Projects]
    B --> C2[Tasks]
    B --> C3[Analytics]
    B --> C4[Reports]
    B --> C5[Notifications]
    B --> C6[Profile]
    B --> C7[Settings]
    
    C1 --> D1[All My Projects]
    C1 --> D2[Create Project]
    C1 --> D3[Project Details]
    
    C2 --> E1[Task Board]
    C2 --> E2[My Tasks]
    C2 --> E3[Create Task]
    
    C3 --> F1[Contribution Analytics]
    C3 --> F2[Team Performance]
    
    C4 --> G1[Project Reports]
    C4 --> G2[Team Reports]
    C4 --> G3[Export Center]
```

### Team Lead Navigation Flow
```mermaid
graph TD
    A[Login] --> B[TL Dashboard]
    B --> C1[Assigned Projects]
    B --> C2[My Team]
    B --> C3[Tasks]
    B --> C4[Analytics]
    B --> C5[Reports]
    B --> C6[Notifications]
    B --> C7[Profile]
    B --> C8[Settings]
    
    C1 --> D1[Project Details]
    
    C3 --> E1[Task Board]
    C3 --> E2[My Tasks]
    C3 --> E3[Create Task]
    
    C4 --> F1[Contribution Analytics]
    C4 --> F2[Team Performance]
    
    C5 --> G1[Team Reports]
```

---

## 6. Dashboard Widgets by Role
### Admin Dashboard Widgets
- All Projects Overview
- All Teams Overview
- System Activity Summary
- Platform Health
- User Management Quick Access

### PM Dashboard Widgets
- My Projects Overview
- Project Progress Trackers
- Team Workload Summary
- Project Health Indicators
- Recent Project Activity

### TL Dashboard Widgets
- Assigned Projects Overview
- Team Task Summary
- Team Contribution Stats
- Team Performance Metrics

### Developer Dashboard Widgets
- My Assigned Tasks
- My Contribution Stats
- Recent Project Updates
- Upcoming Deadlines

### Tester Dashboard Widgets
- My Test Tasks
- Test Coverage Summary
- Bug Report Stats
- Recent Test Activity

---

## 7. Module & Feature Access Summary
| Module | Admin | PM | TL | Developer | Tester |
|--------|-------|----|----|-----------|--------|
| **Authentication** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Dashboard** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Projects** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Teams** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Tasks** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Analytics** | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Reports** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Export** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Activity Logs** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Notifications** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Profile** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Settings** | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 8. Implementation Notes
- All routes should be protected using the `ProtectedRoute` component
- Role checks should happen both client-side (for UI) and server-side (for API)
- Use localStorage to persist authentication state
- Sidebar should dynamically render based on the current user's role
- Access denied page should redirect users to their appropriate dashboard
