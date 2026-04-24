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
  | 'popular'
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
  lecture: LectureCardItem
  variant?: LectureCardVariant
  className?: string
}

function joinClassNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(' ')
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
        backgroundColor: active || inverse ? 'transparent' : 'var(--color-white)',
        color: active || inverse ? 'var(--color-white)' : 'var(--color-black)',
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
  const imageHeight = variant === 'featured'
    ? 'h-[clamp(220px,22.5vw,324px)]'
    : variant === 'popular'
      ? 'h-[clamp(150px,17.4vw,250px)]'
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
      variant === 'featured' || variant === 'popular' || variant === 'vertical' || variant === 'detail' ? 'w-full' : 'w-[clamp(200px,22vw,327px)] max-[767px]:w-full',
    )}>
      {hasImage && variant !== 'compact' && variant !== 'swatch' ? (
        <Image
          src={lecture.image ?? ''}
          alt={lecture.title}
          width={variant === 'featured' ? 1200 : 900}
          height={variant === 'featured' ? 800 : 900}
          unoptimized
          className={joinClassNames(
            'block w-full object-cover transition-opacity duration-200 max-[767px]:h-[200px]',
            variant === 'popular' ? 'opacity-100 group-hover:opacity-55' : 'opacity-50 group-hover:opacity-70',
            imageHeight,
          )}
        />
      ) : (
        <div className={joinClassNames('w-full', imageHeight)} />
      )}
      <span className="absolute left-3 top-3 max-w-[calc(100%-24px)]">
        <CategoryBadge label={categoryLabel} color={color} active={active} inverse={variant === 'swatch' && active} compact={variant === 'detail' || variant === 'swatch'} />
      </span>
    </div>
  )
}

export default function LectureCard({ lecture, variant = 'horizontal', className }: LectureCardProps) {
  const { t } = useTranslation()
  const [hovered, setHovered] = useState(false)

  const color = CATEGORY_COLOR_VAR[lecture.categoryColor] || 'var(--color-red)'
  const categoryLabel = t(`lectureCategories.${lecture.category}`, { defaultValue: lecture.category })
  const hasSummary = Boolean(lecture.summary?.trim())
  const isCompact = variant === 'compact' || variant === 'swatch'
  const isHoverFilled = hovered && variant !== 'swatch'
  const style = {
    '--lecture-card-color': color,
    ...(isHoverFilled ? { backgroundColor: color, color: 'var(--color-white)' } : {}),
  } as CSSProperties

  if (variant === 'swatch') {
    return (
      <Link
        href={`/lectures/${lecture.id}`}
        className={joinClassNames('group block min-w-0 no-underline text-inherit', className)}
        style={{ '--lecture-card-color': color } as CSSProperties}
      >
        <MediaBlock lecture={lecture} color={color} categoryLabel={categoryLabel} variant="swatch" active={false} />
      </Link>
    )
  }

  if (variant === 'popular') {
    return (
      <Link
        href={`/lectures/${lecture.id}`}
        className={joinClassNames(
          'group flex min-w-0 flex-1 cursor-pointer flex-col py-8 text-inherit no-underline transition-colors duration-200 ease-in max-[1199px]:py-6 max-[767px]:border-b max-[767px]:border-black max-[767px]:py-5 last:max-[767px]:border-b-0',
          className,
        )}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="mb-4 flex h-9 items-center justify-between gap-3 px-[clamp(16px,2vw,28px)]">
          <CategoryBadge label={categoryLabel} color={color} active={hovered} thin />
          <span className="text-clamp-1 flex-shrink-0 text-right text-[clamp(13px,1.3vw,20px)] font-normal transition-colors duration-200">{lecture.author}</span>
        </div>
        <MediaBlock lecture={lecture} color={color} categoryLabel={categoryLabel} variant="popular" active={hovered} />
        <div className="mt-5 flex h-[clamp(104px,8.7vw,126px)] flex-col gap-4 overflow-hidden px-[clamp(16px,2vw,28px)]">
          <p className="text-clamp-2 text-[clamp(15px,1.35vw,21px)] font-normal uppercase leading-[1.15] tracking-[-0.04em]">{lecture.title}</p>
          {hasSummary && (
            <p className="text-clamp-3 text-[clamp(13px,1.25vw,19px)] font-normal leading-[1.25]">{lecture.summary}</p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'featured') {
    return (
      <Link
        href={`/lectures/${lecture.id}`}
        className={joinClassNames('group flex min-w-0 flex-[2] cursor-pointer flex-col gap-6 py-6 text-inherit no-underline transition-colors duration-200', className)}
        style={style}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex h-[86px] flex-col gap-3 overflow-hidden px-[clamp(16px,2vw,28px)]">
          <p className="text-clamp-2 text-[clamp(16px,1.6vw,24px)] font-normal uppercase leading-[1.2] tracking-[-0.04em]">{lecture.title}</p>
          <p className="text-clamp-1 text-[clamp(14px,1.3vw,20px)] font-normal">{lecture.author}</p>
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
        <div className="flex h-[86px] flex-col gap-2 overflow-hidden px-[clamp(16px,2vw,28px)]">
          <p className="text-clamp-2 text-[clamp(16px,1.6vw,24px)] font-normal uppercase leading-[1.2] tracking-[-0.04em]">{lecture.title}</p>
          <p className="text-clamp-1 text-[clamp(14px,1.3vw,20px)] font-normal">{lecture.author}</p>
        </div>
        {hasSummary && (
          <p className="text-clamp-3 px-[clamp(16px,2vw,28px)] text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{lecture.summary}</p>
        )}
      </Link>
    )
  }

  const textBlock = (
    <div className={joinClassNames(
      'flex min-w-0 flex-1 flex-col overflow-hidden px-[clamp(16px,2vw,28px)] py-6 transition-colors duration-200',
      isCompact ? 'h-[clamp(136px,10vw,152px)] justify-center gap-4 max-[767px]:h-auto max-[767px]:min-h-[136px] max-[767px]:py-5' : 'h-[321px] gap-6 max-[767px]:h-auto max-[767px]:py-5',
    )}>
      <p className="text-clamp-2 text-[clamp(16px,1.6vw,24px)] font-normal uppercase leading-[1.2] tracking-[-0.04em]">{lecture.title}</p>
      <p className="text-clamp-1 min-h-[1.3em] text-[clamp(14px,1.3vw,20px)] font-normal leading-[1.3]">{lecture.author}</p>
      {!isCompact && hasSummary && (
        <p className="text-clamp-5 text-[clamp(14px,1.6vw,24px)] font-normal leading-[1.3]">{lecture.summary}</p>
      )}
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
        <div className="flex h-[clamp(160px,20vw,260px)] min-w-0 flex-col gap-5 overflow-hidden px-[clamp(16px,2vw,28px)] py-3 transition-colors duration-200 group-hover:bg-[var(--lecture-card-color)] max-[900px]:h-auto">
          <div className="flex flex-col gap-2">
            <p className="text-clamp-2 text-[clamp(18px,1.6vw,24px)] font-normal uppercase leading-[1.15] tracking-[-0.04em]">{lecture.title}</p>
            <p className="text-clamp-1 text-[clamp(14px,1.3vw,20px)] font-normal">{lecture.author}</p>
          </div>
          {hasSummary && (
            <p className="text-clamp-4 text-[clamp(14px,1.3vw,20px)] font-normal leading-[1.35]">{lecture.summary}</p>
          )}
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
