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
  description: string
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
  status?: string
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

type ApiConfig = {
  baseUrl?: string
  fetcher?: typeof fetch
  getLocale?: () => 'uk' | 'en' | null
}

const defaultGetLocale = (): 'uk' | 'en' | null => {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem('i18nextLng')
  return stored?.startsWith('en') ? 'en' : stored?.startsWith('uk') ? 'uk' : null
}

const asArray = <T>(value: unknown): T[] => (Array.isArray(value) ? (value as T[]) : [])

class ContentApi {
  private readonly baseUrl: string
  private readonly fetcher: typeof fetch
  private readonly getLocale: () => 'uk' | 'en' | null

  readonly admin: AdminApi

  constructor(cfg: ApiConfig = {}) {
    this.baseUrl = cfg.baseUrl ?? ''
    this.fetcher = cfg.fetcher ?? ((typeof window !== 'undefined' ? window.fetch.bind(window) : fetch))
    this.getLocale = cfg.getLocale ?? defaultGetLocale
    this.admin = new AdminApi(this)
  }

  private async parseJson(res: Response) {
    const text = await res.text()
    if (!text) return null
    try {
      return JSON.parse(text)
    } catch {
      if (!res.ok) return { error: `Request failed (${res.status})`, status: res.status }
      throw new Error('Invalid JSON response')
    }
  }

  async requestJson(url: string, init?: RequestInit) {
    const res = await this.fetcher(`${this.baseUrl}${url}`, init)
    const data = await this.parseJson(res)
    if (!res.ok) {
      if (data && typeof data === 'object' && 'error' in data) return data
      return { error: `Request failed (${res.status})`, status: res.status }
    }
    return data
  }

  withQuery(url: string, params?: Record<string, string | number | undefined>) {
    const searchParams = new URLSearchParams()
    const locale = this.getLocale()
    if (locale) searchParams.set('locale', locale)
    Object.entries(params ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== '') searchParams.set(key, String(value))
    })
    const query = searchParams.toString()
    return query ? `${url}?${query}` : url
  }

  private post(url: string, body?: object) {
    return this.requestJson(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  private put(url: string, body: object) {
    return this.requestJson(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  private patch(url: string, body: object) {
    return this.requestJson(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }

  private del(url: string) {
    return this.requestJson(url, { method: 'DELETE' })
  }

  postRaw(url: string, body?: object) { return this.post(url, body) }
  putRaw(url: string, body: object) { return this.put(url, body) }
  patchRaw(url: string, body: object) { return this.patch(url, body) }
  delRaw(url: string) { return this.del(url) }

  updateProfile(body: { name?: string; city?: string }) { return this.patch('/api/profile', body) }

  async getLectures(params?: LectureListParams) {
    const data = await this.requestJson(this.withQuery('/api/lectures', params))
    return asArray<Lecture>(data)
  }
  async getLecturesPage(params?: LectureListParams) {
    return (await this.requestJson(this.withQuery('/api/lectures', params))) as PaginatedResponse<Lecture>
  }
  getLecture(id: string) { return this.requestJson(this.withQuery(`/api/lectures/${id}`)) }
  createLecture(body: object) { return this.post('/api/lectures', body) }
  updateLecture(id: string, body: object) { return this.put(`/api/lectures/${id}`, body) }
  deleteLecture(id: string) { return this.del(`/api/lectures/${id}`) }

  async getEvents(params?: EventListParams) {
    const data = await this.requestJson(this.withQuery('/api/events', params))
    return asArray<Event>(data)
  }
  async getEventsPage(params?: EventListParams) {
    return (await this.requestJson(this.withQuery('/api/events', params))) as EventsPageResponse
  }
  async getMyEvents() {
    const data = await this.requestJson(this.withQuery('/api/events', { scope: 'mine' }))
    return asArray<Event>(data)
  }
  getEvent(id: string) { return this.requestJson(this.withQuery(`/api/events/${id}`)) }
  createEvent(body: object) { return this.post('/api/events', body) }
  updateEvent(id: string, body: object) { return this.put(`/api/events/${id}`, body) }
  deleteEvent(id: string) { return this.del(`/api/events/${id}`) }
  async getMyLectures() {
    const data = await this.requestJson(this.withQuery('/api/lectures', { scope: 'mine' }))
    return asArray<Lecture>(data)
  }

  translateText(body: { text: string; sourceLanguage: 'uk' | 'en'; targetLanguage: 'uk' | 'en' }) {
    return this.post('/api/ai/translate', body)
  }
}

class AdminApi {
  constructor(private readonly client: ContentApi) {}

  getUsers(params?: UserListParams) {
    return this.client.requestJson(this.client.withQuery('/api/admin/users', params))
  }
  updateUser(id: string, body: { role?: string }) { return this.client.patchRaw(`/api/admin/users/${id}`, body) }
  deleteUser(id: string) { return this.client.delRaw(`/api/admin/users/${id}`) }
  getLectures(params?: LectureListParams & { status?: string }) {
    return this.client.requestJson(this.client.withQuery('/api/admin/lectures', params))
  }
  updateLectureApproval(id: string, isPublic: boolean) {
    return this.client.patchRaw(`/api/admin/lectures/${id}/approval`, { isPublic })
  }
  deleteLecture(id: string) { return this.client.delRaw(`/api/admin/lectures/${id}`) }
  getEvents(params?: EventListParams) {
    return this.client.requestJson(this.client.withQuery('/api/admin/events', params))
  }
  updateEventApproval(id: string, isPublic: boolean) {
    return this.client.patchRaw(`/api/admin/events/${id}`, { isPublic })
  }
  deleteEvent(id: string) { return this.client.delRaw(`/api/admin/events/${id}`) }
  getStats() { return this.client.requestJson('/api/admin/stats') }
}

export { ContentApi }
export const api = new ContentApi()
