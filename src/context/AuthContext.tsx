'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { AuthUser } from '@/lib/auth'

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string; user?: AuthUser | null }>
  signInWithGoogle: (next?: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string, city: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

function getSiteOrigin() {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }

  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}

function getAuthCallbackURL(next?: string) {
  const safeNext = next?.startsWith('/') && !next.startsWith('//') ? next : '/'
  return `${getSiteOrigin()}/auth/callback?next=${encodeURIComponent(safeNext)}`
}

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

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AuthUser | null
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const refresh = useCallback(async (showLoader = true) => {
    if (showLoader) {
      setLoading(true)
    }

    try {
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
          return
        }

        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          void refresh(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: 'AUTH_INVALID_CREDENTIALS' }
    if (data.user) {
      const userData = await fetchCurrentUser()
      setUser(userData)
      setLoading(false)
      return { user: userData }
    }
    setLoading(false)
    return {}
  }, [supabase])

  const signInWithGoogle = useCallback(async (next = '/') => {
    const redirectTo = getAuthCallbackURL(next)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          prompt: 'select_account',
        },
      },
    })
    if (error) return { error: 'AUTH_OAUTH_FAILED' }
    return {}
  }, [supabase])

  const signUp = useCallback(async (email: string, password: string, name: string, city: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, city },
        emailRedirectTo: getAuthCallbackURL('/account/settings'),
      },
    })
    if (error) return { error: 'AUTH_SIGNUP_FAILED' }
    if (data.session) {
      const currentUser = await fetchCurrentUser()
      setUser(currentUser)
    }
    return {}
  }, [supabase])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setUser(null)
  }, [supabase])

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signUp, signOut, refresh }}>
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
