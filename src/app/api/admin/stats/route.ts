import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

function normalizeLecturerKey(value: unknown) {
  return typeof value === 'string' ? value.trim().toLocaleLowerCase('uk') : ''
}

export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [usersResult, lecturesResult, eventsResult, lecturerRowsResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Lecture').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Event').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('Lecture')
        .select('"authorUk", "authorEn", "userId"'),
    ])

    const uniqueLectors = new Set(
      (lecturerRowsResult.data ?? [])
        .map((lecture) => {
          const authorUk = normalizeLecturerKey(lecture.authorUk)
          const authorEn = normalizeLecturerKey(lecture.authorEn)
          const userId = typeof lecture.userId === 'string' ? lecture.userId : ''

          return authorUk || authorEn || (userId ? `user:${userId}` : '')
        })
        .filter(Boolean),
    )

    return NextResponse.json({
      users: usersResult.count ?? 0,
      lectures: lecturesResult.count ?? 0,
      events: eventsResult.count ?? 0,
      lectors: uniqueLectors.size,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
