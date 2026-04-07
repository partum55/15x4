import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

type EventLecturePayload = {
  title: string
  author: string
  category: string
  categoryColor: string
  image: string
  summary: string
  lectureId?: string
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    const { data: event } = await supabaseAdmin.from('Event').select('*').eq('id', id).maybeSingle()

    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!event.isPublic && event.userId !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { data: lectures, error: lecturesError } = await supabaseAdmin
      .from('EventLecture')
      .select('*')
      .eq('eventId', id)

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ...event, lectures: lectures ?? [] })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: event } = await supabaseAdmin.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { city, date, location, time, image, registrationUrl, lectures } = await req.json()

    const { data: updated, error: updateError } = await supabaseAdmin
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

    const { error: deleteLecturesError } = await supabaseAdmin.from('EventLecture').delete().eq('eventId', id)
    if (deleteLecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const payloadLectures = (lectures ?? []) as EventLecturePayload[]
    const newEventLectures = payloadLectures.map((l) => ({
      title: l.title,
      author: l.author,
      category: l.category,
      categoryColor: l.categoryColor,
      image: l.image,
      summary: l.summary,
      lectureId: l.lectureId ?? null,
      eventId: id,
    }))

    const { data: insertedLectures, error: insertLecturesError } = newEventLectures.length
      ? await supabaseAdmin.from('EventLecture').insert(newEventLectures).select('*')
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
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: event } = await supabaseAdmin.from('Event').select('*').eq('id', id).maybeSingle()
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (event.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    await supabaseAdmin.from('EventLecture').delete().eq('eventId', id)
    const { error } = await supabaseAdmin.from('Event').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
