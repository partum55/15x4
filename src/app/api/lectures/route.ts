import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

type Locale = 'uk' | 'en'

function resolveLocale(req: NextRequest): Locale {
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

async function ensureApprovedUser(userId: string, supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: profile } = await supabase
    .from('profiles')
    .select('status')
    .eq('id', userId)
    .maybeSingle()

  let profileStatus = profile?.status ?? null
  if (!profileStatus) {
    const { data: adminProfile, error: adminProfileError } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('id', userId)
      .maybeSingle()

    if (adminProfileError) {
      return { ok: false, error: 'Failed to verify account status', status: 500 as const }
    }
    profileStatus = adminProfile?.status ?? null
  }

  if (profileStatus !== 'approved') {
    return { ok: false, error: 'Account not approved', status: 403 as const }
  }

  return { ok: true as const }
}

export async function GET(req: NextRequest) {
  try {
    const locale = resolveLocale(req)
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    let query = supabase.from('Lecture').select('*').order('createdAt', { ascending: false })
    if (user) {
      query = query.or(`isPublic.eq.true,userId.eq.${user.id}`)
    } else {
      query = query.eq('isPublic', true)
    }

    const { data: lectures, error } = await query
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

    const approval = await ensureApprovedUser(user.id, supabase)
    if (!approval.ok) {
      return NextResponse.json({ error: approval.error }, { status: approval.status })
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
