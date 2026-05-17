'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/context/AuthContext'
import { CATEGORY_COLOR_VAR } from '@/constants/colors'
import { LECTURE_CATEGORIES } from '@/constants/lectureCategories'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'
import { api } from '@/lib/api'

type Lecture = {
  id: string
  title: string
  author: string
  titleUk: string
  titleEn: string
  authorUk: string
  authorEn: string
  category: string
  categoryColor: string
  isPublic: boolean
  createdAt: string
  user: { id: string; name: string; email: string } | null
}

function TableSkeleton() {
  return (
    <div className="overflow-x-auto" aria-hidden="true">
      <table className="w-full border-collapse">
        <tbody>
          {Array.from({ length: 6 }).map((_, rowIndex) => (
            <tr key={rowIndex} className="border-b border-black/20">
              {Array.from({ length: 6 }).map((__, columnIndex) => (
                <td key={columnIndex} className="p-3">
                  <span className={`block h-5 animate-pulse bg-black/10 ${columnIndex === 0 ? 'w-56' : columnIndex === 5 ? 'ml-auto w-36' : 'w-24'}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function AdminLecturesPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [lecturesError, setLecturesError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [deletingLectureIds, setDeletingLectureIds] = useState<Set<string>>(new Set())
  const [approvingLectureIds, setApprovingLectureIds] = useState<Set<string>>(new Set())

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
    if (loading || !user || user?.profile?.role !== 'admin') return

    let isMounted = true
    setLoadingLectures(true)
    setLecturesError('')

    api.admin.getLectures({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: debouncedSearchQuery,
      category: categoryFilter,
      status: statusFilter,
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
          setLectures(Array.isArray(data.items) ? data.items : [])
          setTotal(totalItems)
        } else {
          setLectures([])
          setTotal(0)
          setLecturesError(data.error)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setLectures([])
        setTotal(0)
        setLecturesError('Could not load lectures.')
      })
      .finally(() => {
        if (isMounted) setLoadingLectures(false)
      })

    return () => {
      isMounted = false
    }
  }, [loading, user, debouncedSearchQuery, categoryFilter, statusFilter, sortBy, page, i18n.language])

  const pagination = buildPaginationState(total, page, PAGE_SIZE)

  async function handleApprove(lectureId: string, isPublic: boolean) {
    if (approvingLectureIds.has(lectureId)) return
    setApprovingLectureIds(prev => {
      const next = new Set(prev)
      next.add(lectureId)
      return next
    })
    try {
      const res = await fetch(`/api/admin/lectures/${lectureId}/approval`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic }),
      })
      if (!res.ok) return
      setLectures(prev => prev.map(l => l.id === lectureId ? { ...l, isPublic } : l))
    } finally {
      setApprovingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(lectureId)
        return next
      })
    }
  }

  async function handleDelete(lectureId: string) {
    if (deletingLectureIds.has(lectureId)) return
    if (!confirm(t('admin.lectures.confirmDelete'))) return
    setDeletingLectureIds(prev => {
      const next = new Set(prev)
      next.add(lectureId)
      return next
    })
    try {
      const res = await fetch(`/api/admin/lectures/${lectureId}`, { method: 'DELETE' })
      if (!res.ok) return
      setLectures(prev => prev.filter(l => l.id !== lectureId))
      setTotal(prev => Math.max(0, prev - 1))
      if (lectures.length === 1 && page > 1) setPage(prev => Math.max(1, prev - 1))
    } finally {
      setDeletingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(lectureId)
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
          {t('admin.lectures.title')}
        </h1>

        {/* Navigation */}
        <nav className="flex gap-4 mb-12 border-b border-black pb-4">
          <Link href="/admin" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.dashboard')}
          </Link>
          <Link href="/admin/users" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.users')}
          </Link>
          <span className="text-[clamp(14px,1.3vw,20px)] font-bold text-red">{t('admin.nav.lectures')}</span>
          <Link href="/admin/events" className="text-[clamp(14px,1.3vw,20px)] text-black no-underline hover:underline">
            {t('admin.nav.events')}
          </Link>
        </nav>

        <div className="grid grid-cols-[minmax(220px,1fr)_repeat(3,minmax(160px,220px))] gap-3 mb-8 max-[1023px]:grid-cols-2 max-[640px]:grid-cols-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('admin.lectures.search')}
            className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
          />
          <select
            value={categoryFilter}
            onChange={(event) => {
              setPage(1)
              setCategoryFilter(event.target.value)
            }}
            className="ui-select"
          >
            <option value="">{t('admin.lectures.allCategories')}</option>
            {LECTURE_CATEGORIES.map(category => (
              <option key={category} value={category}>
                {t(`lectureCategories.${category}`, { defaultValue: category })}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => {
              setPage(1)
              setStatusFilter(event.target.value)
            }}
            className="ui-select"
          >
            <option value="">{t('admin.lectures.allStatuses')}</option>
            <option value="public">{t('admin.lectures.statusPublic')}</option>
            <option value="draft">{t('admin.lectures.statusDraft')}</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => {
              setPage(1)
              setSortBy(event.target.value)
            }}
            className="ui-select"
          >
            <option value="">{t('admin.lectures.newest')}</option>
            <option value="oldest">{t('admin.lectures.oldest')}</option>
            <option value="titleAZ">{t('lectures.titleAZ')}</option>
            <option value="titleZA">{t('lectures.titleZA')}</option>
          </select>
        </div>

        {!loadingLectures && (
          <p className="mb-4 text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
            {t('admin.lectures.showing', { count: lectures.length, total })}
          </p>
        )}

        {loadingLectures ? (
          <TableSkeleton />
        ) : lecturesError ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{lecturesError}</p>
        ) : lectures.length === 0 ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{t('admin.lectures.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.titleHeader')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.author')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.category')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.public')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.lectures.owner')}</th>
                  <th className="text-right p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {lectures.map(l => (
                  <tr key={l.id} className="border-b border-black/20 hover:bg-black/5">
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <Link href={`/lectures/${l.id}`} className="text-black hover:underline">
                        {l.title}
                      </Link>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{l.author}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <span
                        className="px-2 py-1 text-[clamp(11px,1vw,14px)] text-white"
                        style={{ backgroundColor: CATEGORY_COLOR_VAR[l.categoryColor as keyof typeof CATEGORY_COLOR_VAR] || 'var(--color-black)' }}
                      >
                        {t(`lectureCategories.${l.category}`, { defaultValue: l.category })}
                      </span>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {l.isPublic ? '✓' : '—'}
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {l.user?.name || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/account/lectures/${l.id}/edit`}
                          className="px-3 py-1 border border-black bg-white text-black no-underline text-[clamp(11px,1vw,14px)] transition-opacity duration-150 hover:opacity-70"
                        >
                          {t('admin.lectures.edit')}
                        </Link>
                        {!l.isPublic && (
                          <button
                            type="button"
                            onClick={() => handleApprove(l.id, true)}
                            disabled={approvingLectureIds.has(l.id)}
                            aria-busy={approvingLectureIds.has(l.id)}
                            className="px-3 py-1 bg-black text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                          >
                            {approvingLectureIds.has(l.id) ? `${t('admin.lectures.approve')}...` : t('admin.lectures.approve')}
                          </button>
                        )}
                        {l.isPublic && (
                          <button
                            type="button"
                            onClick={() => handleApprove(l.id, false)}
                            disabled={approvingLectureIds.has(l.id)}
                            aria-busy={approvingLectureIds.has(l.id)}
                            className="px-3 py-1 border border-black bg-white text-black border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                          >
                            {approvingLectureIds.has(l.id) ? `${t('admin.lectures.unpublish')}...` : t('admin.lectures.unpublish')}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDelete(l.id)}
                          disabled={deletingLectureIds.has(l.id)}
                          aria-busy={deletingLectureIds.has(l.id)}
                          className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                        >
                          {deletingLectureIds.has(l.id) ? `${t('admin.lectures.delete')}...` : t('admin.lectures.delete')}
                        </button>
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
                  disabled={pagination.currentPage === 1 || loadingLectures}
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
                  disabled={pagination.currentPage === pagination.totalPages || loadingLectures}
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
