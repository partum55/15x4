'use client'

import { useAuth } from '@/context/AuthContext'

export type CurrentUser = {
  id: string
  name: string
  email: string
  status: 'pending_email' | 'pending_approval' | 'approved'
}

export function useCurrentUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}
