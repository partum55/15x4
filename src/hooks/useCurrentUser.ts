'use client'

import { useAuth } from '@/context/AuthContext'

type CurrentUser = {
  id: string
  name: string
  email: string
  status: 'pending_approval' | 'approved'
}

export function useCurrentUser() {
  const { user, loading } = useAuth()
  
  // Map new user shape to expected shape
  const mappedUser: CurrentUser | null = user && user.profile ? {
    id: user.id,
    name: user.profile.name,
    email: user.email,
    status: user.profile.status,
  } : null

  return { user: mappedUser, loading }
}
