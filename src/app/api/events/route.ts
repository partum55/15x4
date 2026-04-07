import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { normalizeLectureCategory } from '@/constants/lectureCategories'

function attachEventLectures(
  events: Array<Record<string, unknown>>,
  eventLectures: Array<Record<string, unknown>>,
) {
  const grouped = new Map<string, Array<Record<string, unknown>>>()
  for (const lecture of eventLectures) {
    const normalizedCategory = normalizeLectureCategory(String(lecture.category ?? ''))
    const normalizedLecture = {
      ...lecture,
      category: normalizedCategory?.category ?? lecture.category,
      categoryColor: normalizedCategory?.categoryColor ?? lecture.categoryColor,
    }

    const eventId = String(lecture.eventId)
    const current = grouped.get(eventId) ?? []
    current.push(normalizedLecture)
    grouped.set(eventId, current)
  }

  return events.map((event) => ({
    ...event,
    lectures: grouped.get(String(event.id)) ?? [],
  }))
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase.from('Event').select('*').order('createdAt', { ascending: false })
    
    if (user) {
      query = query.or(`isPublic.eq.true,userId.eq.${user.id}`)
    } else {
      query = query.eq('isPublic', true)
    }

    const { data: events, error } = await query
    if (error || !events) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const eventIds = events.map((event) => event.id)
    const { data: lectures, error: lecturesError } = eventIds.length
      ? await supabase.from('EventLecture').select('*').in('eventId', eventIds)
      : { data: [] as Array<Record<string, unknown>>, error: null }

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const sanitizedEvents = (events as Array<Record<string, unknown>>).map((event) => ({
      ...event,
      userId: event.userId === user?.id ? event.userId : undefined,
    }))

    const response = attachEventLectures(sanitizedEvents, (lectures ?? []) as Array<Record<string, unknown>>)

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .maybeSingle()

    let profileStatus = profile?.status ?? null

    if (!profileStatus) {
      const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
        .from('profiles')
        .select('status')
        .eq('id', user.id)
        .maybeSingle()

      if (adminProfileError) {
        return NextResponse.json({ error: 'Failed to verify account status' }, { status: 500 })
      }

      profileStatus = adminProfile?.status ?? null
    }

    if (profileStatus !== 'approved') {
      return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
    }

    const body = await req.json()
    const { city, date, location, time, image, registrationUrl, lectures } = body

    if (!city || !date || !location || !time || !image) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: event, error: eventError } = await supabase
      .from('Event')
      .insert({
        city,
        date,
        location,
        time,
        image,
        registrationUrl: registrationUrl ?? null,
        isPublic: false,
        userId: user.id,
      })
      .select('*')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const rawLectures = Array.isArray(lectures) ? lectures : []
    const preparedLectures = rawLectures
      .map((lecture) => {
        const raw = lecture as {
          title?: string
          author?: string
          category?: string
          categoryColor?: string
          image?: string
          summary?: string
          lectureId?: string
        }

        return {
          title: raw.title?.trim() ?? '',
          author: raw.author?.trim() ?? '',
          category: raw.category?.trim() ?? '',
          categoryColor: raw.categoryColor,
          image: raw.image?.trim() ?? '',
          summary: raw.summary?.trim() ?? '',
          lectureId: raw.lectureId,
        }
      })
      .filter((lecture) =>
        lecture.title || lecture.author || lecture.category || lecture.image || lecture.summary,
      )

    const invalidLecture = preparedLectures.find(
      (lecture) => !lecture.title || !lecture.author || !lecture.category || !lecture.image || !lecture.summary,
    )
    if (invalidLecture) {
      return NextResponse.json({ error: 'Invalid lecture payload' }, { status: 400 })
    }

    const normalizedLectures = preparedLectures.map((lecture) => {
      const normalizedCategory = normalizeLectureCategory(lecture.category)
      if (!normalizedCategory) {
        return null
      }

      if (
        lecture.categoryColor !== undefined &&
        lecture.categoryColor !== normalizedCategory.categoryColor
      ) {
        return null
      }

      return {
        title: lecture.title,
        author: lecture.author,
        category: normalizedCategory.category,
        categoryColor: normalizedCategory.categoryColor,
        image: lecture.image,
        summary: lecture.summary,
        lectureId: lecture.lectureId ?? null,
      }
    })

    if (normalizedLectures.some((lecture) => lecture === null)) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    const eventLectures = (normalizedLectures as Array<{
      title: string
      author: string
      category: string
      categoryColor: string
      image: string
      summary: string
      lectureId: string | null
    }>).map((lecture) => ({
      ...lecture,
      eventId: event.id,
    }))

    const { data: createdLectures, error: lecturesError } = eventLectures.length
      ? await supabase.from('EventLecture').insert(eventLectures).select('*')
      : { data: [], error: null }

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ...event, lectures: createdLectures ?? [] }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
