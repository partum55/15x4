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
      .select('id, title, author, category, categoryColor, isPublic, createdAt, userId')
      .order('createdAt', { ascending: false })

    if (error || !lectures) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    const userIds = [...new Set(lectures.map((lecture) => lecture.userId).filter(Boolean))]
    const { data: users } = userIds.length
      ? await supabaseAdmin.from('User').select('id, name, email').in('id', userIds)
      : { data: [] as Array<{ id: string; name: string; email: string }> }

    const usersById = new Map((users ?? []).map((user) => [user.id, user]))
    const response = lectures.map((lecture) => ({
      ...lecture,
      user: lecture.userId ? usersById.get(lecture.userId) ?? null : null,
    }))

    return NextResponse.json(response)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
