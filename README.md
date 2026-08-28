# 🚀 DevMetrics – Engineering Contribution & GitHub Analytics Web Application

**DevMetrics** is a real-time web application for engineering intelligence and contribution analytics. It bridges developer activity on GitHub with project management workflows to provide live visibility into engineering velocity, developer contributions, code quality, and team health.

Designed for engineering managers, team leads, and software developers, DevMetrics synthesizes commit histories, pull requests, code reviews, issue resolution, and task management into interactive dashboards, DORA metrics, dynamic leaderboards, and gamified achievement systems.

---

## 📑 Table of Contents

- [Project Overview](#-project-overview)
- [Problem Statement & Vision](#-problem-statement--vision)
- [Web Application Architecture](#-web-application-architecture)
- [Key Modules & Feature Deep-Dive](#-key-modules--feature-deep-dive)
  - [1. Authentication & Role-Based Access Control (RBAC)](#1-authentication--role-based-access-control-rbac)
  - [2. GitHub Integration & Real-Time Webhooks](#2-github-integration--real-time-webhooks)
  - [3. DORA Metrics & Engineering Health Engine](#3-dora-metrics--engineering-health-engine)
  - [4. Contribution Scoring Algorithm & Gamification](#4-contribution-scoring-algorithm--gamification)
  - [5. Project, Team & Task Workspace](#5-project-team--task-workspace)
  - [6. Real-Time Notification Hub & WebSockets](#6-real-time-notification-hub--websockets)
  - [7. Reports & Export Engine](#7-reports--export-engine)
- [Technology Stack Breakdown](#-technology-stack-breakdown)
- [Repository Directory Structure](#-repository-directory-structure)
- [Database Collections & Schemas](#-database-collections--schemas)
- [User Roles & Access Permissions Matrix](#-user-roles--access-permissions-matrix)
- [Local Setup & Development Guide](#-local-setup--development-guide)
  - [Prerequisites](#prerequisites)
  - [Environment Configuration](#environment-configuration)
  - [1. Backend API Setup](#1-backend-api-setup)
  - [2. Frontend Web App Setup](#2-frontend-web-app-setup)
- [Database Seeding & Pre-Configured Accounts](#-database-seeding--pre-configured-accounts)
- [Complete REST API Reference](#-complete-rest-api-reference)
- [GitHub Webhook Integration Setup](#-github-webhook-integration-setup)
- [Documentation Links](#-documentation-links)

---

## 🎯 Problem Statement & Vision

### The Problem
Software development teams face significant visibility challenges:
- **Invisible Contributions**: Code reviews, refactoring, bug fixes, and mentorship are often overlooked in traditional ticket-only tracking tools.
- **Disconnected Data Silos**: Git activity (commits, PRs) lives separately from project tracking (Jira/Trello/Tasks), leading to manual, inaccurate status reporting.
- **Difficulty Measuring Engineering Health**: Calculating industry-standard **DORA metrics** (Deployment Frequency, Lead Time for Changes, MTTR) requires complex data aggregation across multiple services.
- **Lack of Recognition & Engagement**: Developers lack transparent feedback on their performance, reducing motivation and team collaboration.

### The DevMetrics Vision
DevMetrics solves these challenges by combining **Git event telemetry** with **task management workflows** into a single real-time web interface:
1. **Automated Telemetry**: Ingests commits, PRs, reviews, and issues via GitHub OAuth & Webhooks.
2. **Standardized Engineering KPIs**: Automatically computes DORA metrics, Bus Factor (risk of key personnel reliance), and Code Review Velocity.
3. **Fair & Transparent Scoring**: Evaluates developer impact using a multi-factor mathematical scoring model.
4. **Gamified Growth**: Encourages high-quality contributions through achievement badges, contributor ranks, and real-time leaderboards.

---

## 🏗️ Web Application Architecture

DevMetrics is built using a modern **MERN stack** (MongoDB, Express.js, React.js, Node.js) paired with **Socket.IO** for real-time bi-directional messaging between server and client.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   React 18 Single Page Application                     │
│  - Vite Hot-Reloading Build System                                                     │
│  - Vanilla CSS Dark Theme with Glassmorphism & Custom Tokens                           │
│  - Recharts Data Visualization & Lucide Icons                                          │
│  - Socket.IO WebSockets Client for Real-time Dashboard Updates                         │
└───────────────────────────────────────────┬────────────────────────────────────────────┘
                                            │ (HTTP REST / WebSockets)
                                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                             Node.js / Express Web Application API                      │
├───────────────────────┬───────────────────────┬───────────────────────┬────────────────┤
│    Authentication     │   GitHub Webhook      │   Analytics & DORA    │   Socket.IO    │
│ (JWT / Firebase Auth) │   Event Listener      │   Calculation Engine  │  Realtime Hub  │
└───────────┬───────────┴───────────┬───────────┴───────────┬───────────┴───────┬────────┘
            │                       │                       │                   │
            ▼                       ▼                       ▼                   ▼
┌───────────────────────┐┌───────────────────────┐┌───────────────────┐┌─────────────────┐
│   MongoDB Database    ││  GitHub REST & OAuth  ││  Node-Cron Jobs   ││ Client Socket   │
│ (Users, Tasks, Scores,││ (Commits, PRs, Issues,││ (Periodic Score   ││ (Live Telemetry │
│  Activity Logs, DB)   ││  Repo Syncing)        ││  Recalculation)   ││  Events)        │
└───────────────────────┘└───────────────────────┘└───────────────────┘└─────────────────┘
```

---

## 🛠️ Key Modules & Feature Deep-Dive

### 1. Authentication & Role-Based Access Control (RBAC)
- **Dual-Layer Sign-In**: Supports local email/password sign-in alongside Google Single Sign-On (SSO) via Firebase Admin SDK.
- **JWT Sessions**: Issues signed JSON Web Tokens containing user ID, email, and system role.
- **Granular RBAC**: Enforces route protection via `authMiddleware` and `roleMiddleware` across 5 system roles (**Admin**, **Project Manager**, **Team Lead**, **Developer**, **Tester**).
- **Backend Password Recovery**: Cryptographically generated reset tokens dispatched via **Nodemailer** (SMTP) with local fallback logs for development.

### 2. GitHub Integration & Real-Time Webhooks
- **GitHub OAuth**: Users link personal or organization GitHub accounts to synchronize repositories.
- **Real-Time Webhook Listener**: Endpoint (`/api/github/webhook`) handles incoming GitHub payload events:
  - `push`: Parses commit messages, author details, additions/deletions, and updates repository metrics.
  - `pull_request`: Tracks PR creation, merge status, review count, and lead time.
  - `pull_request_review`: Measures code review participation and approval velocity.
  - `issues`: Tracks bug reports, resolution speed, and issue metrics.

### 3. DORA Metrics & Engineering Health Engine
DevMetrics computes key software delivery and operational performance metrics:
- **Deployment Frequency (DF)**: Measures how often code is deployed to production.
- **Lead Time for Changes (LTC)**: Time elapsed from code commit to production deployment.
- **Mean Time to Recovery (MTTR)**: Time taken to restore service after a failure or bug report.
- **Change Failure Rate (CFR)**: Percentage of deployments causing production incidents.
- **Bus Factor & Repository Risk**: Identifies repositories dependent heavily on a single contributor to mitigate knowledge silos.

### 4. Contribution Scoring Algorithm & Gamification
Developer impact is evaluated dynamically using a multi-factor weighted scoring formula:

$$\text{Contribution Score} = (\text{Tasks Completed} \times 40\%) + (\text{Task Complexity} \times 25\%) + (\text{Deadline Adherence} \times 20\%) + (\text{Participation} \times 15\%)$$

#### Score Variables:
- **Tasks Completed (40%)**: Ratio of assigned work units marked `Done`.
- **Task Complexity (25%)**: Difficulty weighting (`Easy` = 1, `Medium` = 2, `Hard` = 3).
- **Deadline Adherence (20%)**: On-time completion bonus.
- **Participation (15%)**: Active GitHub commits, pull request reviews, and issue resolution activity.

#### Gamification Elements:
- **Ranks & Tiers**: Bronze, Silver, Gold, Platinum, and Diamond contributor ranks.
- **Badges & Achievements**: Unlocked automatically for milestones (e.g., "Bug Hunter", "Code Review Master", "Sprint Champion").
- **Real-Time Leaderboards**: Monthly and all-time developer rankings.

### 5. Project, Team & Task Workspace
- **Project Scope**: Group repositories, teams, milestones, and task boards.
- **Interactive Task Kanban**: Manage work units through status states (`Todo` → `In Progress` → `Review` → `Done`).
- **Workload Distribution**: Track capacity, estimated effort vs actual effort, and assignees per task.

### 6. Real-Time Notification Hub & WebSockets
- **Live WebSocket Server**: Powered by Socket.IO for instant client updates when tasks change, PRs are merged, or notifications trigger.
- **Interactive Notification Center**: Filtering by priority (**Urgent**, **High**, **Medium**, **Low**) with bulk mark-read and deletion actions.

### 7. Reports & Export Engine
- Generate aggregated project health summaries, team productivity reports, and individual contribution statements.

---

## 🧰 Technology Stack Breakdown

| Subsystem | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Web App** | React 18 (Vite) | Single page client application framework & fast bundler |
| | Vanilla CSS | Custom dark theme design system with responsive layouts |
| | Recharts | Interactive line, bar, pie, and radar charts for analytics |
| | Lucide React | Modern, clean UI iconography |
| | React Router DOM v6 | SPA routing with protected route wrappers |
| | Socket.IO Client | Real-time WebSocket connection to backend server |
| **Backend Web API** | Node.js & Express.js | Scalable REST API application server |
| | MongoDB & Mongoose | Document database and schema object modeling |
| | Firebase Admin SDK | Google OAuth identity verification |
| | JWT & bcryptjs | Token authentication & password hashing |
| | Nodemailer | Transactional email dispatch for password recovery |
| | Node-Cron | Scheduled background jobs for recalculating score rankings |
| | Socket.IO Server | Event-driven WebSocket broadcasting server |

---

## 📂 Repository Directory Structure

```text
DevMetrics/
├── docs/                           # Project documentation & design specs
│   └── RBAC_Design.md              # Role-Based Access Control architecture document
│
├── backend/
│   ├── config/                     # Database & Firebase Admin setup
│   │   ├── db.js
│   │   └── firebaseAdmin.js
│   ├── controllers/                # REST API Controller handlers
│   │   ├── achievementController.js
│   │   ├── activityController.js
│   │   ├── analyticsController.js
│   │   ├── authController.js
│   │   ├── githubController.js
│   │   ├── notificationController.js
│   │   ├── projectController.js
│   │   ├── reportController.js
│   │   ├── taskController.js
│   │   ├── teamController.js
│   │   ├── userController.js
│   │   └── webhookController.js
│   ├── jobs/                       # Scheduler jobs (`scoreJob.js`)
│   ├── middleware/                 # JWT auth, RBAC authorization, error handlers
│   │   ├── authMiddleware.js
│   │   ├── roleMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── validationMiddleware.js
│   ├── models/                     # Mongoose Schemas (20 Domain models)
│   │   ├── User.js, Project.js, Task.js, Team.js
│   │   ├── GithubAccount.js, GithubRepository.js, GithubCommit.js
│   │   ├── GithubPullRequest.js, GithubReview.js, GithubIssue.js
│   │   ├── ContributorScore.js, EngineeringHealth.js, RepositoryMetrics.js
│   │   ├── ActivityLog.js, Notification.js, Report.js, Achievement.js
│   ├── routes/                     # Express REST API routes
│   ├── scripts/                    # Database seeder scripts (`seed.js`)
│   ├── services/                   # Business & analytics calculation engines
│   ├── utils/                      # Password reset token generation & email helper
│   ├── app.js                      # Express pipeline & middleware configuration
│   └── server.js                   # Entry point initializing HTTP server & WebSockets
│
└── frontend/
    ├── public/                     # Public static web assets
    ├── src/
    │   ├── components/             # Reusable UI components (Sidebar, Navbar, Cards, Charts, Modals)
    │   ├── context/                # Global React Contexts (AuthContext, SocketContext)
    │   ├── pages/                  # Application views (Dashboard, Tasks, Projects, Analytics, Settings)
    │   ├── App.jsx                 # Router configuration & protected routes
    │   └── main.jsx                # Application root entry point
    ├── index.html                  # HTML entry point
    ├── vite.config.js              # Vite bundler configuration
    └── package.json                # Frontend dependencies
```

---

## 🗄️ Database Collections & Schemas

DevMetrics utilizes 20 Mongoose schemas structured logically across domain entities:

| Collection | Key Attributes & Description |
| :--- | :--- |
| **`users`** | `name`, `email`, `password`, `role` (`Admin`, `Project Manager`, `Team Lead`, `Developer`, `Tester`), `avatar`, `githubId`, `resetPasswordToken`. |
| **`projects`** | `title`, `description`, `owner` (Ref to User), `status` (`Planned`, `Active`, `Completed`, `Archived`), `startDate`, `endDate`. |
| **`teams`** | `name`, `lead` (Ref to User), `members` (Array of Ref to User), `project` (Ref to Project). |
| **`tasks`** | `title`, `description`, `project`, `assignee`, `status` (`Todo`, `In Progress`, `Review`, `Done`), `priority`, `complexity`, `deadline`. |
| **`githubaccounts`** | `user`, `githubUsername`, `accessToken`, `avatarUrl`, `linkedAt`. |
| **`githubrepositories`** | `project`, `repoName`, `owner`, `url`, `defaultBranch`, `webhookSecret`, `isImported`. |
| **`githubcommits`** | `repository`, `sha`, `author`, `message`, `additions`, `deletions`, `committedAt`. |
| **`githubpullrequests`**| `repository`, `prNumber`, `title`, `author`, `state`, `mergedAt`, `additions`, `deletions`, `reviewers`. |
| **`contributorscores`** | `user`, `score`, `tasksCompletedScore`, `complexityScore`, `deadlineScore`, `participationScore`, `rank`, `updatedAt`. |
| **`engineeringhealth`** | `project`, `doraMetrics` (DF, LTC, MTTR, CFR), `busFactor`, `codeQualityScore`, `calculatedAt`. |
| **`activitylogs`** | `user`, `event`, `description`, `metadata`, `timestamp`. |
| **`notifications`** | `user`, `title`, `message`, `priority` (`Urgent`, `High`, `Medium`, `Low`), `isRead`, `createdAt`. |

---

## 👥 User Roles & Access Permissions Matrix

| Feature / Action | Admin | Project Manager | Team Lead | Developer | Tester |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Manage Users & System Roles** | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Create & Delete Projects** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Create & Assign Teams** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Create & Assign Tasks** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Update Task Status (`Todo` → `Done`)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Link GitHub Repositories** | ✅ | ✅ | ✅ | ❌ | ❌ |
| **View Leaderboards & Analytics** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Trigger Metric Recalculations** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Export Reports** | ✅ | ✅ | ✅ | ❌ | ❌ |

---

## 💻 Local Setup & Development Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **npm**: v9.x or higher
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017/devmetrics`) OR MongoDB Atlas URI

---

### Environment Configuration

#### 1. Backend `.env` Configuration
Create a `.env` file inside `backend/`:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/devmetrics
NODE_ENV=development
JWT_SECRET=devmetrics_super_secret_jwt_key_2025
CLIENT_URL=http://localhost:5173

# Nodemailer Email Transporter (Optional, for Password Reset)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password

# Firebase Admin Configuration (Optional, for Google SSO)
FIREBASE_PROJECT_ID=your_firebase_project_id
```

#### 2. Frontend `.env` Configuration
Create a `.env` file inside `frontend/` (see `frontend/.env.example`):

```env
VITE_API_URL=http://localhost:5000

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

---

### 1. Backend API Setup

```bash
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Seed test database accounts (Admin, PM, Lead, Dev, Tester)
npm run seed

# Start API server in development mode (with nodemon)
npm run dev
```

The Express API server will start on **`http://localhost:5000`**.

---

### 2. Frontend Web App Setup

```bash
# Open a new terminal and navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

The React Web Application will open automatically in your browser at **`http://localhost:5173`**.

---

## 🔑 Database Seeding & Pre-Configured Accounts

Running `npm run seed` populates MongoDB with initial test accounts for each role:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@devmetrics.com` | `balu_2005` |
| **Project Manager** | `pm@devmetrics.com` | `balu_2005` |
| **Team Lead** | `lead@devmetrics.com` | `balu_2005` |
| **Developer** | `dev@devmetrics.com` | `balu_2005` |
| **Tester** | `tester@devmetrics.com` | `balu_2005` |

---

## 📡 Complete REST API Reference

### Base API Path: `http://localhost:5000/api`

| Module | Method | Endpoint | Description |
| :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/auth/register` | Register a new user account |
| | `POST` | `/auth/login` | Authenticate user & return JWT token |
| | `POST` | `/auth/forgot-password` | Request password reset token / email |
| | `POST` | `/auth/reset-password` | Reset password using cryptographically valid token |
| **Users** | `GET` | `/users/profile` | Get logged-in user profile details |
| | `PUT` | `/users/profile` | Update user profile information |
| **Projects** | `GET` | `/projects` | Retrieve all accessible projects |
| | `POST` | `/projects` | Create a new project (Admin / PM) |
| | `GET` | `/projects/:id` | Fetch detailed project details |
| | `PUT` | `/projects/:id` | Update project configuration |
| | `DELETE`| `/projects/:id` | Delete project |
| **Tasks** | `GET` | `/tasks` | List tasks filtered by project / user |
| | `POST` | `/tasks` | Create a new work task |
| | `PATCH` | `/tasks/:id/status` | Update task status (`Todo`, `In Progress`, `Review`, `Done`) |
| **Analytics**| `GET` | `/analytics/leaderboard` | Get developer contribution rankings |
| | `GET` | `/analytics/dora` | Fetch project DORA metrics |
| | `POST` | `/analytics/recalculate` | Trigger manual recalculation of scores |
| **GitHub** | `POST` | `/github/connect` | Link GitHub account via OAuth |
| | `POST` | `/github/webhook` | GitHub webhook processing endpoint |
| **Notifications**| `GET` | `/notifications` | Get user notifications |
| | `PATCH` | `/notifications/:id/read`| Mark notification as read |
| **Reports** | `POST` | `/reports/generate` | Generate productivity summary report |

---

## 🔗 GitHub Webhook Integration Setup

1. In your GitHub Repository, navigate to **Settings** → **Webhooks** → **Add webhook**.
2. Set **Payload URL** to: `http://<your-server-domain>:5000/api/github/webhook`
3. Set **Content type** to: `application/json`
4. Enter your configured **Secret**.
5. Select events: **Pushes**, **Pull requests**, **Pull request reviews**, and **Issues**.
6. Click **Add webhook**.

---

## 📄 Documentation Links

- **RBAC Design Specification**: [`docs/RBAC_Design.md`](file:///d:/DEV/docs/RBAC_Design.md)
