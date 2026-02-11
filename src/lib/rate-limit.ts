// In-memory rate limiter using sliding window algorithm
// For production at scale, replace with Redis-backed limiter

interface RateLimitEntry {
    count: number
    resetTime: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
        if (now > entry.resetTime) {
            store.delete(key)
        }
    }
}, 5 * 60 * 1000)

interface RateLimitConfig {
    /** Maximum number of requests allowed in the window */
    limit: number
    /** Window duration in seconds */
    windowSeconds: number
}

interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    resetTime: number
}

/**
 * Check rate limit for the given identifier (typically IP address).
 * Returns { success: true } if under limit, { success: false } if exceeded.
 */
export function checkRateLimit(
    identifier: string,
    config: RateLimitConfig
): RateLimitResult {
    const now = Date.now()
    const key = identifier
    const entry = store.get(key)

    if (!entry || now > entry.resetTime) {
        // Window expired or first request — start new window
        const resetTime = now + config.windowSeconds * 1000
        store.set(key, { count: 1, resetTime })
        return {
            success: true,
            limit: config.limit,
            remaining: config.limit - 1,
            resetTime,
        }
    }

    // Within existing window
    entry.count++
    store.set(key, entry)

    if (entry.count > config.limit) {
        return {
            success: false,
            limit: config.limit,
            remaining: 0,
            resetTime: entry.resetTime,
        }
    }

    return {
        success: true,
        limit: config.limit,
        remaining: config.limit - entry.count,
        resetTime: entry.resetTime,
    }
}

/**
 * Extract client IP from request headers.
 * Supports X-Forwarded-For (reverse proxy), X-Real-Ip, and falls back to a default.
 */
export function getClientIp(request: Request): string {
    const forwarded = request.headers.get('x-forwarded-for')
    if (forwarded) {
        // Take the first IP (client IP) from comma-separated list
        return forwarded.split(',')[0].trim()
    }
    const realIp = request.headers.get('x-real-ip')
    if (realIp) return realIp
    return '127.0.0.1'
}

// Pre-configured rate limit profiles
export const RATE_LIMITS = {
    /** Login: 5 attempts per 60s per IP */
    LOGIN: { limit: 5, windowSeconds: 60 },
    /** Password change: 3 attempts per 60s per IP */
    PASSWORD_CHANGE: { limit: 3, windowSeconds: 60 },
    /** User creation: 5 per 60s per IP */
    CREATE_USER: { limit: 5, windowSeconds: 60 },
    /** General mutations: 30 per 60s per IP */
    MUTATION: { limit: 30, windowSeconds: 60 },
} as const
