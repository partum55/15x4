import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

function parsePositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) return fallback
  return Math.min(Math.floor(parsed), max)
}

function sanitizeSearch(value: string | null) {
  return value?.replace(/[%,()]/g, ' ').trim() ?? ''
}

export async function GET(req: Request) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const limit = parsePositiveInt(searchParams.get('limit'), 100, 100)
    const offset = parsePositiveInt(searchParams.get('offset'), 0, 100000)
    const search = sanitizeSearch(searchParams.get('search'))
    const category = searchParams.get('category')?.trim()
    const status = searchParams.get('status')
    const sort = searchParams.get('sort')

    let query = supabaseAdmin
      .from('Lecture')
      .select('id, titleUk, titleEn, authorUk, authorEn, category, categoryColor, isPublic, createdAt, userId', { count: 'exact' })

    if (category) {
      query = query.eq('category', category)
    }

    if (status === 'public') {
      query = query.eq('isPublic', true)
    } else if (status === 'draft') {
      query = query.eq('isPublic', false)
    }

    if (search) {
      const pattern = `%${search}%`
      query = query.or(
        `titleUk.ilike.${pattern},titleEn.ilike.${pattern},authorUk.ilike.${pattern},authorEn.ilike.${pattern}`,
      )
    }

    if (sort === 'titleAZ' || sort === 'titleZA') {
      query = query.order('titleUk', { ascending: sort === 'titleAZ' })
    } else if (sort === 'oldest') {
      query = query.order('createdAt', { ascending: true })
    } else {
      query = query.order('createdAt', { ascending: false })
    }

    const { data: lectures, error, count } = await query.range(offset, offset + limit - 1)

    if (error || !lectures) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const userIds = [...new Set(lectures.map((lecture) => lecture.userId).filter(Boolean))]
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from('profiles').select('id, name').in('id', userIds)
      : { data: [] as Array<{ id: string; name: string }> }

    const profilesById = new Map((profiles ?? []).map((p) => [p.id, { ...p, email: '' }]))
    const response = lectures.map((lecture) => ({
      ...lecture,
      title: lecture.titleUk,
      author: lecture.authorUk,
      user: lecture.userId ? profilesById.get(lecture.userId) ?? null : null,
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
