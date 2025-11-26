import 'server-only';

/**
 * Professional Email Queue System with Redis
 * Provides reliable email delivery with retry logic and monitoring
 */

import { Redis } from '@upstash/redis';
import { randomUUID } from 'crypto';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Queue configuration
const QUEUE_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAYS: [30000, 300000, 1800000], // 30s, 5min, 30min
  BATCH_SIZE: 10,
  PROCESSING_TIMEOUT: 300000, // 5 minutes
} as const;

// Queue keys
const QUEUE_KEYS = {
  PENDING: 'email_queue:pending',
  PROCESSING: 'email_queue:processing',
  FAILED: 'email_queue:failed',
  METRICS: 'email_queue:metrics',
} as const;

export interface EmailJob {
  id: string;
  type: 'welcome_parent' | 'chore_submitted' | 'reward_redeemed' | 'admin_new_registration';
  to: string;
  data: Record<string, any>;
  priority: 'high' | 'normal' | 'low';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  nextRetryAt?: Date;
  lastError?: string;
  processingStartedAt?: Date;
}

export interface EmailMetrics {
  totalQueued: number;
  totalProcessed: number;
  totalFailed: number;
  totalDelivered: number;
  averageProcessingTime: number;
  queueSize: number;
  processingRate: number; // emails per minute
}

/**
 * Email Queue Manager
 */
export class EmailQueue {
  /**
   * Add email job to queue
   */
  static async enqueue(jobData: Omit<EmailJob, 'id' | 'retryCount' | 'createdAt'>): Promise<string> {
    const job: EmailJob = {
      id: randomUUID(),
      retryCount: 0,
      createdAt: new Date(),
      ...jobData,
    };

    const score = this.getPriorityScore(job.priority);
    await redis.zadd(QUEUE_KEYS.PENDING, { score, member: JSON.stringify(job) });

    // Update metrics
    await this.incrementMetric('totalQueued');

    return job.id;
  }

  /**
   * Process next batch of emails
   */
  static async processBatch(): Promise<{ processed: number; failed: number }> {
    const jobs = await this.getNextBatch();
    let processed = 0;
    let failed = 0;

    for (const job of jobs) {
      try {
        await this.processJob(job);
        processed++;
        await this.incrementMetric('totalProcessed');
        await this.incrementMetric('totalDelivered');
      } catch (error) {
        failed++;
        await this.handleJobFailure(job, error);
      }
    }

    return { processed, failed };
  }

  /**
   * Get next batch of jobs to process
   */
  private static async getNextBatch(): Promise<EmailJob[]> {
    const jobs = await redis.zrange(QUEUE_KEYS.PENDING, 0, QUEUE_CONFIG.BATCH_SIZE - 1, { withScores: false }) as string[];

    if (jobs.length === 0) return [];

    // Move jobs to processing queue
    await redis.zremrangebyrank(QUEUE_KEYS.PENDING, 0, jobs.length - 1);

    const processingJobs = jobs.map(job => {
      const parsedJob = JSON.parse(job) as EmailJob;
      return {
        ...parsedJob,
        processingStartedAt: new Date(),
      };
    });

    // Add to processing queue with expiration
    for (const job of processingJobs) {
      await redis.setex(
        `${QUEUE_KEYS.PROCESSING}:${job.id}`,
        QUEUE_CONFIG.PROCESSING_TIMEOUT / 1000,
        JSON.stringify(job)
      );
    }

    return processingJobs;
  }

