'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import ArrowIcon from '../components/ArrowIcon'
import ConfirmModal from '../components/ConfirmModal'
import { PAGE_SIZE, buildPaginationState } from '@/lib/admin-pagination'
import { api } from '../lib/api'
import { useCurrentUser } from '../hooks/useCurrentUser'
import type { Lecture } from '@/lib/api'

const colorStyles: Record<string, string> = {
  orange: 'border-orange text-orange',
  green: 'border-green text-green',
  blue: 'border-blue text-blue',
  red: 'border-red text-red',
}

export default function MyLecturesPage() {
  const { t } = useTranslation()
  const { user, loading: userLoading } = useCurrentUser()
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loadingLectures, setLoadingLectures] = useState(true)
  const [deletingLectureIds, setDeletingLectureIds] = useState<Set<string>>(new Set())
  const [deleteContext, setDeleteContext] = useState<{ id: string, title: string } | null>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (userLoading) return
    if (!user?.id) {
      setLectures([])
      setTotal(0)
      setLoadingLectures(false)
      return
    }

    let isMounted = true
    setLoadingLectures(true)
    api
      .getLecturesPage({ 
        scope: 'mine',
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        search: debouncedSearchQuery,
        status: statusFilter
      })
      .then((data) => {
        if (!isMounted) return
        setLectures(data.items || [])
        setTotal(data.total || 0)
      })
      .catch(() => {
        if (isMounted) {
          setLectures([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (isMounted) setLoadingLectures(false)
      })

    return () => {
      isMounted = false
    }
  }, [user?.id, userLoading, page, debouncedSearchQuery, statusFilter])

  const pagination = buildPaginationState(total, page, PAGE_SIZE)

  async function handleDelete(id: string) {
    if (deletingLectureIds.has(id)) return
    
    const lecture = lectures.find(l => l.id === id)
    if (!lecture) return

    setDeleteContext({ id, title: lecture.titleUk || lecture.titleEn || '' })
  }

  async function performDelete(id: string) {
    setDeletingLectureIds(prev => {
      const next = new Set(prev)
      next.add(id)
      return next
    })
    try {
      await api.deleteLecture(id)
      setLectures(prev => prev.filter(l => l.id !== id))
      setTotal(prev => Math.max(0, prev - 1))
    } finally {
      setDeletingLectureIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Navbar variant="light" />
      <main className="content-shell flex-1 py-[clamp(32px,4.2vw,64px)]">

        {deleteContext && (
          <ConfirmModal
            title={t('myLectures.deleteConfirm')}
            description={deleteContext.title}
            onConfirm={() => {
              const id = deleteContext.id
              setDeleteContext(null)
              void performDelete(id)
            }}
            onCancel={() => setDeleteContext(null)}
          />
        )}

        <div className="flex items-center justify-between mb-6 gap-4">
          <h1 className="text-[clamp(22px,2.4vw,36px)] font-normal tracking-[-0.04em] uppercase text-black">{t('myLectures.title')}</h1>
          <Link
            href="/account/lectures/new"
            className="flex items-center gap-[10px] px-6 py-[14px] bg-black text-white no-underline text-[clamp(13px,1.2vw,18px)] font-normal uppercase transition-opacity duration-200 hover:opacity-85 whitespace-nowrap flex-shrink-0"
          >
            <span className="max-[767px]:hidden">{t('myLectures.addBtn')}</span>
            <ArrowIcon />
          </Link>
        </div>

        <div className="w-full h-px bg-black" />

        <div className="grid grid-cols-[1fr_200px] gap-3 my-8 max-[640px]:grid-cols-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('admin.lectures.search')}
            className="border border-black bg-white px-4 py-3 font-sans text-[clamp(13px,1.2vw,18px)] outline-none"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setPage(1)
              setStatusFilter(e.target.value)
            }}
            className="ui-select"
          >
            <option value="">{t('admin.lectures.allStatuses')}</option>
            <option value="public">{t('admin.lectures.statusPublic')}</option>
            <option value="draft">{t('admin.lectures.statusDraft')}</option>
          </select>
        </div>

        {loadingLectures ? (
          <ul className="list-none">
            {Array.from({ length: 4 }).map((_, index) => (
              <li key={index} className="flex items-center justify-between gap-6 py-5 border-b border-black max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="h-7 w-28 animate-pulse bg-black/10" />
                  <span className="h-6 w-4/5 animate-pulse bg-black/10" />
                  <span className="h-4 w-1/3 animate-pulse bg-black/10" />
                </div>
                <div className="flex items-center gap-4">
                  <span className="h-4 w-12 animate-pulse bg-black/10" />
                  <span className="h-4 w-16 animate-pulse bg-black/10" />
                </div>
              </li>
            ))}
          </ul>
        ) : lectures.length === 0 ? (
          <p className="py-8 text-[clamp(14px,1.3vw,20px)] text-black opacity-50 uppercase">{t('myLectures.empty')}</p>
        ) : (
          <>
            <ul className="list-none">
              {lectures.map((lecture) => (
                <li key={lecture.id} className="flex items-center justify-between gap-6 py-5 border-b border-black max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-center gap-3">
                      <span className={`border px-2 py-0.5 text-[clamp(10px,0.9vw,12px)] font-bold uppercase ${colorStyles[lecture.categoryColor] || 'border-black text-black'}`}>
                        {t(`lectureCategories.${lecture.category}`)}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold ${lecture.isPublic ? 'bg-green text-white' : 'bg-black/10 text-black/40'}`}>
                        {lecture.isPublic ? 'Public' : 'Draft'}
                      </span>
                    </div>
                    <p className="text-[clamp(15px,1.5vw,22px)] font-normal uppercase tracking-[-0.03em] leading-tight text-black whitespace-nowrap overflow-hidden text-ellipsis">{lecture.title}</p>
                    <p className="text-[clamp(12px,1.1vw,16px)] text-black opacity-60 uppercase">{lecture.author}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <Link
                      href={`/account/lectures/${lecture.id}/edit`}
                      className="font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-black underline bg-transparent border-none cursor-pointer p-0 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100"
                    >
                      {t('myLectures.editBtn')}
                    </Link>
                    <button
                      type="button"
                      className="font-sans text-[clamp(12px,1.1vw,16px)] font-normal text-red underline bg-transparent border-none cursor-pointer p-0 uppercase opacity-70 transition-opacity duration-150 hover:opacity-100 disabled:cursor-wait disabled:opacity-45 disabled:animate-pulse"
                      onClick={() => handleDelete(lecture.id)}
                      disabled={deletingLectureIds.has(lecture.id)}
                      aria-busy={deletingLectureIds.has(lecture.id)}
                    >
                      {deletingLectureIds.has(lecture.id) ? `${t('myLectures.deleteBtn')}...` : t('myLectures.deleteBtn')}
                    </button>
                  </div>
                </li>
              ))}
            </ul>

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
          </>
        )}
      </main>
    </AppLayout>
  )
}
