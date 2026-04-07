import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let query = supabase
      .from('Lecture')
      .select('*')
      .order('createdAt', { ascending: false })

    if (user) {
      query = query.or(`isPublic.eq.true,userId.eq.${user.id}`)
    } else {
      query = query.eq('isPublic', true)
    }

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
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Check if user is approved
    const { data: profile } = await supabase
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single()

    if (profile?.status !== 'approved') {
      return NextResponse.json({ error: 'Account not approved' }, { status: 403 })
    }

    const body = await req.json()
    const { category, categoryColor, author, image, title, summary, duration, videoUrl, authorBio, sources, socialLinks, eventCity, eventDate, eventPhotosUrl } = body

    if (!category || !categoryColor || !author || !image || !title || !summary) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: lecture, error } = await supabase
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
        userId: user.id,
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
