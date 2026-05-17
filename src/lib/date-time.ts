const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const shortDatePattern = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/
const timePattern = /^(\d{1,2}):(\d{2})(?::\d{2})?$/
const kyivTimeZone = 'Europe/Kyiv'
const eventLiveWindowMs = 60 * 60 * 1000

function pad2(value: string | number) {
  return String(value).padStart(2, '0')
}

export function normalizeDateInput(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  if (isoDatePattern.test(trimmed)) return trimmed

  const match = trimmed.match(shortDatePattern)
  if (!match) return trimmed

  const day = Number(match[1])
  const month = Number(match[2])
  const year = match[3]
    ? Number(match[3].length === 2 ? `20${match[3]}` : match[3])
    : new Date().getFullYear()

  if (day < 1 || day > 31 || month < 1 || month > 12) return trimmed

  return `${year}-${pad2(month)}-${pad2(day)}`
}

export function normalizeTimeInput(value?: string | null) {
  const trimmed = value?.trim()
  if (!trimmed) return ''

  const match = trimmed.match(timePattern)
  if (!match) return trimmed

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return trimmed

  return `${pad2(hours)}:${pad2(minutes)}`
}

export function formatEventDate(value?: string | null, includeYear = false) {
  const normalized = normalizeDateInput(value)
  if (!isoDatePattern.test(normalized)) return value ?? ''

  const [year, month, day] = normalized.split('-')
  return includeYear ? `${day}/${month}/${year}` : `${day}/${month}`
}

export function formatEventTime(value?: string | null) {
  return normalizeTimeInput(value)
}

export function compareEventDates(a?: string | null, b?: string | null) {
  const dateA = normalizeDateInput(a)
  const dateB = normalizeDateInput(b)

  if (isoDatePattern.test(dateA) && isoDatePattern.test(dateB)) {
    return dateA.localeCompare(dateB)
  }

  return formatEventDate(dateA).localeCompare(formatEventDate(dateB))
}

function getTimeZoneOffsetMs(timeZone: string, date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)

  const values = new Map(parts.map((part) => [part.type, part.value]))
  const utcTimestamp = Date.UTC(
    Number(values.get('year')),
    Number(values.get('month')) - 1,
    Number(values.get('day')),
    Number(values.get('hour')),
    Number(values.get('minute')),
    Number(values.get('second')),
  )

  return utcTimestamp - date.getTime()
}

export function getEventStartTimestamp(date?: string | null, time?: string | null) {
  const normalizedDate = normalizeDateInput(date)
  if (!isoDatePattern.test(normalizedDate)) return null

  const normalizedTime = normalizeTimeInput(time) || '23:59'
  const [year, month, day] = normalizedDate.split('-').map(Number)
  const [hour, minute] = normalizedTime.split(':').map(Number)
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute)
  const firstPass = utcGuess - getTimeZoneOffsetMs(kyivTimeZone, new Date(utcGuess))
  const secondPass = utcGuess - getTimeZoneOffsetMs(kyivTimeZone, new Date(firstPass))

  return Number.isFinite(secondPass) ? secondPass : null
}

export function getEventPhase(date?: string | null, time?: string | null, now = Date.now()) {
  const start = getEventStartTimestamp(date, time)
  if (start === null) return 'upcoming' as const
  if (now < start) return 'upcoming' as const
  if (now < start + eventLiveWindowMs) return 'live' as const
  return 'past' as const
}

export function isEventPast(date?: string | null, time?: string | null, now = Date.now()) {
  return getEventPhase(date, time, now) === 'past'
}
