import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  RATE_LIMITS,
  rateLimit,
  type RateLimitConfig,
  type RateLimitResult,
} from '@/lib/rate-limit'

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

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
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

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  const limitConfig = resolveRateLimitConfig(pathname, request.method.toUpperCase())
  if (limitConfig) {
    const identity = user?.id ?? getClientIp(request)
    const result = rateLimit(`${limitConfig.bucket}:${identity}`, limitConfig.config)

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

  // Protected routes that require authentication
  const protectedRoutes = ['/account', '/admin', '/lectures/new', '/lectures/edit', '/events/new', '/events/edit']
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  // Auth routes (login/register) - redirect if already logged in
  const authRoutes = ['/login', '/register']
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Admin routes require admin role - check via profile
  if (pathname.startsWith('/admin') && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/account'
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
