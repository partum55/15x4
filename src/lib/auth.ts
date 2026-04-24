import { canManageContent, type ProfileRole } from '@/lib/roles'

export type AuthProfile = {
  id: string
  name: string
  city: string
  role: ProfileRole
}

export type AuthUser = {
  id: string
  email: string
  profile: AuthProfile | null
}

type AuthPage = 'login' | 'register'
type RouteAccessLevel = 'public' | 'guest' | 'authenticated' | 'manager' | 'admin'

const REDIRECT_QUERY_KEY = 'redirect'

function getPathname(target: string) {
  try {
    return new URL(target, 'http://localhost').pathname
  } catch {
    return '/'
  }
}

export function normalizeRedirectTarget(target?: string | null): string | null {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return null
  }

  return target
}

export function isAuthRoute(pathname: string) {
  return pathname.startsWith('/login') || pathname.startsWith('/register')
}

export function getRouteAccessLevel(pathname: string): RouteAccessLevel {
  if (isAuthRoute(pathname)) {
    return 'guest'
  }

  if (pathname.startsWith('/admin')) {
    return 'admin'
  }

  if (pathname.startsWith('/account/lectures') || pathname.startsWith('/account/events')) {
    return 'manager'
  }

  if (pathname.startsWith('/account')) {
    return 'authenticated'
  }

  return 'public'
}

export function canAccessPath(role: ProfileRole | null | undefined, target: string) {
  const accessLevel = getRouteAccessLevel(getPathname(target))

  if (accessLevel === 'public') return true
  if (accessLevel === 'guest') return !role
  if (!role) return false
  if (accessLevel === 'authenticated') return true
  if (accessLevel === 'manager') return canManageContent(role)

  return role === 'admin'
}

export function getDefaultAuthenticatedPath(role: ProfileRole | null | undefined) {
  if (role === 'admin') return '/admin'
  if (canManageContent(role)) return '/account/lectures'
  return '/account/settings'
}

export function resolvePostAuthRedirect(
  role: ProfileRole | null | undefined,
  requestedTarget?: string | null,
) {
  const safeTarget = normalizeRedirectTarget(requestedTarget)

  if (safeTarget) {
    const pathname = getPathname(safeTarget)
    if (!isAuthRoute(pathname) && canAccessPath(role, safeTarget)) {
      return safeTarget
    }
  }

  return getDefaultAuthenticatedPath(role)
}

function buildAuthPageHref(page: AuthPage, requestedTarget?: string | null) {
  const safeTarget = normalizeRedirectTarget(requestedTarget)
  if (!safeTarget || safeTarget === '/') {
    return `/${page}`
  }

  const searchParams = new URLSearchParams({ [REDIRECT_QUERY_KEY]: safeTarget })
  return `/${page}?${searchParams.toString()}`
}

export function buildLoginHref(requestedTarget?: string | null) {
  return buildAuthPageHref('login', requestedTarget)
}

export function buildRegisterHref(requestedTarget?: string | null) {
  return buildAuthPageHref('register', requestedTarget)
}

export function buildRequestRedirectTarget(pathname: string, search = '') {
  return normalizeRedirectTarget(`${pathname}${search}`) ?? pathname
}
