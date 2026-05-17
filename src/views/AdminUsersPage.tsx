'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'
import { PROFILE_ROLES, type ProfileRole } from '@/lib/roles'
import { api } from '@/lib/api'

type User = {
  id: string
  name: string
  email: string
  role: ProfileRole
  createdAt: string
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="w-full border-collapse">
        <tbody>
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-black/20">
              {Array.from({ length: 5 }).map((__, columnIndex) => (
                <td key={columnIndex} className="p-3">
                  <span className={`block h-5 animate-pulse bg-black/10 ${columnIndex === 1 ? 'w-48' : columnIndex === 4 ? 'ml-auto w-40' : 'w-28'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminUsersPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
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

  useEffect(() => {
    if (!loading && (!user || user?.profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

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

  useEffect(() => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    let isMounted = true
    setLoadingUsers(true)
    setUsersError('')
    api.admin.getUsers({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: debouncedSearchQuery,
      role: roleFilter,
      sort: sortBy,
    })
      .then(data => {
        if (!isMounted) return
        if (!data.error) {
          const totalItems = Number(data.total ?? 0)
          const totalPages = Math.ceil(totalItems / PAGE_SIZE)
          if (page > 1 && page > totalPages) {
            setPage(1)
            return
          }
          setUsers(Array.isArray(data.items) ? data.items : [])
          setTotal(totalItems)
        } else {
          setUsers([])
          setTotal(0)
          setUsersError(data.error)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setUsers([])
        setTotal(0)
        setUsersError('Could not load users.')
      })
      .finally(() => {
        if (isMounted) setLoadingUsers(false)
      })

    return () => {
      isMounted = false
    }
  }, [loading, user, debouncedSearchQuery, roleFilter, sortBy, page])

  const pagination = buildPaginationState(total, page, PAGE_SIZE)
  const paginatedUsers = users

  useEffect(() => {
    if (page !== pagination.currentPage) setPage(pagination.currentPage)
  }, [page, pagination.currentPage])

  async function handleSetRole(userId: string, role: ProfileRole) {
    if (pendingRoleUserIds.has(userId) || deletingUserIds.has(userId)) return
    setPendingRoleUserIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!res.ok) return
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u))
    } finally {
      setPendingRoleUserIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  async function handleDelete(userId: string) {
    if (deletingUserIds.has(userId) || pendingRoleUserIds.has(userId)) return
    if (!confirm(t('admin.users.confirmDelete'))) return
    setDeletingUserIds(prev => {
      const next = new Set(prev)
      next.add(userId)
      return next
    })
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
      if (!res.ok) return
      setUsers(prev => prev.filter(u => u.id !== userId))
      setTotal(prev => Math.max(0, prev - 1))
      if (users.length === 1 && page > 1) setPage(prev => Math.max(1, prev - 1))
    } finally {
      setDeletingUserIds(prev => {
        const next = new Set(prev)
        next.delete(userId)
        return next
      })
    }
  }

  if (loading || !user || user?.profile?.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar variant="light" />
      <main className="px-[clamp(16px,3.2vw,48px)] py-[clamp(32px,4.2vw,64px)]">
        <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
          {t('admin.users.title')}
        </h1>

        {/* Navigation */}
        <nav className="flex gap-4 mb-12 border-b border-black pb-4">
          <Link href="/admin" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.dashboard')}
          </Link>
          <span className="text-[clamp(14px,1.3vw,20px)] font-bold text-red">{t('admin.nav.users')}</span>
          <Link href="/admin/lectures" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.lectures')}
          </Link>
          <Link href="/admin/events" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.events')}
          </Link>
        </nav>

        <div className="grid grid-cols-[minmax(220px,1fr)_repeat(2,minmax(150px,220px))] gap-3 mb-8 max-[860px]:grid-cols-2 max-[640px]:grid-cols-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('admin.users.search', { defaultValue: 'пошук за імʼям або поштою' })}
            className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
          />
          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="ui-select"
          >
            <option value="">{t('admin.users.allRoles', { defaultValue: 'усі ролі' })}</option>
            {PROFILE_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="ui-select"
          >
            <option value="">{t('admin.users.newest', { defaultValue: 'спочатку новіші' })}</option>
            <option value="oldest">{t('admin.users.oldest', { defaultValue: 'спочатку старіші' })}</option>
            <option value="nameAZ">A-Z</option>
            <option value="nameZA">Z-A</option>
          </select>
        </div>

        {!loadingUsers && (
          <p className="mb-4 text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
            {t('admin.users.showing', { defaultValue: 'показано {{count}} з {{total}}', count: paginatedUsers.length, total })}
          </p>
        )}

        {loadingUsers ? (
          <TableSkeleton />
        ) : usersError ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{usersError}</p>
        ) : paginatedUsers.length === 0 ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{t('admin.users.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.name')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.email')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.role')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.createdAt')}</th>
                  <th className="text-right p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map(u => (
                  <tr key={u.id} className="border-b border-black/20 hover:bg-black/5">
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{u.name}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{u.email}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <span className={`px-2 py-1 text-[clamp(11px,1vw,14px)] ${
                        u.role === 'admin' ? 'bg-red text-white' :
                        u.role === 'lector' ? 'bg-blue text-white' :
                        'bg-black/10'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {new Date(u.createdAt).toLocaleDateString(i18n.language.startsWith('en') ? 'en' : 'uk')}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex gap-2 justify-end flex-wrap">
                        {u.id !== user.id && (
                          PROFILE_ROLES.filter(role => role !== u.role).map(role => (
                            <button
                              key={role}
                              type="button"
                              onClick={() => handleSetRole(u.id, role)}
                              disabled={pendingRoleUserIds.has(u.id) || deletingUserIds.has(u.id)}
                              aria-busy={pendingRoleUserIds.has(u.id)}
                              className="px-3 py-1 bg-blue text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                            >
                              {pendingRoleUserIds.has(u.id) ? '...' : t(`admin.users.makeRole.${role}`)}
                            </button>
                          ))
                        )}
                        {u.id !== user.id && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            disabled={deletingUserIds.has(u.id) || pendingRoleUserIds.has(u.id)}
                            aria-busy={deletingUserIds.has(u.id)}
                            className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                          >
                            {deletingUserIds.has(u.id) ? `${t('admin.users.delete')}...` : t('admin.users.delete')}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 py-8 max-[640px]:flex-col max-[640px]:items-stretch">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={pagination.currentPage === 1}
                  className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                >
                  {t('admin.pagination.prev', { defaultValue: 'назад' })}
                </button>
                <span className="text-center text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
                  {pagination.currentPage} / {pagination.totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                >
                  {t('admin.pagination.next', { defaultValue: 'далі' })}
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
