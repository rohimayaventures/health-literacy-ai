import { describe, it, expect } from 'vitest'
import { rateLimit } from './rate-limit'

describe('rateLimit', () => {
  it('allows requests under the limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 3 })
    expect(limiter('id-1').ok).toBe(true)
    expect(limiter('id-1').ok).toBe(true)
    expect(limiter('id-1').ok).toBe(true)
  })

  it('rejects requests over the limit', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 2 })
    expect(limiter('id-2').ok).toBe(true)
    expect(limiter('id-2').ok).toBe(true)
    const third = limiter('id-2')
    expect(third.ok).toBe(false)
    expect(third.retryAfter).toBeDefined()
  })

  it('tracks different identifiers separately', () => {
    const limiter = rateLimit({ windowMs: 60_000, maxRequests: 1 })
    expect(limiter('id-a').ok).toBe(true)
    expect(limiter('id-b').ok).toBe(true)
    expect(limiter('id-a').ok).toBe(false)
  })
})
