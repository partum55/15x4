import 'server-only'

import { cookies } from 'next/headers'
import type { AuthUser } from '@/lib/auth'
import { DEMO_GUEST_COOKIE, DEMO_USER } from '@/lib/demo-user'

// Demo branch: the mock admin, unless the visitor has "logged out".
export async function getServerAuthUser(): Promise<AuthUser | null> {
  return (await cookies()).has(DEMO_GUEST_COOKIE) ? null : DEMO_USER
}
