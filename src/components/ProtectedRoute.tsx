import { Navigate, Outlet } from 'react-router-dom'
import { getCurrentUser } from '../auth'

export default function ProtectedRoute() {
  const user = getCurrentUser()

  if (!user) return <Navigate to="/login" replace />
  if (user.status === 'pending_email') return <Navigate to="/confirm-email" replace />
  if (user.status === 'pending_approval') return <Navigate to="/wait-approval" replace />

  return <Outlet />
}
