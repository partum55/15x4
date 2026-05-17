import type { NextRequest } from 'next/server'
import { getLectureCategoryColor } from '@/constants/lectureCategories'

export type Locale = 'uk' | 'en'
export type ContentRow = Record<string, unknown>

export function resolveLocale(req: NextRequest): Locale {
  const queryLocale = req.nextUrl.searchParams.get('locale')
  if (queryLocale === 'en') return 'en'
  const cookie = req.cookies.get('i18nextLng')?.value
  return cookie === 'en' ? 'en' : 'uk'
}

export function resolveLocaleFromUrl(req: Request): Locale {
  const { searchParams } = new URL(req.url)
  return searchParams.get('locale')?.startsWith('en') ? 'en' : 'uk'
}

export function safeParse(value: unknown) {
  if (!value) return null
  try {
    return JSON.parse(String(value))
  } catch {
    return null
  }
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function isValidOptionalHttpUrl(value: unknown) {
  if (value === undefined || value === null || value === '') return true
  return isValidHttpUrl(String(value).trim())
}

export function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

export function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

export function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

export function sanitizeSearch(value: string | null) {
  return value?.replace(/[%,()]/g, ' ').trim() ?? ''
}

export function isValidLectureCategory(category: string) {
  return getLectureCategoryColor(category) !== null
}

export function pickLocalized(en: unknown, uk: unknown, locale: Locale) {
  const primary = locale === 'en' ? en : uk
  const fallback = locale === 'en' ? uk : en
  if (typeof primary === 'string' && primary.trim()) return primary
  if (primary != null && typeof primary !== 'string') return primary
  return fallback ?? ''
}

export function mapEventRow(row: ContentRow, locale: Locale) {
  const citiesData = (Array.isArray(row.cities) ? row.cities[0] : row.cities) as { nameUk?: string; nameEn?: string } | null
  const cityUk = (citiesData?.nameUk ?? row.cityUk ?? '') as string
  const cityEn = (citiesData?.nameEn ?? row.cityEn ?? '') as string
  return {
    ...row,
    cityId: row.city,
    cityUk,
    cityEn,
    title: pickLocalized(row.titleEn, row.titleUk, locale),
    city: pickLocalized(cityEn, cityUk, locale),
    location: pickLocalized(row.locationEn, row.locationUk, locale),
  }
}

export function mapLectureRow(row: ContentRow, locale: Locale) {
  const category = typeof row.category === 'string' ? row.category : ''

  return {
    ...row,
    categoryColor: getLectureCategoryColor(category) ?? 'red',
    title: pickLocalized(row.titleEn, row.titleUk, locale),
    author: pickLocalized(row.authorEn, row.authorUk, locale),
    summary: pickLocalized(row.summaryEn, row.summaryUk, locale),
    authorBio: pickLocalized(row.authorBioEn, row.authorBioUk, locale),
    sources: safeParse(row.sources),
  }
}

export function parseLectureSources(value: string) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawName, rawUrl] = line.includes('|')
        ? line.split('|', 2).map((part) => part.trim())
        : ['', line]

      const urlCandidate = rawUrl || rawName
      const hasUrl = isValidHttpUrl(urlCandidate)

      return {
        name: rawName || urlCandidate,
        url: hasUrl ? urlCandidate : '',
      }
    })
}

export function formatLectureSources(
  sources: Array<{ name?: string | null; url?: string | null }> | null | undefined,
) {
  return (sources ?? [])
    .map((source) => {
      const name = String(source.name ?? '').trim()
      const url = String(source.url ?? '').trim()

      if (name && url && name !== url) {
        return `${name} | ${url}`
      }

      return url || name
    })
    .filter(Boolean)
    .join('\n')
}
