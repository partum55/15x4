import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const session = await getSession()

    const { data: lecture } = await supabaseAdmin.from('Lecture').select('*').eq('id', id).maybeSingle()

    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (!lecture.isPublic && lecture.userId !== session?.userId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json({
      ...lecture,
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
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: lecture } = await supabaseAdmin.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const body = await req.json()
    const { sources, socialLinks, ...rest } = body
    const data = {
      ...rest,
      ...(sources !== undefined ? { sources: JSON.stringify(sources) } : {}),
      ...(socialLinks !== undefined ? { socialLinks: JSON.stringify(socialLinks) } : {}),
    }

    const { data: updated, error } = await supabaseAdmin
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
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: lecture } = await supabaseAdmin.from('Lecture').select('*').eq('id', id).maybeSingle()
    if (!lecture) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (lecture.userId !== session.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { error } = await supabaseAdmin.from('Lecture').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
