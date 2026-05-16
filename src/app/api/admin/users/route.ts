import { NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { parsePositiveInt, sanitizeSearch } from '@/lib/content-api'
import { isProfileRole } from '@/lib/roles'

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
    const role = searchParams.get('role')
    const sort = searchParams.get('sort')
    let emailMap = new Map<string, string>()
    let emailMatchedIds: string[] = []

    if (search) {
      const { data: { users: authUsers } } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 })
      emailMap = new Map(authUsers.map((authUser) => [authUser.id, authUser.email ?? '']))
      const normalizedSearch = search.toLowerCase()
      emailMatchedIds = authUsers
        .filter((authUser) => authUser.email?.toLowerCase().includes(normalizedSearch))
        .map((authUser) => authUser.id)
    }

    let query = supabaseAdmin
      .from('profiles')
      .select('id, name, role, created_at', { count: 'exact' })

    if (isProfileRole(role)) {
      query = query.eq('role', role)
    }

    if (search) {
      const pattern = `%${search}%`
      const emailFilter = emailMatchedIds.length ? `,id.in.(${emailMatchedIds.join(',')})` : ''
      query = query.or(`name.ilike.${pattern},role.ilike.${pattern}${emailFilter}`)
    }

    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'nameAZ' || sort === 'nameZA') {
      query = query.order('name', { ascending: sort === 'nameAZ', nullsFirst: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data: profiles, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    if (!search) {
      const emailEntries = await Promise.all(
        (profiles ?? []).map(async (profile) => {
          const { data } = await supabaseAdmin.auth.admin.getUserById(profile.id)
          return [profile.id, data.user?.email ?? ''] as const
        }),
      )
      emailMap = new Map(emailEntries)
    }
    
    const users = (profiles ?? []).map(p => ({
      id: p.id,
      name: p.name,
      email: emailMap.get(p.id) ?? '',
      role: p.role,
      createdAt: p.created_at,
    }))

    const total = count ?? users.length
    return NextResponse.json({
      items: users,
      total,
      limit,
      offset,
      hasMore: offset + users.length < total,
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
