import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { events, type EventLecture, type Event } from '../data/events'
import Navbar from '../components/Navbar'
import ArrowIcon from '../components/ArrowIcon'
import ChevronIcon from '../components/ChevronIcon'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import './EventsPage.css'

type EventLectureCardProps = EventLecture & {
  isHovered?: boolean
}

function EventLectureCard({
  id, title, author, category, categoryColor, image, summary,
  isHovered = false,
}: EventLectureCardProps) {
  const [hovered, setHovered] = useState(false)
  const showHoverState = isHovered || hovered

  const colorMap: Record<string, string> = {
    orange: 'var(--color-orange)',
    green: 'var(--color-green)',
    blue: 'var(--color-blue)',
    red: 'var(--color-red)',
  }
  const bgColor = colorMap[categoryColor] || 'var(--color-red)'
  const hasImage = image && image.length > 0

  return (
    <Link
      to={`/lectures/${id}`}
      className={`event-lecture-card ${showHoverState ? 'event-lecture-card--hovered' : ''}`}
      style={showHoverState ? { backgroundColor: bgColor } : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="event-lecture-card__thumbnail-container">
        {hasImage ? (
          <img src={image} alt={title} className="event-lecture-card__thumbnail" />
        ) : (
          <div
            className="event-lecture-card__thumbnail event-lecture-card__thumbnail--solid"
            style={{ backgroundColor: bgColor }}
          />
        )}
        <span
          className={`event-lecture-card__badge ${showHoverState ? 'event-lecture-card__badge--filled' : ''}`}
          style={{
            borderColor: bgColor,
            backgroundColor: showHoverState ? bgColor : 'var(--color-white)',
          }}
        >
          {category}
        </span>
      </div>
      <div className="event-lecture-card__content">
        <div className="event-lecture-card__info">
          <p className="event-lecture-card__title">{title}</p>
          <p className="event-lecture-card__author">{author}</p>
        </div>
        <p className="event-lecture-card__summary">{summary}</p>
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
    <div className="event-section">
      <div className="event-section__divider" />

      <div className="event-section__header">
        <div className="event-section__info">
          <div className="event-section__meta">
            <span className="event-section__city">{event.city} [{event.date}]</span>
            <span className="event-section__time">{event.time}</span>
          </div>
          <p className="event-section__location">{event.location}</p>
        </div>

        <div className="event-section__actions">
          <button className="event-section__details-btn" onClick={onToggle}>
            <span>{detailsLabel}</span>
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>
          <Link to={`/events/${event.id}`} className="event-section__register-btn">
            <span>{registerLabel}</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>

      {isExpanded && (
        <div className="event-section__lectures">
          {event.lectures.map((lecture) => (
            <EventLectureCard key={lecture.id} {...lecture} />
          ))}
        </div>
      )}
    </div>
  )
}

export default function EventsPage() {
  const { t } = useTranslation()
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(['lviv-2024-05']))
  const [sortOrder, setSortOrder] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState('')

  const cities = useMemo(() => [...new Set(events.map((e) => e.city))], [])
  const times = useMemo(() => [...new Set(events.map((e) => e.time))].sort(), [])

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
  }, [cityFilter, timeFilter, sortOrder])

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
    <div className="page events-page">
      <Navbar />

      <div className="events-header">
        <h1 className="events-header__title">
          <span className="events-header__title-accent">//</span> {t('events.pageTitle')}
        </h1>
        <div className="events-header__filters">
          <FilterDropdown label={t('events.sortBy')} options={sortOptions} value={sortOrder} onChange={setSortOrder} />
          <FilterDropdown label={t('events.city')} options={cityOptions} value={cityFilter} onChange={setCityFilter} />
          <FilterDropdown label={t('events.time')} options={timeOptions} value={timeFilter} onChange={setTimeFilter} />
        </div>
      </div>

      <main className="events-content">
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
        <div className="event-section__divider" />
      </main>

      <JoinSection />
      <Footer />
    </div>
  )
}
