import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseConfig } from './env'

let client: SupabaseClient | null = null

export function createClient() {
  if (client) return client
  const { url, key } = getSupabaseConfig()

  client = createBrowserClient(url, key)

  return client
}
