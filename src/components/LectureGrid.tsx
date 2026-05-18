'use client'

import { Fragment } from 'react'
import LectureCard, { type LectureCardVariant } from './LectureCard'
import type { Lecture } from '@/lib/api'

export type LectureRowSpec =
  | { variant: LectureCardVariant; size: number }
  | { variants: LectureCardVariant[] }

const DEFAULT_PATTERN: LectureRowSpec[] = [
  { variant: 'horizontal', size: 2 },
  { variant: 'compact', size: 2 },
  { variant: 'horizontal', size: 2 },
  { variants: ['vertical', 'featured', 'vertical'] },
  { variant: 'horizontal', size: 1 },
  { variant: 'compact', size: 2 },
]

const FILLER_PATTERN: LectureRowSpec = { variant: 'horizontal', size: 2 }

type Row = { variants: LectureCardVariant[]; items: Lecture[] }

function rowSpecSize(spec: LectureRowSpec) {
  return 'size' in spec ? spec.size : spec.variants.length
}

function rowSpecVariants(spec: LectureRowSpec): LectureCardVariant[] {
  return 'variants' in spec ? spec.variants : Array.from({ length: spec.size }, () => spec.variant)
}

export function buildLectureRows(items: Lecture[], pattern: LectureRowSpec[] = DEFAULT_PATTERN): Row[] {
  const rows: Row[] = []
  let idx = 0
  let patternIndex = 0
  const activePattern = pattern.length > 0 ? pattern : [FILLER_PATTERN]

  const pushRow = (spec: LectureRowSpec, size: number) => {
    const slice = items.slice(idx, idx + size)
    rows.push({ variants: rowSpecVariants(spec).slice(0, slice.length), items: slice })
    idx += slice.length
  }

  while (idx < items.length) {
    const spec = activePattern[patternIndex % activePattern.length]
    const size = rowSpecSize(spec)

    if (items.length - idx < size) {
      while (idx < items.length) {
        pushRow(FILLER_PATTERN, Math.min(rowSpecSize(FILLER_PATTERN), items.length - idx))
      }
      break
    }

    pushRow(spec, size)
    patternIndex += 1
  }

  return rows
}

type LectureGridProps = {
  lectures: Lecture[]
  pattern?: LectureRowSpec[]
  textLoading?: boolean
}

function LectureGridRow({ row, textLoading }: { row: Row; textLoading?: boolean }) {
  return (
    <div className="flex items-stretch border-b border-black max-[767px]:flex-col">
      {row.items.map((lecture, i) => (
        <Fragment key={lecture.id}>
          {i > 0 && <div className="w-px bg-black flex-shrink-0 max-[767px]:hidden" />}
          <LectureCard
            lecture={lecture}
            variant={row.variants[i] ?? 'horizontal'}
            textLoading={textLoading}
          />
        </Fragment>
      ))}
    </div>
  )
}

export default function LectureGrid({ lectures, pattern = DEFAULT_PATTERN, textLoading }: LectureGridProps) {
  if (lectures.length === 0) return null
  const rows = buildLectureRows(lectures, pattern)

  return (
    <>
      {rows.map((row, index) => (
        <LectureGridRow key={`row-${index}`} row={row} textLoading={textLoading} />
      ))}
    </>
  )
}
