import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { createSession } from '@/lib/session'
import { sendConfirmationEmail } from '@/lib/email'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase()
    const { data: existing } = await supabaseAdmin
      .from('User')
      .select('id')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const emailToken = crypto.randomBytes(32).toString('hex')
    
    const { data: user, error: createError } = await supabaseAdmin
      .from('User')
      .insert({
        name,
        email: normalizedEmail,
        passwordHash,
        status: 'pending_email',
        role: 'user',
        emailToken,
      })
      .select('id, email')
      .single()

    if (createError || !user) {
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }

    // Send confirmation email
    try {
      await sendConfirmationEmail(user.email, emailToken)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Continue anyway - user can request resend later
    }

    await createSession({ userId: user.id, status: 'pending_email', role: 'user' })
    return NextResponse.json({ ok: true, status: 'pending_email' })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
