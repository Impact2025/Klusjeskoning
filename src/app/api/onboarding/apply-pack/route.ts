import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import {
  children,
  families,
  chores,
  choreAssignments,
  starterPacks,
  starterPackChores,
  choreTemplates,
  addonPacks,
  addonPackChores,
  onboardingEvents,
} from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

interface ApplyPackRequest {
  childId: string;
  starterPackId: string;
  addonPackIds?: string[];
}

// POST /api/onboarding/apply-pack - Apply starter pack (and optional addons) to a child
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();

    const body: ApplyPackRequest = await request.json();
    const { childId, starterPackId, addonPackIds = [] } = body;

    if (!childId || !starterPackId) {
      return NextResponse.json({ error: 'childId and starterPackId are required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
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

    // Verify starter pack exists
    const [starterPack] = await db
      .select()
      .from(starterPacks)
      .where(eq(starterPacks.id, starterPackId));

    if (!starterPack) {
      return NextResponse.json({ error: 'Starter pack not found' }, { status: 404 });
    }

    // Get all chore template IDs to create
    const templateIds: string[] = [];

    // Get starter pack chores
    const spChores = await db
      .select({ choreTemplateId: starterPackChores.choreTemplateId })
      .from(starterPackChores)
      .where(eq(starterPackChores.starterPackId, starterPackId));

    templateIds.push(...spChores.map(c => c.choreTemplateId));

    // Get addon pack chores
    for (const addonPackId of addonPackIds) {
      const apChores = await db
        .select({ choreTemplateId: addonPackChores.choreTemplateId })
        .from(addonPackChores)
        .where(eq(addonPackChores.addonPackId, addonPackId));

      templateIds.push(...apChores.map(c => c.choreTemplateId));
    }

    // Remove duplicates
    const uniqueTemplateIds = [...new Set(templateIds)];

    // Get all template details
    const templates = await db
      .select()
      .from(choreTemplates)
      .where(eq(choreTemplates.isActive, true));

    const templateMap = new Map(templates.map(t => [t.id, t]));

    // Create chores for child
    const createdChores: string[] = [];

    for (const templateId of uniqueTemplateIds) {
      const template = templateMap.get(templateId);
      if (!template) continue;

      // Create the chore
      const [newChore] = await db.insert(chores).values({
        familyId: session.familyId,
        name: template.name,
        points: template.basePoints,
        xpReward: template.baseXp,
        status: 'available',
        recurrenceType: template.frequency === 'daily' ? 'daily' : template.frequency === 'weekly' ? 'weekly' : 'none',
        isTemplate: template.frequency !== 'monthly' ? 1 : 0, // Recurring chores are templates
      }).returning();

      if (newChore) {
        createdChores.push(newChore.id);

        // Assign chore to child
        await db.insert(choreAssignments).values({
          choreId: newChore.id,
          childId: childId,
        });
      }
    }

    // Update child record
    await db
      .update(children)
      .set({
        starterPackId: starterPackId,
        childOnboardingCompleted: true,
        childOnboardingCompletedAt: new Date(),
      })
      .where(eq(children.id, childId));

    // Check if all children have completed onboarding
    const allChildren = await db
      .select()
      .from(children)
      .where(eq(children.familyId, session.familyId));

    const allCompleted = allChildren.every(c => c.childOnboardingCompleted);

    if (allCompleted) {
      // Mark family onboarding as completed
      await db
        .update(families)
        .set({
          onboardingCompleted: true,
          onboardingCompletedAt: new Date(),
        })
        .where(eq(families.id, session.familyId));
    }

    // Log onboarding event
    await db.insert(onboardingEvents).values({
      familyId: session.familyId,
      childId: childId,
      eventType: 'starter_pack_applied',
      eventData: {
        starterPackId,
        addonPackIds,
        choresCreated: createdChores.length,
      },
    });

    return NextResponse.json({
      success: true,
      choresCreated: createdChores.length,
      starterPack: starterPack.name,
      addonsApplied: addonPackIds.length,
    });
  } catch (error) {
    console.error('Error applying starter pack:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
