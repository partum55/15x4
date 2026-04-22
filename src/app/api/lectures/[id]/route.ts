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

function validCategoryPair(category: string, categoryColor: string) {
  return (
    (category === 'tech' && categoryColor === 'blue') ||
    (category === 'nature' && categoryColor === 'green') ||
    (category === 'artes' && categoryColor === 'red') ||
    (category === 'wild-card' && categoryColor === 'orange')
  )
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const locale = resolveLocale(req)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const role = user ? await getProfileRole(user.id, supabase) : null

    const { data: lecture } = await supabase.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (!lecture.isPublic && (!user || lecture.userId !== user.id || !canManageContent(role))) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const mapped = mapLectureRow(lecture as Record<string, unknown>, locale)
    return NextResponse.json({
      ...mapped,
      userId: lecture.userId === user?.id ? lecture.userId : undefined,
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

    const { data: lecture } = await supabase.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    const normalizedCategory = String(category ?? lecture.category)
    const normalizedCategoryColor = String(categoryColor ?? lecture.categoryColor)

    if (!validCategoryPair(normalizedCategory, normalizedCategoryColor)) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    const data = {
      eventId: eventId ?? lecture.eventId,
      slot: slot ? Number(slot) : lecture.slot,
      category: normalizedCategory,
      categoryColor: normalizedCategoryColor,
      authorUk: authorUk !== undefined ? String(authorUk).trim() : lecture.authorUk,
      authorEn: authorEn !== undefined ? String(authorEn).trim() : lecture.authorEn,
      image: image !== undefined ? String(image).trim() : lecture.image,
      titleUk: titleUk !== undefined ? String(titleUk).trim() : lecture.titleUk,
      titleEn: titleEn !== undefined ? String(titleEn).trim() : lecture.titleEn,
      summaryUk: summaryUk !== undefined ? String(summaryUk).trim() : lecture.summaryUk,
      summaryEn: summaryEn !== undefined ? String(summaryEn).trim() : lecture.summaryEn,
      duration: duration !== undefined ? (duration ? String(duration).trim() : null) : lecture.duration,
      videoUrl: videoUrl !== undefined ? (videoUrl ? String(videoUrl).trim() : null) : lecture.videoUrl,
      authorBioUk: authorBioUk !== undefined ? (authorBioUk ? String(authorBioUk).trim() : null) : lecture.authorBioUk,
      authorBioEn: authorBioEn !== undefined ? (authorBioEn ? String(authorBioEn).trim() : null) : lecture.authorBioEn,
      sources: sources !== undefined ? (sources ? JSON.stringify(sources) : null) : lecture.sources,
      socialLinks: socialLinks !== undefined ? (socialLinks ? JSON.stringify(socialLinks) : null) : lecture.socialLinks,
      eventCity: eventCity !== undefined ? (eventCity ? String(eventCity).trim() : null) : lecture.eventCity,
      eventDate: eventDate !== undefined ? (eventDate ? String(eventDate).trim() : null) : lecture.eventDate,
      eventPhotosUrl: eventPhotosUrl !== undefined ? (eventPhotosUrl ? String(eventPhotosUrl).trim() : null) : lecture.eventPhotosUrl,
    }

    const { data: updated, error } = await supabase
      .from('Lecture')
      .update(data)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !updated) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const locale = resolveLocale(req)
    return NextResponse.json(mapLectureRow(updated as Record<string, unknown>, locale))
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

    const { data: lecture } = await supabase.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabase.from('Lecture').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
