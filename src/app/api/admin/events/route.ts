import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: events, error } = await supabaseAdmin
      .from('Event')
      .select('id, city, date, location, time, isPublic, createdAt, userId')
      .order('createdAt', { ascending: false })

    if (error || !events) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const eventIds = events.map((event) => event.id)
    const userIds = [...new Set(events.map((event) => event.userId).filter(Boolean))]

    const [{ data: lectures }, { data: users }] = await Promise.all([
      eventIds.length
        ? supabaseAdmin.from('EventLecture').select('id, eventId').in('eventId', eventIds)
        : Promise.resolve({ data: [] as Array<{ id: string; eventId: string }> }),
      userIds.length
        ? supabaseAdmin.from('User').select('id, name, email').in('id', userIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string; email: string }> }),
    ])

    const usersById = new Map((users ?? []).map((user) => [user.id, user]))
    const lecturesCountByEventId = new Map<string, number>()
    for (const lecture of lectures ?? []) {
      lecturesCountByEventId.set(lecture.eventId, (lecturesCountByEventId.get(lecture.eventId) ?? 0) + 1)
    }

    const response = events.map((event) => ({
      ...event,
      user: event.userId ? usersById.get(event.userId) ?? null : null,
      _count: { lectures: lecturesCountByEventId.get(event.id) ?? 0 },
    }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
