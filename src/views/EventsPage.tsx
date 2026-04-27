'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import type { Event } from '@/lib/api'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import LectureCard from '../components/LectureCard'
import { api } from '../lib/api'
import { formatEventDate, formatEventTime, isEventPast } from '../lib/date-time'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'

const EVENTS_PAGE_SIZE = 10

type EventSectionProps = {
  event: Event
  detailsLabel: string
  registerLabel: string
}

function EventSection({ event, detailsLabel, registerLabel }: EventSectionProps) {
  const lectures = event.lectures ?? []
  const registerHref = event.registrationUrl?.trim()
  const registrationAvailable = Boolean(registerHref) && !isEventPast(event.date, event.time)

  const actionClassName = "flex h-[69px] w-[clamp(220px,22.7vw,327px)] items-center justify-center gap-[10px] px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] no-underline max-[767px]:w-full"
  const registerClassName = `${actionClassName} bg-black text-white transition-opacity duration-200 hover:opacity-85`
  const disabledRegisterClassName = `${actionClassName} cursor-not-allowed border border-black text-black opacity-40`
  const registerContent = (
    <>
      <span>{registerLabel}</span>
      <ArrowIcon />
    </>
  )

  return (
    <section className="border-t border-black">
      <div className="flex items-start justify-between gap-6 py-6 max-[767px]:flex-col max-[767px]:gap-5">
        <div className="flex w-[clamp(220px,22.7vw,327px)] flex-col gap-6 max-[767px]:w-full">
          <div className="flex items-center justify-between gap-6">
            <span className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em]">
              {event.city} [{formatEventDate(event.date, true)}]
            </span>
            <span className="text-[clamp(14px,1.3vw,20px)] font-normal">{formatEventTime(event.time)}</span>
          </div>
          <p className="text-[clamp(13px,1.3vw,20px)] font-normal leading-[1.35]">{event.location}</p>
        </div>

        <div className="flex items-center gap-9 max-[1199px]:gap-6 max-[767px]:w-full max-[767px]:flex-col max-[767px]:gap-4">
          <Link
            href={`/events/${event.id}`}
            className={`${actionClassName} border border-red bg-transparent text-black transition-colors duration-200 hover:bg-red hover:text-white`}
          >
            <span>{detailsLabel}</span>
            <ArrowIcon />
          </Link>
          {registrationAvailable && registerHref ? (
            <a href={registerHref} target="_blank" rel="noopener noreferrer" className={registerClassName}>
              {registerContent}
            </a>
          ) : (
            <span className={disabledRegisterClassName} aria-disabled="true">
              {registerContent}
            </span>
          )}
        </div>
      </div>

      {lectures.length > 0 && (
        <div className="grid grid-cols-2 gap-x-9 gap-y-6 pb-9 max-[1199px]:gap-x-6 max-[767px]:grid-cols-1">
          {lectures.slice(0, 4).map((lecture) => (
            <LectureCard key={lecture.id} lecture={lecture} variant="compact" />
          ))}
        </div>
      )}
    </section>
  )
}

export default function EventsPage() {
  const { t, i18n } = useTranslation()
  const [sortOrder, setSortOrder] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [cityOptionsData, setCityOptionsData] = useState<Array<{ value: string; label: string }>>([])
  const [timeOptionsData, setTimeOptionsData] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)

  useEffect(() => {
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
  }, [i18n.language, cityFilter, timeFilter, sortOrder])

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

  return (
    <div className="page">
      <Navbar />

      <Skeleton name="page-events" loading={skeletonLoading} className="min-h-[620px]">
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
          {events.length > 0 ? (
            events.map((event) => (
              <EventSection
                key={event.id}
                event={event}
                detailsLabel={t('events.details')}
                registerLabel={t('events.register')}
              />
            ))
          ) : (
            <div className="border-t border-black py-12 text-center text-[clamp(16px,1.6vw,24px)] opacity-60">
              {t('events.noResults')}
            </div>
          )}
          <div className="h-px w-full bg-black" />
        </main>

        {(hasMore || total > events.length) && (
          <div className="content-shell py-10 flex justify-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="px-8 py-3 border border-black bg-transparent text-black font-sans text-[clamp(13px,1.2vw,18px)] uppercase cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white disabled:cursor-wait disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-black"
            >
              {loadingMore ? <span className="loader" /> : t('events.loadMore')}
            </button>
          </div>
        )}

        <JoinSection />
        <Footer />
      </Skeleton>
    </div>
  )
}
