import { NextRequest, NextResponse } from 'next/server';
import {
  generateDailySuggestions,
  expireOldSuggestions,
  reactivateSnoozedSuggestions,
} from '@/lib/suggestions/generate';

// POST /api/cron/generate-suggestions - Generate daily suggestions (called by Vercel Cron)
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret (Vercel sends this header)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Only check in production
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('[Cron] Starting daily suggestions generation...');

    // Step 1: Expire old suggestions
    const expired = await expireOldSuggestions();
    console.log(`[Cron] Expired ${expired} old suggestions`);

    // Step 2: Reactivate snoozed suggestions
    const reactivated = await reactivateSnoozedSuggestions();
    console.log(`[Cron] Reactivated ${reactivated} snoozed suggestions`);

    // Step 3: Generate new suggestions
    const { families, suggestions } = await generateDailySuggestions();
    console.log(`[Cron] Generated ${suggestions} suggestions for ${families} families`);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        expired,
        reactivated,
        familiesProcessed: families,
        suggestionsGenerated: suggestions,
      },
    });
  } catch (error) {
    console.error('[Cron] Error generating suggestions:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Use POST for cron jobs' }, { status: 405 });
  }

  // Redirect to POST
  return POST(request);
}
