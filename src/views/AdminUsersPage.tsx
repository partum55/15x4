'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import Loader from '@/components/Loader'
import { useAuth } from '@/context/AuthContext'
import { PROFILE_ROLES, type ProfileRole } from '@/lib/roles'

type User = {
  id: string
  name: string
  email: string
  role: ProfileRole
  createdAt: string
}

const USERS_PAGE_SIZE = 20

export default function AdminUsersPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [page, setPage] = useState(1)
  const [pendingRoleUserIds, setPendingRoleUserIds] = useState<Set<string>>(new Set())
  const [deletingUserIds, setDeletingUserIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!loading && (!user || user?.profile?.role !== 'admin')) {
      router.push('/')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUsers(data)
        setLoadingUsers(false)
      })
  }, [loading, user])

  useEffect(() => {
    setPage(1)
  }, [searchQuery, roleFilter, sortBy])

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const rows = users.filter((row) => {
      const matchesSearch = !query || [row.name, row.email, row.role].some((value) => value.toLowerCase().includes(query))
      const matchesRole = !roleFilter || row.role === roleFilter
      return matchesSearch && matchesRole
    })

    return rows.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      if (sortBy === 'nameAZ') return a.name.localeCompare(b.name, 'uk')
      if (sortBy === 'nameZA') return b.name.localeCompare(a.name, 'uk')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [users, searchQuery, roleFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paginatedUsers = filteredUsers.slice((safePage - 1) * USERS_PAGE_SIZE, safePage * USERS_PAGE_SIZE)

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
            className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
          >
            <option value="">{t('admin.users.allRoles', { defaultValue: 'усі ролі' })}</option>
            {PROFILE_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
          >
            <option value="">{t('admin.users.newest', { defaultValue: 'спочатку новіші' })}</option>
            <option value="oldest">{t('admin.users.oldest', { defaultValue: 'спочатку старіші' })}</option>
            <option value="nameAZ">A-Z</option>
            <option value="nameZA">Z-A</option>
          </select>
        </div>

        {!loadingUsers && (
          <p className="mb-4 text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
            {t('admin.users.showing', { defaultValue: 'показано {{count}} з {{total}}', count: paginatedUsers.length, total: filteredUsers.length })}
          </p>
        )}

        {loadingUsers ? (
          <Loader className="flex items-center justify-center py-12" />
        ) : filteredUsers.length === 0 ? (
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
                      {new Date(u.createdAt).toLocaleDateString('uk')}
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
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 py-8 max-[640px]:flex-col max-[640px]:items-stretch">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={safePage === 1}
                  className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-black"
                >
                  {t('admin.pagination.prev', { defaultValue: 'назад' })}
                </button>
                <span className="text-center text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safePage === totalPages}
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
