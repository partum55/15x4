import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireContentRole } from '@/lib/authz'
import { normalizeDateInput, normalizeTimeInput } from '@/lib/date-time'
import { findCityOption } from '@/constants/cities'
import {
  type Locale,
  isValidDate,
  isValidHttpUrl,
  isValidLectureCategory,
  isValidOptionalHttpUrl,
  isValidTime,
  mapEventRow,
  mapLectureRow,
  parsePositiveInt,
  resolveLocale,
  sanitizeSearch,
} from '@/lib/content-api'

function facetKey(value: unknown) {
  return String(value ?? '').trim()
}

function buildEventFacets(events: Array<Record<string, unknown>>, locale: Locale) {
  const cityMap = new Map<string, string>()
  const timeSet = new Set<string>()

  for (const event of events) {
    const cityValue = facetKey(event.city)
    const cities = (Array.isArray(event.cities) ? event.cities[0] : event.cities) as { nameUk?: string; nameEn?: string } | null
    const cityLabel = facetKey(locale === 'en' ? cities?.nameEn ?? cities?.nameUk : cities?.nameUk ?? cities?.nameEn)
    if (cityValue && cityLabel && !cityMap.has(cityValue)) cityMap.set(cityValue, cityLabel)

    const time = facetKey(event.time)
    if (time) timeSet.add(time)
  }

  return {
    cities: [...cityMap.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    times: [...timeSet]
      .sort()
      .map((time) => ({ value: time, label: time })),
  }
}

function attachLectures(
  events: Array<Record<string, unknown>>,
  lectures: Array<Record<string, unknown>>,
  locale: Locale,
) {
  const grouped = new Map<string, Array<Record<string, unknown>>>()
  for (const lecture of lectures) {
    const key = String(lecture.eventId)
    const current = grouped.get(key) ?? []
    current.push(mapLectureRow(lecture, locale))
    grouped.set(key, current)
  }

  for (const [key, list] of grouped.entries()) {
    list.sort((a, b) => Number(a.slot ?? 0) - Number(b.slot ?? 0))
    grouped.set(key, list)
  }

  return events.map((event) => ({
    ...mapEventRow(event, locale),
    lectures: grouped.get(String(event.id)) ?? [],
  }))
}

export async function GET(req: NextRequest) {
  try {
    const locale = resolveLocale(req)
    const searchParams = req.nextUrl.searchParams
    const scope = searchParams.get('scope')
    const wantsPagination = searchParams.has('limit') || searchParams.has('offset')
    const limit = parsePositiveInt(searchParams.get('limit'), 10, 50)
    const offset = parsePositiveInt(searchParams.get('offset'), 0, 100000)
    const city = searchParams.get('city')?.trim()
    const time = searchParams.get('time')?.trim()
    const status = searchParams.get('status')?.trim()
    const search = sanitizeSearch(searchParams.get('search'))
    const sort = searchParams.get('sort')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (scope === 'mine' && !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const userId = user?.id

    let query = wantsPagination
      ? supabase.from('Event').select('*, cities(nameUk, nameEn)', { count: 'exact' })
      : supabase.from('Event').select('*, cities(nameUk, nameEn)')

    if (scope === 'mine') {
      query = query.eq('userId', userId)
      if (status === 'public') query = query.eq('isPublic', true)
      if (status === 'draft') query = query.eq('isPublic', false)
    } else {
      query = query.eq('isPublic', true)
    }

    if (search) {
      const pattern = `%${search}%`
      query = query.or(
        `titleUk.ilike.${pattern},titleEn.ilike.${pattern},locationUk.ilike.${pattern},locationEn.ilike.${pattern},cityUk.ilike.${pattern},cityEn.ilike.${pattern}`,
      )
    }

    let facetsQuery = supabase.from('Event').select('city, cities(nameUk, nameEn), time')
    if (scope === 'mine') {
      facetsQuery = facetsQuery.eq('userId', userId)
    } else {
      facetsQuery = facetsQuery.eq('isPublic', true)
    }

    const { data: facetRows, error: facetsError } = wantsPagination
      ? await facetsQuery
      : { data: [] as Array<Record<string, unknown>>, error: null }

    if (facetsError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (city) {
      query = query.eq('city', city)
    }
    if (time) {
      query = query.eq('time', time)
    }

    if (sort === 'dateAsc') {
      query = query.order('date', { ascending: true }).order('time', { ascending: true })
    } else if (sort === 'dateDesc') {
      query = query.order('date', { ascending: false }).order('time', { ascending: false })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    if (wantsPagination) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: events, error, count } = await query
    if (error || !events) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const eventIds = events.map((event) => event.id)
    let lecturesQuery = eventIds.length
      ? supabase.from('Lecture').select('*').in('eventId', eventIds)
      : null

    if (lecturesQuery && scope !== 'mine') {
      lecturesQuery = lecturesQuery.eq('isPublic', true)
    }

    const { data: lectures, error: lecturesError } = lecturesQuery
      ? await lecturesQuery
      : { data: [] as Array<Record<string, unknown>>, error: null }

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const sanitizedEvents = (events as Array<Record<string, unknown>>).map((event) => ({
      ...event,
      userId: event.userId === user?.id ? event.userId : undefined,
    }))

    const items = attachLectures(sanitizedEvents, (lectures ?? []) as Array<Record<string, unknown>>, locale)

    if (wantsPagination) {
      const total = count ?? items.length
      return NextResponse.json({
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
        ...buildEventFacets((facetRows ?? []) as Array<Record<string, unknown>>, locale),
      })
    }

    return NextResponse.json(items)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireContentRole(user.id, supabase)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const body = await req.json()
    const {
      titleUk,
      titleEn,
      descriptionUk,
      descriptionEn,
      cityId,
      date,
      locationUk,
      locationEn,
      time,
      image,
      registrationUrl,
      eventPhotosUrl,
      lectures,
    } = body

    const normalizedDate = normalizeDateInput(String(date ?? ''))
    const normalizedTime = normalizeTimeInput(String(time ?? ''))
    const cityOption = findCityOption(String(cityId ?? ''))

    if (!titleUk || !cityOption || !normalizedDate || !locationUk || !normalizedTime || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidDate(normalizedDate) || !isValidTime(normalizedTime)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidHttpUrl(String(image))) {
      return NextResponse.json({ error: 'image must be a valid http/https URL' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(registrationUrl)) {
      return NextResponse.json({ error: 'registrationUrl must be a valid http/https URL' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(eventPhotosUrl)) {
      return NextResponse.json({ error: 'eventPhotosUrl must be a valid http/https URL' }, { status: 400 })
    }

    const rawLectures = Array.isArray(lectures) ? lectures : []
    if (rawLectures.length > 4) {
      return NextResponse.json({ error: 'Too many lectures' }, { status: 400 })
    }

    const preparedLectures = rawLectures.map((item, index) => {
      const lecture = item as Record<string, unknown>
      return {
        userId: user.id,
        slot: Number(lecture.slot ?? index + 1),
        titleUk: String(lecture.titleUk ?? '').trim(),
        titleEn: String(lecture.titleEn ?? '').trim(),
        authorUk: String(lecture.authorUk ?? '').trim(),
        authorEn: String(lecture.authorEn ?? '').trim(),
        category: String(lecture.category ?? '').trim(),
        summaryUk: String(lecture.summaryUk ?? '').trim(),
        summaryEn: String(lecture.summaryEn ?? '').trim(),
        image: String(lecture.image ?? '').trim(),
        videoUrl: String(lecture.videoUrl ?? '').trim(),
        presentationUrl: String(lecture.presentationUrl ?? '').trim(),
        authorBioUk: String(lecture.authorBioUk ?? '').trim(),
        authorBioEn: String(lecture.authorBioEn ?? '').trim(),
        sources: Array.isArray(lecture.sources) ? lecture.sources : [],
      }
    })

    const invalidLecture = preparedLectures.find((lecture) =>
      !lecture.titleUk ||
      !lecture.authorUk ||
      !lecture.category ||
      !lecture.summaryUk ||
      !lecture.image ||
      lecture.slot < 1 ||
      lecture.slot > 4 ||
      !isValidHttpUrl(lecture.image) ||
      !isValidOptionalHttpUrl(lecture.videoUrl) ||
      !isValidOptionalHttpUrl(lecture.presentationUrl) ||
      !isValidLectureCategory(lecture.category),
    )

    if (invalidLecture) {
      return NextResponse.json({ error: 'Invalid lecture payload' }, { status: 400 })
    }

    const eventPayload = {
      titleUk: String(titleUk).trim(),
      titleEn: String(titleEn ?? '').trim(),
      descriptionUk: String(descriptionUk ?? '').trim(),
      descriptionEn: String(descriptionEn ?? '').trim(),
      city: cityOption.id,
      date: normalizedDate,
      locationUk: String(locationUk).trim(),
      locationEn: String(locationEn ?? '').trim(),
      time: normalizedTime,
      image: String(image).trim(),
      registrationUrl: registrationUrl ? String(registrationUrl).trim() : '',
      eventPhotosUrl: eventPhotosUrl ? String(eventPhotosUrl).trim() : '',
      userId: user.id,
    }

    const { data: event, error: eventError } = await supabase
      .rpc('create_event_with_lectures', {
        p_event: eventPayload,
        p_lectures: preparedLectures,
      })
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const locale = resolveLocale(req)
    const eventWithCity = { ...(event as Record<string, unknown>), cities: { nameUk: cityOption.uk, nameEn: cityOption.en } }
    return NextResponse.json(mapEventRow(eventWithCity, locale), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
