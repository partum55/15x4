import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireContentRole } from '@/lib/authz'
import {
  isValidLectureCategory,
  isValidHttpUrl,
  isValidOptionalHttpUrl,
  mapLectureRow,
  parseLectureSources,
  parsePositiveInt,
  resolveLocale,
  sanitizeSearch,
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
    const status = searchParams.get('status')?.trim()
    const sort = searchParams.get('sort')
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const sortByEventDate = sort === 'dateAsc' || sort === 'dateDesc' || !sort
    let query = wantsPagination && !sortByEventDate
      ? supabase.from('Lecture').select('*, Event!inner(date, time)', { count: 'exact' })
      : supabase.from('Lecture').select('*, Event!inner(date, time)')

    if (scope === 'mine') {
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      query = query.eq('userId', user.id)
      if (status === 'public') query = query.eq('isPublic', true)
      if (status === 'draft') query = query.eq('isPublic', false)
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
    } else if (sortByEventDate) {
      query = query.order('createdAt', { ascending: false })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    if (wantsPagination && !sortByEventDate) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: lectures, error, count } = await query
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const sortedLectures = sortByEventDate
      ? [...(lectures ?? [])].sort((a, b) => {
          const eventA = (a as { Event?: { date?: string | null; time?: string | null } }).Event
          const eventB = (b as { Event?: { date?: string | null; time?: string | null } }).Event
          const dateA = `${eventA?.date ?? ''}T${eventA?.time ?? ''}`
          const dateB = `${eventB?.date ?? ''}T${eventB?.time ?? ''}`
          const dateCompare = dateA.localeCompare(dateB)
          if (dateCompare !== 0) return sort === 'dateAsc' ? dateCompare : -dateCompare
          return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? '')) * (sort === 'dateAsc' ? 1 : -1)
        })
      : (lectures ?? [])

    const visibleLectures = wantsPagination && sortByEventDate
      ? sortedLectures.slice(offset, offset + limit)
      : sortedLectures

    const parsed = visibleLectures.map((lecture) => {
      const lectureRow = lecture as Record<string, unknown>
      const mapped = mapLectureRow(lectureRow, locale)
      return {
        ...mapped,
        userId: lectureRow.userId === user?.id ? lectureRow.userId : undefined,
      }
    })

    if (wantsPagination) {
      const total = sortByEventDate ? (lectures ?? []).length : count ?? parsed.length
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
      authorUk,
      authorEn,
      image,
      titleUk,
      titleEn,
      summaryUk,
      summaryEn,
      videoUrl,
      presentationUrl,
      authorBioUk,
      authorBioEn,
      sources,
    } = body

    if (!eventId || !slot || !category || !authorUk || !image || !titleUk || !summaryUk) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!isValidHttpUrl(String(image))) {
      return NextResponse.json({ error: 'image must be a valid http/https URL' }, { status: 400 })
    }

    if (!isValidLectureCategory(String(category))) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(videoUrl)) {
      return NextResponse.json({ error: 'videoUrl must be a valid http/https URL' }, { status: 400 })
    }

    if (!isValidOptionalHttpUrl(presentationUrl)) {
      return NextResponse.json({ error: 'presentationUrl must be a valid http/https URL' }, { status: 400 })
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
        authorUk: String(authorUk).trim(),
        authorEn: String(authorEn ?? '').trim(),
        image: String(image).trim(),
        titleUk: String(titleUk).trim(),
        titleEn: String(titleEn ?? '').trim(),
        summaryUk: String(summaryUk).trim(),
        summaryEn: String(summaryEn ?? '').trim(),
        videoUrl: videoUrl ? String(videoUrl).trim() : null,
        presentationUrl: presentationUrl ? String(presentationUrl).trim() : null,
        authorBioUk: authorBioUk ? String(authorBioUk).trim() : null,
        authorBioEn: authorBioEn ? String(authorBioEn).trim() : null,
        sources: sources
          ? JSON.stringify(Array.isArray(sources) ? sources : parseLectureSources(String(sources)))
          : null,
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
