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

const json = (res: Response) => res.json()
const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])
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

  getLectures: () => fetch('/api/lectures').then(json).then((data) => asArray<Lecture>(data)),
  getLecture: (id: string) => fetch(`/api/lectures/${id}`).then(json),
  createLecture: (body: object) => post('/api/lectures', body),
  updateLecture: (id: string, body: object) => put(`/api/lectures/${id}`, body),
  deleteLecture: (id: string) => del(`/api/lectures/${id}`),

  getEvents: () => fetch('/api/events').then(json).then((data) => asArray<Event>(data)),
  getEvent: (id: string) => fetch(`/api/events/${id}`).then(json),
  createEvent: (body: object) => post('/api/events', body),
  updateEvent: (id: string, body: object) => put(`/api/events/${id}`, body),
  deleteEvent: (id: string) => del(`/api/events/${id}`),

  translateText: (body: { text: string; sourceLanguage: 'uk' | 'en'; targetLanguage: 'uk' | 'en' }) =>
    post('/api/ai/translate', body),

  admin: {
    getUsers: () => fetch('/api/admin/users').then(json),
    updateUser: (id: string, body: { status?: string; role?: string }) => patch(`/api/admin/users/${id}`, body),
    deleteUser: (id: string) => del(`/api/admin/users/${id}`),
    getLectures: () => fetch('/api/admin/lectures').then(json),
    deleteLecture: (id: string) => del(`/api/admin/lectures/${id}`),
    getEvents: () => fetch('/api/admin/events').then(json),
    deleteEvent: (id: string) => del(`/api/admin/events/${id}`),
    getStats: () => fetch('/api/admin/stats').then(json),
  },
}
