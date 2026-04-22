import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get profiles with user emails from auth.users
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('id, name, role, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Fetch emails from auth.users for each profile
    const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers()
    
    const emailMap = new Map(authUsers.map(u => [u.id, u.email]))
    
    const users = (profiles ?? []).map(p => ({
      id: p.id,
      name: p.name,
      email: emailMap.get(p.id) ?? '',
      role: p.role,
      createdAt: p.created_at,
    }))

    return NextResponse.json(users)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
