import { NextResponse, type NextRequest } from 'next/server'
import { buildRequestRedirectTarget, canAccessPath, getDefaultAuthenticatedPath, getRouteAccessLevel, isAuthRoute, normalizeRedirectTarget, resolvePostAuthRedirect } from '@/lib/auth'
import { DEMO_GUEST_COOKIE, DEMO_USER } from '@/lib/demo-user'

// Demo branch: same route guards as production, driven by the mock user instead of Supabase.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const role = request.cookies.has(DEMO_GUEST_COOKIE) ? null : DEMO_USER.profile!.role
  const level = getRouteAccessLevel(pathname)

  if (!role && level !== 'public' && level !== 'guest') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', buildRequestRedirectTarget(pathname, request.nextUrl.search))
    return NextResponse.redirect(url)
  }

  if (role && isAuthRoute(pathname)) {
    const target = normalizeRedirectTarget(request.nextUrl.searchParams.get('redirect'))
    return NextResponse.redirect(new URL(resolvePostAuthRedirect(role, target), request.url))
  }

  if (role && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultAuthenticatedPath(role), request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
