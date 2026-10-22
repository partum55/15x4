// Demo branch: one in-process stand-in for every /api route. Reads come from mock data,
// writes are acknowledged but not persisted (there is no database).
import { NextRequest, NextResponse } from 'next/server'
import {
  type ContentRow,
  mapEventRow,
  mapLectureRow,
  parsePositiveInt,
  resolveLocale,
  sanitizeSearch,
} from '@/lib/content-api'
import { DEMO_EVENTS, DEMO_LECTURES } from '@/lib/demo-data'
import { DEMO_GUEST_COOKIE, DEMO_PROFILES, DEMO_USER } from '@/lib/demo-user'

const json = (body: unknown, status = 200) => NextResponse.json(body, { status })
const str = (v: unknown) => String(v ?? '')
const cmp = (a: string, b: string) => a.localeCompare(b)
const matches = (row: ContentRow, fields: string[], search: string) =>
  fields.some((f) => str(row[f]).toLowerCase().includes(search.toLowerCase()))
const eventKey = (e: ContentRow) => `${str(e.date)}T${str(e.time)}`
const eventOf = (eventId: unknown) => DEMO_EVENTS.find((e) => e.id === eventId)
const byStatus = (rows: ContentRow[], status: string | null) =>
  rows.filter((r) => (status === 'public' ? r.isPublic : status === 'draft' ? !r.isPublic : true))

function paginate<T>(all: T[], offset: number, limit: number) {
  const items = all.slice(offset, offset + limit)
  return { items, total: all.length, limit, offset, hasMore: offset + items.length < all.length }
}

const lecturesOf = (eventId: unknown, locale: 'uk' | 'en', includeDrafts: boolean) =>
  DEMO_LECTURES
    .filter((l) => l.eventId === eventId && (includeDrafts || l.isPublic))
    .sort((a, b) => Number(a.slot) - Number(b.slot))
    .map((l) => mapLectureRow(l, locale))

function events(req: NextRequest, mine: boolean) {
  const locale = resolveLocale(req)
  const p = req.nextUrl.searchParams
  const wantsPagination = p.has('limit') || p.has('offset')
  const limit = parsePositiveInt(p.get('limit'), 10, 50)
  const offset = parsePositiveInt(p.get('offset'), 0, 100000)
  const city = p.get('city')?.trim()
  const time = p.get('time')?.trim()
  const search = sanitizeSearch(p.get('search'))
  const sort = p.get('sort')

  const scoped = mine ? byStatus(DEMO_EVENTS, p.get('status')) : DEMO_EVENTS.filter((e) => e.isPublic)
  const filtered = scoped
    .filter((e) =>
      (!city || e.city === city) &&
      (!time || e.time === time) &&
      (!search || matches(e, ['titleUk', 'titleEn', 'locationUk', 'locationEn', 'cityUk', 'cityEn'], search)),
    )
    .sort((a, b) =>
      sort === 'dateAsc' ? cmp(eventKey(a), eventKey(b))
      : sort === 'dateDesc' ? cmp(eventKey(b), eventKey(a))
      : cmp(str(b.createdAt), str(a.createdAt)),
    )

  const page = wantsPagination ? paginate(filtered, offset, limit) : null
  const items = (page?.items ?? filtered).map((e) => ({
    ...mapEventRow(e, locale),
    lectures: lecturesOf(e.id, locale, mine),
  }))
  if (!page) return json(items)

  const cities = [...new Map(scoped.map((e) => [str(e.city), str(locale === 'en' ? e.cityEn : e.cityUk)])).entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => cmp(a.label, b.label))
  const times = [...new Set(scoped.map((e) => str(e.time)))].sort().map((t) => ({ value: t, label: t }))
  return json({ ...page, items, cities, times })
}

function lectures(req: NextRequest, mine: boolean) {
  const locale = resolveLocale(req)
  const p = req.nextUrl.searchParams
  const wantsPagination = p.has('limit') || p.has('offset')
  const limit = parsePositiveInt(p.get('limit'), 20, 100)
  const offset = parsePositiveInt(p.get('offset'), 0, 100000)
  const category = p.get('category')?.trim()
  const search = sanitizeSearch(p.get('search'))
  const sort = p.get('sort')
  const titleField = locale === 'en' ? 'titleEn' : 'titleUk'

  const scoped = mine ? byStatus(DEMO_LECTURES, p.get('status')) : DEMO_LECTURES.filter((l) => l.isPublic)
  const filtered = scoped
    .filter((l) =>
      (!category || l.category === category) &&
      (!search || matches(l, ['titleUk', 'titleEn', 'authorUk', 'authorEn', 'summaryUk', 'summaryEn'], search)),
    )
    .sort((a, b) => {
      if (sort === 'titleAZ') return cmp(str(a[titleField]), str(b[titleField]))
      if (sort === 'titleZA') return cmp(str(b[titleField]), str(a[titleField]))
      const byDate = cmp(eventKey(eventOf(a.eventId) ?? {}), eventKey(eventOf(b.eventId) ?? {}))
      return sort === 'dateAsc' ? byDate : -byDate
    })

  const page = wantsPagination ? paginate(filtered, offset, limit) : null
  const items = (page?.items ?? filtered).map((l) => mapLectureRow(l, locale))
  return json(page ? { ...page, items } : items)
}

// ---- admin ----

