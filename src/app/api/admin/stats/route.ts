import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [usersResult, lecturesResult, eventsResult, pendingResult] = await Promise.all([
      supabaseAdmin.from('User').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Lecture').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('Event').select('id', { count: 'exact', head: true }),
      supabaseAdmin
        .from('User')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_approval'),
    ])

    return NextResponse.json({
      users: usersResult.count ?? 0,
      lectures: lecturesResult.count ?? 0,
      events: eventsResult.count ?? 0,
      pending: pendingResult.count ?? 0,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
