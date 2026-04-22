import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const nextParam = searchParams.get('next') ?? '/'
  const next = nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : '/'

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      try {
        const userId = data.user.id
        const metadata = data.user.user_metadata ?? {}
        const userName =
          metadata.name ||
          metadata.full_name ||
          data.user.email?.split('@')[0] ||
          'User'

        const { data: existingProfile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()

        if (!existingProfile) {
          await supabaseAdmin
            .from('profiles')
            .insert({
              id: userId,
              name: userName,
              role: 'user',
            })
        }
      } catch (err) {
        console.error('Failed to ensure user profile:', err)
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
