'use client'

import { useState } from 'react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useTranslation } from 'react-i18next'
import { CATEGORY_COLOR_VAR } from '../constants/colors'

export type LectureCardVariant =
  | 'horizontal'
  | 'compact'
  | 'vertical'
  | 'featured'
  | 'event'
  | 'swatch'
  | 'detail'

export type LectureCardItem = {
  id: string
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  author: string
  image?: string
  title: string
  summary?: string
}

type LectureCardProps = {
  lecture?: LectureCardItem
  variant?: LectureCardVariant
  className?: string
  loading?: boolean
  textLoading?: boolean
}

function joinClassNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function getLectureCardSizes(variant: LectureCardVariant) {
  if (variant === 'featured') {
    return '(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 34vw'
  }

  if (variant === 'detail') {
    return '(max-width: 900px) 100vw, 327px'
  }

  if (variant === 'vertical') {
    return '(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 22vw'
  }

  return '(max-width: 767px) 100vw, 50vw'
}

function TextLoadingOverlay({ compact, summary }: { compact?: boolean; summary?: boolean }) {
  return (
    <div
      className={joinClassNames(
        'pointer-events-none absolute inset-0 z-10 flex flex-col bg-white px-[clamp(16px,2vw,28px)] py-6',
        compact ? 'justify-center gap-4 max-[767px]:py-5' : 'gap-6 max-[767px]:py-5',
      )}
      aria-hidden="true"
    >
      <span className="h-7 w-4/5 animate-pulse bg-black/10" />
      <span className="h-5 w-3/5 animate-pulse bg-black/10" />
      {!compact && summary && (
        <span className="flex flex-col gap-3">
          <span className="h-5 w-full animate-pulse bg-black/10" />
          <span className="h-5 w-11/12 animate-pulse bg-black/10" />
          <span className="h-5 w-2/3 animate-pulse bg-black/10" />
        </span>
      )}
    </div>
  )
}

function CategoryBadge({
  label,
  color,
  active,
  inverse,
  compact,
  thin,
}: {
  label: string
  color: string
  active?: boolean
  inverse?: boolean
  compact?: boolean
  thin?: boolean
}) {
  return (
    <span
      className={joinClassNames(
        'inline-flex max-w-full items-center font-normal leading-none whitespace-nowrap transition-colors duration-200',
        thin ? 'border' : 'border-2',
        compact ? 'px-4 py-1.5 text-[clamp(11px,1vw,14px)]' : 'px-6 py-2 text-[clamp(12px,1.3vw,20px)] max-[767px]:px-4',
      )}
      style={{
        borderColor: active || inverse ? 'var(--color-white)' : color,
        backgroundColor: active ? 'var(--color-white)' : inverse ? 'transparent' : 'var(--color-white)',
        color: active ? 'var(--color-black)' : inverse ? 'var(--color-white)' : 'var(--color-black)',
      }}
    >
      <span className="text-clamp-1">{label}</span>
    </span>
  )
}

