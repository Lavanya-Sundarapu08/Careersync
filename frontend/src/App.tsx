import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar'
import Login from './pages/Login'
import Register from './pages/Register'
import JobsList from './pages/JobsList'
import JobDetail from './pages/JobDetail'
import PostJob from './pages/PostJob'
import MyApplications from './pages/MyApplications'
import RecruiterQueue from './pages/RecruiterQueue'
import ApplicationDetail from './pages/ApplicationDetail'
import AdminDisputes from './pages/AdminDisputes'
import OAuth2Callback from './pages/OAuth2Callback'
import LandingPage from './pages/LandingPage'
import { useAuth } from './context/AuthContext'
import type { Role } from './types'

function RequireRole({ roles, children }: { roles: Role[]; children: React.ReactNode }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (!roles.includes(user.role)) return <Navigate to="/jobs" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <div className="min-h-screen">
      <NavBar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/oauth2/callback" element={<OAuth2Callback />} />
        <Route path="/jobs" element={<JobsList />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/applications/:id" element={<ApplicationDetail />} />
        <Route path="/my-applications" element={
          <RequireRole roles={['CANDIDATE']}><MyApplications /></RequireRole>
        } />
        <Route path="/recruiter/queue" element={
          <RequireRole roles={['RECRUITER', 'ADMIN']}><RecruiterQueue /></RequireRole>
        } />
        <Route path="/recruiter/jobs/new" element={
          <RequireRole roles={['RECRUITER']}><PostJob /></RequireRole>
        } />
        <Route path="/admin/disputes" element={
          <RequireRole roles={['ADMIN']}><AdminDisputes /></RequireRole>
        } />
      </Routes>
    </div>
  )
}
