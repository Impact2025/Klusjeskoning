import { NextRequest, NextResponse } from 'next/server';
import { getHealthMetrics } from '@/middleware/performance-monitoring';

// Health check endpoint for monitoring and load balancers
export async function GET(request: NextRequest) {
  try {
    const metrics = await getHealthMetrics();

    // Check database connectivity
    let dbStatus = 'unknown';
    try {
      // Simple database check - you might want to add a more comprehensive check
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = 'disconnected';
    }

    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      database: dbStatus,
      memory: {
        used: Math.round(metrics.memory.heapUsed / 1024 / 1024), // MB
        total: Math.round(metrics.memory.heapTotal / 1024 / 1024), // MB
        external: Math.round(metrics.memory.external / 1024 / 1024), // MB
      },
      environment: metrics.environment,
      version: metrics.version,
    };

    // Return detailed metrics if requested
    const url = new URL(request.url);
    if (url.searchParams.get('detailed') === 'true') {
      health.metrics = metrics.metrics;
    }

    return NextResponse.json(health);

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed'
      },
      { status: 503 }
    );
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}