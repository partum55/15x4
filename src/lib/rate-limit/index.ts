import { supabaseAdmin } from '@/lib/supabase-admin'

export type RateLimitConfig = {
  limit: number
  window: number  // seconds
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number  // unix ms timestamp
}

export async function rateLimit(
  key: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  try {
    const { data, error } = await supabaseAdmin.rpc('increment_rate_limit', {
      p_key: key,
      p_window_seconds: config.window,
      p_limit: config.limit,
    })

    if (error || !data || (data as unknown[]).length === 0) {
      return { success: true, limit: config.limit, remaining: config.limit, reset: Date.now() + config.window * 1000 }
    }

    const row = (data as Array<{ success: boolean; current_count: number; reset_at: string }>)[0]
    const resetMs = new Date(row.reset_at).getTime()
    return {
      success: row.success,
      limit: config.limit,
      remaining: Math.max(0, config.limit - row.current_count),
      reset: resetMs,
    }
  } catch {
    // Fail open: allow requests when the rate-limit store is unavailable
    return { success: true, limit: config.limit, remaining: config.limit, reset: Date.now() + config.window * 1000 }
  }
}

export const RATE_LIMITS = {
  auth:     { limit: 10,  window: 60 },
  api:      { limit: 100, window: 60 },
  apiWrite: { limit: 30,  window: 60 },
  admin:    { limit: 60,  window: 60 },
} as const