function adminList(req: NextRequest, rows: ContentRow[], fields: string[], defaultSort: (a: ContentRow, b: ContentRow) => number) {
  const p = req.nextUrl.searchParams
  const locale = resolveLocale(req)
  const search = sanitizeSearch(p.get('search'))
  const sort = p.get('sort')
  const titleField = locale === 'en' ? 'titleEn' : 'titleUk'
  const filtered = byStatus(rows, p.get('status'))
    .filter((r) => (!p.get('category') || r.category === p.get('category')) && (!search || matches(r, fields, search)))
    .sort((a, b) =>
      sort === 'titleAZ' ? cmp(str(a[titleField]), str(b[titleField]))
      : sort === 'titleZA' ? cmp(str(b[titleField]), str(a[titleField]))
      : sort === 'oldest' ? cmp(str(a.createdAt), str(b.createdAt))
      : defaultSort(a, b),
    )
  return paginate(filtered, parsePositiveInt(p.get('offset'), 0, 100000), parsePositiveInt(p.get('limit'), 100, 100))
}

const owner = { id: DEMO_USER.id, name: DEMO_USER.profile?.name, email: DEMO_USER.email }

function adminEvents(req: NextRequest) {
  const locale = resolveLocale(req)
  const page = adminList(
    req, DEMO_EVENTS, ['titleUk', 'titleEn', 'city', 'locationUk', 'locationEn'],
    (a, b) => req.nextUrl.searchParams.get('sort') === 'created'
      ? cmp(str(b.createdAt), str(a.createdAt))
      : cmp(eventKey(b), eventKey(a)),
  )
  return json({
    ...page,
    items: page.items.map((e) => ({
      ...e,
      title: str(locale === 'en' ? e.titleEn : e.titleUk),
      city: str(locale === 'en' ? e.cityEn : e.cityUk),
      location: str(locale === 'en' ? e.locationEn : e.locationUk),
      user: owner,
      _count: { lectures: DEMO_LECTURES.filter((l) => l.eventId === e.id).length },
    })),
  })
}

function adminLectures(req: NextRequest) {
  const locale = resolveLocale(req)
  const page = adminList(req, DEMO_LECTURES, ['titleUk', 'titleEn', 'authorUk', 'authorEn'], (a, b) => cmp(str(b.createdAt), str(a.createdAt)))
  return json({
    ...page,
    items: page.items.map((l) => ({
      ...l,
      title: str(locale === 'en' ? l.titleEn : l.titleUk),
      author: str(locale === 'en' ? l.authorEn : l.authorUk),
      user: owner,
    })),
  })
}

function adminUsers(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const search = sanitizeSearch(p.get('search'))
  const sort = p.get('sort')
  const users = DEMO_PROFILES
    .filter((u) => (!p.get('role') || u.role === p.get('role')) && (!search || matches(u, ['name', 'email', 'role'], search)))
    .sort((a, b) =>
      sort === 'nameAZ' ? cmp(a.name, b.name)
      : sort === 'nameZA' ? cmp(b.name, a.name)
      : sort === 'oldest' ? cmp(a.createdAt, b.createdAt)
      : cmp(b.createdAt, a.createdAt),
    )
  return json(paginate(users, parsePositiveInt(p.get('offset'), 0, 100000), parsePositiveInt(p.get('limit'), 100, 100)))
}

function adminStats() {
  return json({
    users: DEMO_PROFILES.length,
    lectures: DEMO_LECTURES.length,
    events: DEMO_EVENTS.length,
    lectors: new Set(DEMO_LECTURES.map((l) => l.authorUk)).size,
  })
}

// ---- dispatch ----

async function handleWrite(req: NextRequest, path: string[]) {
  const body = await req.json().catch(() => ({}))
  if (path[0] === 'ai' && path[1] === 'translate') {
    return json({ translatedText: `[demo] ${str(body.text)}` })
  }
  if (path[0] === 'profile') return json({ ...DEMO_USER.profile, ...body })
  // Echo the payload so forms see a success; nothing is stored.
  return json({ ok: true, demo: true, id: path[1] ?? 'demo-new', ...body })
}

export async function handleDemoApi(req: NextRequest, path: string[]) {
  const [section, id, sub] = path
  const isGuest = req.cookies.has(DEMO_GUEST_COOKIE)

  if (section === 'profile' && req.method === 'GET') {
    return isGuest ? json({ error: 'Unauthorized' }, 401) : json(DEMO_USER)
  }
  if (req.method !== 'GET') {
    return isGuest && section !== 'ai' ? json({ error: 'Unauthorized' }, 401) : handleWrite(req, path)
  }

  if (section === 'admin') {
    if (isGuest) return json({ error: 'Forbidden' }, 403)
    if (id === 'events') return adminEvents(req)
    if (id === 'lectures' && !sub) return adminLectures(req)
    if (id === 'users') return adminUsers(req)
    if (id === 'stats') return adminStats()
    return json({ error: 'Not found' }, 404)
  }

  const mine = req.nextUrl.searchParams.get('scope') === 'mine'
  if (mine && isGuest) return json({ error: 'Unauthorized' }, 401)

  if (section === 'events') {
    if (!id) return events(req, mine)
    const event = eventOf(id)
    if (!event || (!event.isPublic && isGuest)) return json({ error: 'Not found' }, 404)
    const locale = resolveLocale(req)
    return json({ ...mapEventRow(event, locale), lectures: lecturesOf(id, locale, !isGuest) })
  }

  if (section === 'lectures') {
    if (!id) return lectures(req, mine)
    const lecture = DEMO_LECTURES.find((l) => l.id === id)
    if (!lecture || (!lecture.isPublic && isGuest)) return json({ error: 'Not found' }, 404)
    return json(mapLectureRow(lecture, resolveLocale(req)))
  }

  return json({ error: 'Not found' }, 404)
}
