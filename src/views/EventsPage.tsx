'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import type { Event } from '@/lib/api'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import ChevronIcon from '../components/ChevronIcon'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import LectureCard from '../components/LectureCard'
import { api } from '../lib/api'
import { compareEventDates, formatEventDate, formatEventTime } from '../lib/date-time'
import { useMinimumSkeleton } from '../hooks/useMinimumSkeleton'

type EventSectionProps = {
  event: Event
  isExpanded: boolean
  onToggle: () => void
  detailsLabel: string
  registerLabel: string
}

function EventSection({ event, isExpanded, onToggle, detailsLabel, registerLabel }: EventSectionProps) {
  const registerHref = event.registrationUrl?.trim() || `/events/${event.id}`
  const isExternalRegistration = registerHref.startsWith('http')
  const lectures = event.lectures ?? []

  const registerClassName = "flex h-[69px] w-[clamp(220px,22.7vw,327px)] items-center justify-center gap-[10px] bg-black px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] text-white no-underline transition-opacity duration-200 hover:opacity-85 max-[767px]:w-full"
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
              {event.city} [{formatEventDate(event.date)}]
            </span>
            <span className="text-[clamp(14px,1.3vw,20px)] font-normal">{formatEventTime(event.time)}</span>
          </div>
          <p className="text-[clamp(13px,1.3vw,20px)] font-normal leading-[1.35]">{event.location}</p>
        </div>

        <div className="flex items-center gap-9 max-[1199px]:gap-6 max-[767px]:w-full max-[767px]:flex-col max-[767px]:gap-4">
          <button
            type="button"
            className="flex h-[69px] w-[clamp(220px,22.7vw,327px)] cursor-pointer items-center justify-center gap-[10px] border border-red bg-transparent px-6 py-5 font-sans text-[clamp(14px,1.6vw,24px)] text-black transition-colors duration-200 hover:bg-red hover:text-white max-[767px]:w-full"
            onClick={onToggle}
            aria-expanded={isExpanded}
          >
            <span>{detailsLabel}</span>
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>
          {isExternalRegistration ? (
            <a href={registerHref} target="_blank" rel="noopener noreferrer" className={registerClassName}>
              {registerContent}
            </a>
          ) : (
            <Link href={registerHref} className={registerClassName}>
              {registerContent}
            </Link>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-9 pb-9 max-[1199px]:gap-6 max-[767px]:grid-cols-1">
          {lectures.length > 0 ? (
            lectures.map((lecture) => (
              <LectureCard key={lecture.id} lecture={lecture} variant="event" />
            ))
          ) : (
            <p className="col-span-2 py-8 text-[clamp(14px,1.4vw,20px)] opacity-60 max-[767px]:col-span-1">
              {event.title}
            </p>
          )}
        </div>
      )}
      {!isExpanded && lectures.length > 0 && (
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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(() => {
    let isMounted = true

    api
      .getEvents()
      .then((data) => {
        if (!isMounted) return
        setEvents(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setEvents([])
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
  }, [i18n.language])

  const cities = useMemo(() => [...new Set(events.map((e) => e.city).filter(Boolean))], [events])
  const times = useMemo(() => [...new Set(events.map((e) => e.time).filter(Boolean))].sort(), [events])

  const filteredEvents = useMemo(() => {
    let result = [...events]

    if (cityFilter) {
      result = result.filter((e) => e.city === cityFilter)
    }
    if (timeFilter) {
      result = result.filter((e) => e.time === timeFilter)
    }
    if (sortOrder === 'dateAsc') {
      result.sort((a, b) => {
        return compareEventDates(a.date, b.date)
      })
    } else if (sortOrder === 'dateDesc') {
      result.sort((a, b) => {
        return compareEventDates(b.date, a.date)
      })
    }

    return result
  }, [cityFilter, timeFilter, sortOrder, events])

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const sortOptions = [
    { value: '', label: t('events.sortBy') },
    { value: 'dateDesc', label: t('events.dateDesc') },
    { value: 'dateAsc', label: t('events.dateAsc') },
  ]

  const cityOptions = [
    { value: '', label: t('events.allCities') },
    ...cities.map((c) => ({ value: c, label: c })),
  ]

  const timeOptions = [
    { value: '', label: t('events.time') },
    ...times.map((time) => ({ value: time, label: formatEventTime(time) })),
  ]
  const showInitialSkeleton = loading && !hasLoaded
  const skeletonLoading = useMinimumSkeleton(showInitialSkeleton)

  return (
    <div className="page">
      <Navbar />

      <Skeleton name="page-events" loading={skeletonLoading} className="min-h-[620px]">
        <div className="content-shell grid grid-cols-[clamp(220px,22.7vw,327px)_minmax(0,1fr)] gap-9 py-6 max-[1199px]:gap-6 max-[900px]:grid-cols-1 max-[900px]:gap-4">
          <div className="max-[900px]:hidden" />
          <div className="flex min-w-0 flex-col gap-6 px-[clamp(16px,2vw,28px)] max-[900px]:px-0 max-[900px]:gap-4">
            <h1 className="text-[clamp(28px,3.2vw,48px)] font-normal leading-none text-black">
              <span className="text-red">{'//'}</span> {t('events.pageTitle')}
            </h1>
            <div className="flex items-center justify-between gap-6 max-[1199px]:gap-4 max-[767px]:w-full max-[767px]:flex-wrap max-[767px]:gap-3">
            <FilterDropdown label={t('events.sortBy')} options={sortOptions} value={sortOrder} onChange={setSortOrder} />
            <FilterDropdown label={t('events.city')} options={cityOptions} value={cityFilter} onChange={setCityFilter} />
            <FilterDropdown label={t('events.time')} options={timeOptions} value={timeFilter} onChange={setTimeFilter} />
            </div>
          </div>
        </div>

        <main className="content-shell">
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event) => (
              <EventSection
                key={event.id}
                event={event}
                isExpanded={expandedEvents.has(event.id)}
                onToggle={() => toggleEvent(event.id)}
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

        <JoinSection />
        <Footer />
      </Skeleton>
    </div>
  )
}
