import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import {
  choreSuggestions,
  choreTemplates,
  chores,
  choreAssignments,
  children,
  onboardingEvents,
} from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

interface RespondRequest {
  suggestionId: string;
  action: 'accept' | 'dismiss' | 'snooze';
  snoozeDays?: number; // Only used if action is 'snooze'
}

// POST /api/suggestions/respond - Accept, dismiss, or snooze a suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: RespondRequest = await request.json();
    const { suggestionId, action, snoozeDays = 7 } = body;

    if (!suggestionId || !action) {
      return NextResponse.json({ error: 'suggestionId and action are required' }, { status: 400 });
    }

    if (!['accept', 'dismiss', 'snooze'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get the suggestion
    const [suggestion] = await db
      .select()
      .from(choreSuggestions)
      .where(eq(choreSuggestions.id, suggestionId));

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    // Verify child belongs to family
    const [child] = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, suggestion.childId),
        eq(children.familyId, session.familyId)
      ));

    if (!child) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    let result: { success: boolean; message: string; choreId?: string } = {
      success: false,
      message: '',
    };

    if (action === 'accept') {
      // Get template details
      const [template] = await db
        .select()
        .from(choreTemplates)
        .where(eq(choreTemplates.id, suggestion.choreTemplateId));

      if (!template) {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 });
      }

      // Create the chore
      const [newChore] = await db.insert(chores).values({
        familyId: session.familyId,
        name: template.name,
        points: template.basePoints,
        xpReward: template.baseXp,
        status: 'available',
        recurrenceType: template.frequency === 'daily' ? 'daily' : template.frequency === 'weekly' ? 'weekly' : 'none',
        isTemplate: template.frequency !== 'monthly' ? 1 : 0,
      }).returning();

      // Assign chore to child
      await db.insert(choreAssignments).values({
        choreId: newChore.id,
        childId: suggestion.childId,
      });

      // Update suggestion status
      await db
        .update(choreSuggestions)
        .set({
          status: 'accepted',
          respondedAt: new Date(),
        })
        .where(eq(choreSuggestions.id, suggestionId));

      result = {
        success: true,
        message: `Klusje "${template.name}" is toegevoegd!`,
        choreId: newChore.id,
      };

    } else if (action === 'dismiss') {
      // Update suggestion status to dismissed
      await db
        .update(choreSuggestions)
        .set({
          status: 'dismissed',
          respondedAt: new Date(),
        })
        .where(eq(choreSuggestions.id, suggestionId));

      result = {
        success: true,
        message: 'Suggestie afgewezen',
      };

    } else if (action === 'snooze') {
      // Calculate snooze until date
      const snoozedUntil = new Date();
      snoozedUntil.setDate(snoozedUntil.getDate() + snoozeDays);

      // Update suggestion status to snoozed
      await db
        .update(choreSuggestions)
        .set({
          status: 'snoozed',
          snoozedUntil,
        })
        .where(eq(choreSuggestions.id, suggestionId));

      result = {
        success: true,
        message: `Suggestie uitgesteld voor ${snoozeDays} dagen`,
      };
    }

    // Log event
    await db.insert(onboardingEvents).values({
      familyId: session.familyId,
      childId: suggestion.childId,
      eventType: 'suggestion_responded',
      eventData: {
        suggestionId,
        action,
        triggerReason: suggestion.triggerReason,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error responding to suggestion:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
