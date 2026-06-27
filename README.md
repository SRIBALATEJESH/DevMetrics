# DevMetrics – Engineering Contribution & GitHub Analytics Platform

DevMetrics is a premium, real-time analytics platform designed for modern engineering teams. It connects directly with GitHub via OAuth and Webhooks to analyze codebase events, evaluate individual contributions, monitor repository health (such as Bus Factor and risk factors), and gamify developer achievements.

---

## Key Features

- 🔐 **Dual-Layer Authentication**: Secure user access supporting local email/password sign-in and Google Single Sign-On (SSO) backed by Firebase Auth and JWT sessions.
- 🐙 **GitHub OAuth & Repository Linking**: Securely link personal/organization GitHub accounts and import repositories directly into projects.
- 📊 **Dynamic Analytics Dashboard**: Live metrics for key engineering KPIs:
  - **DORA Metrics**: Deployment Frequency, Lead Time for Changes, Mean Time to Recovery (MTTR).
  - **Contribution Charts**: Real-time commits, pull requests, issues, and reviews visualized via Recharts.
- 🏆 **Gamified Leaderboards & Achievements**: Tracks developer contributions and updates ranks based on a dynamic scoring algorithm, unlocking badges and rewards.
- 🔍 **Engineering Profiles**: Detailed activity summaries, work breakdown charts (code, reviews, bugs), and integration logs for every engineer.
- 🔔 **Interactive Notification Center**: A live hub supporting filters, priority badges (Urgent, High, Medium, Low), and individual or bulk read/delete operations.
- 📬 **Backend-Integrated Password Recovery**: Secure password reset flow using secure cryptographically random tokens, with real-time email dispatch via **Nodemailer** (Gmail SMTP) and local log file fallbacks.
- ⚡ **Real-Time Webhooks**: Active webhook listener (`/api/github/webhook`) parsing push, pull requests, pull request reviews, and issue events to update the dashboard instantly.

---

## Technology Stack

### Frontend (Client SPA)
- **Framework**: React.js (Vite)
- **Styling**: Vanilla CSS (highly customized premium dark mode layout with glassmorphic elements)
- **Routing**: React Router DOM (with Role-Based Access Control wrappers)
- **Charts & Icons**: Recharts & Lucide React

### Backend (Server API)
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB (Mongoose Object Modeling)
- **Authentication Services**: Firebase Admin SDK & JSON Web Tokens (JWT)
- **Email Utility**: Nodemailer
- **WebSockets**: Socket.IO for real-time dashboard events

---

## Directory Structure

```text
DevMetrics/
├── backend/
│   ├── config/          # DB, Firebase Admin, and general configurations
│   ├── controllers/     # Auth, project, task, and analytics controller logic
│   ├── jobs/            # Recalculation scheduler jobs for metrics
│   ├── middleware/      # Auth security (JWT/RBAC) and validation layers
│   ├── models/          # User, Project, Team, Task, and Activity Mongoose schemas
│   ├── routes/          # REST API endpoints grouped by feature
│   ├── scripts/         # DB seeders and utility scripts
│   ├── validations/     # Input validation rules (Joi/express-validator)
│   ├── server.js        # Entry point initializing HTTP & Socket.IO servers
│   └── app.js           # Express middleware pipeline
│
└── frontend/
    ├── public/          # Static assets
    └── src/
        ├── components/  # Layout, Sidebar, and reusable visual blocks
        ├── context/     # Auth and Socket.IO state providers
        ├── pages/       # Dashboard, Profiles, Settings, Auth, and Analytics pages
        ├── App.jsx      # Main application Router configuration
        └── main.jsx     # Frontend entry point
```

---

## Local Development Setup

### Prerequisites
- Node.js (v16+)
- MongoDB running locally (`mongodb://localhost:27017`)
- A Gmail account + Google App Password (for password resets)

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environmental settings in a `.env` file inside the `backend` folder:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/devmetrics
   NODE_ENV=development
   JWT_SECRET=your_secret_jwt_key
   EMAIL_USER=your_gmail_address@gmail.com
   EMAIL_PASS=your_gmail_app_password
   ```
4. Seed the default database users (Admin, Developer, Tester, etc.):
   ```bash
   npm run seed
   ```
5. Start the development API server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite hot-reloading development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:5173`.

---

## Seeding & Default Accounts
When you run `npm run seed`, the database is populated with test users mapped to sub-addresses of the configured admin email (e.g. `your_email+pm@gmail.com`). You can log in using these roles (password is `balu_2005` by default) or trigger the **Forgot Password** link to receive email notifications locally.
