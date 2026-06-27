import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { RoleProvider } from './context/RoleContext'
import { LayoutProvider } from './context/LayoutContext'
import { LayoutWrapper } from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import RoleSelectionModal from './components/RoleSelectionModal'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import ProjectDetails from './pages/ProjectDetails'
import AllProjects from './pages/AllProjects'
import CreateProject from './pages/CreateProject'
import TeamDirectory from './pages/TeamDirectory'
import CreateTeam from './pages/CreateTeam'
import TaskBoard from './pages/TaskBoard'
import MyTasks from './pages/MyTasks'
import CreateTask from './pages/CreateTask'
import ContributionAnalytics from './pages/ContributionAnalytics'
import TeamPerformance from './pages/TeamPerformance'
import ProjectReports from './pages/ProjectReports'
import TeamReports from './pages/TeamReports'
import ExportCenter from './pages/ExportCenter'
import ActivityLogs from './pages/ActivityLogs'
import EngineeringProfile from './pages/EngineeringProfile'
import NotificationCenter from './pages/NotificationCenter'
import SettingsDashboard from './pages/SettingsDashboard'
import AccessDenied from './pages/AccessDenied'
import NotFound from './pages/NotFound'
import AdminDashboard from './pages/AdminDashboard'
import GithubIntegration from './pages/GithubIntegration'
import RepositoryManagement from './pages/RepositoryManagement'
import RepositoryLinking from './pages/RepositoryLinking'
import GithubAnalyticsDashboard from './pages/GithubAnalyticsDashboard'
import EngineeringHealthDashboard from './pages/EngineeringHealthDashboard'
import DeveloperPerformanceDashboard from './pages/DeveloperPerformanceDashboard'
import LeaderboardPage from './pages/LeaderboardPage'
import RepositoryInsights from './pages/RepositoryInsights'
import ReviewAnalytics from './pages/ReviewAnalytics'
import IssueAnalytics from './pages/IssueAnalytics'
import ProjectRiskAnalytics from './pages/ProjectRiskAnalytics'
import BusFactorAnalytics from './pages/BusFactorAnalytics'
import KnowledgeDistribution from './pages/KnowledgeDistribution'
import UniversalTimeline from './pages/UniversalTimeline'

// Wrapper component to access AuthContext for the role modal
function RoleModalGuard() {
  const { needsRole } = useAuth()
  return needsRole ? <RoleSelectionModal /> : null
}

function App() {
  return (
    <AuthProvider>
      <RoleProvider>
        <LayoutProvider>
          <Router>
            <Routes>
              {/* Public static landing/auth routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Shared layout routes with persistent sidebar and header */}
              <Route element={<LayoutWrapper />}>
                <Route path="/access-denied" element={<AccessDenied />} />

                {/* Redirect /projects to /all-projects */}
                <Route path="/projects" element={<Navigate to="/all-projects" replace />} />
                <Route path="/projects/create" element={<Navigate to="/create-project" replace />} />

                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/project-details" element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                } />
                <Route path="/project-details/:id" element={
                  <ProtectedRoute>
                    <ProjectDetails />
                  </ProtectedRoute>
                } />
                <Route path="/all-projects" element={
                  <ProtectedRoute>
                    <AllProjects />
                  </ProtectedRoute>
                } />
                <Route path="/create-project" element={
                  <ProtectedRoute>
                    <CreateProject />
                  </ProtectedRoute>
                } />
                <Route path="/team-directory" element={
                  <ProtectedRoute>
                    <TeamDirectory />
                  </ProtectedRoute>
                } />
                <Route path="/create-team" element={
                  <ProtectedRoute>
                    <CreateTeam />
                  </ProtectedRoute>
                } />
                <Route path="/task-board" element={
                  <ProtectedRoute>
                    <TaskBoard />
                  </ProtectedRoute>
                } />
                <Route path="/my-tasks" element={
                  <ProtectedRoute>
                    <MyTasks />
                  </ProtectedRoute>
                } />
                <Route path="/create-task" element={
                  <ProtectedRoute>
                    <CreateTask />
                  </ProtectedRoute>
                } />
                <Route path="/contribution-analytics" element={
                  <ProtectedRoute>
                    <ContributionAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/team-performance" element={
                  <ProtectedRoute>
                    <TeamPerformance />
                  </ProtectedRoute>
                } />
                <Route path="/project-reports" element={
                  <ProtectedRoute>
                    <ProjectReports />
                  </ProtectedRoute>
                } />
                <Route path="/team-reports" element={
                  <ProtectedRoute>
                    <TeamReports />
                  </ProtectedRoute>
                } />
                <Route path="/export-center" element={
                  <ProtectedRoute>
                    <ExportCenter />
                  </ProtectedRoute>
                } />
                <Route path="/activity-logs" element={
                  <ProtectedRoute>
                    <ActivityLogs />
                  </ProtectedRoute>
                } />
                <Route path="/timeline" element={
                  <ProtectedRoute>
                    <UniversalTimeline />
                  </ProtectedRoute>
                } />
                <Route path="/engineering-profile" element={
                  <ProtectedRoute>
                    <EngineeringProfile />
                  </ProtectedRoute>
                } />
                <Route path="/notification-center" element={
                  <ProtectedRoute>
                    <NotificationCenter />
                  </ProtectedRoute>
                } />
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/settings/github" element={
                  <ProtectedRoute>
                    <GithubIntegration />
                  </ProtectedRoute>
                } />
                <Route path="/github/repositories" element={
                  <ProtectedRoute>
                    <RepositoryManagement />
                  </ProtectedRoute>
                } />
                <Route path="/github/linking" element={
                  <ProtectedRoute>
                    <RepositoryLinking />
                  </ProtectedRoute>
                } />
                <Route path="/github/sync" element={
                  <ProtectedRoute>
                    <RepositoryManagement initialTab="sync" />
                  </ProtectedRoute>
                } />
                <Route path="/projects/:projectId/repository" element={
                  <ProtectedRoute>
                    <RepositoryLinking />
                  </ProtectedRoute>
                } />
                <Route path="/github/analytics" element={
                  <ProtectedRoute>
                    <GithubAnalyticsDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/dashboard/admin-charts" element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/engineering-health" element={
                  <ProtectedRoute>
                    <EngineeringHealthDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/developers" element={
                  <ProtectedRoute>
                    <DeveloperPerformanceDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/leaderboard" element={
                  <ProtectedRoute>
                    <LeaderboardPage />
                  </ProtectedRoute>
                } />
                <Route path="/repository-insights" element={
                  <ProtectedRoute>
                    <RepositoryInsights />
                  </ProtectedRoute>
                } />
                <Route path="/reviews" element={
                  <ProtectedRoute>
                    <ReviewAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/issues" element={
                  <ProtectedRoute>
                    <IssueAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/project-risk" element={
                  <ProtectedRoute>
                    <ProjectRiskAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/bus-factor" element={
                  <ProtectedRoute>
                    <BusFactorAnalytics />
                  </ProtectedRoute>
                } />
                <Route path="/knowledge-distribution" element={
                  <ProtectedRoute>
                    <KnowledgeDistribution />
                  </ProtectedRoute>
                } />

                {/* 404 Route inside layout */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <RoleModalGuard />
          </Router>
        </LayoutProvider>
      </RoleProvider>
    </AuthProvider>
  )
}

export default App
