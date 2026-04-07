import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await getSession()

    const baseQuery = supabaseAdmin
      .from('Lecture')
      .select('*')
      .order('createdAt', { ascending: false })

    const query = session
      ? baseQuery.or(`isPublic.eq.true,userId.eq.${session.userId}`)
      : baseQuery.eq('isPublic', true)

    const { data: lectures, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const parsed = (lectures ?? []).map((l) => ({
      ...l,
      sources: l.sources ? JSON.parse(l.sources) : null,
      socialLinks: l.socialLinks ? JSON.parse(l.socialLinks) : null,
    }))

    return NextResponse.json(parsed)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (session.status !== 'approved') return NextResponse.json({ error: 'Account not approved' }, { status: 403 })

    const body = await req.json()
    const { category, categoryColor, author, image, title, summary, duration, videoUrl, authorBio, sources, socialLinks, eventCity, eventDate, eventPhotosUrl } = body

    if (!category || !categoryColor || !author || !image || !title || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: lecture, error } = await supabaseAdmin
      .from('Lecture')
      .insert({
        category,
        categoryColor,
        author,
        image,
        title,
        summary,
        duration,
        videoUrl,
        authorBio,
        eventCity,
        eventDate,
        eventPhotosUrl,
        sources: sources ? JSON.stringify(sources) : null,
        socialLinks: socialLinks ? JSON.stringify(socialLinks) : null,
        isPublic: false,
        userId: session.userId,
      })
      .select('*')
      .single()

    if (error || !lecture) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(lecture, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
