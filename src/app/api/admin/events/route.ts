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
      .select('id, titleUk, titleEn, cityUk, cityEn, date, locationUk, locationEn, time, image, isPublic, createdAt, userId')
      .order('createdAt', { ascending: false })

    if (error || !events) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const eventIds = events.map((event) => event.id)
    const userIds = [...new Set(events.map((event) => event.userId).filter(Boolean))]

    const [{ data: lectures }, { data: profiles }] = await Promise.all([
      eventIds.length
        ? supabaseAdmin.from('Lecture').select('id, eventId').in('eventId', eventIds)
        : Promise.resolve({ data: [] as Array<{ id: string; eventId: string }> }),
      userIds.length
        ? supabaseAdmin.from('profiles').select('id, name').in('id', userIds)
        : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    ])

    // Get emails from auth
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const emailMap = new Map(authUsers.map(u => [u.id, u.email]))

    const profilesById = new Map((profiles ?? []).map((p) => [p.id, { ...p, email: emailMap.get(p.id) ?? '' }]))
    const lecturesCountByEventId = new Map<string, number>()
    for (const lecture of lectures ?? []) {
      lecturesCountByEventId.set(lecture.eventId, (lecturesCountByEventId.get(lecture.eventId) ?? 0) + 1)
    }

    const response = events.map((event) => ({
      ...event,
      title: event.titleUk,
      city: event.cityUk,
      location: event.locationUk,
      user: event.userId ? profilesById.get(event.userId) ?? null : null,
      _count: { lectures: lecturesCountByEventId.get(event.id) ?? 0 },
    }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
