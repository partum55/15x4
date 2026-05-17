import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isProfileRole } from '@/lib/roles'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { role } = body

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('id', id)
      .maybeSingle()

    if (!existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (!isProfileRole(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Protection: Don't allow demoting yourself from admin
    if (id === session.userId && role !== 'admin') {
      return NextResponse.json({ error: 'Cannot demote yourself from admin' }, { status: 400 })
    }

    // Protection: Don't allow demoting the last admin
    if (role !== 'admin') {
      const { data: currentProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', id)
        .single()

      if (currentProfile?.role === 'admin') {
        const { count } = await supabaseAdmin
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'admin')

        if (count && count <= 1) {
          return NextResponse.json({ error: 'Cannot demote the last administrator' }, { status: 400 })
        }
      }
    }

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update({ role })
      .eq('id', id)
      .select('id, name, role')
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Get user email from auth
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(id)

    return NextResponse.json({
      ...profile,
      email: authUser?.email ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    // Don't allow deleting yourself
    if (id === session.userId) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Protection: Don't allow deleting the last admin
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', id)
      .single()

    if (currentProfile?.role === 'admin') {
      const { count } = await supabaseAdmin
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')

      if (count && count <= 1) {
        return NextResponse.json({ error: 'Cannot delete the last administrator' }, { status: 400 })
      }
    }

    // Delete from auth (will cascade to profiles due to FK)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
