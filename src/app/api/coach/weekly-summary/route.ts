import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { weeklySummaries, families, children, chores } from '@/server/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { generateWeeklySummary } from '@/lib/ai/openrouter';

// GET /api/coach/weekly-summary - Get weekly summaries
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
    const limit = parseInt(searchParams.get('limit') || '4');
    const generateNew = searchParams.get('generate') === 'true';

    // Get existing summaries
    const summaries = await db
      .select()
      .from(weeklySummaries)
      .where(eq(weeklySummaries.familyId, session.familyId))
      .orderBy(desc(weeklySummaries.weekStart))
      .limit(limit);

    // Check if we should generate a new summary
    if (generateNew || summaries.length === 0) {
      // Check if there's already a summary for this week
      const today = new Date();
      const dayOfWeek = today.getDay();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);

      const existingThisWeek = summaries.find(s => {
        const sWeekStart = new Date(s.weekStart);
        return sWeekStart.toDateString() === weekStart.toDateString();
      });

      if (!existingThisWeek && generateNew) {
        // Generate new summary
        const newSummary = await generateNewWeeklySummary(session.familyId, weekStart);
        if (newSummary) {
          summaries.unshift(newSummary);
        }
      }
    }

    // Mark latest as read
    if (summaries.length > 0 && !summaries[0].isRead) {
      await db
        .update(weeklySummaries)
        .set({ isRead: true })
        .where(eq(weeklySummaries.id, summaries[0].id));
      summaries[0].isRead = true;
    }

    return NextResponse.json({
      summaries,
      hasUnread: summaries.some(s => !s.isRead),
    });
  } catch (error) {
    console.error('Error fetching weekly summaries:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/coach/weekly-summary - Generate a new weekly summary
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Calculate week bounds
    const today = new Date();
    const dayOfWeek = today.getDay();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Check if summary already exists for this week
    const [existing] = await db
      .select()
      .from(weeklySummaries)
      .where(and(
        eq(weeklySummaries.familyId, session.familyId),
        eq(weeklySummaries.weekStart, weekStart.toISOString().split('T')[0])
      ));

    if (existing) {
      return NextResponse.json({
        summary: existing,
        alreadyExists: true,
      });
    }

    // Generate new summary
    const summary = await generateNewWeeklySummary(session.familyId, weekStart);

    if (!summary) {
      return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 });
    }

    return NextResponse.json({
      summary,
      success: true,
    });
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateNewWeeklySummary(familyId: string, weekStart: Date) {
  if (!db) return null;

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  // Previous week for comparison
  const prevWeekStart = new Date(weekStart);
  prevWeekStart.setDate(prevWeekStart.getDate() - 7);
  const prevWeekEnd = new Date(weekStart);
  prevWeekEnd.setDate(prevWeekEnd.getDate() - 1);

  // Get family data
  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, familyId));

  if (!family) return null;

  // Get children
  const familyChildren = await db
    .select()
    .from(children)
    .where(eq(children.familyId, familyId));

  if (familyChildren.length === 0) return null;

  // Get chores for this week
  const weekChores = await db
    .select()
    .from(chores)
    .where(and(
      eq(chores.familyId, familyId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, weekStart),
      lte(chores.submittedAt, weekEnd)
    ));

  // Get chores for previous week
  const prevWeekChores = await db
    .select()
    .from(chores)
    .where(and(
      eq(chores.familyId, familyId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, prevWeekStart),
      lte(chores.submittedAt, prevWeekEnd)
    ));

  // Build child stats
  const childStats = familyChildren.map(child => {
    const childChores = weekChores.filter(c => c.submittedByChildId === child.id);
    const choreNames = childChores.map(c => c.name);
    const choreCounts: Record<string, number> = {};
    choreNames.forEach(name => {
      choreCounts[name] = (choreCounts[name] || 0) + 1;
    });

    const topChores = Object.entries(choreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // Calculate child age
    let childAge: number | undefined;
    if (child.birthdate) {
      const birthDate = new Date(child.birthdate);
      childAge = Math.floor((Date.now() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Simple streak calculation (consecutive days with at least one chore)
    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      checkDate.setHours(0, 0, 0, 0);
      const nextDate = new Date(checkDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const hasChoreOnDay = weekChores.some(c =>
        c.submittedByChildId === child.id &&
        c.submittedAt &&
        new Date(c.submittedAt) >= checkDate &&
        new Date(c.submittedAt) < nextDate
      );

      if (hasChoreOnDay) {
        streakDays++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      name: child.name,
      age: childAge,
      choresCompleted: childChores.length,
      totalPoints: childChores.reduce((sum, c) => sum + c.points, 0),
      streakDays,
      topChores,
    };
  });

  // Build family data for AI
  const familyData = {
    familyName: family.familyName,
    children: childStats,
    weekStats: {
      totalChoresCompleted: weekChores.length,
      previousWeekTotal: prevWeekChores.length,
      totalPointsEarned: weekChores.reduce((sum, c) => sum + c.points, 0),
      teamChoresCompleted: 0, // TODO: track team chores
    },
  };

  // Generate AI summary
  const { summaryContent, highlights, recommendations, model } = await generateWeeklySummary(familyData);

  // Calculate comparison
  const comparison = {
    choresChange: weekChores.length - prevWeekChores.length,
    choresChangePercent: prevWeekChores.length > 0
      ? Math.round((weekChores.length - prevWeekChores.length) / prevWeekChores.length * 100)
      : 0,
  };

  // Save to database
  const [newSummary] = await db
    .insert(weeklySummaries)
    .values({
      familyId,
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      summaryContent,
      highlights,
      recommendations,
      childStats,
      comparisonWithPrevious: comparison,
      aiModel: model,
    })
    .returning();

  return newSummary;
}
