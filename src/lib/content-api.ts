import type { NextRequest } from 'next/server'

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

export function validCategoryPair(category: string, categoryColor: string) {
  return (
    (category === 'tech' && categoryColor === 'blue') ||
    (category === 'nature' && categoryColor === 'green') ||
    (category === 'artes' && categoryColor === 'red') ||
    (category === 'wild-card' && categoryColor === 'orange')
  )
}

export function mapEventRow(row: ContentRow, locale: Locale) {
  return {
    ...row,
    cityId: row.city,
    title: locale === 'en' ? row.titleEn ?? row.titleUk : row.titleUk ?? row.titleEn,
    city: locale === 'en' ? row.cityEn ?? row.cityUk : row.cityUk ?? row.cityEn,
    location: locale === 'en' ? row.locationEn ?? row.locationUk : row.locationUk ?? row.locationEn,
  }
}

export function mapLectureRow(row: ContentRow, locale: Locale) {
  return {
    ...row,
    title: locale === 'en' ? row.titleEn ?? row.titleUk : row.titleUk ?? row.titleEn,
    author: locale === 'en' ? row.authorEn ?? row.authorUk : row.authorUk ?? row.authorEn,
    summary: locale === 'en' ? row.summaryEn ?? row.summaryUk : row.summaryUk ?? row.summaryEn,
    authorBio: locale === 'en' ? row.authorBioEn ?? row.authorBioUk : row.authorBioUk ?? row.authorBioEn,
    sources: safeParse(row.sources),
    socialLinks: safeParse(row.socialLinks),
  }
}
