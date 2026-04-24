import 'server-only'

import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isProfileRole } from '@/lib/roles'
import type { AuthProfile, AuthUser } from '@/lib/auth'

type ProfileRow = {
  id: string
  name: string | null
  city: string | null
  role: string | null
}

function getFallbackName(user: SupabaseUser) {
  return (
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.email?.split('@')[0] ||
    'User'
  )
}

function mapProfileRow(row: ProfileRow | null, fallbackName: string): AuthProfile | null {
  if (!row || !isProfileRole(row.role)) {
    return null
  }

  return {
    id: row.id,
    name: row.name?.trim() || fallbackName,
    city: row.city?.trim() || '',
    role: row.role,
  }
}

async function readProfileRow(userId: string, supabase: SupabaseClient): Promise<ProfileRow | null> {
  const { data } = await supabase
    .from('profiles')
    .select('id, name, city, role')
    .eq('id', userId)
    .maybeSingle()

  return (data as ProfileRow | null) ?? null
}

export async function ensureAuthProfile(
  user: SupabaseUser,
  supabase?: SupabaseClient,
): Promise<AuthProfile | null> {
  const fallbackName = getFallbackName(user)

  if (supabase) {
    const profile = mapProfileRow(await readProfileRow(user.id, supabase), fallbackName)
    if (profile) return profile
  }

  const adminProfile = mapProfileRow(
    ((await supabaseAdmin
      .from('profiles')
      .select('id, name, city, role')
      .eq('id', user.id)
      .maybeSingle()).data as ProfileRow | null) ?? null,
    fallbackName,
  )

  if (adminProfile) {
    return adminProfile
  }

  return null
}

export async function buildAuthUser(
  user: SupabaseUser,
  supabase?: SupabaseClient,
): Promise<AuthUser> {
  return {
    id: user.id,
    email: user.email ?? '',
    profile: await ensureAuthProfile(user, supabase),
  }
}

export async function getServerAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  return buildAuthUser(user, supabase)
}
