import 'server-only';

/**
 * Simple caching layer for the KlusjesKoning application
 * Uses Upstash Redis for distributed caching
 */

import { Redis } from '@upstash/redis';

// Initialize Redis connection with fallback
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  SESSION: 3600, // 1 hour
  FAMILY_DATA: 300, // 5 minutes
  ADMIN_STATS: 600, // 10 minutes
  PUBLIC_DATA: 3600, // 1 hour
} as const;

// Cache key prefixes to avoid collisions
const CACHE_KEYS = {
  SESSION: 'session:',
  FAMILY: 'family:',
  ADMIN_STATS: 'admin_stats:',
  FINANCIAL: 'financial:',
} as const;

/**
 * Generic cache operations
 */
export class Cache {
  /**
   * Get value from cache
   */
  static async get<T>(key: string): Promise<T | null> {
    if (!redis) return null; // No caching if Redis not configured

    try {
      const value = await redis.get(key);
      if (value === null) return null;

      // Parse JSON if it's a string
      if (typeof value === 'string') {
        return JSON.parse(value) as T;
      }

      return value as T;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache with TTL
   */
  static async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (!redis) return; // No caching if Redis not configured

    try {
      await redis.setex(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  /**
   * Delete value from cache
   */
  static async del(key: string): Promise<void> {
    if (!redis) return; // No caching if Redis not configured

    try {
      await redis.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  /**
   * Check if key exists in cache
   */
  static async exists(key: string): Promise<boolean> {
    if (!redis) return false; // No caching if Redis not configured

    try {
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  /**
   * Clear all cache keys with a prefix
   */
  static async clearPrefix(prefix: string): Promise<void> {
    if (!redis) return; // No caching if Redis not configured

    try {
      const keys = await redis.keys(`${prefix}*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (error) {
      console.error('Cache clear prefix error:', error);
    }
  }
}

/**
 * Session-specific cache operations
 */
export class SessionCache {
  static getKey(sessionId: string): string {
    return `${CACHE_KEYS.SESSION}${sessionId}`;
  }

  static async get(sessionId: string) {
    return Cache.get(this.getKey(sessionId));
  }

  static async set(sessionId: string, data: any): Promise<void> {
    await Cache.set(this.getKey(sessionId), data, CACHE_TTL.SESSION);
  }

  static async del(sessionId: string): Promise<void> {
    await Cache.del(this.getKey(sessionId));
  }

  static async invalidateFamilySessions(familyId: string): Promise<void> {
    // This would require maintaining a mapping of familyId -> sessionIds
    // For now, we'll clear all sessions (not ideal but functional)
    await Cache.clearPrefix(CACHE_KEYS.SESSION);
  }
}

/**
 * Family data cache operations
 */
export class FamilyCache {
  static getKey(familyId: string): string {
    return `${CACHE_KEYS.FAMILY}${familyId}`;
  }

  static async get(familyId: string) {
    return Cache.get(this.getKey(familyId));
  }

  static async set(familyId: string, data: any): Promise<void> {
    await Cache.set(this.getKey(familyId), data, CACHE_TTL.FAMILY_DATA);
  }

  static async del(familyId: string): Promise<void> {
    await Cache.del(this.getKey(familyId));
  }

  static async invalidate(familyId: string): Promise<void> {
    await this.del(familyId);
    // Also invalidate related admin stats
    await AdminStatsCache.clear();
  }
}

/**
 * Admin statistics cache operations
 */
export class AdminStatsCache {
  static getKey(): string {
    return CACHE_KEYS.ADMIN_STATS;
  }

  static async get() {
    return Cache.get(this.getKey());
  }

  static async set(data: any): Promise<void> {
    await Cache.set(this.getKey(), data, CACHE_TTL.ADMIN_STATS);
  }

  static async clear(): Promise<void> {
    await Cache.del(this.getKey());
  }
}

/**
 * Financial data cache operations
 */
export class FinancialCache {
  static getKey(): string {
    return CACHE_KEYS.FINANCIAL;
  }

  static async get() {
    return Cache.get(this.getKey());
  }

  static async set(data: any): Promise<void> {
    await Cache.set(this.getKey(), data, CACHE_TTL.ADMIN_STATS);
  }

  static async clear(): Promise<void> {
    await Cache.del(this.getKey());
  }
}

/**
 * Cache warming utilities
 */
export class CacheWarmer {
  /**
   * Warm up frequently accessed data
   */
  static async warmUpCriticalData(): Promise<void> {
    try {
      // This could be called during application startup
      // or on a schedule to keep critical data cached

      // Warm up admin stats
      const { getOptimizedAdminStats } = await import('@/lib/database-optimizations');
      const stats = await getOptimizedAdminStats();
      await AdminStatsCache.set(stats);

      console.log('Cache warming completed');
    } catch (error) {
      console.error('Cache warming failed:', error);
    }
  }
}

/**
 * Cache invalidation helpers
 */
export class CacheInvalidation {
  /**
   * Invalidate all family-related caches when family data changes
   */
  static async invalidateFamilyData(familyId: string): Promise<void> {
    await FamilyCache.invalidate(familyId);
  }

  /**
   * Invalidate admin caches when admin data changes
   */
  static async invalidateAdminData(): Promise<void> {
    await AdminStatsCache.clear();
    await FinancialCache.clear();
  }

  /**
   * Clear all caches (useful for maintenance)
   */
  static async clearAll(): Promise<void> {
    await Cache.clearPrefix(CACHE_KEYS.SESSION);
    await Cache.clearPrefix(CACHE_KEYS.FAMILY);
    await Cache.clearPrefix(CACHE_KEYS.ADMIN_STATS);
    await Cache.clearPrefix(CACHE_KEYS.FINANCIAL);
  }
}

/**
 * Health check for cache connectivity
 */
export async function checkCacheHealth(): Promise<{
  healthy: boolean;
  latency?: number;
  error?: string;
}> {
  if (!redis) {
    return {
      healthy: false,
      error: 'Redis not configured',
    };
  }

  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return {
      healthy: true,
      latency,
    };
  } catch (error) {
    return {
      healthy: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}