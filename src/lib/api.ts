export type Lecture = {
  id: string
  eventId: string
  slot: number
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  author: string
  authorUk: string
  authorEn: string
  image: string
  title: string
  titleUk: string
  titleEn: string
  summary: string
  summaryUk: string
  summaryEn: string
  videoUrl?: string
  presentationUrl?: string
  authorBio?: string
  authorBioUk?: string
  authorBioEn?: string
  sources?: { name: string; url: string }[] | null
  isPublic: boolean
  userId?: string
  createdAt: string
  updatedAt: string
}

export type EventLecture = {
  id: string
  eventId: string
  slot: number
  title: string
  titleUk: string
  titleEn: string
  author: string
  authorUk: string
  authorEn: string
  category: string
  categoryColor: 'orange' | 'green' | 'blue' | 'red'
  image: string
  summary: string
  summaryUk: string
  summaryEn: string
  presentationUrl?: string
  sources?: { name: string; url: string }[] | null
}

export type Event = {
  id: string
  title: string
  titleUk: string
  titleEn: string
  cityId?: string
  city: string
  cityUk: string
  cityEn: string
  date: string
  descriptionUk: string
  descriptionEn: string
  location: string
  locationUk: string
  locationEn: string
  time: string
  image: string
  registrationUrl?: string
  eventPhotosUrl?: string
  isPublic: boolean
  userId?: string
  createdAt: string
  updatedAt: string
  lectures?: EventLecture[]
}

export type PaginatedResponse<T> = {
  items: T[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

export type EventFacet = {
  value: string
  label: string
}

export type EventsPageResponse = PaginatedResponse<Event> & {
  cities: EventFacet[]
  times: EventFacet[]
}

export type LectureListParams = {
  limit?: number
  offset?: number
  search?: string
  category?: string
  sort?: string
  scope?: string
}

export type EventListParams = {
  scope?: string
  limit?: number
  offset?: number
  search?: string
  city?: string
  time?: string
  status?: string
  sort?: string
}

export type UserListParams = {
  limit?: number
  offset?: number
  search?: string
  role?: string
  sort?: string
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
const parseJson = async (res: Response) => {
  const text = await res.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    if (!res.ok) return { error: `Request failed (${res.status})`, status: res.status }
    throw new Error('Invalid JSON response')
  }
}
const requestJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, init)
  const data = await parseJson(res)

  if (!res.ok) {
    if (data && typeof data === 'object' && 'error' in data) return data
    return { error: `Request failed (${res.status})`, status: res.status }
  }

  return data
}
const currentLocale = () => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem('i18nextLng')
  return stored?.startsWith('en') ? 'en' : stored?.startsWith('uk') ? 'uk' : null
}
const withQuery = (url: string, params?: Record<string, string | number | undefined>) => {
  const searchParams = new URLSearchParams()
  const locale = currentLocale()
  if (locale) searchParams.set('locale', locale)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') searchParams.set(key, String(value))
  })
  const query = searchParams.toString()
  return query ? `${url}?${query}` : url
}
const post = (url: string, body?: object) =>
  requestJson(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
const put = (url: string, body: object) =>
  requestJson(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const patch = (url: string, body: object) =>
  requestJson(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
const del = (url: string) =>
  requestJson(url, { method: 'DELETE' })

export const api = {
  updateProfile: (body: { name?: string; city?: string }) => patch('/api/profile', body),

  getLectures: (params?: LectureListParams) => requestJson(withQuery('/api/lectures', params)).then((data) => asArray<Lecture>(data)),
  getLecturesPage: (params?: LectureListParams) =>
    requestJson(withQuery('/api/lectures', params)).then((data) => data as PaginatedResponse<Lecture>),
  getLecture: (id: string) => requestJson(withQuery(`/api/lectures/${id}`)),
  createLecture: (body: object) => post('/api/lectures', body),
  updateLecture: (id: string, body: object) => put(`/api/lectures/${id}`, body),
  deleteLecture: (id: string) => del(`/api/lectures/${id}`),

  getEvents: (params?: EventListParams) => requestJson(withQuery('/api/events', params)).then((data) => asArray<Event>(data)),
  getEventsPage: (params?: EventListParams) =>
    requestJson(withQuery('/api/events', params)).then((data) => data as EventsPageResponse),
  getMyEvents: () => requestJson(withQuery('/api/events', { scope: 'mine' })).then((data) => asArray<Event>(data)),
  getEvent: (id: string) => requestJson(withQuery(`/api/events/${id}`)),
  createEvent: (body: object) => post('/api/events', body),
  updateEvent: (id: string, body: object) => put(`/api/events/${id}`, body),
  deleteEvent: (id: string) => del(`/api/events/${id}`),
  getMyLectures: () => requestJson(withQuery('/api/lectures', { scope: 'mine' })).then((data) => asArray<Lecture>(data)),

  translateText: (body: { text: string; sourceLanguage: 'uk' | 'en'; targetLanguage: 'uk' | 'en' }) =>
    post('/api/ai/translate', body),

  admin: {
    getUsers: (params?: UserListParams) => requestJson(withQuery('/api/admin/users', params)),
    updateUser: (id: string, body: { role?: string }) => patch(`/api/admin/users/${id}`, body),
    deleteUser: (id: string) => del(`/api/admin/users/${id}`),
    getLectures: (params?: LectureListParams & { status?: string }) => requestJson(withQuery('/api/admin/lectures', params)),
    deleteLecture: (id: string) => del(`/api/admin/lectures/${id}`),
    getEvents: (params?: EventListParams) => requestJson(withQuery('/api/admin/events', params)),
    approveEvent: (id: string) => patch(`/api/admin/events/${id}`, {}),
    deleteEvent: (id: string) => del(`/api/admin/events/${id}`),
    getStats: () => requestJson('/api/admin/stats'),
  },
}
