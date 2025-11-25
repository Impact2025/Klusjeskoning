import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { familyRewards, rewardRedemptions, children, pointsTransactions } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// POST /api/rewards/redeem - Redeem a reward
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const body = await request.json();
    const { childId, rewardId } = body;

    if (!childId || !rewardId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get the child and reward details
    const [child] = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, childId),
        eq(children.familyId, familyId)
      ));

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const [reward] = await db
      .select()
      .from(familyRewards)
      .where(and(
        eq(familyRewards.id, rewardId),
        eq(familyRewards.familyId, familyId),
        eq(familyRewards.isActive, 1)
      ));

    if (!reward) {
      return NextResponse.json({ error: 'Reward not found' }, { status: 404 });
    }

    // Check if child has enough points
    if (child.points < reward.points) {
      return NextResponse.json({ error: 'Insufficient points' }, { status: 400 });
    }

    // Check if child meets minimum age requirement
    const currentYear = new Date().getFullYear();
    const birthYear = 2024 - 10; // Simplified - you'd store birth date
    const age = currentYear - birthYear;

    if (age < reward.minAge) {
      return NextResponse.json({ error: 'Child does not meet minimum age requirement' }, { status: 400 });
    }

    // Check if there's already a pending redemption for this reward by this child
    const [existingRedemption] = await db
      .select()
      .from(rewardRedemptions)
      .where(and(
        eq(rewardRedemptions.childId, childId),
        eq(rewardRedemptions.rewardId, rewardId),
        eq(rewardRedemptions.status, 'pending')
      ));

    if (existingRedemption) {
      return NextResponse.json({ error: 'Reward already requested' }, { status: 400 });
    }

    // Create redemption record
    const [redemption] = await db.insert(rewardRedemptions).values({
      familyId,
      childId,
      rewardId,
      pointsSpent: reward.points,
      status: 'pending',
    }).returning();

    // Create points transaction
    await db.insert(pointsTransactions).values({
      familyId,
      childId,
      type: 'spent',
      amount: -reward.points,
      description: `Ingewisseld voor: ${reward.name}`,
      relatedRewardId: rewardId,
      balanceBefore: child.points,
      balanceAfter: child.points - reward.points,
    });

    // Update child's points
    await db
      .update(children)
      .set({ points: child.points - reward.points })
      .where(eq(children.id, childId));

    return NextResponse.json({
      redemption,
      newBalance: child.points - reward.points
    });
  } catch (error) {
    console.error('Error redeeming reward:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/rewards/redeem - Get redemption history
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const status = searchParams.get('status');

    let whereConditions = [eq(rewardRedemptions.familyId, familyId)];

    if (childId) {
      whereConditions.push(eq(rewardRedemptions.childId, childId));
    }

    if (status) {
      whereConditions.push(eq(rewardRedemptions.status, status as any));
    }

    const redemptions = await db
      .select({
        id: rewardRedemptions.id,
        childId: rewardRedemptions.childId,
        rewardId: rewardRedemptions.rewardId,
        pointsSpent: rewardRedemptions.pointsSpent,
        status: rewardRedemptions.status,
        notes: rewardRedemptions.notes,
        createdAt: rewardRedemptions.createdAt,
        completedAt: rewardRedemptions.completedAt,
        reward: {
          name: familyRewards.name,
          emoji: familyRewards.emoji,
        },
        child: {
          name: children.name,
        },
      })
      .from(rewardRedemptions)
      .leftJoin(familyRewards, eq(rewardRedemptions.rewardId, familyRewards.id))
      .leftJoin(children, eq(rewardRedemptions.childId, children.id))
      .where(and(...whereConditions))
      .orderBy(desc(rewardRedemptions.createdAt));

    return NextResponse.json({ redemptions });
  } catch (error) {
    console.error('Error fetching redemptions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}