import { redirect } from 'next/navigation'
import { getServerAuthUser } from '@/lib/auth-server'
import { getDefaultAuthenticatedPath } from '@/lib/auth'

export default async function AccountPage() {
  const user = await getServerAuthUser()

  redirect(getDefaultAuthenticatedPath(user?.profile?.role))
}
