import 'server-only';

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis connection with fallback
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Rate limiters for different endpoints
// Prefix v5: Reset with much more generous limits for family app usage
export const authRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(50, '1 m'), // 50 auth attempts per minute (brute-force protection only)
  analytics: true,
  prefix: 'ratelimit:v5:auth',
}) : null;

export const apiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1000, '1 m'), // 1000 requests per minute - very generous for normal use
  analytics: true,
  prefix: 'ratelimit:v5:api',
}) : null;

export const webhookRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute for webhooks
  analytics: true,
  prefix: 'ratelimit:v5:webhook',
}) : null;

// Helper function to get client IP (optimized for Vercel Edge)
export function getClientIP(request: Request): string {
  // Vercel/Cloudflare specific headers first
  const vercelForwardedFor = request.headers.get('x-vercel-forwarded-for');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  // Try headers in order of reliability for Vercel Edge
  const ip = vercelForwardedFor?.split(',')[0]?.trim() ||
             cfConnectingIP ||
             forwarded?.split(',')[0]?.trim() ||
             realIP ||
             clientIP ||
             'unknown';

  return ip;
}

// Helper to convert reset time to Date
function convertResetTime(reset: Date | number): Date {
  return reset instanceof Date ? reset : new Date(reset * 1000);
}

// Rate limiting middleware for auth endpoints
// Uses FAIL-OPEN policy: if Redis fails, allow request but log warning
export async function checkAuthRateLimit(request: Request, identifier?: string): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: Date;
}> {
  // If Redis is not configured, allow requests (fail-open)
  if (!redis || !authRateLimit) {
    console.warn('[RATE-LIMIT] Redis not configured - allowing auth request (fail-open)');
    return { success: true };
  }

  try {
    const ip = identifier || getClientIP(request);
    const result = await authRateLimit.limit(ip);

    if (!result.success) {
      console.warn(`[RATE-LIMIT] Auth rate limit exceeded for IP: ${ip.substring(0, 10)}...`);
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: convertResetTime(result.reset),
    };
  } catch (error) {
    // FAIL-OPEN: Allow request if rate limiting fails, but log the error
    console.error('[RATE-LIMIT] Auth rate limit check failed (allowing request):', error);
    return { success: true };
  }
}

// Rate limiting middleware for general API endpoints
// Uses FAIL-OPEN policy: if Redis fails, allow request but log warning
export async function checkApiRateLimit(request: Request, identifier?: string): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: Date;
}> {
  // If Redis is not configured, allow requests (fail-open)
  if (!redis || !apiRateLimit) {
    console.warn('[RATE-LIMIT] Redis not configured - allowing API request (fail-open)');
    return { success: true };
  }

  try {
    const ip = identifier || getClientIP(request);
    const result = await apiRateLimit.limit(ip);

    if (!result.success) {
      console.warn(`[RATE-LIMIT] API rate limit exceeded for IP: ${ip.substring(0, 10)}...`);
    }

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: convertResetTime(result.reset),
    };
  } catch (error) {
    // FAIL-OPEN: Allow request if rate limiting fails, but log the error
    console.error('[RATE-LIMIT] API rate limit check failed (allowing request):', error);
    return { success: true };
  }
}

// Rate limiting middleware for webhooks
export async function checkWebhookRateLimit(request: Request, identifier?: string): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: Date;
}> {
  // Webhooks from payment providers need to work even without Redis
  if (!redis || !webhookRateLimit) {
    console.warn('[RATE-LIMIT] Redis not configured - allowing webhook (fail-open)');
    return { success: true };
  }

  try {
    const ip = identifier || getClientIP(request);
    const result = await webhookRateLimit.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: convertResetTime(result.reset),
    };
  } catch (error) {
    // For webhooks, always allow on error (payment webhooks are critical)
    console.error('[RATE-LIMIT] Webhook rate limit check failed (allowing request):', error);
    return { success: true };
  }
}
