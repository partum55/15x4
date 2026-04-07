import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { lectures, type Lecture } from '../data/lectures'
import Navbar from '../components/Navbar'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import './LecturesPage.css'

type CardVariant = 'horizontal' | 'compact' | 'vertical' | 'featured'

type ArchiveLectureCardProps = Lecture & {
  variant?: CardVariant
}

function ArchiveLectureCard({
  id, category, categoryColor, author, image, title, summary,
  variant = 'horizontal',
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
            style={{ backgroundColor: borderColor }}
          />
          <span className="archive-card__badge" style={{ borderColor }}>{category}</span>
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
            style={{ backgroundColor: borderColor }}
          />
          <span className="archive-card__badge" style={{ borderColor }}>{category}</span>
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
          <img src={image} alt={title} className="archive-card__thumbnail archive-card__thumbnail--featured" />
          <span className="archive-card__badge" style={{ borderColor }}>{category}</span>
        </div>
      </Link>
    )
  }

  // Default: horizontal layout
  return (
    <Link to={`/lectures/${id}`} className="archive-card archive-card--horizontal">
      <div className="archive-card__thumbnail-container">
        <img src={image} alt={title} className="archive-card__thumbnail" />
        <span className="archive-card__badge" style={{ borderColor }}>{category}</span>
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
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16L20 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export default function LecturesPage() {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('')
  const [themeFilter, setThemeFilter] = useState('')

  const categories = useMemo(() => [...new Set(lectures.map((l) => l.category))], [])

  const hasActiveFilters = !!(searchQuery || sortBy || themeFilter)

  const filteredLectures = useMemo(() => {
    let result = [...lectures]

    if (themeFilter) {
      result = result.filter((l) => l.category === themeFilter)
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (l) => l.title.toLowerCase().includes(q) || l.author.toLowerCase().includes(q),
      )
    }
    if (sortBy === 'titleAZ') {
      result.sort((a, b) => a.title.localeCompare(b.title, 'uk'))
    } else if (sortBy === 'titleZA') {
      result.sort((a, b) => b.title.localeCompare(a.title, 'uk'))
    }

    return result
  }, [themeFilter, searchQuery, sortBy])

  const sortOptions = [
    { value: '', label: t('lectures.sortBy') },
    { value: 'titleAZ', label: t('lectures.titleAZ') },
    { value: 'titleZA', label: t('lectures.titleZA') },
  ]

  const themeOptions = [
    { value: '', label: t('lectures.allThemes') },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  /* Default fancy layout matching Figma */
  const renderDefaultGrid = () => {
    const rows: React.ReactNode[] = []
    let idx = 0
    const get = (i: number): Lecture => lectures[i % lectures.length]

    // Row 1: Two horizontal
    rows.push(
      <div key="row-1" className="archive-row">
        <ArchiveLectureCard {...get(idx++)} variant="horizontal" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="horizontal" />
      </div>,
    )

    // Row 2: Two compact
    rows.push(
      <div key="row-2" className="archive-row">
        <ArchiveLectureCard {...get(idx++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="compact" />
      </div>,
    )

    // Row 3: Two horizontal
    rows.push(
      <div key="row-3" className="archive-row">
        <ArchiveLectureCard {...get(idx++)} variant="horizontal" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="horizontal" />
      </div>,
    )

    // Row 4: vertical + featured + vertical
    rows.push(
      <div key="row-4" className="archive-row archive-row--triple">
        <ArchiveLectureCard {...get(idx++)} variant="vertical" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(2)} variant="featured" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="vertical" />
      </div>,
    )

    // Row 5: Four compact
    rows.push(
      <div key="row-5" className="archive-row archive-row--quad">
        <ArchiveLectureCard {...get(idx++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="compact" />
        <div className="archive-row__separator" />
        <ArchiveLectureCard {...get(idx++)} variant="compact" />
      </div>,
    )

    return rows
  }

  /* Simple 2-column grid for filtered results */
  const renderFilteredGrid = () => {
    if (filteredLectures.length === 0) {
      return <p className="archive-no-results">{t('lectures.noResults')}</p>
    }

    const rows: React.ReactNode[] = []
    for (let i = 0; i < filteredLectures.length; i += 2) {
      const left = filteredLectures[i]
      const right = filteredLectures[i + 1]
      rows.push(
        <div key={`filtered-${i}`} className="archive-row">
          <ArchiveLectureCard {...left} variant="horizontal" />
          {right && (
            <>
              <div className="archive-row__separator" />
              <ArchiveLectureCard {...right} variant="horizontal" />
            </>
          )}
        </div>,
      )
    }
    return rows
  }

  return (
    <div className="page lectures-page">
      <Navbar />

      <div className="archive-header">
        <h1 className="archive-header__title">
          <span className="archive-header__title-accent">//</span> {t('lectures.pageTitle')}
        </h1>
        <div className="archive-header__filters">
          <FilterDropdown label={t('lectures.sortBy')} options={sortOptions} value={sortBy} onChange={setSortBy} />
          <FilterDropdown label={t('lectures.theme')} options={themeOptions} value={themeFilter} onChange={setThemeFilter} />
          <div className="archive-search">
            <input
              type="text"
              placeholder={t('lectures.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="archive-search__input"
            />
            <SearchIcon />
          </div>
        </div>
      </div>

      <main className="archive-content">
        {hasActiveFilters ? renderFilteredGrid() : renderDefaultGrid()}
      </main>

      <JoinSection />
      <Footer />
    </div>
  )
}
