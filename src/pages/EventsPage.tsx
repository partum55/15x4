import { useState } from 'react'
import { Link } from 'react-router-dom'
import { events, type EventLecture, type Event } from '../data/events'
import ArrowIcon from '../components/ArrowIcon'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import './EventsPage.css'

type EventLectureCardProps = EventLecture & {
  isHovered?: boolean
}

function EventLectureCard({ 
  id, 
  title, 
  author, 
  category, 
  categoryColor, 
  image, 
  summary,
  isHovered = false
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
          <img 
            src={image} 
            alt={title} 
            className="event-lecture-card__thumbnail"
          />
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
            backgroundColor: showHoverState ? bgColor : 'var(--color-white)'
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

function ChevronIcon({ direction = 'down' }: { direction?: 'down' | 'up' }) {
  return (
    <svg 
      width="12" 
      height="8" 
      viewBox="0 0 12 8" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{ transform: direction === 'up' ? 'rotate(180deg)' : undefined }}
    >
      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

type EventSectionProps = {
  event: Event
  isExpanded: boolean
  onToggle: () => void
}

function EventSection({ event, isExpanded, onToggle }: EventSectionProps) {
  return (
    <div className="event-section">
      <div className="event-section__divider" />
      
      {/* Event Header Row */}
      <div className="event-section__header">
        <div className="event-section__info">
          <div className="event-section__meta">
            <span className="event-section__city">{event.city} [{event.date}]</span>
            <span className="event-section__time">{event.time}</span>
          </div>
          <p className="event-section__location">{event.location}</p>
        </div>
        
        <div className="event-section__actions">
          <button 
            className="event-section__details-btn"
            onClick={onToggle}
          >
            <span>детальніше</span>
            <ChevronIcon direction={isExpanded ? 'up' : 'down'} />
          </button>
          <Link to={`/events/${event.id}`} className="event-section__register-btn">
            <span>реєстрація</span>
            <ArrowIcon />
          </Link>
        </div>
      </div>

      {/* Lectures Grid */}
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
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set(['lviv-2024-05']))

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  return (
    <div className="page events-page">
      {/* Navigation Header */}
      <nav className="events-nav">
        <Link to="/" className="events-nav__logo">15x4</Link>
        <div className="events-nav__links">
          <Link to="/events" className="events-nav__link events-nav__link--active">події</Link>
          <Link to="/lectures" className="events-nav__link">лекції</Link>
          <Link to="/#about" className="events-nav__link">про нас</Link>
        </div>
      </nav>

      {/* Page Header with Filters */}
      <div className="events-header">
        <h1 className="events-header__title">// ПОДІЇ</h1>
        <div className="events-header__filters">
          <button className="events-filter">
            <span>сортувати за</span>
            <ChevronIcon />
          </button>
          <button className="events-filter">
            <span>місто</span>
            <ChevronIcon />
          </button>
          <button className="events-filter">
            <span>час</span>
            <ChevronIcon />
          </button>
        </div>
      </div>

      {/* Events List */}
      <main className="events-content">
        {events.map((event) => (
          <EventSection 
            key={event.id} 
            event={event}
            isExpanded={expandedEvents.has(event.id)}
            onToggle={() => toggleEvent(event.id)}
          />
        ))}
        <div className="event-section__divider" />
      </main>

      <JoinSection />
      <Footer />
    </div>
  )
}
