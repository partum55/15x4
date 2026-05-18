'use client'

import { useTranslation } from 'react-i18next'
import AdminLayout from '@/components/admin/AdminLayout'
import AdminNav from '@/components/admin/AdminNav'
import AdminTableSkeleton from '@/components/admin/AdminTableSkeleton'
import ConfirmModal from '@/components/ConfirmModal'
import { useAdminLectures } from '@/hooks/admin/useAdminLectures'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'
import { CATEGORY_COLOR_VAR } from '@/constants/colors'
import { LECTURE_CATEGORIES } from '@/constants/lectureCategories'
import Link from 'next/link'

export default function AdminLecturesPage() {
  const { t } = useTranslation()
  const {
    lectures,
    loadingLectures,
    lecturesError,
    total,
    page,
    setPage,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    approvingLectureIds,
    deletingLectureIds,
    deleteContext,
    setDeleteContext,
    publishEventContext,
    setPublishEventContext,
    unpublishEventContext,
    setUnpublishEventContext,
    handleApprove,
    handlePublishEventAndLecture,
    handleUnpublishEvent,
    handleDeleteRequest,
    performDelete,
    currentUser,
  } = useAdminLectures()

  const pagination = buildPaginationState(total, page, PAGE_SIZE)

  if (!currentUser || currentUser?.profile?.role !== 'admin') {
    return null
  }

  return (
    <AdminLayout title={t('admin.lectures.title')}>
      {deleteContext && (
        <ConfirmModal
          title={t('admin.lectures.confirmDelete', { title: deleteContext.title })}
          description={t('admin.lectures.confirmDeleteDescription', { title: deleteContext.title })}
          onConfirm={() => {
            const id = deleteContext.id
            setDeleteContext(null)
            void performDelete(id)
          }}
          onCancel={() => setDeleteContext(null)}
        />
      )}

      {publishEventContext && (
        <ConfirmModal
          title={t('admin.lectures.confirmPublishEvent')}
          description={t('admin.lectures.confirmPublishEventDescription')}
          onConfirm={handlePublishEventAndLecture}
          onCancel={() => setPublishEventContext(null)}
          isDestructive={false}
        />
      )}

      {unpublishEventContext && (
        <ConfirmModal
          title={t('admin.lectures.confirmUnpublishEvent')}
          description={t('admin.lectures.confirmUnpublishEventDescription')}
          onConfirm={handleUnpublishEvent}
          onCancel={() => setUnpublishEventContext(null)}
          isDestructive={false}
        />
      )}

      <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black mb-8">
        {t('admin.lectures.title')}
      </h1>

      <AdminNav />

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
              {t(`lectureCategories.${category}`)}
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
        <AdminTableSkeleton cols={6} />
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
                      {t(`lectureCategories.${l.category}`)}
                    </span>
                  </td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                    <span className={`px-2 py-0.5 text-[clamp(10px,0.9vw,13px)] uppercase tracking-wider font-bold ${
                      l.isPublic ? 'bg-green text-white' : 'bg-black/10 text-black/40'
                    }`}>
                      {l.isPublic ? t('admin.lectures.statusPublic') : t('admin.lectures.statusDraft')}
                    </span>
                  </td>
                  <td className="p-3 text-[clamp(13px,1.2vw,18px)]">
                    {(l as unknown as { user?: { name: string } }).user?.name || '—'}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/account/lectures/${l.id}/edit`}
                        className="px-3 py-1 border border-black bg-white text-black no-underline text-[clamp(11px,1vw,14px)] transition-opacity duration-150 hover:bg-black hover:text-white"
                      >
                        {t('admin.lectures.edit')}
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleApprove(l.id, !l.isPublic)}
                        disabled={approvingLectureIds.has(l.id)}
                        className={`px-3 py-1 border text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:opacity-60 ${
                          l.isPublic ? 'bg-white border-black text-black' : 'bg-black border-black text-white'
                        }`}
                      >
                        {approvingLectureIds.has(l.id) ? '...' : (l.isPublic ? t('admin.lectures.unpublish') : t('admin.lectures.approve'))}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(l.id)}
                        disabled={deletingLectureIds.has(l.id)}
                        className="px-3 py-1 bg-red text-white border-none text-[clamp(11px,1vw,14px)] cursor-pointer hover:opacity-80 disabled:opacity-60"
                      >
                        {deletingLectureIds.has(l.id) ? '...' : t('admin.lectures.delete')}
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
