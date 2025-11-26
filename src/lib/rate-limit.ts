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
// Note: If redis is null, rate limiting will be disabled in development
export const authRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '10 m'), // 5 requests per 10 minutes for auth
  analytics: true,
}) : null;

export const apiRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour for general API
  analytics: true,
}) : null;

export const webhookRateLimit = redis ? new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute for webhooks
  analytics: true,
}) : null;

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const clientIP = request.headers.get('x-client-ip');

  // Try different headers in order of preference
  const ip = forwarded?.split(',')[0]?.trim() ||
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
export async function checkAuthRateLimit(request: Request, identifier?: string): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: Date;
}> {
  if (!redis || !authRateLimit) return { success: true }; // No rate limiting if Redis not configured

  try {
    const ip = identifier || getClientIP(request);
    const result = await authRateLimit.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: convertResetTime(result.reset),
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // Allow request if rate limiting fails (fail-open)
    return { success: true };
  }
}

// Rate limiting middleware for general API endpoints
export async function checkApiRateLimit(request: Request, identifier?: string): Promise<{
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: Date;
}> {
  if (!redis || !apiRateLimit) return { success: true }; // No rate limiting if Redis not configured

  try {
    const ip = identifier || getClientIP(request);
    const result = await apiRateLimit.limit(ip);

    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: convertResetTime(result.reset),
    };
  } catch (error) {
    console.error('API rate limit check failed:', error);
    // Allow request if rate limiting fails (fail-open)
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
  if (!redis || !webhookRateLimit) return { success: true }; // No rate limiting if Redis not configured

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
    console.error('Webhook rate limit check failed:', error);
    // Allow request if rate limiting fails (fail-open)
    return { success: true };
  }
}