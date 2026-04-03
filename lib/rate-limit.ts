/**
 * Simple in-memory rate limiter for API routes.
 * For production at scale, consider Vercel KV, Upstash Redis, or similar.
 */

const DEFAULT_WINDOW_MS = 60 * 1000 // 1 minute
const DEFAULT_MAX_REQUESTS = 30

type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()

// Cleanup stale entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt < now) store.delete(key)
  }
}, 5 * 60 * 1000)

export function rateLimit(options?: {
  windowMs?: number
  maxRequests?: number
}) {
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS
  const maxRequests = options?.maxRequests ?? DEFAULT_MAX_REQUESTS

  return function check(identifier: string): { ok: boolean; remaining: number; retryAfter?: number } {
    const now = Date.now()
    let entry = store.get(identifier)

    if (!entry || entry.resetAt < now) {
      entry = { count: 1, resetAt: now + windowMs }
      store.set(identifier, entry)
      return { ok: true, remaining: maxRequests - 1 }
    }

    entry.count++
    const remaining = Math.max(0, maxRequests - entry.count)

    if (entry.count > maxRequests) {
      return {
        ok: false,
        remaining: 0,
        retryAfter: Math.ceil((entry.resetAt - now) / 1000),
      }
    }

    return { ok: true, remaining }
  }
}

export function getIdentifier(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() ?? req.headers.get('x-real-ip') ?? 'unknown'
  const ua = req.headers.get('user-agent') ?? ''
  return `${ip}:${ua.slice(0, 64)}`
}
