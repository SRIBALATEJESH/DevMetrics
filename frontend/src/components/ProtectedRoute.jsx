import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useRole } from '../context/RoleContext'

const ProtectedRoute = ({ children }) => {
  const { user } = useAuth()
  const { hasAccess } = useRole()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!hasAccess(location.pathname)) {
    return <Navigate to="/access-denied" replace />
  }

  return children
}

export default ProtectedRoute
