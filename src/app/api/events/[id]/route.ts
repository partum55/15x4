import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileRole, requireContentRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeDateInput, normalizeTimeInput } from '@/lib/date-time'
import { findCityOption } from '@/constants/cities'
import {
  isValidDate,
  isValidHttpUrl,
  isValidLectureCategory,
  isValidOptionalHttpUrl,
  isValidTime,
  mapEventRow,
  mapLectureRow,
  resolveLocale,
} from '@/lib/content-api'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const locale = resolveLocale(req)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = user ? await getProfileRole(user.id, supabase) : null

    const queryClient = role === 'admin' ? supabaseAdmin : supabase
    const { data: event } = await queryClient.from('Event').select('*, cities(nameUk, nameEn)').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const canReadPrivate = Boolean(user && (event.userId === user.id || role === 'admin'))
    if (!event.isPublic && !canReadPrivate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    let lecturesQuery = queryClient
      .from('Lecture')
      .select('*')
      .eq('eventId', id)
      .order('slot', { ascending: true })

    if (!canReadPrivate) {
      lecturesQuery = lecturesQuery.eq('isPublic', true)
    }

    const { data: lectures, error: lecturesError } = await lecturesQuery

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      ...mapEventRow(event as Record<string, unknown>, locale),
      userId: event.userId === user?.id || role === 'admin' ? event.userId : undefined,
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

    const queryClient = access.role === 'admin' ? supabaseAdmin : supabase
    const { data: event } = await queryClient.from('Event').select('*, cities(nameUk, nameEn)').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const ownerId = String(event.userId ?? user.id)

    const body = await req.json()
    const { titleUk, titleEn, descriptionUk, descriptionEn, cityId, date, locationUk, locationEn, time, image, registrationUrl, eventPhotosUrl, lectures } = body

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
        userId: ownerId,
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
    }

    const { data: updated, error: updateError } = await queryClient
      .rpc('update_event_with_lectures', {
        p_event_id: id,
        p_event: eventPayload,
        p_lectures: preparedLectures,
      })
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const locale = resolveLocale(req)
    const updatedWithCity = { ...(updated as Record<string, unknown>), cities: { nameUk: cityOption.uk, nameEn: cityOption.en } }
    return NextResponse.json(mapEventRow(updatedWithCity, locale))
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

    const queryClient = access.role === 'admin' ? supabaseAdmin : supabase
    const { data: event } = await queryClient.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await queryClient.from('Event').delete().eq('id', id)
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

    const queryClient = access.role === 'admin' ? supabaseAdmin : supabase
    const { data: event } = await queryClient.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const {
      slot,
      category,
      titleUk,
      titleEn,
      authorUk,
      authorEn,
      summaryUk,
      summaryEn,
      image,
      videoUrl,
      presentationUrl,
      authorBioUk,
      authorBioEn,
      sources,
    } = body

    if (!slot || !category || !titleUk || !authorUk || !summaryUk || !image) {
      return NextResponse.json({ error: 'Missing required lecture fields' }, { status: 400 })
    }

    if (!isValidLectureCategory(String(category))) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    if (!isValidHttpUrl(String(image))) {
      return NextResponse.json({ error: 'image must be a valid http/https URL' }, { status: 400 })
    }
    if (!isValidOptionalHttpUrl(videoUrl)) {
      return NextResponse.json({ error: 'videoUrl must be a valid http/https URL' }, { status: 400 })
    }
    if (!isValidOptionalHttpUrl(presentationUrl)) {
      return NextResponse.json({ error: 'presentationUrl must be a valid http/https URL' }, { status: 400 })
    }

    const lecturePayload = {
      eventId: id,
      userId: String(event.userId ?? user.id),
      slot: Number(slot),
      category: String(category),
      titleUk: String(titleUk).trim(),
      titleEn: String(titleEn ?? '').trim(),
      authorUk: String(authorUk).trim(),
      authorEn: String(authorEn ?? '').trim(),
      summaryUk: String(summaryUk).trim(),
      summaryEn: String(summaryEn ?? '').trim(),
      image: String(image).trim(),
      videoUrl: videoUrl ? String(videoUrl).trim() : null,
      presentationUrl: presentationUrl ? String(presentationUrl).trim() : null,
      authorBioUk: authorBioUk ? String(authorBioUk).trim() : null,
      authorBioEn: authorBioEn ? String(authorBioEn).trim() : null,
      sources: Array.isArray(sources) ? JSON.stringify(sources) : null,
      isPublic: false,
    }

    const { data: existing } = await queryClient
      .from('Lecture')
      .select('id')
      .eq('eventId', id)
      .eq('slot', Number(slot))
      .maybeSingle()

    const query = existing
      ? queryClient.from('Lecture').update(lecturePayload).eq('id', existing.id)
      : queryClient.from('Lecture').insert(lecturePayload)

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
