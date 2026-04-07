import { NextRequest, NextResponse } from 'next/server'
import { createSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    
    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id, role, status')
      .eq('emailToken', token)
      .maybeSingle()

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    if (user.status !== 'pending_email') {
      return NextResponse.json({ error: 'Email already confirmed' }, { status: 400 })
    }

    await supabaseAdmin
      .from('User')
      .update({ status: 'pending_approval', emailToken: null })
      .eq('id', user.id)

    const role = (user.role ?? 'user') as 'user' | 'admin'
    await createSession({ userId: user.id, status: 'pending_approval', role })
    return NextResponse.json({ ok: true, status: 'pending_approval' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url))
    }

    const { data: user } = await supabaseAdmin
      .from('User')
      .select('id, role, status')
      .eq('emailToken', token)
      .maybeSingle()

    if (!user || user.status !== 'pending_email') {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url))
    }

    await supabaseAdmin
      .from('User')
      .update({ status: 'pending_approval', emailToken: null })
      .eq('id', user.id)

    const role = (user.role ?? 'user') as 'user' | 'admin'
    await createSession({ userId: user.id, status: 'pending_approval', role })
    return NextResponse.redirect(new URL('/wait-approval', req.url))
  } catch {
    return NextResponse.redirect(new URL('/login?error=server_error', req.url))
  }
}
