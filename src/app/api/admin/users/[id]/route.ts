import { NextRequest, NextResponse } from 'next/server'
import { sendApprovalEmail } from '@/lib/email'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { status, role } = body

    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, name, status')
      .eq('id', id)
      .maybeSingle()

    if (!existingProfile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const wasApproved = existingProfile.status !== 'approved' && status === 'approved'

    const data: { status?: string; role?: string } = {}
    if (status) data.status = status
    if (role) data.role = role

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .update(data)
      .eq('id', id)
      .select('id, name, status, role')
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Get user email from auth
    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(id)

    // Send approval email if user was just approved
    if (wasApproved && authUser?.email) {
      try {
        await sendApprovalEmail(authUser.email, profile.name)
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
      }
    }

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
