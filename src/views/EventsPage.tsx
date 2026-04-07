'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import type { EventLecture, Event } from '../data/events'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import ChevronIcon from '../components/ChevronIcon'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import { api } from '../lib/api'
import { CATEGORY_COLOR_VAR } from '../constants/colors'

type EventLectureCardProps = EventLecture & {
  isHovered?: boolean
}

function EventLectureCard({
  id, title, author, category, categoryColor, image, summary,
  isHovered = false,
}: EventLectureCardProps) {
  const [hovered, setHovered] = useState(false)
  const showHoverState = isHovered || hovered

  const bgColor = CATEGORY_COLOR_VAR[categoryColor] || 'var(--color-red)'
  const hasImage = image && image.length > 0

  return (
    <Link
      href={`/lectures/${id}`}
      className="flex gap-9 no-underline text-inherit transition-colors duration-200 max-[1199px]:gap-6 max-[767px]:flex-col max-[767px]:gap-4"
      style={showHoverState ? { backgroundColor: bgColor } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative w-[clamp(200px,22vw,327px)] flex-shrink-0 max-[767px]:w-full">
        {hasImage ? (
          <Image
            src={image}
            alt={title}
            width={900}
            height={900}
            unoptimized
            className="w-full h-[clamp(200px,22vw,321px)] object-cover block opacity-50 max-[767px]:h-[200px]"
          />
        ) : (
          <div
            className="w-full h-[clamp(80px,7.5vw,111px)] max-[767px]:h-[100px]"
            style={{ backgroundColor: bgColor }}
          />
        )}
        <span
          className="absolute top-3 left-3 bg-white border-2 px-6 py-2 text-[clamp(13px,1.3vw,20px)] font-normal text-black whitespace-nowrap transition-colors duration-200"
          style={{
            borderColor: bgColor,
            backgroundColor: showHoverState ? bgColor : 'var(--color-white)',
          }}
        >
          {category}
        </span>
      </div>
      <div className="flex flex-col gap-9 py-6 px-3 flex-1 max-[767px]:px-0 max-[767px]:py-0">
        <div className="flex flex-col gap-3">
          <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em] leading-[1.2]">{title}</p>
          <p className="text-[clamp(14px,1.3vw,20px)] font-normal">{author}</p>
        </div>
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{summary}</p>
      </div>
    </Link>
  )
}

type EventSectionProps = {
  event: Event
  isExpanded: boolean
  onToggle: () => void
  detailsLabel: string
  registerLabel: string
}

function EventSection({ event, isExpanded, onToggle, detailsLabel, registerLabel }: EventSectionProps) {
  return (
    <div className="flex flex-col gap-9">
      <div className="w-full h-px bg-black" />

      <div className="flex items-start justify-between pt-9 gap-6 flex-wrap max-[767px]:flex-col max-[767px]:gap-6">
        <div className="flex flex-col gap-9">
          <div className="flex items-center justify-between gap-6 min-w-[clamp(200px,22vw,327px)]">
            <span className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em]">{event.city} [{event.date}]</span>
            <span className="text-[clamp(16px,1.6vw,24px)] font-normal">{event.time}</span>
          </div>
          <p className="text-[clamp(14px,1.3vw,20px)] font-normal max-w-[clamp(200px,22vw,327px)] leading-[1.4]">{event.location}</p>
        </div>

        <div className="flex items-center gap-9 max-[1199px]:gap-6 max-[767px]:flex-col max-[767px]:w-full max-[767px]:gap-4">
          <button
            className="flex items-center justify-center gap-[10px] px-6 py-5 border border-red bg-transparent font-sans text-[clamp(16px,1.6vw,24px)] text-black cursor-pointer min-w-[clamp(200px,22vw,327px)] transition-colors duration-200 hover:bg-red hover:text-white max-[767px]:w-full max-[767px]:min-w-0"
            onClick={onToggle}
          >
            <span>{detailsLabel}</span>
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>
          <Link
            href={`/events/${event.id}`}
            className="flex items-center justify-center gap-[10px] px-6 py-5 bg-black font-sans text-[clamp(16px,1.6vw,24px)] text-white no-underline min-w-[clamp(200px,22vw,327px)] transition-opacity duration-200 hover:opacity-85 max-[767px]:w-full max-[767px]:min-w-0"
          >
            <span>{registerLabel}</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>

      {isExpanded && (
        <div className="grid grid-cols-2 gap-9 pb-9 max-[1199px]:gap-6 max-[767px]:grid-cols-1">
            {(event.lectures ?? []).map((lecture) => (
            <EventLectureCard key={lecture.id} {...lecture} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  const { t } = useTranslation()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set())
  const [sortOrder, setSortOrder] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')
  const [events, setEvents] = useState<Event[]>([])

  useEffect(() => {
    api
      .getEvents()
      .then((data) => setEvents(Array.isArray(data) ? data : []))
      .catch(() => setEvents([]))
  }, [])

  const cities = useMemo(() => [...new Set(events.map((e) => e.city))], [events])
  const times = useMemo(() => [...new Set(events.map((e) => e.time))].sort(), [events])

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
        const [da, ma] = a.date.split('/').map(Number)
        const [db, mb] = b.date.split('/').map(Number)
        return ma * 100 + da - (mb * 100 + db)
      })
    } else if (sortOrder === 'dateDesc') {
      result.sort((a, b) => {
        const [da, ma] = a.date.split('/').map(Number)
        const [db, mb] = b.date.split('/').map(Number)
        return mb * 100 + db - (ma * 100 + da)
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
    ...times.map((time) => ({ value: time, label: time })),
  ]

  return (
    <div className="page">
      <Navbar />

      <div className="flex items-end justify-between px-[clamp(16px,3.2vw,48px)] py-6 gap-6 flex-wrap max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-4">
        <h1 className="text-[clamp(28px,3.2vw,48px)] font-normal text-black leading-none">
          <span className="text-red">{'//'}</span> {t('events.pageTitle')}
        </h1>
        <div className="flex items-center gap-6 max-[1199px]:gap-4 max-[767px]:w-full max-[767px]:flex-wrap max-[767px]:gap-3">
          <FilterDropdown label={t('events.sortBy')} options={sortOptions} value={sortOrder} onChange={setSortOrder} />
          <FilterDropdown label={t('events.city')} options={cityOptions} value={cityFilter} onChange={setCityFilter} />
          <FilterDropdown label={t('events.time')} options={timeOptions} value={timeFilter} onChange={setTimeFilter} />
        </div>
      </div>

      <main className="px-[clamp(16px,3.2vw,48px)]">
        {filteredEvents.map((event) => (
          <EventSection
            key={event.id}
            event={event}
            isExpanded={expandedEvents.has(event.id)}
            onToggle={() => toggleEvent(event.id)}
            detailsLabel={t('events.details')}
            registerLabel={t('events.register')}
          />
        ))}
        <div className="w-full h-px bg-black" />
      </main>

      <JoinSection />
      <Footer />
    </div>
  )
}
