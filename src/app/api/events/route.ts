import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canManageContent } from '@/lib/roles'
import { getProfileRole, requireContentRole } from '@/lib/authz'
import { normalizeDateInput, normalizeTimeInput } from '@/lib/date-time'

type Locale = 'uk' | 'en'

function resolveLocale(req: NextRequest): Locale {
  const queryLocale = req.nextUrl.searchParams.get('locale')
  if (queryLocale === 'en') return 'en'
  const cookie = req.cookies.get('i18nextLng')?.value
  return cookie === 'en' ? 'en' : 'uk'
}

function mapEventRow(row: Record<string, unknown>, locale: Locale) {
  return {
    ...row,
    title: locale === 'en' ? row.titleEn ?? row.titleUk : row.titleUk ?? row.titleEn,
    city: locale === 'en' ? row.cityEn ?? row.cityUk : row.cityUk ?? row.cityEn,
    location: locale === 'en' ? row.locationEn ?? row.locationUk : row.locationUk ?? row.locationEn,
  }
}

function mapLectureRow(row: Record<string, unknown>, locale: Locale) {
  return {
    ...row,
    title: locale === 'en' ? row.titleEn ?? row.titleUk : row.titleUk ?? row.titleEn,
    author: locale === 'en' ? row.authorEn ?? row.authorUk : row.authorUk ?? row.authorEn,
    summary: locale === 'en' ? row.summaryEn ?? row.summaryUk : row.summaryUk ?? row.summaryEn,
  }
}

function validCategoryPair(category: string, categoryColor: string) {
  return (
    (category === 'tech' && categoryColor === 'blue') ||
    (category === 'nature' && categoryColor === 'green') ||
    (category === 'artes' && categoryColor === 'red') ||
    (category === 'wild-card' && categoryColor === 'orange')
  )
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  )
}

function isValidTime(value: string) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
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
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const role = user ? await getProfileRole(user.id, supabase) : null
    let query = supabase.from('Event').select('*').order('createdAt', { ascending: false })
    if (role !== 'admin') {
      if (user && canManageContent(role)) {
        query = query.or(`isPublic.eq.true,userId.eq.${user.id}`)
      } else {
        query = query.eq('isPublic', true)
      }
    }

    const { data: events, error } = await query
    if (error || !events) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const eventIds = events.map((event) => event.id)
    const { data: lectures, error: lecturesError } = eventIds.length
      ? await supabase.from('Lecture').select('*').in('eventId', eventIds)
      : { data: [] as Array<Record<string, unknown>>, error: null }

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const sanitizedEvents = (events as Array<Record<string, unknown>>).map((event) => ({
      ...event,
      userId: event.userId === user?.id || role === 'admin' ? event.userId : undefined,
    }))

    return NextResponse.json(
      attachLectures(sanitizedEvents, (lectures ?? []) as Array<Record<string, unknown>>, locale),
    )
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
      cityUk,
      cityEn,
      date,
      locationUk,
      locationEn,
      time,
      image,
      registrationUrl,
      lectures,
    } = body

    const normalizedDate = normalizeDateInput(String(date ?? ''))
    const normalizedTime = normalizeTimeInput(String(time ?? ''))

    if (!titleUk || !cityUk || !normalizedDate || !locationUk || !normalizedTime || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidDate(normalizedDate) || !isValidTime(normalizedTime)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabase
      .from('Event')
      .insert({
        titleUk: String(titleUk).trim(),
        titleEn: String(titleEn ?? '').trim(),
        descriptionUk: String(descriptionUk ?? '').trim(),
        descriptionEn: String(descriptionEn ?? '').trim(),
        cityUk: String(cityUk).trim(),
        cityEn: String(cityEn ?? '').trim(),
        date: normalizedDate,
        locationUk: String(locationUk).trim(),
        locationEn: String(locationEn ?? '').trim(),
        time: normalizedTime,
        image: String(image).trim(),
        registrationUrl: registrationUrl ? String(registrationUrl).trim() : null,
        isPublic: false,
        userId: user.id,
      })
      .select('*')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const rawLectures = Array.isArray(lectures) ? lectures : []
    if (rawLectures.length > 4) {
      return NextResponse.json({ error: 'Too many lectures' }, { status: 400 })
    }

    const preparedLectures = rawLectures.map((item, index) => {
      const lecture = item as Record<string, unknown>
      return {
        eventId: event.id,
        userId: user.id,
        slot: Number(lecture.slot ?? index + 1),
        titleUk: String(lecture.titleUk ?? '').trim(),
        titleEn: String(lecture.titleEn ?? '').trim(),
        authorUk: String(lecture.authorUk ?? '').trim(),
        authorEn: String(lecture.authorEn ?? '').trim(),
        category: String(lecture.category ?? '').trim(),
        categoryColor: String(lecture.categoryColor ?? '').trim(),
        summaryUk: String(lecture.summaryUk ?? '').trim(),
        summaryEn: String(lecture.summaryEn ?? '').trim(),
        image: String(lecture.image ?? '').trim(),
        isPublic: false,
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
      !validCategoryPair(lecture.category, lecture.categoryColor),
    )

    if (invalidLecture) {
      return NextResponse.json({ error: 'Invalid lecture payload' }, { status: 400 })
    }

    if (preparedLectures.length > 0) {
      const { error: lecturesError } = await supabase.from('Lecture').insert(preparedLectures)
      if (lecturesError) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    const locale = resolveLocale(req)
    return NextResponse.json(mapEventRow(event as Record<string, unknown>, locale), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
