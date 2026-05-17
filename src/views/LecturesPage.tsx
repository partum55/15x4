'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Lecture } from '@/lib/api'
import Navbar from '../components/Navbar'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import LectureCard from '../components/LectureCard'
import { api } from '../lib/api'
import { LECTURE_CATEGORIES } from '../constants/lectureCategories'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'

const LECTURES_PAGE_SIZE = 20
const LECTURES_FILTER_STORAGE_KEY = '15x4:lectures:filters'

type StoredLectureFilters = {
  searchQuery?: string
  sortBy?: string
  themeFilter?: string
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function LecturesPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'uk'
  const previousLocaleRef = useRef(locale)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [themeFilter, setThemeFilter] = useState('')
  const [filtersReady, setFiltersReady] = useState(false)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [textRefreshing, setTextRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LECTURES_FILTER_STORAGE_KEY)
      const stored = raw ? (JSON.parse(raw) as StoredLectureFilters) : null
      if (stored?.searchQuery) {
        setSearchQuery(stored.searchQuery)
        setDebouncedSearchQuery(stored.searchQuery.trim())
      }
      if (stored?.sortBy) setSortBy(stored.sortBy)
      if (stored?.themeFilter) setThemeFilter(stored.themeFilter)
    } catch {
      // Ignore invalid persisted filters.
    } finally {
      setFiltersReady(true)
    }
  }, [])

  useEffect(() => {
    if (!filtersReady) return
    window.localStorage.setItem(
      LECTURES_FILTER_STORAGE_KEY,
      JSON.stringify({ searchQuery, sortBy, themeFilter }),
    )
  }, [filtersReady, searchQuery, sortBy, themeFilter])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    if (!filtersReady) return
    let isMounted = true
    setLoading(true)

    api
      .getLecturesPage({
        limit: LECTURES_PAGE_SIZE,
        offset: 0,
        search: debouncedSearchQuery,
        category: themeFilter,
        sort: sortBy,
      })
      .then((data) => {
        if (!isMounted) return
        setLectures(Array.isArray(data.items) ? data.items : [])
        setHasMore(Boolean(data.hasMore))
        setTotal(Number(data.total ?? 0))
      })
      .catch(() => {
        if (!isMounted) return
        setLectures([])
        setHasMore(false)
        setTotal(0)
      })
      .finally(() => {
        if (isMounted) {
          setHasLoaded(true)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [filtersReady, debouncedSearchQuery, sortBy, themeFilter])

  useEffect(() => {
    const previousLocale = previousLocaleRef.current
    if (previousLocale === locale) return
    previousLocaleRef.current = locale
    if (!filtersReady || !hasLoaded) return

    let isMounted = true
    setTextRefreshing(true)

    api
      .getLecturesPage({
        limit: Math.max(lectures.length, LECTURES_PAGE_SIZE),
        offset: 0,
        search: debouncedSearchQuery,
        category: themeFilter,
        sort: sortBy,
      })
      .then((data) => {
        if (!isMounted) return
        setLectures(Array.isArray(data.items) ? data.items : [])
        setHasMore(Boolean(data.hasMore))
        setTotal(Number(data.total ?? 0))
      })
      .catch(() => {
        if (!isMounted) return
        setHasMore(total > lectures.length)
      })
      .finally(() => {
        if (isMounted) setTextRefreshing(false)
      })

    return () => {
      isMounted = false
    }
  }, [locale, filtersReady, hasLoaded, lectures.length, debouncedSearchQuery, sortBy, themeFilter, total])

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const data = await api.getLecturesPage({
        limit: LECTURES_PAGE_SIZE,
        offset: lectures.length,
        search: debouncedSearchQuery,
        category: themeFilter,
        sort: sortBy,
      })
      setLectures((current) => [...current, ...(Array.isArray(data.items) ? data.items : [])])
      setHasMore(Boolean(data.hasMore))
      setTotal(Number(data.total ?? 0))
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const hasActiveFilters = !!(debouncedSearchQuery || sortBy || themeFilter)
  const showInitialSkeleton = loading && !hasLoaded
  const skeletonLoading = useMinimumSkeleton(showInitialSkeleton)
  const textSkeletonLoading = useMinimumSkeleton(textRefreshing, 350)

  const sortOptions = [
    { value: '', label: t('lectures.sortBy') },
    { value: 'titleAZ', label: t('lectures.titleAZ') },
    { value: 'titleZA', label: t('lectures.titleZA') },
  ]

  const themeOptions = [
    { value: '', label: t('lectures.allThemes') },
    ...LECTURE_CATEGORIES.map((c) => ({
      value: c,
      label: t(`lectureCategories.${c}`, { defaultValue: c }),
    })),
  ]

  const renderTwoColumnRows = (items: Lecture[], keyPrefix: string) => {
    const rows: React.ReactNode[] = []

    for (let i = 0; i < items.length; i += 2) {
      const left = items[i]
      const right = items[i + 1]

      rows.push(
        <div key={`${keyPrefix}-${i}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <LectureCard lecture={left} variant="horizontal" textLoading={textSkeletonLoading} />
          {right && (
            <>
              <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
              <LectureCard lecture={right} variant="horizontal" textLoading={textSkeletonLoading} />
            </>
          )}
        </div>,
      )
    }

    return rows
  }

  /* Default fancy layout matching Figma */
  const renderDefaultGrid = () => {
    if (lectures.length === 0) return null
    const rows: React.ReactNode[] = []
    let idx = 0

    while (idx < lectures.length) {
      if (idx + 2 > lectures.length) break
      rows.push(
        <div key={`row-horizontal-a-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <LectureCard lecture={lectures[idx]} variant="horizontal" textLoading={textSkeletonLoading} />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <LectureCard lecture={lectures[idx + 1]} variant="horizontal" textLoading={textSkeletonLoading} />
        </div>,
      )
      idx += 2

      if (idx + 2 > lectures.length) break
      rows.push(
        <div key={`row-compact-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <LectureCard lecture={lectures[idx]} variant="compact" textLoading={textSkeletonLoading} />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <LectureCard lecture={lectures[idx + 1]} variant="compact" textLoading={textSkeletonLoading} />
        </div>,
      )
      idx += 2

      if (idx + 2 > lectures.length) break
      rows.push(
        <div key={`row-horizontal-b-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <LectureCard lecture={lectures[idx]} variant="horizontal" textLoading={textSkeletonLoading} />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <LectureCard lecture={lectures[idx + 1]} variant="horizontal" textLoading={textSkeletonLoading} />
        </div>,
      )
      idx += 2

      if (idx + 3 > lectures.length) break
      rows.push(
        <div key={`row-featured-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <LectureCard lecture={lectures[idx]} variant="vertical" textLoading={textSkeletonLoading} />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <LectureCard lecture={lectures[idx + 1]} variant="featured" textLoading={textSkeletonLoading} />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <LectureCard lecture={lectures[idx + 2]} variant="vertical" textLoading={textSkeletonLoading} />
        </div>,
      )
      idx += 3

      if (idx + 1 > lectures.length) break
      rows.push(
        <div key={`row-wide-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <LectureCard lecture={lectures[idx]} variant="horizontal" textLoading={textSkeletonLoading} />
        </div>,
      )
      idx += 1
    }

    if (idx < lectures.length) {
      rows.push(...renderTwoColumnRows(lectures.slice(idx), `row-rest-${idx}`))
    }

    return rows
  }

  /* Simple 2-column grid for filtered results */
  const renderFilteredGrid = () => {
    if (lectures.length === 0) {
      return (
        <p className="py-12 text-[clamp(16px,1.6vw,24px)] text-center opacity-60">{t('lectures.noResults')}</p>
      )
    }

    return renderTwoColumnRows(lectures, 'filtered')
  }

  const renderLoadingGrid = () => (
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

  return (
    <div className="page">
      <Navbar />

      <div className="min-h-[620px]">
        <div className="content-shell flex items-end justify-between py-6 gap-6 flex-wrap max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-4">
          <h1 className="text-[clamp(28px,3.2vw,48px)] font-normal text-black leading-none">
            <span className="text-red">{'//'}</span> {t('lectures.pageTitle')}
          </h1>
          <div className="flex items-center gap-6 max-[1199px]:gap-4 max-[767px]:w-full max-[767px]:flex-wrap max-[767px]:gap-3">
            <FilterDropdown label={t('lectures.sortBy')} options={sortOptions} value={sortBy} onChange={setSortBy} />
            <FilterDropdown label={t('lectures.theme')} options={themeOptions} value={themeFilter} onChange={setThemeFilter} />
            <div className="flex items-center gap-3 border border-black px-4 py-2 min-w-[160px] max-[767px]:flex-1 max-[767px]:min-w-[120px]">
              <input
                type="text"
                placeholder={t('lectures.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 border-none bg-transparent font-sans text-[clamp(14px,1.3vw,20px)] text-black outline-none placeholder:text-black placeholder:opacity-50"
              />
              <SearchIcon />
            </div>
          </div>
        </div>

        <main className="content-shell border-t border-black">
          {skeletonLoading ? renderLoadingGrid() : hasActiveFilters ? renderFilteredGrid() : renderDefaultGrid()}
        </main>

        {skeletonLoading ? (
          <div className="content-shell py-10 flex justify-center">
            <div className="h-[48px] w-36 animate-pulse border border-black bg-black/10" />
          </div>
        ) : loadingMore ? (
          <div className="content-shell py-10 flex justify-center" aria-live="polite" aria-busy="true">
            <span className="loader" />
          </div>
        ) : (hasMore || total > lectures.length) && (
          <div className="content-shell py-10 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              {t('lectures.loadMore')}
            </button>
          </div>
        )}

        <JoinSection />
        <Footer />
      </div>
    </div>
  )
}
