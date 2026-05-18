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
    if (isPublic) {
      const { data: lectureData, error: lectureFetchError } = await supabaseAdmin
        .from('Lecture')
        .select('eventId')
        .eq('id', id)
        .single()

      if (lectureFetchError || !lectureData) {
        return NextResponse.json({ error: 'Lecture not found' }, { status: 404 })
      }

      const { data: eventData, error: eventFetchError } = await supabaseAdmin
        .from('Event')
        .select('isPublic')
        .eq('id', lectureData.eventId)
        .single()

      if (eventFetchError || !eventData) {
        return NextResponse.json({ error: 'Parent event not found' }, { status: 404 })
      }

      if (!eventData.isPublic) {
        return NextResponse.json({ 
          error: 'CANNOT_PUBLISH_LECTURE_WITHOUT_EVENT',
          message: 'Cannot publish a lecture when its parent event is a draft.' 
        }, { status: 400 })
      }
    }

    const { data: lecture, error } = await supabaseAdmin
      .from('Lecture')
      .update({ isPublic })
      .eq('id', id)
      .select('*, eventId')
      .single()

    if (error || !lecture) {
      console.error('Failed to update lecture:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    let remainingPublicCount = 0
    if (!isPublic) {
      const { count } = await supabaseAdmin
        .from('Lecture')
        .select('*', { count: 'exact', head: true })
        .eq('eventId', lecture.eventId)
        .eq('isPublic', true)
      remainingPublicCount = count || 0
    }

    return NextResponse.json({
      ...lecture,
      remainingPublicCount,
      message: isPublic ? 'Lecture approved and published' : 'Lecture unpublished',
    })
  } catch (error) {
    console.error('Error updating lecture approval:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
