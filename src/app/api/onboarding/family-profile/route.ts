import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { families, onboardingEvents } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// GET /api/onboarding/family-profile - Get family profile for onboarding
export async function GET() {
  try {
    const session = await requireSession();

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const [family] = await db
      .select({
        id: families.id,
        familyName: families.familyName,
        hasGarden: families.hasGarden,
        hasPets: families.hasPets,
        onboardingCompleted: families.onboardingCompleted,
        onboardingCompletedAt: families.onboardingCompletedAt,
      })
      .from(families)
      .where(eq(families.id, session.familyId));

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: family });
  } catch (error) {
    console.error('Error fetching family profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/onboarding/family-profile - Update family profile
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body = await request.json();
    const { hasGarden, hasPets } = body;

    if (hasGarden === undefined && hasPets === undefined) {
      return NextResponse.json({ error: 'At least one field is required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Update family profile
    const updateData: Record<string, boolean> = {};
    if (hasGarden !== undefined) updateData.hasGarden = hasGarden;
    if (hasPets !== undefined) updateData.hasPets = hasPets;

    const [updatedFamily] = await db
      .update(families)
      .set(updateData)
      .where(eq(families.id, session.familyId))
      .returning({
        id: families.id,
        hasGarden: families.hasGarden,
        hasPets: families.hasPets,
      });

    // Log onboarding event
    await db.insert(onboardingEvents).values({
      familyId: session.familyId,
      eventType: 'family_profile_updated',
      eventData: { hasGarden, hasPets },
    });

    return NextResponse.json({ profile: updatedFamily });
  } catch (error) {
    console.error('Error updating family profile:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
