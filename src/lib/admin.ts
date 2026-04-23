import { getServerAuthUser } from '@/lib/auth-server'

export async function requireAdminSession() {
  const user = await getServerAuthUser()

  if (!user || user.profile?.role !== 'admin') return null

  return { userId: user.id, email: user.email }
}
