import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeLectureCategory } from '@/constants/lectureCategories'

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

    const normalizedCategory = normalizeLectureCategory(String(lecture.category ?? ''))

    return NextResponse.json({
      ...lecture,
      category: normalizedCategory?.category ?? lecture.category,
      categoryColor: normalizedCategory?.categoryColor ?? lecture.categoryColor,
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

    const candidateCategory = typeof rest.category === 'string'
      ? rest.category
      : lecture.category
    const normalizedCategory = normalizeLectureCategory(String(candidateCategory ?? ''))
    if (!normalizedCategory) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    if (rest.categoryColor !== undefined && rest.categoryColor !== normalizedCategory.categoryColor) {
      return NextResponse.json({ error: 'Invalid lecture category' }, { status: 400 })
    }

    const data = {
      ...rest,
      category: normalizedCategory.category,
      categoryColor: normalizedCategory.categoryColor,
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
