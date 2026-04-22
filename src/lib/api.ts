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
  duration?: string
  videoUrl?: string
  authorBio?: string
  authorBioUk?: string
  authorBioEn?: string
  eventCity?: string
  eventDate?: string
  eventPhotosUrl?: string
  sources?: { name: string; url: string }[] | null
  socialLinks?: { type: string; url: string }[] | null
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
}

export type Event = {
  id: string
  title: string
  titleUk: string
  titleEn: string
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

export type LectureListParams = {
  limit?: number
  offset?: number
  search?: string
  category?: string
  sort?: string
}

const json = (res: Response) => res.json()
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
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
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined }).then(json)
const put = (url: string, body: object) =>
  fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json)
const patch = (url: string, body: object) =>
  fetch(url, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(json)
const del = (url: string) =>
  fetch(url, { method: 'DELETE' }).then(json)

export const api = {
  updateProfile: (body: { name?: string }) => patch('/api/profile', body),

  getLectures: (params?: LectureListParams) => fetch(withQuery('/api/lectures', params)).then(json).then((data) => asArray<Lecture>(data)),
  getLecturesPage: (params?: LectureListParams) =>
    fetch(withQuery('/api/lectures', params)).then(json).then((data) => data as PaginatedResponse<Lecture>),
  getLecture: (id: string) => fetch(withQuery(`/api/lectures/${id}`)).then(json),
  createLecture: (body: object) => post('/api/lectures', body),
  updateLecture: (id: string, body: object) => put(`/api/lectures/${id}`, body),
  deleteLecture: (id: string) => del(`/api/lectures/${id}`),

  getEvents: () => fetch(withQuery('/api/events')).then(json).then((data) => asArray<Event>(data)),
  getEvent: (id: string) => fetch(withQuery(`/api/events/${id}`)).then(json),
  createEvent: (body: object) => post('/api/events', body),
  updateEvent: (id: string, body: object) => put(`/api/events/${id}`, body),
  deleteEvent: (id: string) => del(`/api/events/${id}`),

  translateText: (body: { text: string; sourceLanguage: 'uk' | 'en'; targetLanguage: 'uk' | 'en' }) =>
    post('/api/ai/translate', body),

  admin: {
    getUsers: () => fetch('/api/admin/users').then(json),
    updateUser: (id: string, body: { role?: string }) => patch(`/api/admin/users/${id}`, body),
    deleteUser: (id: string) => del(`/api/admin/users/${id}`),
    getLectures: (params?: LectureListParams & { status?: string }) => fetch(withQuery('/api/admin/lectures', params)).then(json),
    deleteLecture: (id: string) => del(`/api/admin/lectures/${id}`),
    getEvents: () => fetch('/api/admin/events').then(json),
    approveEvent: (id: string) => patch(`/api/admin/events/${id}`, {}),
    deleteEvent: (id: string) => del(`/api/admin/events/${id}`),
    getStats: () => fetch('/api/admin/stats').then(json),
  },
}
