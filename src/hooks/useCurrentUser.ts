'use client'

import { useAuth } from '@/context/AuthContext'
import type { ProfileRole } from '@/lib/roles'

type CurrentUser = {
  id: string
  name: string
  email: string
  role: ProfileRole
}

export function useCurrentUser() {
  const { user, loading } = useAuth()
  
  // Map new user shape to expected shape
  const mappedUser: CurrentUser | null = user && user.profile ? {
    id: user.id,
    name: user.profile.name,
    email: user.email,
    role: user.profile.role,
  } : null

  return { user: mappedUser, loading }
}
