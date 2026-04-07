'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { Skeleton } from 'boneyard-js/react'
import type { Lecture } from '@/lib/api'
import Navbar from '../components/Navbar'
import FilterDropdown from '../components/FilterDropdown'
import JoinSection from '../components/JoinSection'
import Footer from '../components/Footer'
import { api } from '../lib/api'
import { CATEGORY_COLOR_VAR } from '../constants/colors'

type CardVariant = 'horizontal' | 'compact' | 'vertical' | 'featured'

type ArchiveLectureCardProps = Lecture & {
  variant?: CardVariant
}

function ArchiveLectureCard({
  id, category, categoryColor, author, image, title, summary,
  variant = 'horizontal',
}: ArchiveLectureCardProps) {
  const borderColor = CATEGORY_COLOR_VAR[categoryColor] || 'var(--color-red)'

  if (variant === 'compact') {
    return (
      <Link
        href={`/lectures/${id}`}
        className="flex-1 no-underline text-inherit cursor-pointer py-6 flex flex-row gap-9 max-[767px]:flex-col max-[767px]:gap-4"
      >
        <div className="relative w-[clamp(200px,22vw,327px)] flex-shrink-0 max-[767px]:w-full">
          <div
            className="w-full h-[clamp(80px,7.5vw,111px)] object-cover block"
            style={{ backgroundColor: borderColor }}
          />
          <span
            className="absolute top-3 left-3 bg-white border-2 px-6 py-2 text-[clamp(13px,1.3vw,20px)] font-normal text-black whitespace-nowrap"
            style={{ borderColor }}
          >
            {category}
          </span>
        </div>
        <div className="flex flex-col gap-[10px] py-6 px-3 max-[767px]:px-0 max-[767px]:py-0">
          <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em] leading-[1.2]">{title}</p>
          <p className="text-[clamp(14px,1.3vw,20px)] font-normal">{author}</p>
        </div>
      </Link>
    )
  }

  if (variant === 'vertical') {
    return (
      <Link
        href={`/lectures/${id}`}
        className="flex-1 no-underline text-inherit cursor-pointer py-6 flex flex-col gap-6 w-[clamp(200px,22vw,327px)] max-[767px]:w-full"
      >
        <div className="relative w-full">
          <div
            className="w-full h-[clamp(80px,9vw,130px)] object-cover block"
            style={{ backgroundColor: borderColor }}
          />
          <span
            className="absolute top-3 left-3 bg-white border-2 px-6 py-2 text-[clamp(13px,1.3vw,20px)] font-normal text-black whitespace-nowrap"
            style={{ borderColor }}
          >
            {category}
          </span>
        </div>
        <div className="flex flex-col gap-[10px]">
          <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em] leading-[1.2]">{title}</p>
          <p className="text-[clamp(14px,1.3vw,20px)] font-normal">{author}</p>
        </div>
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{summary}</p>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/lectures/${id}`}
        className="flex-[2] no-underline text-inherit cursor-pointer py-6 flex flex-col gap-6"
      >
        <div className="flex flex-col gap-3">
          <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em] leading-[1.2]">{title}</p>
          <p className="text-[clamp(14px,1.3vw,20px)] font-normal">{author}</p>
        </div>
        <div className="relative w-full">
          <Image
            src={image}
            alt={title}
            width={1200}
            height={800}
            unoptimized
            className="w-full h-[clamp(200px,22vw,324px)] object-cover block"
          />
          <span
            className="absolute top-3 left-3 bg-white border-2 px-6 py-2 text-[clamp(13px,1.3vw,20px)] font-normal text-black whitespace-nowrap"
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
    <Link
      href={`/lectures/${id}`}
      className="flex-1 no-underline text-inherit cursor-pointer py-6 flex flex-row gap-9 max-[767px]:flex-col max-[767px]:gap-4"
    >
      <div className="relative w-[clamp(200px,22vw,327px)] flex-shrink-0 max-[767px]:w-full">
        <Image
          src={image}
          alt={title}
          width={900}
          height={900}
          unoptimized
          className="w-full h-[clamp(200px,22vw,321px)] object-cover block opacity-50 transition-opacity duration-200 hover:opacity-85 max-[767px]:h-[200px]"
        />
        <span
          className="absolute top-3 left-3 bg-white border-2 px-6 py-2 text-[clamp(13px,1.3vw,20px)] font-normal text-black whitespace-nowrap"
          style={{ borderColor }}
        >
          {category}
        </span>
      </div>
      <div className="flex flex-col gap-6 py-6 px-3 flex-1 max-[767px]:px-0 max-[767px]:py-0">
        <div className="flex flex-col gap-3">
          <p className="text-[clamp(16px,1.6vw,24px)] font-normal uppercase tracking-[-0.04em] leading-[1.2]">{title}</p>
          <p className="text-[clamp(14px,1.3vw,20px)] font-normal">{author}</p>
        </div>
        <p className="text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{summary}</p>
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
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    api
      .getLectures()
      .then((data) => {
        if (!isMounted) return
        setLectures(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!isMounted) return
        setLectures([])
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  const categories = useMemo(() => [...new Set(lectures.map((l) => l.category))], [lectures])

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
  }, [themeFilter, searchQuery, sortBy, lectures])

  const sortOptions = [
    { value: '', label: t('lectures.sortBy') },
    { value: 'titleAZ', label: t('lectures.titleAZ') },
    { value: 'titleZA', label: t('lectures.titleZA') },
  ]

  const themeOptions = [
    { value: '', label: t('lectures.allThemes') },
    ...categories.map((c) => ({ value: c, label: c })),
  ]

  const renderTwoColumnRows = (items: Lecture[], keyPrefix: string) => {
    const rows: React.ReactNode[] = []

    for (let i = 0; i < items.length; i += 2) {
      const left = items[i]
      const right = items[i + 1]

      rows.push(
        <div key={`${keyPrefix}-${i}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <ArchiveLectureCard {...left} variant="horizontal" />
          {right && (
            <>
              <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
              <ArchiveLectureCard {...right} variant="horizontal" />
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
          <ArchiveLectureCard {...lectures[idx]} variant="horizontal" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 1]} variant="horizontal" />
        </div>,
      )
      idx += 2

      if (idx + 2 > lectures.length) break
      rows.push(
        <div key={`row-compact-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <ArchiveLectureCard {...lectures[idx]} variant="compact" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 1]} variant="compact" />
        </div>,
      )
      idx += 2

      if (idx + 2 > lectures.length) break
      rows.push(
        <div key={`row-horizontal-b-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <ArchiveLectureCard {...lectures[idx]} variant="horizontal" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 1]} variant="horizontal" />
        </div>,
      )
      idx += 2

      if (idx + 3 > lectures.length) break
      rows.push(
        <div key={`row-featured-${idx}`} className="flex items-stretch border-b border-black max-[767px]:flex-col">
          <ArchiveLectureCard {...lectures[idx]} variant="vertical" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 1]} variant="featured" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 2]} variant="vertical" />
        </div>,
      )
      idx += 3

      if (idx + 4 > lectures.length) break
      rows.push(
        <div key={`row-compact-quad-${idx}`} className="flex border-b border-black max-[767px]:flex-col">
          <ArchiveLectureCard {...lectures[idx]} variant="compact" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 1]} variant="compact" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 2]} variant="compact" />
          <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />
          <ArchiveLectureCard {...lectures[idx + 3]} variant="compact" />
        </div>,
      )
      idx += 4
    }

    if (idx < lectures.length) {
      rows.push(...renderTwoColumnRows(lectures.slice(idx), `row-rest-${idx}`))
    }

    return rows
  }

  /* Simple 2-column grid for filtered results */
  const renderFilteredGrid = () => {
    if (filteredLectures.length === 0) {
      return (
        <p className="py-12 text-[clamp(16px,1.6vw,24px)] text-center opacity-60">{t('lectures.noResults')}</p>
      )
    }

    return renderTwoColumnRows(filteredLectures, 'filtered')
  }

  return (
    <div className="page">
      <Navbar />

      <Skeleton name="page-lectures" loading={loading}>
        <div className="flex items-end justify-between px-[clamp(16px,3.2vw,48px)] py-6 gap-6 flex-wrap max-[767px]:flex-col max-[767px]:items-start max-[767px]:gap-4">
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

        <main className="px-[clamp(16px,3.2vw,48px)] border-t border-black">
          {hasActiveFilters ? renderFilteredGrid() : renderDefaultGrid()}
        </main>

        <JoinSection />
        <Footer />
      </Skeleton>
    </div>
  )
}