function MediaBlock({
  lecture,
  color,
  categoryLabel,
  variant,
  active,
}: {
  lecture: LectureCardItem
  color: string
  categoryLabel: string
  variant: LectureCardVariant
  active?: boolean
}) {
  const hasImage = Boolean(lecture.image?.trim())
  const isHorizontal = variant === 'horizontal'
  const revealImageOnHover = variant === 'compact' || variant === 'swatch'
  const imageHeight = variant === 'featured'
    ? 'h-[clamp(220px,22.5vw,324px)]'
    : variant === 'detail'
        ? 'h-[clamp(160px,20vw,260px)]'
        : variant === 'compact' || variant === 'swatch'
          ? 'h-[clamp(136px,10vw,152px)]'
          : variant === 'vertical'
            ? 'h-[clamp(100px,9vw,130px)]'
            : 'h-[clamp(220px,22.3vw,321px)]'

  return (
    <div className={joinClassNames(
      'relative shrink-0 overflow-hidden bg-[var(--lecture-card-color)]',
      isHorizontal ? 'self-stretch' : '',
      variant === 'featured' || variant === 'vertical' || variant === 'detail' ? 'w-full' : 'w-[clamp(200px,22vw,327px)] max-[767px]:w-full',
    )}>
      {hasImage ? (
        <Image
          src={lecture.image ?? ''}
          alt={lecture.title}
          width={variant === 'featured' ? 1200 : 900}
          height={variant === 'featured' ? 800 : 900}
          sizes={getLectureCardSizes(variant)}
          className={joinClassNames(
            'block w-full object-cover transition-opacity duration-200 max-[767px]:h-[200px]',
            isHorizontal ? 'h-full min-h-[clamp(220px,22.3vw,321px)]' : imageHeight,
            revealImageOnHover
              ? active
                ? 'opacity-70'
                : 'opacity-0'
              : 'opacity-50 group-hover:opacity-70',
          )}
        />
      ) : (
        <div className={joinClassNames('w-full', isHorizontal ? 'h-full min-h-[clamp(220px,22.3vw,321px)]' : imageHeight)} />
      )}
      <span className={joinClassNames(
        'absolute max-w-[calc(100%-24px)]',
        'left-3 top-3',
      )}>
        <CategoryBadge label={categoryLabel} color={color} active={active} inverse={variant === 'swatch' && active} compact={variant === 'detail' || variant === 'swatch'} />
      </span>
    </div>
  )
}

