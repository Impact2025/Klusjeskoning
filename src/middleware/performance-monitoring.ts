import { NextRequest, NextResponse } from 'next/server';

// Performance monitoring for API routes
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  recordMetric(endpoint: string, duration: number, statusCode: number) {
    const key = `${endpoint}_${statusCode}`;
    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metrics = this.metrics.get(key)!;
    metrics.push(duration);

    // Keep only last 100 measurements per endpoint
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  getMetrics(endpoint?: string) {
    if (endpoint) {
      const endpointMetrics: Record<string, { avg: number; min: number; max: number; count: number }> = {};

      for (const [key, durations] of this.metrics.entries()) {
        if (key.startsWith(`${endpoint}_`)) {
          const statusCode = key.split('_')[1];
          const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
          const min = Math.min(...durations);
          const max = Math.max(...durations);

          endpointMetrics[statusCode] = {
            avg: Math.round(avg),
            min,
            max,
            count: durations.length
          };
        }
      }

      return endpointMetrics;
    }

    // Return all metrics
    const allMetrics: Record<string, { avg: number; min: number; max: number; count: number }> = {};
    for (const [key, durations] of this.metrics.entries()) {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);

      allMetrics[key] = {
        avg: Math.round(avg),
        min,
        max,
        count: durations.length
      };
    }

    return allMetrics;
  }

  logSlowRequest(endpoint: string, duration: number, statusCode: number) {
    if (duration > 1000) { // Log requests slower than 1 second
      console.warn(`🐌 SLOW REQUEST: ${endpoint} took ${duration}ms (status: ${statusCode})`);
    }
  }

  logError(endpoint: string, error: Error, statusCode: number) {
    console.error(`❌ API ERROR: ${endpoint} failed with ${statusCode}`, {
      error: error.message,
      stack: error.stack,
      endpoint,
      statusCode
    });
  }
}

// API Performance Middleware
export async function withPerformanceMonitoring(
  request: NextRequest,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const monitor = PerformanceMonitor.getInstance();
  const url = new URL(request.url);
  const endpoint = `${request.method} ${url.pathname}`;

  try {
    const response = await handler();
    const duration = Date.now() - startTime;

    // Record metrics
    monitor.recordMetric(endpoint, duration, response.status);

    // Log slow requests
    monitor.logSlowRequest(endpoint, duration, response.status);

    // Add performance headers in development
    if (process.env.NODE_ENV === 'development') {
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Response-Time', `${duration}ms`);
      return newResponse as NextResponse;
    }

    return response;

  } catch (error) {
    const duration = Date.now() - startTime;

    // Log errors
    monitor.logError(endpoint, error as Error, 500);

    // Record error metric
    monitor.recordMetric(endpoint, duration, 500);

    throw error;
  }
}

// Health check endpoint for monitoring
export async function getHealthMetrics() {
  const monitor = PerformanceMonitor.getInstance();
  const metrics = monitor.getMetrics();

  return {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics,
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || 'unknown'
  };
}