import type { SupabaseClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { canManageContent, isProfileRole, type ProfileRole } from '@/lib/roles'

export async function getProfileRole(
  userId: string,
  supabase: SupabaseClient,
): Promise<ProfileRole | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  if (isProfileRole(profile?.role)) return profile.role

  const { data: adminProfile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

  return isProfileRole(adminProfile?.role) ? adminProfile.role : null
}

export async function requireContentRole(userId: string, supabase: SupabaseClient) {
  const role = await getProfileRole(userId, supabase)

  if (!canManageContent(role)) {
    return { ok: false as const, error: 'Forbidden', status: 403 as const }
  }

  return { ok: true as const, role }
}
