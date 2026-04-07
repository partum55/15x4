import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id, passwordHash, status, role')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const status = user.status as 'pending_email' | 'pending_approval' | 'approved'
    const role = (user.role ?? 'user') as 'user' | 'admin'
    await createSession({ userId: user.id, status, role })
    return NextResponse.json({ ok: true, status })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
