import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { dailySpins, pointsTransactions, children, achievements } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { childId } = await request.json();
    if (!childId) {
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    // Verify child belongs to family
    const child = await db
      .select()
      .from(children)
      .where(and(eq(children.id, childId), eq(children.familyId, session.familyId)))
      .limit(1);

    if (!child.length) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Use UTC dates consistently to avoid timezone issues
    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const todayString = todayUTC.toISOString().split('T')[0]; // YYYY-MM-DD format


    // Check if child has spins available
    let dailySpinRecord = await db
      .select()
      .from(dailySpins)
      .where(and(eq(dailySpins.childId, childId), eq(dailySpins.familyId, session.familyId)))
      .limit(1);

    let spinsAvailable = 1; // Default 1 spin per day
    let isNewRecord = false;

    const hasExistingRecord = dailySpinRecord.length > 0;

    if (!hasExistingRecord) {
      // Create new daily spin record
      await db.insert(dailySpins).values({
        childId,
        familyId: session.familyId,
        lastSpinDate: todayString,
        spinsAvailable: 0, // Will be set to 1 after spin
        totalSpins: 0,
      });
      dailySpinRecord = await db
        .select()
        .from(dailySpins)
        .where(and(eq(dailySpins.childId, childId), eq(dailySpins.familyId, session.familyId)))
        .limit(1);
      isNewRecord = true;
    }

    const spinRecord = dailySpinRecord[0];

    // Check if it's a new day - compare date strings directly for consistency
    const lastSpinDateString = spinRecord.lastSpinDate;
    const isNewDay = lastSpinDateString < todayString;

    if (isNewDay) {
      // Reset spins for new day
      spinsAvailable = 1;
      await db
        .update(dailySpins)
        .set({
          lastSpinDate: todayString,
          spinsAvailable: 0, // Will be decremented after spin
        })
        .where(eq(dailySpins.id, spinRecord.id));
    } else {
      spinsAvailable = spinRecord.spinsAvailable;
    }

    if (spinsAvailable <= 0) {
      return NextResponse.json({ error: 'No spins available' }, { status: 400 });
    }

    // Define spin rewards with probabilities
    const rewards = [
      { type: 'points', value: 10, label: '10 Punten', probability: 30, rarity: 'common' },
      { type: 'xp', value: 25, label: '25 XP', probability: 25, rarity: 'common' },
      { type: 'points', value: 25, label: '25 Punten', probability: 20, rarity: 'rare' },
      { type: 'sticker', value: 'random', label: 'Nieuwe Sticker', probability: 15, rarity: 'rare' },
      { type: 'xp', value: 50, label: '50 XP', probability: 5, rarity: 'epic' },
      { type: 'avatar_item', value: 'random', label: 'Avatar Item', probability: 3, rarity: 'epic' },
      { type: 'points', value: 50, label: '50 Punten', probability: 1.5, rarity: 'legendary' },
      { type: 'bonus', value: 'double_next', label: 'Dubbele Punten Morgen!', probability: 0.5, rarity: 'legendary' },
    ];

    // Select reward based on probability
    const random = Math.random() * 100;
    let cumulativeProbability = 0;
    let selectedReward = rewards[0];

    for (const reward of rewards) {
      cumulativeProbability += reward.probability;
      if (random <= cumulativeProbability) {
        selectedReward = reward;
        break;
      }
    }

    // Apply the reward with improved transaction handling
    const result = await db.transaction(async (tx) => {
      try {
        // Decrement spins available
        const spinUpdateResult = await tx
          .update(dailySpins)
          .set({
            spinsAvailable: sql`${dailySpins.spinsAvailable} - 1`,
            totalSpins: sql`${dailySpins.totalSpins} + 1`,
          })
          .where(eq(dailySpins.id, spinRecord.id));

        if (spinUpdateResult.rowCount === 0) {
          throw new Error('Failed to update spin record');
        }

      let rewardApplied = false;

        // Apply reward based on type
        if (selectedReward.type === 'points') {
          const pointsUpdateResult = await tx
            .update(children)
            .set({
              points: sql`${children.points} + ${selectedReward.value}`,
              totalPointsEver: sql`${children.totalPointsEver} + ${selectedReward.value}`,
            })
            .where(eq(children.id, childId));

          if (pointsUpdateResult.rowCount === 0) {
            throw new Error('Failed to update child points');
          }

          // Record transaction
          await tx.insert(pointsTransactions).values({
            familyId: session.familyId,
            childId,
            type: 'bonus',
            amount: selectedReward.value as number,
            description: `Dagelijkse spin: ${selectedReward.label}`,
            balanceBefore: child[0].points,
            balanceAfter: child[0].points + (selectedReward.value as number),
          });

          rewardApplied = true;
        } else if (selectedReward.type === 'xp') {
          const xpUpdateResult = await tx
            .update(children)
            .set({
              xp: sql`${children.xp} + ${selectedReward.value}`,
              totalXpEver: sql`${children.totalXpEver} + ${selectedReward.value}`,
            })
            .where(eq(children.id, childId));

          if (xpUpdateResult.rowCount === 0) {
            throw new Error('Failed to update child XP');
          }

          rewardApplied = true;
        } else if (selectedReward.type === 'bonus' && selectedReward.value === 'double_next') {
          // For now, just give extra points as placeholder
          // In future, implement actual bonus system
          const bonusUpdateResult = await tx
            .update(children)
            .set({
              points: sql`${children.points} + 25`,
              totalPointsEver: sql`${children.totalPointsEver} + 25`,
            })
            .where(eq(children.id, childId));

          if (bonusUpdateResult.rowCount === 0) {
            throw new Error('Failed to apply bonus reward');
          }

          await tx.insert(pointsTransactions).values({
            familyId: session.familyId,
            childId,
            type: 'bonus',
            amount: 25,
            description: 'Dagelijkse spin bonus: Dubbele punten morgen!',
            balanceBefore: child[0].points,
            balanceAfter: child[0].points + 25,
          });

          rewardApplied = true;
        }

        // For stickers and avatar items, we'll implement later when those systems are ready
        // For now, give points as fallback
        if (!rewardApplied) {
          const fallbackUpdateResult = await tx
            .update(children)
            .set({
              points: sql`${children.points} + 10`,
              totalPointsEver: sql`${children.totalPointsEver} + 10`,
            })
            .where(eq(children.id, childId));

          if (fallbackUpdateResult.rowCount === 0) {
            throw new Error('Failed to apply fallback reward');
          }

          await tx.insert(pointsTransactions).values({
            familyId: session.familyId,
            childId,
            type: 'bonus',
            amount: 10,
            description: `Dagelijkse spin: ${selectedReward.label} (tijdelijk punten)`,
            balanceBefore: child[0].points,
            balanceAfter: child[0].points + 10,
          });
        }

        return selectedReward;

      } catch (txError) {
        console.error('Daily spin transaction failed:', txError);
        throw txError; // Re-throw to trigger transaction rollback
      }

        // Check for spin achievements
        const updatedSpinRecord = await tx
          .select()
          .from(dailySpins)
          .where(eq(dailySpins.id, spinRecord.id))
          .limit(1);

        if (updatedSpinRecord[0].totalSpins === 1) {
          // First spin achievement
          await tx.insert(achievements).values({
            childId,
            familyId: session.familyId,
            achievementId: 'first_spin',
            name: 'Eerste Spin',
            description: 'Je hebt je eerste dagelijkse spin gedaan!',
            category: 'special',
            xpReward: 10,
          });
        } else if (updatedSpinRecord[0].totalSpins === 7) {
          // Week of spins achievement
          await tx.insert(achievements).values({
            childId,
            familyId: session.familyId,
            achievementId: 'spin_week',
            name: 'Spin Kampioen',
            description: '7 dagen achter elkaar gespind!',
            category: 'special',
            xpReward: 50,
          });
        }
    });

    return NextResponse.json({
      success: true,
      reward: result,
      spinsRemaining: spinsAvailable - 1,
    });

  } catch (error) {
    console.error('Daily spin error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    // Get daily spin status - use UTC consistently
    const now = new Date();
    const todayUTC = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const todayString = todayUTC.toISOString().split('T')[0];

    let dailySpinRecord = await db
      .select()
      .from(dailySpins)
      .where(and(eq(dailySpins.childId, childId), eq(dailySpins.familyId, session.familyId)))
      .limit(1);

    let spinsAvailable = 0;

    if (!dailySpinRecord.length) {
      spinsAvailable = 1; // New day, 1 spin available
    } else {
      const spinRecord = dailySpinRecord[0];
      const lastSpinDateString = spinRecord.lastSpinDate;

      if (lastSpinDateString < todayString) {
        spinsAvailable = 1; // New day
      } else {
        spinsAvailable = spinRecord.spinsAvailable;
      }
    }

    return NextResponse.json({
      spinsAvailable,
      nextReset: new Date(todayUTC.getTime() + 24 * 60 * 60 * 1000), // Tomorrow
    });

  } catch (error) {
    console.error('Get daily spin status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}