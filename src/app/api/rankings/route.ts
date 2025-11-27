import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/server/auth/session';
import { calculateRanking, getRankingSettings, updateWeeklyRankings, processWeeklyChampions, getWeeklyChampionStatus } from '@/lib/ranking-utils';
import type { RankingType, RankingCategory } from '@/lib/ranking-utils';
import { db } from '@/server/db/client';
import { children } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const rankingType = searchParams.get('type') as RankingType;
    const category = searchParams.get('category') as RankingCategory;

    if (!rankingType || !category) {
      return NextResponse.json(
        { error: 'Ranking type and category are required' },
        { status: 400 }
      );
    }

    // Check if rankings are enabled for this family
    const settings = await getRankingSettings(familyId);

    if (!settings.rankingsEnabled) {
      return NextResponse.json({ entries: [] });
    }

    // Check specific ranking type
    const typeEnabled = {
      family: settings.familyRankingEnabled,
      friends: settings.friendsRankingEnabled,
      powerklusjes: settings.powerRankingEnabled
    };

    if (!typeEnabled[rankingType]) {
      return NextResponse.json({ entries: [] });
    }

    // Calculate current ranking
    const result = await calculateRanking(
      familyId,
      rankingType,
      category,
      new Date(), // Will use current week bounds
      new Date()
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching rankings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const body = await request.json();
    const { action } = body;

    if (action === 'update_weekly') {
      // Update weekly rankings (admin/cron job function)
      await updateWeeklyRankings(familyId);
      return NextResponse.json({ success: true });
    }

    if (action === 'process_champions') {
      // Process weekly champions and award rewards
      await processWeeklyChampions(familyId);
      return NextResponse.json({ success: true });
    }

    if (action === 'check_champion') {
      const { searchParams } = new URL(request.url);
      const childId = searchParams.get('childId');

      if (!childId) {
        return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
      }

      // Check if db client is available
      if (!db) {
        return NextResponse.json({ error: 'Database not available' }, { status: 503 });
      }

      // Check if child belongs to family
      const child = await db
        .select()
        .from(children)
        .where(and(
          eq(children.id, childId),
          eq(children.familyId, familyId)
        ));

      if (!child.length) {
        return NextResponse.json({ error: 'Child not found' }, { status: 404 });
      }

      // Check champion status
      const championStatus = await getWeeklyChampionStatus(childId, familyId);

      // For now, return mock data - in production this would check if user just became champion
      return NextResponse.json({
        isNewChampion: false, // Set to true to test celebration
        category: 'xp',
        isGoldenPet: championStatus.goldenPetActive
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error updating rankings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}