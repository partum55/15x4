'use client'

import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminNav from '@/components/admin/AdminNav'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import ConfirmModal from '@/components/ConfirmModal'
import { useAdminEvents } from '@/hooks/admin/useAdminEvents'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'
import type { Event } from '@/lib/api'
import Link from 'next/link'
import { formatEventDate, formatEventTime } from '@/lib/date-time'

export default function AdminEventsPage() {
  const { t, i18n } = useTranslation()
  const {
    events,
    loadingEvents,
    eventsError,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    approvingEventIds,
    deletingEventIds,
    deleteContext,
    setDeleteContext,
    handleApprove,
    handleDeleteRequest,
    performDelete,
    currentUser,
  } = useAdminEvents()

  const pagination = buildPaginationState(total, page, PAGE_SIZE)
  const selectedLanguage = i18n.language.startsWith('en') ? 'en' : 'uk'
  const getEventTitle = (row: Event) => selectedLanguage === 'en' ? row.titleEn || row.titleUk : row.titleUk || row.titleEn
  const getEventLocation = (row: Event) => selectedLanguage === 'en' ? row.locationEn || row.locationUk : row.locationUk || row.locationEn

  if (!currentUser || currentUser?.profile?.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout title={t('admin.events.title')}>
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
          placeholder={t('admin.events.search')}
          className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="ui-select"
        >
          <option value="">{t('admin.events.allStatuses')}</option>
          <option value="public">{t('admin.events.statusPublic')}</option>
          <option value="draft">{t('admin.events.statusDraft')}</option>
        </select>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="ui-select"
        >
          <option value="">{t('admin.events.newest')}</option>
          <option value="oldest">{t('admin.events.oldest')}</option>
          <option value="created">{t('admin.events.created')}</option>
          <option value="titleAZ">{t('lectures.titleAZ')}</option>
          <option value="titleZA">{t('lectures.titleZA')}</option>
        </select>
      </div>

      {!loadingEvents && (
        <p className="mb-4 text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
          {t('admin.events.showing', { count: events.length, total })}
        </p>
      )}

      {loadingEvents ? (
        <AdminTableSkeleton cols={7} />
      ) : eventsError ? (
        <p className="text-[clamp(14px,1.3vw,20px)] opacity-60">{eventsError}</p>
      ) : events.length === 0 ? (
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
              {events.map(e => (
                <tr key={e.id} className="border-b border-black/20 hover:bg-black/5">
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                    <Link href={`/events/${e.id}`} className="text-black hover:underline">
                      {getEventTitle(e)}
                    </Link>
                  </td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{formatEventDate(e.date, true)} · {formatEventTime(e.time)}</td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{getEventLocation(e)}</td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">{(e as unknown as { _count?: { lectures: number } })._count?.lectures ?? 0}</td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                    <span className={`px-2 py-0.5 text-[clamp(10px,0.9vw,13px)] uppercase tracking-wider font-bold ${
                      e.isPublic ? 'bg-green text-white' : 'bg-black/10 text-black/40'
                    }`}>
                      {e.isPublic ? t('admin.events.statusPublic') : t('admin.events.statusDraft')}
                    </span>
                  </td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                    {(e as unknown as { user?: { name: string } }).user?.name || '—'}
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
                        className={`px-3 py-1 border text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:opacity-60 ${
                          e.isPublic ? 'bg-white border-black text-black' : 'bg-black border-black text-white'
                        }`}
                      >
                        {approvingEventIds.has(e.id) ? '...' : (e.isPublic ? t('admin.lectures.unpublish') : t('admin.events.approve'))}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(e.id)}
                        disabled={deletingEventIds.has(e.id)}
                        className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:opacity-60"
                      >
                        {deletingEventIds.has(e.id) ? '...' : t('admin.events.delete')}
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
                className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('admin.pagination.prev')}
              </button>
              <span className="text-center text-[clamp(12px,1.1vw,16px)] uppercase text-black/60">
                {pagination.currentPage} / {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={pagination.currentPage === pagination.totalPages}
                className="px-6 py-3 border border-black bg-white text-black text-[clamp(12px,1.1vw,16px)] uppercase hover:bg-black hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('admin.pagination.next')}
              </button>
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  )
}
