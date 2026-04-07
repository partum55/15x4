import { getSession } from '@/lib/session'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function requireAdminSession() {
  const session = await getSession()
  if (!session) return null

  const { data: user } = await supabaseAdmin
    .from('User')
    .select('role')
    .eq('id', session.userId)
    .maybeSingle()

  return user?.role === 'admin' ? session : null
}
