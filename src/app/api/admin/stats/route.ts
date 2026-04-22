import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [usersResult, lecturesResult, eventsResult, lectorsResult] = await Promise.all([
      supabaseAdmin.from('profiles').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Lecture').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Event').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'lector'),
    ])

    return NextResponse.json({
      users: usersResult.count ?? 0,
      lectures: lecturesResult.count ?? 0,
      events: eventsResult.count ?? 0,
      lectors: lectorsResult.count ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
