'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import type { Event } from '@/lib/api'
import Navbar from '../components/Navbar'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import EventSection from '../components/EventSection'
import { api } from '../lib/api'
import { formatEventTime } from '../lib/date-time'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'

const EVENTS_PAGE_SIZE = 10
const EVENTS_FILTER_STORAGE_KEY = '15x4:events:filters'

type StoredEventFilters = {
  sortOrder?: string
  cityFilter?: string
  timeFilter?: string
}

function LoadingBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-black/10 ${className}`} />
}

export default function EventsPage() {
  const { t, i18n } = useTranslation()
  const locale = i18n.language.startsWith('en') ? 'en' : 'uk'
  const previousLocaleRef = useRef(locale)
  const [sortOrder, setSortOrder] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')
  const [filtersReady, setFiltersReady] = useState(false)
  const [events, setEvents] = useState<Event[]>([])
  const [cityOptionsData, setCityOptionsData] = useState<Array<{ value: string; label: string }>>([])
  const [timeOptionsData, setTimeOptionsData] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [textRefreshing, setTextRefreshing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(EVENTS_FILTER_STORAGE_KEY)
      const stored = raw ? (JSON.parse(raw) as StoredEventFilters) : null
      if (stored?.sortOrder) setSortOrder(stored.sortOrder)
      if (stored?.cityFilter) setCityFilter(stored.cityFilter)
      if (stored?.timeFilter) setTimeFilter(stored.timeFilter)
    } catch {
      // Ignore invalid persisted filters.
    } finally {
      setFiltersReady(true)
    }
  }, [])

  useEffect(() => {
    if (!filtersReady) return
    window.localStorage.setItem(
      EVENTS_FILTER_STORAGE_KEY,
      JSON.stringify({ sortOrder, cityFilter, timeFilter }),
    )
  }, [filtersReady, sortOrder, cityFilter, timeFilter])

  useEffect(() => {
    if (!filtersReady) return
    let isMounted = true
    setLoading(true)

    api
      .getEventsPage({
        limit: EVENTS_PAGE_SIZE,
        offset: 0,
        city: cityFilter,
        time: timeFilter,
        sort: sortOrder,
      })
      .then((data) => {
        if (!isMounted) return
        setEvents(Array.isArray(data.items) ? data.items : [])
        setCityOptionsData(Array.isArray(data.cities) ? data.cities : [])
        setTimeOptionsData(Array.isArray(data.times) ? data.times : [])
        setHasMore(Boolean(data.hasMore))
        setTotal(Number(data.total ?? 0))
      })
      .catch(() => {
        if (!isMounted) return
        setEvents([])
        setCityOptionsData([])
        setTimeOptionsData([])
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
  }, [filtersReady, cityFilter, timeFilter, sortOrder])

  useEffect(() => {
    const previousLocale = previousLocaleRef.current
    if (previousLocale === locale) return
    previousLocaleRef.current = locale
    if (!filtersReady || !hasLoaded) return

    let isMounted = true
    setTextRefreshing(true)

    api
      .getEventsPage({
        limit: Math.max(events.length, EVENTS_PAGE_SIZE),
        offset: 0,
        city: cityFilter,
        time: timeFilter,
        sort: sortOrder,
      })
      .then((data) => {
        if (!isMounted) return
        setEvents(Array.isArray(data.items) ? data.items : [])
        setCityOptionsData(Array.isArray(data.cities) ? data.cities : [])
        setTimeOptionsData(Array.isArray(data.times) ? data.times : [])
        setHasMore(Boolean(data.hasMore))
        setTotal(Number(data.total ?? 0))
      })
      .catch(() => {
        if (!isMounted) return
        setHasMore(total > events.length)
      })
      .finally(() => {
        if (isMounted) setTextRefreshing(false)
      })

    return () => {
      isMounted = false
    }
  }, [locale, filtersReady, hasLoaded, events.length, cityFilter, timeFilter, sortOrder, total])

  async function handleLoadMore() {
    setLoadingMore(true)
    try {
      const data = await api.getEventsPage({
        limit: EVENTS_PAGE_SIZE,
        offset: events.length,
        city: cityFilter,
        time: timeFilter,
        sort: sortOrder,
      })
      setEvents((current) => [...current, ...(Array.isArray(data.items) ? data.items : [])])
      setCityOptionsData(Array.isArray(data.cities) ? data.cities : [])
      setTimeOptionsData(Array.isArray(data.times) ? data.times : [])
      setHasMore(Boolean(data.hasMore))
      setTotal(Number(data.total ?? 0))
    } catch {
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  const sortOptions = [
    { value: '', label: t('events.sortBy') },
    { value: 'dateDesc', label: t('events.dateDesc') },
    { value: 'dateAsc', label: t('events.dateAsc') },
  ]

  const cityOptions = [
    { value: '', label: t('events.allCities') },
    ...cityOptionsData,
  ]

  const timeOptions = [
    { value: '', label: t('events.time') },
    ...timeOptionsData.map((time) => ({ value: time.value, label: formatEventTime(time.value) || time.label })),
  ]
  const showInitialSkeleton = loading && !hasLoaded
  const skeletonLoading = useMinimumSkeleton(showInitialSkeleton)
  const refreshSkeletonLoading = useMinimumSkeleton(loading && hasLoaded, 350)
  const listSkeletonLoading = skeletonLoading || refreshSkeletonLoading
  const textSkeletonLoading = useMinimumSkeleton(textRefreshing, 350)

  return (
    <div className="page">
      <Navbar />

      <div className="min-h-[620px]">
        <div className="content-shell grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-end gap-6 py-6 max-[1199px]:gap-4 max-[900px]:grid-cols-1 max-[900px]:gap-4">
          <div className="grid grid-cols-[clamp(220px,22.7vw,327px)_minmax(0,1fr)] items-end gap-6 max-[1199px]:gap-4 max-[900px]:grid-cols-1">
            <h1 className="col-start-2 px-[clamp(16px,2vw,28px)] text-[clamp(28px,3.2vw,48px)] font-normal leading-none text-black max-[900px]:col-start-auto max-[900px]:px-0">
              <span className="text-red">{'//'}</span> {t('events.pageTitle')}
            </h1>
          </div>
          <div className="flex items-end justify-between gap-6 max-[1199px]:gap-4 max-[767px]:flex-col max-[767px]:items-stretch">
            <FilterDropdown label={t('events.sortBy')} options={sortOptions} value={sortOrder} onChange={setSortOrder} />
            <FilterDropdown label={t('events.city')} options={cityOptions} value={cityFilter} onChange={setCityFilter} />
            <FilterDropdown label={t('events.time')} options={timeOptions} value={timeFilter} onChange={setTimeFilter} />
          </div>
        </div>

        <main className="content-shell">
          {listSkeletonLoading ? (
            <>
              <EventSection loading />
              <EventSection loading />
              <EventSection loading />
            </>
          ) : events.length > 0 ? (
            events.map((event) => (
              <EventSection
                key={event.id}
                event={event}
                detailsLabel={t('events.details')}
                registerLabel={t('events.register')}
                ongoingLabel={t('events.ongoing')}
                photosLabel={t('events.photos')}
                textLoading={textSkeletonLoading}
              />
            ))
          ) : (
            <div className="border-t border-black py-12 text-center text-[clamp(16px,1.6vw,24px)] opacity-60">
              {t('events.noResults')}
            </div>
          )}
          <div className="h-px w-full bg-black" />
        </main>

        {listSkeletonLoading ? (
          <div className="content-shell flex justify-center py-10">
            <LoadingBlock className="h-[48px] w-36 border border-black bg-transparent" />
          </div>
        ) : loadingMore ? (
          <div className="content-shell py-10 flex justify-center" aria-live="polite" aria-busy="true">
            <span className="loader" />
          </div>
        ) : (hasMore || total > events.length) && (
          <div className="content-shell py-10 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              {t('events.loadMore')}
            </button>
          </div>
        )}

        <JoinSection />
        <Footer />
      </div>
    </div>
  )
}
