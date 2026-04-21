import { NextRequest, NextResponse } from 'next/server'
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
    const { isPublic } = body

    // Validate the request
    if (typeof isPublic !== 'boolean') {
      return NextResponse.json({ error: 'isPublic must be a boolean' }, { status: 400 })
    }

    // Update lecture's isPublic status
    const { data: lecture, error } = await supabaseAdmin
      .from('Lecture')
      .update({ isPublic })
      .eq('id', id)
      .select()
      .single()

    if (error || !lecture) {
      console.error('Failed to update lecture:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json({
      ...lecture,
      message: isPublic ? 'Lecture approved and published' : 'Lecture unpublished',
    })
  } catch (error) {
    console.error('Error updating lecture approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
