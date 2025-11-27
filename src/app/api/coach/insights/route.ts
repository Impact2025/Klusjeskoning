import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { coachInsights, behaviorPatterns, children, chores } from '@/server/db/schema';
import { eq, and, desc, sql, gte, isNull, or } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { generateParentInsight } from '@/lib/ai/openrouter';

// GET /api/coach/insights - Get insights for parents
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
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build conditions
    const conditions = [
      eq(coachInsights.familyId, session.familyId),
      eq(coachInsights.isDismissed, false),
    ];

    if (childId) {
      conditions.push(
        or(
          eq(coachInsights.childId, childId),
          isNull(coachInsights.childId) // Also include family-wide insights
        )!
      );
    }

    if (unreadOnly) {
      conditions.push(eq(coachInsights.isRead, false));
    }

    const insights = await db
      .select()
      .from(coachInsights)
      .where(and(...conditions))
      .orderBy(desc(coachInsights.priority), desc(coachInsights.createdAt))
      .limit(limit);

    // Get unread count
    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coachInsights)
      .where(and(
        eq(coachInsights.familyId, session.familyId),
        eq(coachInsights.isRead, false),
        eq(coachInsights.isDismissed, false)
      ));

    // Get children for context
    const familyChildren = await db
      .select({ id: children.id, name: children.name })
      .from(children)
      .where(eq(children.familyId, session.familyId));

    return NextResponse.json({
      insights,
      unreadCount: unreadResult?.count || 0,
      children: familyChildren,
    });
  } catch (error) {
    console.error('Error fetching coach insights:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/coach/insights - Generate new insight or update existing
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
    const { action, insightId, childId, insightType } = body;

    // Handle update actions
    if (action === 'markRead' && insightId) {
      await db
        .update(coachInsights)
        .set({ isRead: true })
        .where(and(
          eq(coachInsights.id, insightId),
          eq(coachInsights.familyId, session.familyId)
        ));
      return NextResponse.json({ success: true });
    }

    if (action === 'dismiss' && insightId) {
      await db
        .update(coachInsights)
        .set({ isDismissed: true })
        .where(and(
          eq(coachInsights.id, insightId),
          eq(coachInsights.familyId, session.familyId)
        ));
      return NextResponse.json({ success: true });
    }

    // Generate new insight
    if (action === 'generate' && childId && insightType) {
      // Get child data
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

      // Get child's chore data for context
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentChores = await db
        .select()
        .from(chores)
        .where(and(
          eq(chores.submittedByChildId, childId),
          gte(chores.submittedAt, thirtyDaysAgo)
        ))
        .orderBy(desc(chores.submittedAt));

      // Get behavior patterns
      const patterns = await db
        .select()
        .from(behaviorPatterns)
        .where(and(
          eq(behaviorPatterns.childId, childId),
          eq(behaviorPatterns.isActive, true)
        ));

      // Calculate child age
      let childAge: number | undefined;
      if (child.birthdate) {
        const birthDate = new Date(child.birthdate);
        childAge = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      }

      // Get previous insights to avoid repetition
      const previousInsights = await db
        .select({ content: coachInsights.content })
        .from(coachInsights)
        .where(and(
          eq(coachInsights.childId, childId),
          eq(coachInsights.insightType, insightType)
        ))
        .orderBy(desc(coachInsights.createdAt))
        .limit(3);

      // Build data points
      const dataPoints = {
        choresCompleted: recentChores.filter(c => c.status === 'approved').length,
        choresByDay: calculateChoresByDay(recentChores),
        averagePointsPerChore: calculateAveragePoints(recentChores),
        patterns: patterns.map(p => ({ type: p.patternType, description: p.description })),
        mostCommonChores: getMostCommonChores(recentChores),
      };

      // Generate AI insight
      const { title, content, actionText, model } = await generateParentInsight(
        insightType,
        {
          childName: child.name,
          childAge,
          dataPoints,
          previousInsights: previousInsights.map(p => p.content),
        }
      );

      // Save insight
      const [newInsight] = await db
        .insert(coachInsights)
        .values({
          familyId: session.familyId,
          childId,
          insightType,
          title,
          content,
          priority: insightType === 'attention_point' ? 8 : 5,
          actionable: !!actionText,
          actionText,
          dataPoints,
          aiModel: model,
          validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Valid for 7 days
        })
        .returning();

      return NextResponse.json({
        insight: newInsight,
        success: true,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error processing coach insight:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
function calculateChoresByDay(chores: { submittedAt: Date | null }[]): Record<string, number> {
  const byDay: Record<string, number> = {};
  const days = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

  chores.forEach(chore => {
    if (chore.submittedAt) {
      const day = days[new Date(chore.submittedAt).getDay()];
      byDay[day] = (byDay[day] || 0) + 1;
    }
  });

  return byDay;
}

function calculateAveragePoints(chores: { points: number; status: string }[]): number {
  const approved = chores.filter(c => c.status === 'approved');
  if (approved.length === 0) return 0;
  return Math.round(approved.reduce((sum, c) => sum + c.points, 0) / approved.length);
}

function getMostCommonChores(chores: { name: string }[]): string[] {
  const counts: Record<string, number> = {};
  chores.forEach(c => {
    counts[c.name] = (counts[c.name] || 0) + 1;
  });

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name]) => name);
}
