import { createClient, SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

function getSupabaseAdminClient(): SupabaseClient {
  if (cachedClient) return cachedClient

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY')
  }

  cachedClient = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  return cachedClient
}

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    return Reflect.get(getSupabaseAdminClient(), prop, receiver)
  },
})
