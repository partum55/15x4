import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parsePositiveInt, resolveLocaleFromUrl, sanitizeSearch } from '@/lib/content-api'

export async function GET(req: Request) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const locale = resolveLocaleFromUrl(req)
    const limit = parsePositiveInt(searchParams.get('limit'), 100, 100)
    const offset = parsePositiveInt(searchParams.get('offset'), 0, 100000)
    const search = sanitizeSearch(searchParams.get('search'))
    const status = searchParams.get('status')
    const sort = searchParams.get('sort')

    let query = supabaseAdmin
      .from('Event')
      .select('id, titleUk, titleEn, cityUk, cityEn, date, locationUk, locationEn, time, image, isPublic, createdAt, userId', { count: 'exact' })

    if (status === 'public') {
      query = query.eq('isPublic', true)
    } else if (status === 'draft') {
      query = query.eq('isPublic', false)
    }

    if (search) {
      const pattern = `%${search}%`
      query = query.or(
        `titleUk.ilike.${pattern},titleEn.ilike.${pattern},cityUk.ilike.${pattern},cityEn.ilike.${pattern},locationUk.ilike.${pattern},locationEn.ilike.${pattern}`,
      )
    }

    if (sort === 'oldest') {
      query = query.order('date', { ascending: true }).order('time', { ascending: true })
    } else if (sort === 'created') {
      query = query.order('createdAt', { ascending: false })
    } else if (sort === 'titleAZ' || sort === 'titleZA') {
      query = query.order(locale === 'en' ? 'titleEn' : 'titleUk', { ascending: sort === 'titleAZ' })
    } else {
      query = query.order('date', { ascending: false }).order('time', { ascending: false })
    }

    const { data: events, error, count } = await query.range(offset, offset + limit - 1)

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
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
    const emailMap = new Map(authUsers.map(u => [u.id, u.email]))

    const profilesById = new Map((profiles ?? []).map((p) => [p.id, { ...p, email: emailMap.get(p.id) ?? '' }]))
    const lecturesCountByEventId = new Map<string, number>()
    for (const lecture of lectures ?? []) {
      lecturesCountByEventId.set(lecture.eventId, (lecturesCountByEventId.get(lecture.eventId) ?? 0) + 1)
    }

    const response = events.map((event) => ({
      ...event,
      title: locale === 'en' ? event.titleEn ?? event.titleUk : event.titleUk ?? event.titleEn,
      city: locale === 'en' ? event.cityEn ?? event.cityUk : event.cityUk ?? event.cityEn,
      location: locale === 'en' ? event.locationEn ?? event.locationUk : event.locationUk ?? event.locationEn,
      user: event.userId ? profilesById.get(event.userId) ?? null : null,
      _count: { lectures: lecturesCountByEventId.get(event.id) ?? 0 },
    }))

    const total = count ?? response.length
    return NextResponse.json({
      items: response,
      total,
      limit,
      offset,
      hasMore: offset + response.length < total,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
