import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'
import { createClient as createSupabaseMiddlewareClient } from '@/utils/supabase/middleware'

const STATUS_REDIRECTS: Record<string, string> = {
  pending_email: '/confirm-email',
  pending_approval: '/wait-approval',
}

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createSupabaseMiddlewareClient(request)
  await supabase.auth.getUser()

  const session = await getSession()
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const redirect = STATUS_REDIRECTS[session.status]
  if (redirect) {
    return NextResponse.redirect(new URL(redirect, request.url))
  }

  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (session.role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*'],
}
