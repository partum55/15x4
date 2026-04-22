import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { canManageContent } from '@/lib/roles'
import { getProfileRole, requireContentRole } from '@/lib/authz'

type Locale = 'uk' | 'en'

function resolveLocale(req: NextRequest): Locale {
  const queryLocale = req.nextUrl.searchParams.get('locale')
  if (queryLocale === 'en') return 'en'
  const cookie = req.cookies.get('i18nextLng')?.value
  return cookie === 'en' ? 'en' : 'uk'
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

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

function sanitizeSearch(value: string | null) {
  return value?.replace(/[%,()]/g, ' ').trim() ?? ''
}

function validCategoryPair(category: string, categoryColor: string) {
  return (
    (category === 'tech' && categoryColor === 'blue') ||
    (category === 'nature' && categoryColor === 'green') ||
    (category === 'artes' && categoryColor === 'red') ||
    (category === 'wild-card' && categoryColor === 'orange')
  )
}

export async function GET(req: NextRequest) {
  try {
    const locale = resolveLocale(req)
    const searchParams = req.nextUrl.searchParams
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

    const role = user ? await getProfileRole(user.id, supabase) : null
    let query = wantsPagination
      ? supabase.from('Lecture').select('*', { count: 'exact' })
      : supabase.from('Lecture').select('*')

    if (user && canManageContent(role)) {
      query = query.or(`isPublic.eq.true,userId.eq.${user.id}`)
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

    if (!validCategoryPair(String(category), String(categoryColor))) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
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
        authorBioUk: authorBioUk ? String(authorBioUk).trim() : null,
        authorBioEn: authorBioEn ? String(authorBioEn).trim() : null,
        sources: sources ? JSON.stringify(sources) : null,
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