export default function LectureCard({ lecture, variant = 'horizontal', className, textLoading = false }: LectureCardProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)
  const isCompact = variant === 'compact' || variant === 'swatch'

  if (!lecture) {
    if (variant === 'detail') {
      return (
        <div className={joinClassNames('group grid min-w-0 grid-cols-[minmax(160px,327px)_1fr] gap-9 border-t border-black py-6 text-black no-underline transition-colors duration-200 max-[900px]:grid-cols-1 max-[900px]:gap-4', className)}>
          <div className="relative h-[clamp(160px,20vw,260px)] w-full overflow-hidden bg-black/10">
            <span className="absolute left-3 top-3 h-8 w-24 animate-pulse bg-white/80" />
          </div>
          <div className="flex min-w-0 flex-col gap-5 px-[clamp(16px,2vw,28px)] py-3">
            <div className="flex flex-col gap-2">
              <span className="h-7 w-4/5 animate-pulse bg-black/10" />
              <span className="h-5 w-3/5 animate-pulse bg-black/10" />
            </div>
            <div className="flex flex-col gap-3">
              <span className="h-5 w-full animate-pulse bg-black/10" />
              <span className="h-5 w-11/12 animate-pulse bg-black/10" />
              <span className="h-5 w-2/3 animate-pulse bg-black/10" />
            </div>
          </div>
        </div>
      )
    }

    if (variant === 'featured') {
      return (
        <div className={joinClassNames('group flex min-w-0 flex-[2] flex-col gap-6 py-6 text-inherit no-underline transition-colors duration-200', className)}>
          <div className="flex h-[86px] flex-col gap-3 overflow-hidden px-[clamp(16px,2vw,28px)]">
            <span className="h-7 w-4/5 animate-pulse bg-black/10" />
            <span className="h-5 w-3/5 animate-pulse bg-black/10" />
          </div>
          <div className="relative h-[clamp(220px,22.5vw,324px)] w-full overflow-hidden bg-black/10">
            <span className="absolute left-3 top-3 h-9 w-28 animate-pulse bg-white/80" />
          </div>
        </div>
      )
    }

    if (variant === 'vertical') {
      return (
        <div className={joinClassNames('group flex min-w-0 flex-1 flex-col gap-6 py-6 text-inherit no-underline transition-colors duration-200 max-[767px]:w-full', className)}>
          <div className="relative h-[clamp(100px,9vw,130px)] w-full overflow-hidden bg-black/10">
            <span className="absolute left-3 top-3 h-9 w-28 animate-pulse bg-white/80" />
          </div>
          <div className="flex h-[86px] flex-col gap-2 overflow-hidden px-[clamp(16px,2vw,28px)]">
            <span className="h-7 w-4/5 animate-pulse bg-black/10" />
            <span className="h-5 w-3/5 animate-pulse bg-black/10" />
          </div>
          <div className="flex flex-col gap-3 px-[clamp(16px,2vw,28px)]">
            <span className="h-5 w-full animate-pulse bg-black/10" />
            <span className="h-5 w-4/5 animate-pulse bg-black/10" />
            <span className="h-5 w-2/3 animate-pulse bg-black/10" />
          </div>
        </div>
      )
    }

    const mediaClassName = isCompact
      ? 'h-[clamp(136px,10vw,152px)]'
      : 'h-full min-h-[clamp(220px,22.3vw,321px)]'

    return (
      <div
        className={joinClassNames(
          'group flex min-w-0 flex-1 gap-9 text-inherit no-underline transition-colors duration-200 max-[1199px]:gap-6 max-[767px]:flex-col max-[767px]:gap-4',
          variant === 'event' ? 'w-full' : variant === 'compact' ? '' : 'py-6',
          className,
        )}
      >
        <div className={`relative ${mediaClassName} w-[clamp(200px,22vw,327px)] shrink-0 overflow-hidden bg-black/10 max-[767px]:h-[200px] max-[767px]:w-full`}>
          <span className="absolute left-3 top-3 h-9 w-28 animate-pulse bg-white/80" />
        </div>
        <div className={joinClassNames(
          'flex min-w-0 flex-1 flex-col px-[clamp(16px,2vw,28px)] py-6 transition-colors duration-200',
          isCompact ? 'h-[clamp(136px,10vw,152px)] justify-center gap-4 overflow-hidden max-[767px]:h-auto max-[767px]:min-h-[136px] max-[767px]:py-5' : 'gap-6 max-[767px]:py-5',
        )}>
          <span className="h-7 w-4/5 animate-pulse bg-black/10" />
          <span className="h-5 w-3/5 animate-pulse bg-black/10" />
        </div>
      </div>
    )
  }

  const color = CATEGORY_COLOR_VAR[lecture.categoryColor] || 'var(--color-red)'
  const categoryLabel = t(`lectureCategories.${lecture.category}`, { defaultValue: lecture.category })
  const hasSummary = Boolean(lecture.summary?.trim())
  const isHoverFilled = hovered && variant !== 'swatch'
  const style = {
    '--lecture-card-color': color,
    ...(isHoverFilled ? { backgroundColor: color, color: 'var(--color-white)' } : {}),
  } as CSSProperties

  if (variant === 'featured') {
    return (
      <Link
        href={`/lectures/${lecture.id}`}
        className={joinClassNames('group flex min-w-0 flex-[2] cursor-pointer flex-col gap-6 py-6 text-inherit no-underline transition-colors duration-200', className)}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative flex h-[86px] flex-col gap-3 overflow-hidden px-[clamp(16px,2vw,28px)]">
          <p className="text-clamp-2 text-[clamp(16px,1.6vw,24px)] font-normal uppercase leading-[1.2] tracking-[-0.04em]">{lecture.title}</p>
          <p className="text-clamp-1 text-[clamp(14px,1.3vw,20px)] font-normal">{lecture.author}</p>
          {textLoading && <TextLoadingOverlay compact />}
        </div>
        <MediaBlock lecture={lecture} color={color} categoryLabel={categoryLabel} variant="featured" active={hovered} />
      </Link>
    )
  }

  if (variant === 'vertical') {
    return (
      <Link
        href={`/lectures/${lecture.id}`}
        className={joinClassNames('group flex min-w-0 flex-1 cursor-pointer flex-col gap-6 py-6 text-inherit no-underline transition-colors duration-200 max-[767px]:w-full', className)}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <MediaBlock lecture={lecture} color={color} categoryLabel={categoryLabel} variant="vertical" active={hovered} />
        <div className="relative flex h-[86px] flex-col gap-2 overflow-hidden px-[clamp(16px,2vw,28px)]">
          <p className="text-clamp-2 text-[clamp(16px,1.6vw,24px)] font-normal uppercase leading-[1.2] tracking-[-0.04em]">{lecture.title}</p>
          <p className="text-clamp-1 text-[clamp(14px,1.3vw,20px)] font-normal">{lecture.author}</p>
          {textLoading && <TextLoadingOverlay compact />}
        </div>
        {hasSummary && (
          <div className="relative px-[clamp(16px,2vw,28px)]">
            <p className="text-clamp-3 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{lecture.summary}</p>
            {textLoading && (
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col gap-3 bg-white px-[clamp(16px,2vw,28px)]" aria-hidden="true">
                <span className="h-5 w-full animate-pulse bg-black/10" />
                <span className="h-5 w-4/5 animate-pulse bg-black/10" />
                <span className="h-5 w-2/3 animate-pulse bg-black/10" />
              </div>
            )}
          </div>
        )}
      </Link>
    )
  }

  const textBlock = (
    <div className={joinClassNames(
      'relative flex min-w-0 flex-1 flex-col px-[clamp(16px,2vw,28px)] py-6 transition-colors duration-200',
      isCompact ? 'h-[clamp(136px,10vw,152px)] justify-center gap-4 overflow-hidden max-[767px]:h-auto max-[767px]:min-h-[136px] max-[767px]:py-5' : 'gap-6 max-[767px]:py-5',
    )}>
      <p className="text-clamp-2 text-[clamp(16px,1.6vw,24px)] font-normal uppercase leading-[1.2] tracking-[-0.04em]">{lecture.title}</p>
      <p className="text-clamp-1 min-h-[1.3em] text-[clamp(14px,1.3vw,20px)] font-normal leading-[1.3]">{lecture.author}</p>
      {!isCompact && hasSummary && (
        <p className="text-clamp-5 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{lecture.summary}</p>
      )}
      {textLoading && <TextLoadingOverlay compact={isCompact} summary={hasSummary} />}
    </div>
  )

  if (variant === 'detail') {
    return (
      <Link
        href={`/lectures/${lecture.id}`}
        className={joinClassNames('group grid min-w-0 grid-cols-[minmax(160px,327px)_1fr] gap-9 border-t border-black py-6 text-black no-underline transition-colors duration-200 hover:text-white max-[900px]:grid-cols-1 max-[900px]:gap-4', className)}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <MediaBlock lecture={lecture} color={color} categoryLabel={categoryLabel} variant="detail" active={hovered} />
        <div className="relative flex min-w-0 flex-col gap-5 px-[clamp(16px,2vw,28px)] py-3 transition-colors duration-200 group-hover:bg-[var(--lecture-card-color)]">
          <div className="flex flex-col gap-2">
            <p className="text-clamp-2 text-[clamp(18px,1.6vw,24px)] font-normal uppercase leading-[1.15] tracking-[-0.04em]">{lecture.title}</p>
            <p className="text-clamp-1 text-[clamp(14px,1.3vw,20px)] font-normal">{lecture.author}</p>
          </div>
          {hasSummary && (
            <p className="text-clamp-4 text-[clamp(14px,1.3vw,20px)] font-normal leading-[1.35]">{lecture.summary}</p>
          )}
          {textLoading && <TextLoadingOverlay summary={hasSummary} />}
        </div>
      </Link>
    )
  }

  return (
    <Link
      href={`/lectures/${lecture.id}`}
      className={joinClassNames(
        'group flex min-w-0 flex-1 cursor-pointer gap-9 text-inherit no-underline transition-colors duration-200 max-[1199px]:gap-6 max-[767px]:flex-col max-[767px]:gap-4',
        variant === 'event' ? 'w-full' : variant === 'compact' ? '' : 'py-6',
        className,
      )}
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <MediaBlock lecture={lecture} color={color} categoryLabel={categoryLabel} variant={isCompact ? 'compact' : 'horizontal'} active={hovered} />
      {textBlock}
    </Link>
  )
}
