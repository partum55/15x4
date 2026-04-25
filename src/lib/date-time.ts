const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/
const shortDatePattern = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/
const timePattern = /^(\d{1,2}):(\d{2})(?::\d{2})?$/

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

export function isEventPast(date?: string | null, time?: string | null, now = Date.now()) {
  const normalizedDate = normalizeDateInput(date)
  if (!isoDatePattern.test(normalizedDate)) return false

  const normalizedTime = normalizeTimeInput(time) || '23:59'
  const timestamp = new Date(`${normalizedDate}T${normalizedTime}`).getTime()
  return Number.isFinite(timestamp) && timestamp < now
}
