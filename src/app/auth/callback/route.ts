import { NextResponse } from 'next/server'
import { resolvePostAuthRedirect, normalizeRedirectTarget } from '@/lib/auth'
import { buildAuthUser } from '@/lib/auth-server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const { searchParams } = requestUrl
  const code = searchParams.get('code')
  const next = normalizeRedirectTarget(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = await buildAuthUser(data.user, supabase)
      const destination = resolvePostAuthRedirect(user.profile?.role, next)
      return NextResponse.redirect(new URL(destination, requestUrl.origin))
    }
  }

  const loginUrl = new URL('/login', requestUrl.origin)
  loginUrl.searchParams.set('error', 'auth_callback_error')
  if (next && next !== '/') {
    loginUrl.searchParams.set('redirect', next)
  }
  return NextResponse.redirect(loginUrl)
}
