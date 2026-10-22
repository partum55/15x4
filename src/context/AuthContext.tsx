'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import { DEMO_GUEST_COOKIE, DEMO_USER } from '@/lib/demo-user'
import type { AuthUser } from '@/lib/auth'

type AuthResultError = {
  code?: string
  message?: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: AuthResultError; user?: AuthUser | null }>
  signInWithGoogle: (next?: string) => Promise<{ error?: AuthResultError }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: AuthResultError }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
  updatePassword: (password: string) => Promise<{ error?: AuthResultError }>
}

const AuthContext = createContext<AuthContextType | null>(null)

async function fetchCurrentUser() {
  const response = await fetch('/api/profile', {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })

  if (response.status === 401) {
    return null
  }

  if (!response.ok) {
    throw new Error('Failed to fetch current user')
  }

  return response.json() as Promise<AuthUser>
}

// Demo branch: no Supabase. "Signing in" (any credentials, or Google) logs in as the mock admin;
// "signing out" sets a cookie that the server and middleware treat as a guest.
function setGuest(guest: boolean) {
  document.cookie = guest
    ? `${DEMO_GUEST_COOKIE}=1; path=/; max-age=31536000; sameSite=lax`
    : `${DEMO_GUEST_COOKIE}=; path=/; max-age=0`
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AuthUser | null
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)

  const logIn = useCallback(async () => {
    setGuest(false)
    setUser(DEMO_USER)
    return { user: DEMO_USER }
  }, [])

  const signInWithGoogle = useCallback(async (next = '/') => {
    await logIn()
    window.location.assign(next)
    return {}
  }, [logIn])

  const signUp = useCallback(async () => ({}), [])

  const signOut = useCallback(async () => {
    setGuest(true)
    setUser(null)
  }, [])

  const refresh = useCallback(async () => {
    try {
      setUser(await fetchCurrentUser())
    } catch {
      setUser(null)
    }
  }, [])

  const updatePassword = useCallback(async () => ({}), [])

  return (
    <AuthContext.Provider value={{ user, loading: false, signIn: logIn, signInWithGoogle, signUp, signOut, refresh, updatePassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
