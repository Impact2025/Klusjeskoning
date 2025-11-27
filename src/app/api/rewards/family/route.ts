import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { familyRewards, rewardTemplates, children } from '@/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// GET /api/rewards/family - Get family's rewards
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const childId = searchParams.get('childId');

    let whereConditions = [
      eq(familyRewards.familyId, familyId),
      eq(familyRewards.isActive, 1)
    ];

    if (category) {
      whereConditions.push(eq(familyRewards.category, category as any));
    }

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const rewards = await db
      .select()
      .from(familyRewards)
      .where(and(...whereConditions))
      .orderBy(familyRewards.category, familyRewards.name);

    // If childId is provided, filter by age appropriateness
    if (childId) {
      const [child] = await db
        .select()
        .from(children)
        .where(and(
          eq(children.id, childId),
          eq(children.familyId, familyId)
        ));

      if (child) {
        // Calculate age (simplified - in production you'd use proper date calculation)
        const currentYear = new Date().getFullYear();
        const birthYear = 2024 - 10; // Simplified - you'd store birth date
        const age = currentYear - birthYear;

        return NextResponse.json({
          rewards: rewards.filter(reward => reward.minAge <= age)
        });
      }
    }

    return NextResponse.json({ rewards });
  } catch (error) {
    console.error('Error fetching family rewards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rewards/family - Add reward to family
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const body = await request.json();
    const { templateId, name, description, category, points, minAge, emoji, estimatedCost } = body;

    if (!name || !description || !category || points === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const [reward] = await db.insert(familyRewards).values({
      familyId,
      templateId: templateId || null,
      name,
      description,
      category,
      points,
      minAge: minAge || 4,
      emoji,
      estimatedCost: estimatedCost ? Math.round(estimatedCost * 100) : null, // Convert to cents
    }).returning();

    return NextResponse.json({ reward });
  } catch (error) {
    console.error('Error creating family reward:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}