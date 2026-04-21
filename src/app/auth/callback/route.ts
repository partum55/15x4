import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      // Auto-approve user after email confirmation
      try {
        const userId = data.user.id
        const userName = data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User'

        // Check if profile exists
        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id, status')
          .eq('id', userId)
          .maybeSingle()

        if (!existingProfile) {
          // Create profile with approved status
          await supabaseAdmin
            .from('profiles')
            .insert({
              id: userId,
              name: userName,
              role: 'user',
              status: 'approved',
            })
        } else if (existingProfile.status !== 'approved') {
          // Update existing profile to approved
          await supabaseAdmin
            .from('profiles')
            .update({ status: 'approved' })
            .eq('id', userId)
        }
      } catch (err) {
        console.error('Failed to auto-approve user:', err)
        // Continue anyway, the user might still be able to proceed
      }

      // Use origin for redirect to handle both local and production
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
