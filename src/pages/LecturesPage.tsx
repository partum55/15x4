import { useState } from 'react'
import { Link } from 'react-router-dom'
import { lectures, type Lecture } from '../data/lectures'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import './LecturesPage.css'

type CardVariant = 'horizontal' | 'compact' | 'vertical' | 'featured'

type ArchiveLectureCardProps = Lecture & {
  variant?: CardVariant
}

function ArchiveLectureCard({ 
  id, 
  category, 
  categoryColor, 
  author, 
  image, 
  title, 
  summary,
  variant = 'horizontal'
}: ArchiveLectureCardProps) {
  const badgeColorMap: Record<string, string> = {
    orange: 'var(--color-orange)',
    green: 'var(--color-green)',
    blue: 'var(--color-blue)',
    red: 'var(--color-red)',
  }
  const borderColor = badgeColorMap[categoryColor] || 'var(--color-red)'

  if (variant === 'compact') {
    return (
      <Link to={`/lectures/${id}`} className="archive-card archive-card--compact">
        <div className="archive-card__thumbnail-container">
          <div 
            className="archive-card__thumbnail archive-card__thumbnail--solid"
            style={{ backgroundColor: 'var(--color-red)' }}
          />
          <span 
            className="archive-card__badge" 
            style={{ borderColor }}
          >
            {category}
          </span>
        </div>
        <div className="archive-card__info archive-card__info--compact">
          <p className="archive-card__title">{title}</p>
          <p className="archive-card__author">{author}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'vertical') {
    return (
      <Link to={`/lectures/${id}`} className="archive-card archive-card--vertical">
        <div className="archive-card__thumbnail-container">
          <div 
            className="archive-card__thumbnail archive-card__thumbnail--solid archive-card__thumbnail--small"
            style={{ backgroundColor: 'var(--color-red)' }}
          />
          <span 
            className="archive-card__badge" 
            style={{ borderColor }}
          >
            {category}
          </span>
        </div>
        <div className="archive-card__info">
          <p className="archive-card__title">{title}</p>
          <p className="archive-card__author">{author}</p>
        </div>
        <p className="archive-card__summary">{summary}</p>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link to={`/lectures/${id}`} className="archive-card archive-card--featured">
        <div className="archive-card__info archive-card__info--featured">
          <p className="archive-card__title">{title}</p>
          <p className="archive-card__author">{author}</p>
        </div>
        <div className="archive-card__thumbnail-container archive-card__thumbnail-container--featured">
          <img 
            src={image} 
            alt={title} 
            className="archive-card__thumbnail archive-card__thumbnail--featured"
          />
          <span 
            className="archive-card__badge" 
            style={{ borderColor }}
          >
            {category}
          </span>
        </div>
      </Link>
    )
  }

  // Default: horizontal layout
  return (
    <Link to={`/lectures/${id}`} className="archive-card archive-card--horizontal">
      <div className="archive-card__thumbnail-container">
        <img 
          src={image} 
          alt={title} 
          className="archive-card__thumbnail"
        />
        <span 
          className="archive-card__badge" 
          style={{ borderColor }}
        >
          {category}
        </span>
      </div>
      <div className="archive-card__content">
        <div className="archive-card__info">
          <p className="archive-card__title">{title}</p>
          <p className="archive-card__author">{author}</p>
        </div>
        <p className="archive-card__summary">{summary}</p>
      </div>
    </Link>
  )
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

function ChevronIcon() {
  return (
    <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function LecturesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // Create rows of cards with varying layouts matching the Figma design
  const renderLectureGrid = () => {
    // Row 1: Two horizontal cards
    // Row 2: Two compact cards (no description)
    // Row 3: Two horizontal cards
    // Row 4: Featured wide card + vertical card + vertical card
    // Row 5: Four small vertical cards

    const rows = []
    let lectureIndex = 0

    // Get lecture with fallback cycling
    const getLecture = (index: number) => lectures[index % lectures.length]

    // Row 1: Two horizontal cards
    rows.push(
      <div key="row-1" className="archive-row">
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="horizontal" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="horizontal" />
      </div>
    )

    // Row 2: Two compact cards
    rows.push(
      <div key="row-2" className="archive-row">
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="compact" />
      </div>
    )

    // Row 3: Two horizontal cards
    rows.push(
      <div key="row-3" className="archive-row">
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="horizontal" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="horizontal" />
      </div>
    )

    // Row 4: Featured + vertical + vertical (3 cards)
    rows.push(
      <div key="row-4" className="archive-row archive-row--triple">
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="vertical" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(2)} variant="featured" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="vertical" />
      </div>
    )

    // Row 5: Four small vertical cards
    rows.push(
      <div key="row-5" className="archive-row archive-row--quad">
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...getLecture(lectureIndex++)} variant="compact" />
      </div>
    )

    return rows
  }

  return (
    <div className="page lectures-page">
      {/* Navigation Header */}
      <nav className="archive-nav">
        <Link to="/" className="archive-nav__logo">15x4</Link>
        <div className="archive-nav__links">
          <Link to="/events" className="archive-nav__link">події</Link>
          <Link to="/lectures" className="archive-nav__link archive-nav__link--active">лекції</Link>
          <Link to="/#about" className="archive-nav__link">про нас</Link>
        </div>
      </nav>

      {/* Page Header with Filters */}
      <div className="archive-header">
        <h1 className="archive-header__title">// ЛЕКЦІЇ</h1>
        <div className="archive-header__filters">
          <button className="archive-filter">
            <span>сортувати за</span>
            <ChevronIcon />
          </button>
          <button className="archive-filter">
            <span>тема</span>
            <ChevronIcon />
          </button>
          <div className="archive-search">
            <input 
              type="text" 
              placeholder="пошук"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="archive-search__input"
            />
            <SearchIcon />
          </div>
        </div>
      </div>

      {/* Lectures Grid */}
      <main className="archive-content">
        {renderLectureGrid()}
      </main>

      <JoinSection />
      <Footer />
    </div>
  )
}
