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
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({ name: name.trim() })
      .eq('id', user.id)
      .select('id, name, role')
      .single()

    if (error || !profile) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    return NextResponse.json(profile)
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
