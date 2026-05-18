'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import Navbar from '@/components/Navbar'
import AdminNav from '@/components/admin/AdminNav'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import ConfirmModal from '@/components/ConfirmModal'
import { useAuth } from '@/context/AuthContext'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'
import { api } from '@/lib/api'
import { formatEventDate, formatEventTime } from '@/lib/date-time'

type Event = {
  id: string
  title: string
  titleUk: string
  titleEn: string
  city: string
  cityUk: string
  cityEn: string
  date: string
  location: string
  locationUk: string
  locationEn: string
  time: string
  image: string
  isPublic: boolean
  createdAt: string
  user: { id: string; name: string; email: string } | null
  _count: { lectures: number }
}

export default function AdminEventsPage() {
  const { t, i18n } = useTranslation()
  const router = useRouter()
  const { user, loading } = useAuth()
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(true)
  const [eventsError, setEventsError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [approvingEventIds, setApprovingEventIds] = useState<Set<string>>(new Set())
  const [deletingEventIds, setDeletingEventIds] = useState<Set<string>>(new Set())
  const [deleteContext, setDeleteContext] = useState<{ id: string, title: string } | null>(null)

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
  }, [statusFilter, sortBy])

  useEffect(() => {
    if (loading || !user || user?.profile?.role !== 'admin') return
    let isMounted = true
    setLoadingEvents(true)
    setEventsError('')
    api.admin.getEvents({
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      search: debouncedSearchQuery,
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
          setEvents(Array.isArray(data.items) ? data.items : [])
          setTotal(totalItems)
        } else {
          setEvents([])
          setTotal(0)
          setEventsError(data.error)
        }
      })
      .catch(() => {
        if (!isMounted) return
        setEvents([])
        setTotal(0)
        setEventsError('Could not load events.')
      })
      .finally(() => {
        if (isMounted) setLoadingEvents(false)
      })
    return () => {
      isMounted = false
    }
  }, [loading, user, debouncedSearchQuery, statusFilter, sortBy, page, i18n.language])

  const pagination = buildPaginationState(total, page, PAGE_SIZE)
  const paginatedEvents = events
  const selectedLanguage = i18n.language.startsWith('en') ? 'en' : 'uk'
  const eventTitle = (row: Event) => selectedLanguage === 'en' ? row.titleEn || row.titleUk : row.titleUk || row.titleEn
  const eventLocation = (row: Event) => selectedLanguage === 'en' ? row.locationEn || row.locationUk : row.locationUk || row.locationEn

  useEffect(() => {
    if (page !== pagination.currentPage) setPage(pagination.currentPage)
  }, [page, pagination.currentPage])

  async function handleDelete(eventId: string) {
    if (deletingEventIds.has(eventId)) return
    
    const target = events.find(e => e.id === eventId)
    if (!target) return

    setDeleteContext({ id: eventId, title: eventTitle(target) })
  }

  async function performDelete(eventId: string) {
    setDeletingEventIds(prev => {
      const next = new Set(prev)
      next.add(eventId)
      return next
    })
    try {
      const data = await api.admin.deleteEvent(eventId)
      if (data.error) {
        alert(data.error)
        return
      }
      setEvents(prev => prev.filter(e => e.id !== eventId))
      setTotal(prev => Math.max(0, prev - 1))
      if (events.length === 1 && page > 1) setPage(prev => Math.max(1, prev - 1))
    } finally {
      setDeletingEventIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
        return next
      })
    }
  }

  async function handleApprove(eventId: string, isPublic: boolean) {
    if (approvingEventIds.has(eventId)) return
    setApprovingEventIds(prev => {
      const next = new Set(prev)
      next.add(eventId)
      return next
    })
    try {
      const data = await api.admin.updateEventApproval(eventId, isPublic)
      if (data.error) return
      setEvents(prev => prev.map(event => (event.id === eventId ? { ...event, isPublic } : event)))
    } finally {
      setApprovingEventIds(prev => {
        const next = new Set(prev)
        next.delete(eventId)
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

        {deleteContext && (
          <ConfirmModal
            title={t('admin.events.confirmDelete', { title: deleteContext.title })}
            description={t('admin.events.confirmDeleteDescription', { title: deleteContext.title })}
            onConfirm={() => {
              const id = deleteContext.id
              setDeleteContext(null)
              void performDelete(id)
            }}
            onCancel={() => setDeleteContext(null)}
          />
        )}

        <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
          {t('admin.events.title')}
        </h1>

        <AdminNav />

        <div className="grid grid-cols-[minmax(220px,1fr)_repeat(2,minmax(150px,220px))] gap-3 mb-8 max-[860px]:grid-cols-2 max-[640px]:grid-cols-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder={t('admin.events.search', { defaultValue: 'пошук за назвою, містом або власником' })}
            className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="ui-select"
          >
            <option value="">{t('admin.events.allStatuses', { defaultValue: 'усі статуси' })}</option>
            <option value="public">{t('admin.events.statusPublic', { defaultValue: 'публічні' })}</option>
            <option value="draft">{t('admin.events.statusDraft', { defaultValue: 'чернетки' })}</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="ui-select"
          >
            <option value="">{t('admin.events.newest', { defaultValue: 'спочатку найближчі' })}</option>
            <option value="oldest">{t('admin.events.oldest', { defaultValue: 'спочатку найдавніші' })}</option>
            <option value="created">{t('admin.events.created', { defaultValue: 'спочатку створені нещодавно' })}</option>
            <option value="titleAZ">{t('lectures.titleAZ')}</option>
            <option value="titleZA">{t('lectures.titleZA')}</option>
          </select>
        </div>

        {!loadingEvents && (
          <p className="mb-4 text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
            {t('admin.events.showing', { defaultValue: 'показано {{count}} з {{total}}', count: paginatedEvents.length, total })}
          </p>
        )}

        {loadingEvents ? (
          <AdminTableSkeleton cols={7} />
        ) : eventsError ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{eventsError}</p>
        ) : paginatedEvents.length === 0 ? (
          <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{t('admin.events.empty')}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.city')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.date')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.location')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.lectures')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.public')}</th>
                  <th className="text-left p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.events.owner')}</th>
                  <th className="text-right p-3 text-[clamp(12px,1.1vw,16px)] uppercase">{t('admin.users.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedEvents.map(e => (
                  <tr key={e.id} className="border-b border-black/20 hover:bg-black/5">
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <Link href={`/events/${e.id}`} className="text-black hover:underline">
                        {eventTitle(e)}
                      </Link>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{formatEventDate(e.date, true)} · {formatEventTime(e.time)}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{eventLocation(e)}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{e._count.lectures}</td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      <span className={`px-2 py-0.5 text-[clamp(10px,0.9vw,13px)] uppercase tracking-wider font-bold ${
                        e.isPublic ? 'bg-green text-white' : 'bg-black/10 text-black/40'
                      }`}>
                        {e.isPublic ? t('admin.events.statusPublic', { defaultValue: 'Public' }) : t('admin.events.statusDraft', { defaultValue: 'Draft' })}
                      </span>
                    </td>
                    <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                      {e.user?.name || '—'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/account/events/${e.id}/edit`}
                          className="px-3 py-1 border border-black bg-white text-black no-underline text-[clamp(11px,1vw,14px)] transition-opacity duration-150 hover:bg-black hover:text-white"
                        >
                          {t('admin.events.edit')}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleApprove(e.id, !e.isPublic)}
                          disabled={approvingEventIds.has(e.id)}
                          aria-busy={approvingEventIds.has(e.id)}
                          className={`px-3 py-1 border text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse ${
                            e.isPublic 
                              ? 'bg-white border-black text-black' 
                              : 'bg-black border-black text-white'
                          }`}
                        >
                          {approvingEventIds.has(e.id) ? '...' : (e.isPublic ? t('admin.lectures.unpublish') : t('admin.events.approve'))}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(e.id)}
                          disabled={deletingEventIds.has(e.id)}
                          aria-busy={deletingEventIds.has(e.id)}
                          className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:cursor-wait disabled:opacity-60 disabled:animate-pulse"
                        >
                          {deletingEventIds.has(e.id) ? `${t('admin.events.delete')}...` : t('admin.events.delete')}
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
