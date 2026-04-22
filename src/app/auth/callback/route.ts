import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

const SITE_URL = 'https://15x4.vercel.app'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
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

      return NextResponse.redirect(`${SITE_URL}${next}`)
    }
  }

  // Return to login with error
  return NextResponse.redirect(`${SITE_URL}/login?error=auth_callback_error`)
}
