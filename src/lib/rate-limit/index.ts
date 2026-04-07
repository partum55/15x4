type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()
const CLEANUP_INTERVAL_MS = 60_000
let lastCleanupAt = 0

export type RateLimitConfig = {
  limit: number      // max requests
  window: number     // time window in seconds
}

export type RateLimitResult = {
  success: boolean
  limit: number
  remaining: number
  reset: number      // timestamp when limit resets
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  if (now - lastCleanupAt >= CLEANUP_INTERVAL_MS) {
    for (const [storedKey, entry] of store.entries()) {
      if (entry.resetAt < now) {
        store.delete(storedKey)
      }
    }
    lastCleanupAt = now
  }

  const windowMs = config.window * 1000
  
  let entry = store.get(key)
  
  // Reset if window expired
  if (!entry || entry.resetAt < now) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    }
  }
  
  entry.count++
  store.set(key, entry)
  
  const remaining = Math.max(0, config.limit - entry.count)
  const success = entry.count <= config.limit
  
  return {
    success,
    limit: config.limit,
    remaining,
    reset: entry.resetAt,
  }
}

// Preset configs
export const RATE_LIMITS = {
  // Auth endpoints - stricter
  auth: { limit: 10, window: 60 },           // 10 per minute
  
  // API endpoints - more relaxed
  api: { limit: 100, window: 60 },           // 100 per minute
  apiWrite: { limit: 30, window: 60 },       // 30 writes per minute
  
  // Admin - moderate
  admin: { limit: 60, window: 60 },          // 60 per minute
} as const
