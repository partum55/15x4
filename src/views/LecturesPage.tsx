'use client'

import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AppLayout from '../components/AppLayout'
import FilterDropdown from '../components/FilterDropdown'
import LectureCard from '../components/LectureCard'
import LectureGrid from '../components/LectureGrid'
import LoadingBlock from '../components/ui/LoadingBlock'
import { api } from '../lib/api'
import type { Lecture } from '@/lib/api'
import { LECTURE_CATEGORIES } from '../constants/lectureCategories'
import { useFilteredList } from '../hooks/useFilteredList'

const LECTURES_PAGE_SIZE = 20
const LECTURES_FILTER_STORAGE_KEY = '15x4:lectures:filters'

type LectureFilters = {
  search: string
  sort: string
  theme: string
}

const DEFAULT_FILTERS: LectureFilters = { search: '', sort: 'dateDesc', theme: '' }

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function LecturesLoadingGrid() {
  return (
    <>
      <div className="flex items-stretch border-b border-black max-[767px]:flex-col">
        <LectureCard loading variant="horizontal" />
        <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
        <LectureCard loading variant="horizontal" />
      </div>
      <div className="flex items-stretch border-b border-black max-[767px]:flex-col">
        <LectureCard loading variant="compact" />
        <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
        <LectureCard loading variant="compact" />
      </div>
      <div className="flex items-stretch border-b border-black max-[767px]:flex-col">
        <LectureCard loading variant="horizontal" />
        <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
        <LectureCard loading variant="horizontal" />
      </div>
      <div className="flex items-stretch border-b border-black max-[767px]:flex-col">
        <LectureCard loading variant="vertical" />
        <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
        <LectureCard loading variant="featured" />
        <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
        <LectureCard loading variant="vertical" />
      </div>
    </>
  )
}

const fetchLectures = ({ filters, limit, offset }: { filters: LectureFilters; limit: number; offset: number }) =>
  api.getLecturesPage({
    limit,
    offset,
    search: filters.search,
    category: filters.theme,
    sort: filters.sort,
  })

export default function LecturesPage() {
  const { t } = useTranslation()
  const list = useFilteredList<Lecture, LectureFilters>({
    fetcher: fetchLectures,
    defaultFilters: DEFAULT_FILTERS,
    pageSize: LECTURES_PAGE_SIZE,
    storageKey: LECTURES_FILTER_STORAGE_KEY,
    debouncedKeys: ['search'],
  })

  const { items: lectures, loading, textRefreshing, loadingMore, hasMore, total } = list.state

  // Hide load-more once an active filter is in play to mirror the previous UX.
  const hasActiveFilters = Boolean(list.filters.search || list.filters.theme || (list.filters.sort && list.filters.sort !== 'dateDesc'))

  const sortOptions = [
    { value: 'dateDesc', label: t('lectures.dateDesc') },
    { value: 'dateAsc', label: t('lectures.dateAsc') },
    { value: 'titleAZ', label: t('lectures.titleAZ') },
    { value: 'titleZA', label: t('lectures.titleZA') },
  ]

  const themeOptions = [
    { value: '', label: t('lectures.allThemes') },
    ...LECTURE_CATEGORIES.map((c) => ({
      value: c,
      label: t(`lectureCategories.${c}`),
    })),
  ]

  useEffect(() => {
    // No-op: useFilteredList already wires fetching.
  }, [hasActiveFilters])

  return (
    <AppLayout>
      <div className="min-h-[620px]">
        <div className="content-shell flex items-end justify-between py-6 gap-6 flex-wrap max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-4">
          <h1 className="text-[clamp(28px,3.2vw,48px)] font-normal text-black leading-none">
            <span className="text-red">{'//'}</span> {t('lectures.pageTitle')}
          </h1>
          <div className="flex items-center gap-6 max-[1199px]:gap-4 max-[767px]:w-full max-[767px]:flex-wrap max-[767px]:gap-3">
            <FilterDropdown label={t('lectures.sortBy')} options={sortOptions} value={list.filters.sort} onChange={(v) => list.setFilter('sort', v)} />
            <FilterDropdown label={t('lectures.theme')} options={themeOptions} value={list.filters.theme} onChange={(v) => list.setFilter('theme', v)} />
            <div className="flex items-center gap-3 border border-black px-4 py-2 min-w-[160px] max-[767px]:flex-1 max-[767px]:min-w-[120px]">
              <input
                type="text"
                placeholder={t('lectures.search')}
                value={list.filters.search}
                onChange={(e) => list.setFilter('search', e.target.value)}
                className="flex-1 border-none bg-transparent font-sans text-[clamp(14px,1.3vw,20px)] text-black outline-none placeholder:text-black placeholder:opacity-50"
              />
              <SearchIcon />
            </div>
          </div>
        </div>

        <main className="content-shell border-t border-black">
          {loading ? (
            <LecturesLoadingGrid />
          ) : lectures.length === 0 ? (
            <p className="py-12 text-[clamp(16px,1.6vw,24px)] text-center opacity-60">{t('lectures.noResults')}</p>
          ) : (
            <LectureGrid lectures={lectures} textLoading={textRefreshing} />
          )}
        </main>

        {loading ? (
          <div className="content-shell py-10 flex justify-center">
            <LoadingBlock className="h-[48px] w-36 border border-black bg-black/10" />
          </div>
        ) : loadingMore ? (
          <div className="content-shell py-10 flex justify-center" aria-live="polite" aria-busy="true">
            <span className="loader" />
          </div>
        ) : (hasMore || total > lectures.length) && (
          <div className="content-shell py-10 flex justify-center">
            <button
              type="button"
              onClick={() => void list.loadMore()}
              className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              {t('lectures.loadMore')}
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
