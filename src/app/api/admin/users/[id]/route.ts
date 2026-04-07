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

    const { data: existingUser } = await supabaseAdmin
      .from('User')
      .select('id, name, email, status')
      .eq('id', id)
      .maybeSingle()

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const wasApproved = existingUser.status !== 'approved' && status === 'approved'

    const data: { status?: string; role?: string } = {}
    if (status) data.status = status
    if (role) data.role = role

    const { data: user, error } = await supabaseAdmin
      .from('User')
      .update(data)
      .eq('id', id)
      .select('id, name, email, status, role')
      .single()

    if (error || !user) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Send approval email if user was just approved
    if (wasApproved) {
      try {
        await sendApprovalEmail(user.email, user.name)
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError)
      }
    }

    return NextResponse.json(user)
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

    const { error } = await supabaseAdmin.from('User').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
