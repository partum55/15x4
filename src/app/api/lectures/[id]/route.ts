import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: lecture } = await supabase.from('Lecture').select('*').eq('id', id).maybeSingle()

    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!lecture.isPublic && lecture.userId !== user?.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...lecture,
      userId: lecture.userId === user?.id ? lecture.userId : undefined,
      sources: lecture.sources ? JSON.parse(lecture.sources) : null,
      socialLinks: lecture.socialLinks ? JSON.parse(lecture.socialLinks) : null,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: lecture } = await supabase.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { sources, socialLinks, ...rest } = body
    const data = {
      ...rest,
      ...(sources !== undefined ? { sources: JSON.stringify(sources) } : {}),
      ...(socialLinks !== undefined ? { socialLinks: JSON.stringify(socialLinks) } : {}),
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

    return NextResponse.json(updated)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
