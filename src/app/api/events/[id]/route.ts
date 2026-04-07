import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeLectureCategory } from '@/constants/lectureCategories'

type EventLecturePayload = {
  title: string
  author: string
  category: string
  categoryColor?: string
  image: string
  summary: string
  lectureId?: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!event.isPublic && event.userId !== user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: lectures, error: lecturesError } = await supabase
      .from('EventLecture')
      .select('*')
      .eq('eventId', id)

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const normalizedLectures = (lectures ?? []).map((lecture) => {
      const normalizedCategory = normalizeLectureCategory(String(lecture.category ?? ''))

      return {
        ...lecture,
        category: normalizedCategory?.category ?? lecture.category,
        categoryColor: normalizedCategory?.categoryColor ?? lecture.categoryColor,
      }
    })

    return NextResponse.json({
      ...event,
      userId: event.userId === user?.id ? event.userId : undefined,
      lectures: normalizedLectures,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { city, date, location, time, image, registrationUrl, lectures } = await req.json()

    const { data: updated, error: updateError } = await supabase
      .from('Event')
      .update({
        city,
        date,
        location,
        time,
        image,
        registrationUrl: registrationUrl ?? null,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (updateError || !updated) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const { error: deleteLecturesError } = await supabase.from('EventLecture').delete().eq('eventId', id)
    if (deleteLecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const payloadLectures = Array.isArray(lectures) ? (lectures as EventLecturePayload[]) : []
    const preparedLectures = payloadLectures
      .map((lecture) => ({
        title: lecture.title?.trim() ?? '',
        author: lecture.author?.trim() ?? '',
        category: lecture.category?.trim() ?? '',
        categoryColor: lecture.categoryColor,
        image: lecture.image?.trim() ?? '',
        summary: lecture.summary?.trim() ?? '',
        lectureId: lecture.lectureId,
      }))
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
        eventId: id,
      }
    })

    if (normalizedLectures.some((lecture) => lecture === null)) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    const newEventLectures = normalizedLectures as Array<{
      title: string
      author: string
      category: string
      categoryColor: string
      image: string
      summary: string
      lectureId: string | null
      eventId: string
    }>

    const { data: insertedLectures, error: insertLecturesError } = newEventLectures.length
      ? await supabase.from('EventLecture').insert(newEventLectures).select('*')
      : { data: [], error: null }

    if (insertLecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ...updated, lectures: insertedLectures ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: event } = await supabase.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await supabase.from('EventLecture').delete().eq('eventId', id)
    const { error } = await supabase.from('Event').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
