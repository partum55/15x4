import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { data: lectures, error } = await supabaseAdmin
      .from('Lecture')
      .select('id, titleUk, titleEn, authorUk, authorEn, category, categoryColor, isPublic, createdAt, userId')
      .order('createdAt', { ascending: false })

    if (error || !lectures) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const userIds = [...new Set(lectures.map((lecture) => lecture.userId).filter(Boolean))]
    const { data: profiles } = userIds.length
      ? await supabaseAdmin.from('profiles').select('id, name').in('id', userIds)
      : { data: [] as Array<{ id: string; name: string }> }

    // Get emails from auth
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    const emailMap = new Map(authUsers.map(u => [u.id, u.email]))

    const profilesById = new Map((profiles ?? []).map((p) => [p.id, { ...p, email: emailMap.get(p.id) ?? '' }]))
    const response = lectures.map((lecture) => ({
      ...lecture,
      title: lecture.titleUk,
      author: lecture.authorUk,
      user: lecture.userId ? profilesById.get(lecture.userId) ?? null : null,
    }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
