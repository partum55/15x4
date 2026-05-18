'use client'

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/context/AuthContext'
import { PAGE_SIZE } from '@/lib/admin-pagination'
import { api } from '@/lib/api'
import type { ProfileRole } from '@/lib/roles'

export type User = {
  id: string
  name: string
  email: string
  role: ProfileRole
  createdAt: string
}

export function useAdminUsers() {
  const { t } = useTranslation()
  const { user, loading, signIn } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [usersError, setUsersError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pendingRoleUserIds, setPendingRoleUserIds] = useState<Set<string>>(new Set())
  const [deletingUserIds, setDeletingUserIds] = useState<Set<string>>(new Set())
  
  const [reauthContext, setReauthContext] = useState<{ 
    type: 'role', 
    userId: string, 
    role: ProfileRole,
    name: string
  } | null>(null)
  
  const [deleteContext, setDeleteContext] = useState<{
    userId: string,
    name: string
  } | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    setPage(1)
  }, [roleFilter, sortBy])

  const fetchUsers = useCallback(async () => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    
    setLoadingUsers(true)
    setUsersError('')
    try {
      const data = await api.admin.getUsers({
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: debouncedSearchQuery,
        role: roleFilter,
        sort: sortBy,
      })
      
      if (!data.error) {
        setUsers(Array.isArray(data.items) ? data.items : [])
        setTotal(Number(data.total ?? 0))
      } else {
        setUsersError(data.error)
      }
    } catch {
      setUsersError('Could not load users.')
    } finally {
      setLoadingUsers(false)
    }
  }, [loading, user, debouncedSearchQuery, roleFilter, sortBy, page])

  useEffect(() => {
    void fetchUsers()
  }, [fetchUsers])

  const handleSetRole = async (userId: string, role: ProfileRole) => {
    if (pendingRoleUserIds.has(userId) || deletingUserIds.has(userId)) return
    
    const targetUser = users.find(u => u.id === userId)
    if (!targetUser) return

    if (role === 'admin' || userId === user?.id) {
      setReauthContext({ type: 'role', userId, role, name: targetUser.name })
      return
    }

    await performSetRole(userId, role)
  }

  const performSetRole = async (userId: string, role: ProfileRole) => {
    setPendingRoleUserIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    try {
      const data = await api.admin.updateUser(userId, { role })
      if (!data.error) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
      } else {
        alert(data.error)
      }
    } finally {
      setPendingRoleUserIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleDelete = (userId: string) => {
    const targetUser = users.find(u => u.id === userId)
    if (targetUser) setDeleteContext({ userId, name: targetUser.name })
  }

  const performDelete = async (userId: string) => {
    setDeletingUserIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    try {
      const data = await api.admin.deleteUser(userId)
      if (!data.error) {
        setUsers(prev => prev.filter(u => u.id !== userId))
        setTotal(prev => Math.max(0, prev - 1))
      } else {
        alert(data.error)
      }
    } finally {
      setDeletingUserIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  const handleReauth = async (password: string) => {
    if (!user?.email || !reauthContext) return
    const result = await signIn(user.email, password)
    if (result.error) throw new Error(t('auth.login.errorInvalidPassword'))

    const { userId, role } = reauthContext
    setReauthContext(null)
    await performSetRole(userId, role)
  }

  return {
    users,
    loadingUsers,
    usersError,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    roleFilter,
    setRoleFilter,
    sortBy,
    setSortBy,
    pendingRoleUserIds,
    deletingUserIds,
    reauthContext,
    setReauthContext,
    deleteContext,
    setDeleteContext,
    handleSetRole,
    handleDelete,
    performDelete,
    handleReauth,
    currentUser: user
  }
}
