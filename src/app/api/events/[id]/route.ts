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
    authorBio: locale === 'en' ? row.authorBioEn ?? row.authorBioUk : row.authorBioUk ?? row.authorBioEn,
    sources: row.sources ? JSON.parse(String(row.sources)) : null,
    socialLinks: row.socialLinks ? JSON.parse(String(row.socialLinks)) : null,
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const locale = resolveLocale(req)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = user ? await getProfileRole(user.id, supabase) : null

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const canReadPrivate = Boolean(user && (event.userId === user.id || canManageContent(role)))
    if (!event.isPublic && !canReadPrivate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: lectures, error: lecturesError } = await supabase
      .from('Lecture')
      .select('*')
      .eq('eventId', id)
      .order('slot', { ascending: true })

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      ...mapEventRow(event as Record<string, unknown>, locale),
      userId: event.userId === user?.id ? event.userId : undefined,
      lectures: (lectures ?? []).map((lecture) => mapLectureRow(lecture as Record<string, unknown>, locale)),
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireContentRole(user.id, supabase)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const ownerId = String(event.userId ?? user.id)

    const body = await req.json()
    const { titleUk, titleEn, descriptionUk, descriptionEn, cityUk, cityEn, date, locationUk, locationEn, time, image, registrationUrl, lectures } = body

    const normalizedDate = normalizeDateInput(String(date ?? ''))
    const normalizedTime = normalizeTimeInput(String(time ?? ''))

    if (!titleUk || !cityUk || !normalizedDate || !locationUk || !normalizedTime || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidDate(normalizedDate) || !isValidTime(normalizedTime)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: updated, error: updateError } = await supabase
      .from('Event')
      .update({
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
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const rawLectures = Array.isArray(lectures) ? lectures : []
    if (rawLectures.length > 4) {
      return NextResponse.json({ error: 'Too many lectures' }, { status: 400 })
    }

    const preparedLectures = rawLectures.map((item, index) => {
      const lecture = item as Record<string, unknown>
      return {
        eventId: id,
        userId: ownerId,
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

    const { error: deleteLecturesError } = await supabase.from('Lecture').delete().eq('eventId', id)
    if (deleteLecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (preparedLectures.length > 0) {
      const { error: insertLecturesError } = await supabase.from('Lecture').insert(preparedLectures)
      if (insertLecturesError) {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }

    const locale = resolveLocale(req)
    return NextResponse.json(mapEventRow(updated as Record<string, unknown>, locale))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireContentRole(user.id, supabase)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('Event').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const access = await requireContentRole(user.id, supabase)
    if (!access.ok) {
      return NextResponse.json({ error: access.error }, { status: access.status })
    }

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { slot, category, categoryColor, titleUk, titleEn, authorUk, authorEn, summaryUk, summaryEn, image } = body

    if (!slot || !category || !categoryColor || !titleUk || !authorUk || !summaryUk || !image) {
      return NextResponse.json({ error: 'Missing required lecture fields' }, { status: 400 })
    }

    if (!validCategoryPair(String(category), String(categoryColor))) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    const lecturePayload = {
      eventId: id,
      userId: String(event.userId ?? user.id),
      slot: Number(slot),
      category: String(category),
      categoryColor: String(categoryColor),
      titleUk: String(titleUk).trim(),
      titleEn: String(titleEn ?? '').trim(),
      authorUk: String(authorUk).trim(),
      authorEn: String(authorEn ?? '').trim(),
      summaryUk: String(summaryUk).trim(),
      summaryEn: String(summaryEn ?? '').trim(),
      image: String(image).trim(),
      isPublic: false,
    }

    const { data: existing } = await supabase
      .from('Lecture')
      .select('id')
      .eq('eventId', id)
      .eq('slot', Number(slot))
      .maybeSingle()

    const query = existing
      ? supabase.from('Lecture').update(lecturePayload).eq('id', existing.id)
      : supabase.from('Lecture').insert(lecturePayload)

    const { data: saved, error } = await query.select('*').single()
    if (error || !saved) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const locale = resolveLocale(req)
    return NextResponse.json(mapLectureRow(saved as Record<string, unknown>, locale))
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
