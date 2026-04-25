import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  RATE_LIMITS,
  rateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from '@/lib/rate-limit'
import { getSupabaseConfig } from '@/lib/supabase/env'
import { buildRequestRedirectTarget, canAccessPath, getDefaultAuthenticatedPath, getRouteAccessLevel, isAuthRoute, normalizeRedirectTarget, resolvePostAuthRedirect } from '@/lib/auth'
import { isProfileRole } from '@/lib/roles'

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    const firstIp = forwardedFor.split(',')[0]?.trim()
    if (firstIp) return firstIp
  }

  return request.headers.get('x-real-ip') ?? 'unknown'
}

function resolveRateLimitConfig(pathname: string, method: string): { bucket: string; config: RateLimitConfig } | null {
  if (pathname.startsWith('/api/admin')) {
    return { bucket: 'api-admin', config: RATE_LIMITS.admin }
  }

  if (pathname.startsWith('/auth/callback')) {
    return { bucket: 'auth-callback', config: RATE_LIMITS.auth }
  }

  if (pathname.startsWith('/api/')) {
    if (READ_METHODS.has(method)) {
      return { bucket: 'api-read', config: RATE_LIMITS.api }
    }

    return { bucket: 'api-write', config: RATE_LIMITS.apiWrite }
  }

  return null
}

function applyRateLimitHeaders(response: NextResponse, result: RateLimitResult) {
  response.headers.set('X-RateLimit-Limit', String(result.limit))
  response.headers.set('X-RateLimit-Remaining', String(result.remaining))
  response.headers.set('X-RateLimit-Reset', String(Math.ceil(result.reset / 1000)))
}

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })
  const { url, key } = getSupabaseConfig()

  const supabase = createServerClient(
    url,
    key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const authState = await supabase.auth.getUser().then(({ data }) => data)
  const { user } = authState

  const { pathname } = request.nextUrl
  const routeAccessLevel = getRouteAccessLevel(pathname)

  const limitConfig = resolveRateLimitConfig(pathname, request.method.toUpperCase())
  if (limitConfig) {
    const identity = user?.id ?? getClientIp(request)
    const result = await rateLimit(`${limitConfig.bucket}:${identity}`, limitConfig.config)

    if (!result.success) {
      const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000))
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(result.limit),
            'X-RateLimit-Remaining': String(result.remaining),
            'X-RateLimit-Reset': String(Math.ceil(result.reset / 1000)),
            'Retry-After': String(retryAfter),
          },
        }
      )
    }

    applyRateLimitHeaders(supabaseResponse, result)
  }

  let role = null

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    role = isProfileRole(profile?.role) ? profile.role : null
  }

  if ((routeAccessLevel === 'authenticated' || routeAccessLevel === 'manager' || routeAccessLevel === 'admin') && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', buildRequestRedirectTarget(pathname, request.nextUrl.search))
    return NextResponse.redirect(url)
  }

  if (isAuthRoute(pathname) && user) {
    const redirectTarget = normalizeRedirectTarget(request.nextUrl.searchParams.get('redirect'))
    return NextResponse.redirect(new URL(resolvePostAuthRedirect(role, redirectTarget), request.url))
  }

  if (user && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDefaultAuthenticatedPath(role), request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
