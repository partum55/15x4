import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireContentRole } from '@/lib/authz'
import {
  isValidHttpUrl,
  isValidOptionalHttpUrl,
  mapLectureRow,
  parseLectureSources,
  parsePositiveInt,
  resolveLocale,
  sanitizeSearch,
  validCategoryPair,
} from '@/lib/content-api'

export async function GET(req: NextRequest) {
  try {
    const locale = resolveLocale(req)
    const searchParams = req.nextUrl.searchParams
    const scope = searchParams.get('scope')
    const wantsPagination = searchParams.has('limit') || searchParams.has('offset')
    const limit = parsePositiveInt(searchParams.get('limit'), 20, 100)
    const offset = parsePositiveInt(searchParams.get('offset'), 0, 100000)
    const search = sanitizeSearch(searchParams.get('search'))
    const category = searchParams.get('category')?.trim()
    const sort = searchParams.get('sort')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = wantsPagination
      ? supabase.from('Lecture').select('*', { count: 'exact' })
      : supabase.from('Lecture').select('*')

    if (scope === 'mine') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      query = query.eq('userId', user.id)
    } else {
      query = query.eq('isPublic', true)
    }

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      const pattern = `%${search}%`
      query = query.or(
        `titleUk.ilike.${pattern},titleEn.ilike.${pattern},authorUk.ilike.${pattern},authorEn.ilike.${pattern},summaryUk.ilike.${pattern},summaryEn.ilike.${pattern}`,
      )
    }

    if (sort === 'titleAZ' || sort === 'titleZA') {
      query = query.order(locale === 'en' ? 'titleEn' : 'titleUk', { ascending: sort === 'titleAZ' })
    } else if (sort === 'dateAsc') {
      query = query.order('eventDate', { ascending: true, nullsFirst: false }).order('createdAt', { ascending: true })
    } else if (sort === 'dateDesc' || !sort) {
      query = query.order('eventDate', { ascending: false, nullsFirst: false }).order('createdAt', { ascending: false })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    if (wantsPagination) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: lectures, error, count } = await query
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const parsed = (lectures ?? []).map((lecture) => {
      const lectureRow = lecture as Record<string, unknown>
      const mapped = mapLectureRow(lectureRow, locale)
      return {
        ...mapped,
        userId: lectureRow.userId === user?.id ? lectureRow.userId : undefined,
      }
    })

    if (wantsPagination) {
      const total = count ?? parsed.length
      return NextResponse.json({
        items: parsed,
        total,
        limit,
        offset,
        hasMore: offset + parsed.length < total,
      })
    }

    return NextResponse.json(parsed)
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
      eventId,
      slot,
      category,
      categoryColor,
      authorUk,
      authorEn,
      image,
      titleUk,
      titleEn,
      summaryUk,
      summaryEn,
      duration,
      videoUrl,
      presentationUrl,
      authorBioUk,
      authorBioEn,
      sources,
      socialLinks,
      eventCity,
      eventDate,
      eventPhotosUrl,
    } = body

    if (!eventId || !slot || !category || !categoryColor || !authorUk || !image || !titleUk || !summaryUk) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidHttpUrl(String(image))) {
      return NextResponse.json({ error: 'image must be a valid http/https URL' }, { status: 400 })
    }

    if (!validCategoryPair(String(category), String(categoryColor))) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(videoUrl)) {
      return NextResponse.json({ error: 'videoUrl must be a valid http/https URL' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(presentationUrl)) {
      return NextResponse.json({ error: 'presentationUrl must be a valid http/https URL' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(eventPhotosUrl)) {
      return NextResponse.json({ error: 'eventPhotosUrl must be a valid http/https URL' }, { status: 400 })
    }

    if (access.role !== 'admin') {
      const { data: targetEvent } = await supabase
        .from('Event')
        .select('userId')
        .eq('id', String(eventId))
        .maybeSingle()
      if (!targetEvent) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }
      if (targetEvent.userId !== user.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const { data: lecture, error } = await supabase
      .from('Lecture')
      .insert({
        eventId,
        userId: user.id,
        slot: Number(slot),
        category: String(category),
        categoryColor: String(categoryColor),
        authorUk: String(authorUk).trim(),
        authorEn: String(authorEn ?? '').trim(),
        image: String(image).trim(),
        titleUk: String(titleUk).trim(),
        titleEn: String(titleEn ?? '').trim(),
        summaryUk: String(summaryUk).trim(),
        summaryEn: String(summaryEn ?? '').trim(),
        duration: duration ? String(duration).trim() : null,
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        presentationUrl: presentationUrl ? String(presentationUrl).trim() : null,
        authorBioUk: authorBioUk ? String(authorBioUk).trim() : null,
        authorBioEn: authorBioEn ? String(authorBioEn).trim() : null,
        sources: sources
          ? JSON.stringify(Array.isArray(sources) ? sources : parseLectureSources(String(sources)))
          : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        eventCity: eventCity ? String(eventCity).trim() : null,
        eventDate: eventDate ? String(eventDate).trim() : null,
        eventPhotosUrl: eventPhotosUrl ? String(eventPhotosUrl).trim() : null,
        isPublic: false,
      })
      .select('*')
      .single()

    if (error || !lecture) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const locale = resolveLocale(req)
    return NextResponse.json(mapLectureRow(lecture as Record<string, unknown>, locale), { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
