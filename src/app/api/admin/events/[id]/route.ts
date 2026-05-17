import { NextRequest, NextResponse } from 'next/server'
import { requireAdminSession } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { error } = await supabaseAdmin.from('Event').delete().eq('id', id)
    if (error) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdminSession()
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const { isPublic } = await req.json()

    const { data: event, error: eventError } = await supabaseAdmin
      .from('Event')
      .update({ isPublic: !!isPublic })
      .eq('id', id)
      .select('id')
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { error: lecturesError } = await supabaseAdmin
      .from('Lecture')
      .update({ isPublic: !!isPublic })
      .eq('eventId', id)

    if (lecturesError) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