  /**
   * Process individual email job
   */
  private static async processJob(job: EmailJob): Promise<void> {
    const startTime = Date.now();

    try {
      // Send email via existing notification system
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: job.type,
          to: job.to,
          data: job.data,
        }),
      });

      if (!response.ok) {
        throw new Error(`Email delivery failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(`Email delivery failed: ${result.error}`);
      }

      // Clean up processing queue
      await redis.del(`${QUEUE_KEYS.PROCESSING}:${job.id}`);

      // Update processing time metric
      const processingTime = Date.now() - startTime;
      await this.updateProcessingTime(processingTime);

    } catch (error) {
      throw error;
    }
  }

  /**
   * Handle job failure with retry logic
   */
  private static async handleJobFailure(job: EmailJob, error: any): Promise<void> {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    job.lastError = errorMessage;
    job.retryCount++;

    // Clean up processing queue
    await redis.del(`${QUEUE_KEYS.PROCESSING}:${job.id}`);

    if (job.retryCount < job.maxRetries) {
      // Schedule retry
      const retryDelay = QUEUE_CONFIG.RETRY_DELAYS[job.retryCount - 1] || QUEUE_CONFIG.RETRY_DELAYS[QUEUE_CONFIG.RETRY_DELAYS.length - 1];
      job.nextRetryAt = new Date(Date.now() + retryDelay);

      const score = job.nextRetryAt.getTime();
      await redis.zadd(QUEUE_KEYS.PENDING, { score, member: JSON.stringify(job) });
    } else {
      // Move to failed queue
      await redis.zadd(QUEUE_KEYS.FAILED, {
        score: Date.now(),
        member: JSON.stringify({
          ...job,
          failedAt: new Date(),
        })
      });

      await this.incrementMetric('totalFailed');
    }
  }

  /**
   * Get priority score for queue ordering
   */
  private static getPriorityScore(priority: EmailJob['priority']): number {
    const now = Date.now();
    switch (priority) {
      case 'high': return now - 86400000; // 1 day ago (highest priority)
      case 'normal': return now;
      case 'low': return now + 86400000; // 1 day from now (lowest priority)
      default: return now;
    }
  }

  /**
   * Metrics management
   */
  private static async incrementMetric(metric: keyof EmailMetrics): Promise<void> {
    await redis.hincrby(QUEUE_KEYS.METRICS, metric, 1);
  }

  private static async updateProcessingTime(processingTime: number): Promise<void> {
    const current = await redis.hget(QUEUE_KEYS.METRICS, 'averageProcessingTime') as string | null;
    const currentAvg = current ? parseFloat(current) : 0;
    const newAvg = (currentAvg + processingTime) / 2;
    await redis.hset(QUEUE_KEYS.METRICS, { averageProcessingTime: newAvg.toString() });
  }

  /**
   * Get queue metrics
   */
  static async getMetrics(): Promise<EmailMetrics> {
    const metrics = await redis.hgetall(QUEUE_KEYS.METRICS) as Record<string, string>;
    const queueSize = await redis.zcard(QUEUE_KEYS.PENDING);

    return {
      totalQueued: parseInt(metrics?.totalQueued || '0'),
      totalProcessed: parseInt(metrics?.totalProcessed || '0'),
      totalFailed: parseInt(metrics?.totalFailed || '0'),
      totalDelivered: parseInt(metrics?.totalDelivered || '0'),
      averageProcessingTime: parseFloat(metrics?.averageProcessingTime || '0'),
      queueSize,
      processingRate: 0, // Would need time-series data for accurate calculation
    };
  }

  /**
   * Get failed jobs for manual review
   */
  static async getFailedJobs(limit = 50): Promise<EmailJob[]> {
    const failedJobs = await redis.zrange(QUEUE_KEYS.FAILED, 0, limit - 1, { withScores: false }) as string[];
    return failedJobs.map(job => JSON.parse(job) as EmailJob);
  }

  /**
   * Retry failed job manually
   */
  static async retryFailedJob(jobId: string): Promise<boolean> {
    const failedJobs = await redis.zrange(QUEUE_KEYS.FAILED, 0, -1, { withScores: false }) as string[];
    const jobData = failedJobs.find(job => (JSON.parse(job) as EmailJob).id === jobId);

    if (!jobData) return false;

    const job = JSON.parse(jobData) as EmailJob;
    job.retryCount = 0; // Reset retry count
    job.lastError = undefined;

    // Remove from failed queue
    await redis.zrem(QUEUE_KEYS.FAILED, jobData);

    // Re-queue
    await this.enqueue(job);

    return true;
  }

  /**
   * Clean up stale processing jobs (hung jobs)
   */
  static async cleanupStaleJobs(): Promise<number> {
    const processingKeys = await redis.keys(`${QUEUE_KEYS.PROCESSING}:*`);
    let cleaned = 0;

    for (const key of processingKeys) {
      const jobData = await redis.get(key) as string | null;
      if (jobData) {
        const job = JSON.parse(jobData) as EmailJob;
        if (job.processingStartedAt) {
          const processingTime = Date.now() - new Date(job.processingStartedAt).getTime();

          if (processingTime > QUEUE_CONFIG.PROCESSING_TIMEOUT) {
            // Job has been processing too long, move back to pending
            await redis.del(key);
            await this.enqueue(job);
            cleaned++;
          }
        }
      }
    }

    return cleaned;
  }
}

/**
 * Background processor for email queue
 * This should be run as a cron job or background service
 */
export async function processEmailQueue(): Promise<void> {
  try {
    const result = await EmailQueue.processBatch();

    if (result.processed > 0 || result.failed > 0) {
      console.log(`Email queue processed: ${result.processed} successful, ${result.failed} failed`);
    }

    // Clean up stale jobs periodically
    if (Math.random() < 0.1) { // 10% chance
      const cleaned = await EmailQueue.cleanupStaleJobs();
      if (cleaned > 0) {
        console.log(`Cleaned up ${cleaned} stale email jobs`);
      }
    }

  } catch (error) {
    console.error('Email queue processing error:', error);
  }
}

/**
 * Initialize email queue processor
 * Call this from a cron job or scheduled task
 */
export function startEmailQueueProcessor(intervalMs = 30000): NodeJS.Timeout {
  console.log('Starting email queue processor...');

  // Process immediately
  processEmailQueue();

  // Set up interval
  return setInterval(processEmailQueue, intervalMs);
}