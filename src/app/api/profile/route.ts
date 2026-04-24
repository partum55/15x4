import { NextRequest, NextResponse } from 'next/server'
import { getServerAuthUser } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const user = await getServerAuthUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    return NextResponse.json(user)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, city } = body

    if (name !== undefined && (typeof name !== 'string' || name.trim().length === 0)) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    if (city !== undefined && typeof city !== 'string') {
      return NextResponse.json({ error: 'City is invalid' }, { status: 400 })
    }

    const updates: { name?: string; city?: string } = {}
    if (name !== undefined) updates.name = name.trim()
    if (city !== undefined) updates.city = city.trim()

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select('id, name, city, role')
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
