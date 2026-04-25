import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getProfileRole, requireContentRole } from '@/lib/authz'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Locale = 'uk' | 'en'

function resolveLocale(req: NextRequest): Locale {
  const queryLocale = req.nextUrl.searchParams.get('locale')
  if (queryLocale === 'en') return 'en'
  const cookie = req.cookies.get('i18nextLng')?.value
  return cookie === 'en' ? 'en' : 'uk'
}

function safeParse(value: unknown) {
  if (!value) return null
  try { return JSON.parse(String(value)) } catch { return null }
}

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch { return false }
}

function mapLectureRow(row: Record<string, unknown>, locale: Locale) {
  return {
    ...row,
    title: locale === 'en' ? row.titleEn ?? row.titleUk : row.titleUk ?? row.titleEn,
    author: locale === 'en' ? row.authorEn ?? row.authorUk : row.authorUk ?? row.authorEn,
    summary: locale === 'en' ? row.summaryEn ?? row.summaryUk : row.summaryUk ?? row.summaryEn,
    authorBio: locale === 'en' ? row.authorBioEn ?? row.authorBioUk : row.authorBioUk ?? row.authorBioEn,
    sources: safeParse(row.sources),
    socialLinks: safeParse(row.socialLinks),
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

    const queryClient = role === 'admin' ? supabaseAdmin : supabase
    const { data: lecture } = await queryClient.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const canReadPrivate = Boolean(user && (lecture.userId === user.id || role === 'admin'))
    if (!lecture.isPublic && !canReadPrivate) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const mapped = mapLectureRow(lecture as Record<string, unknown>, locale)
    return NextResponse.json({
      ...mapped,
      userId: lecture.userId === user?.id || role === 'admin' ? lecture.userId : undefined,
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

    const queryClient = access.role === 'admin' ? supabaseAdmin : supabase
    const { data: lecture } = await queryClient.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

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

    if (titleUk !== undefined && !data.titleUk) {
      return NextResponse.json({ error: 'titleUk cannot be empty' }, { status: 400 })
    }
    if (authorUk !== undefined && !data.authorUk) {
      return NextResponse.json({ error: 'authorUk cannot be empty' }, { status: 400 })
    }
    if (summaryUk !== undefined && !data.summaryUk) {
      return NextResponse.json({ error: 'summaryUk cannot be empty' }, { status: 400 })
    }
    if (image !== undefined && !data.image) {
      return NextResponse.json({ error: 'image cannot be empty' }, { status: 400 })
    }
    if (image !== undefined && data.image && !isValidHttpUrl(data.image)) {
      return NextResponse.json({ error: 'image must be a valid http/https URL' }, { status: 400 })
    }

    const { data: updated, error } = await queryClient
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

    const queryClient = access.role === 'admin' ? supabaseAdmin : supabase
    const { data: lecture } = await queryClient.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== user.id && access.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await queryClient.from('Lecture').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
