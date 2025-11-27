import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { coachPreferences, children } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';

// GET /api/coach/preferences - Get coach preferences for a child
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 });
    }

    // Verify child belongs to family
    const [child] = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, childId),
        eq(children.familyId, session.familyId)
      ));

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get preferences or return defaults
    const [preferences] = await db
      .select()
      .from(coachPreferences)
      .where(eq(coachPreferences.childId, childId));

    if (preferences) {
      return NextResponse.json({ preferences });
    }

    // Return defaults if no preferences exist
    return NextResponse.json({
      preferences: {
        childId,
        isEnabled: true,
        greetingsEnabled: true,
        remindersEnabled: true,
        tipsEnabled: true,
        maxMessagesPerDay: 5,
        preferredTone: 'friendly',
        reminderTime: null,
        parentNotificationsEnabled: true,
      },
    });
  } catch (error) {
    console.error('Error fetching coach preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/coach/preferences - Update coach preferences
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const body = await request.json();
    const {
      childId,
      isEnabled,
      greetingsEnabled,
      remindersEnabled,
      tipsEnabled,
      maxMessagesPerDay,
      preferredTone,
      reminderTime,
      parentNotificationsEnabled,
    } = body;

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 });
    }

    // Verify child belongs to family
    const [child] = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, childId),
        eq(children.familyId, session.familyId)
      ));

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Check if preferences exist
    const [existing] = await db
      .select()
      .from(coachPreferences)
      .where(eq(coachPreferences.childId, childId));

    const updatedValues = {
      isEnabled: isEnabled ?? true,
      greetingsEnabled: greetingsEnabled ?? true,
      remindersEnabled: remindersEnabled ?? true,
      tipsEnabled: tipsEnabled ?? true,
      maxMessagesPerDay: Math.min(Math.max(maxMessagesPerDay ?? 5, 1), 10), // Clamp 1-10
      preferredTone: preferredTone || 'friendly',
      reminderTime: reminderTime || null,
      parentNotificationsEnabled: parentNotificationsEnabled ?? true,
      updatedAt: new Date(),
    };

    let preferences;
    if (existing) {
      // Update existing
      [preferences] = await db
        .update(coachPreferences)
        .set(updatedValues)
        .where(eq(coachPreferences.childId, childId))
        .returning();
    } else {
      // Create new
      [preferences] = await db
        .insert(coachPreferences)
        .values({
          childId,
          ...updatedValues,
        })
        .returning();
    }

    return NextResponse.json({
      preferences,
      success: true,
    });
  } catch (error) {
    console.error('Error updating coach preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
