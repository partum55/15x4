import 'server-only'

import { redirect } from 'next/navigation'
import { buildLoginHref, getDefaultAuthenticatedPath, resolvePostAuthRedirect } from '@/lib/auth'
import { getServerAuthUser } from '@/lib/auth-server'
import { canManageContent } from '@/lib/roles'

export async function requireAuthenticatedPage(requestedTarget: string) {
  const user = await getServerAuthUser()

  if (!user) {
    redirect(buildLoginHref(requestedTarget))
  }

  return user
}

export async function requireManagerPage(requestedTarget: string) {
  const user = await requireAuthenticatedPage(requestedTarget)

  if (!canManageContent(user.profile?.role)) {
    redirect(getDefaultAuthenticatedPath(user.profile?.role))
  }

  return user
}

export async function requireAdminPage(requestedTarget: string) {
  const user = await requireAuthenticatedPage(requestedTarget)

  if (user.profile?.role !== 'admin') {
    redirect(getDefaultAuthenticatedPath(user.profile?.role))
  }

  return user
}

export async function redirectAuthenticatedAwayFromAuthPage(requestedTarget?: string | null) {
  const user = await getServerAuthUser()

  if (user) {
    redirect(resolvePostAuthRedirect(user.profile?.role, requestedTarget))
  }
}
