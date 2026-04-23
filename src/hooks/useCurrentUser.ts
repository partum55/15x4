'use client'

import { useAuth } from '@/context/AuthContext'
import type { ProfileRole } from '@/lib/roles'

type CurrentUser = {
  id: string
  name: string
  email: string
  role: ProfileRole | null
}

export function useCurrentUser() {
  const { user, loading } = useAuth()
  
  const mappedUser: CurrentUser | null = user ? {
    id: user.id,
    name: user.profile?.name ?? user.email,
    email: user.email,
    role: user.profile?.role ?? null,
  } : null

  return { user: mappedUser, loading }
}
