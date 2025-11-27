import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { children, pointsTransactions, choreAssignments } from '@/server/db/schema';
import { eq, and, gte, lte, sql, desc } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';
import { startOfWeek, endOfWeek, subDays, format } from 'date-fns';
import { nl } from 'date-fns/locale';

// Get current week's start and end dates
function getCurrentWeek() {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 }); // Sunday
  return { weekStart, weekEnd };
}

// Calculate days left in current week
function getDaysLeftInWeek() {
  const now = new Date();
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const diffTime = weekEnd.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

// GET /api/leaderboards/weekly - Get weekly leaderboards for family
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const currentChildId = searchParams.get('currentChildId');

    const { weekStart, weekEnd } = getCurrentWeek();

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get all children in the family
    const familyChildren = await db
      .select({
        id: children.id,
        name: children.name,
        avatar: children.avatar,
      })
      .from(children)
      .where(eq(children.familyId, familyId));

    if (familyChildren.length === 0) {
      return NextResponse.json({
        leaderboards: { points: [], tasks: [], streaks: [] },
        weekInfo: {
          startDate: weekStart.toISOString(),
          endDate: weekEnd.toISOString(),
          daysLeft: getDaysLeftInWeek(),
        }
      });
    }

    // Calculate points leaderboard
    const pointsLeaderboard = await Promise.all(
      familyChildren.map(async (child) => {
        // Sum points earned this week from transactions
        const pointsResult = await db!
          .select({
            totalPoints: sql<number>`COALESCE(SUM(${pointsTransactions.amount}), 0)`,
          })
          .from(pointsTransactions)
          .where(and(
            eq(pointsTransactions.childId, child.id),
            eq(pointsTransactions.type, 'earned'),
            gte(pointsTransactions.createdAt, weekStart),
            lte(pointsTransactions.createdAt, weekEnd)
          ));

        return {
          childId: child.id,
          childName: child.name,
          avatar: child.avatar,
          points: Math.max(0, pointsResult[0]?.totalPoints || 0),
          tasksCompleted: 0, // Will be calculated below
          streak: 0, // Will be calculated below
        };
      })
    );

    // Calculate tasks completed leaderboard
    const tasksLeaderboard = await Promise.all(
      familyChildren.map(async (child) => {
        // Count approved chore assignments this week
        const tasksResult = await db!
          .select({
            taskCount: sql<number>`COUNT(*)`,
          })
          .from(choreAssignments)
          .where(and(
            eq(choreAssignments.childId, child.id),
            gte(choreAssignments.assignedAt, weekStart),
            lte(choreAssignments.assignedAt, weekEnd)
          ));

        return {
          childId: child.id,
          childName: child.name,
          avatar: child.avatar,
          points: 0, // Will be set from pointsLeaderboard
          tasksCompleted: tasksResult[0]?.taskCount || 0,
          streak: 0, // Will be calculated below
        };
      })
    );

    // Calculate streaks leaderboard (simplified - consecutive days with activity)
    const streaksLeaderboard = await Promise.all(
      familyChildren.map(async (child) => {
        // For simplicity, we'll use a basic streak calculation
        // In a real implementation, you'd track daily activity properly
        let streak = 0;
        const today = new Date();

        // Check last 7 days for activity
        for (let i = 0; i < 7; i++) {
          const checkDate = subDays(today, i);
          const startOfDay = new Date(checkDate);
          startOfDay.setHours(0, 0, 0, 0);
          const endOfDay = new Date(checkDate);
          endOfDay.setHours(23, 59, 59, 999);

          const activityResult = await db!
            .select({
              hasActivity: sql<number>`COUNT(*) > 0`,
            })
            .from(pointsTransactions)
            .where(and(
              eq(pointsTransactions.childId, child.id),
              gte(pointsTransactions.createdAt, startOfDay),
              lte(pointsTransactions.createdAt, endOfDay)
            ));

          if (activityResult[0]?.hasActivity) {
            streak++;
          } else {
            break; // Streak broken
          }
        }

        return {
          childId: child.id,
          childName: child.name,
          avatar: child.avatar,
          points: 0, // Will be set from pointsLeaderboard
          tasksCompleted: 0, // Will be set from tasksLeaderboard
          streak: streak,
        };
      })
    );

    // Sort and rank the leaderboards
    const sortAndRank = (entries: any[], sortKey: string) => {
      return entries
        .sort((a, b) => b[sortKey] - a[sortKey])
        .map((entry, index) => ({
          ...entry,
          rank: index + 1,
          isCurrentUser: entry.childId === currentChildId,
        }));
    };

    // Combine data and create final leaderboards
    const finalPointsLeaderboard = sortAndRank(
      pointsLeaderboard.map(p => ({
        ...p,
        tasksCompleted: tasksLeaderboard.find(t => t.childId === p.childId)?.tasksCompleted || 0,
        streak: streaksLeaderboard.find(s => s.childId === p.childId)?.streak || 0,
      })),
      'points'
    );

    const finalTasksLeaderboard = sortAndRank(
      tasksLeaderboard.map(t => ({
        ...t,
        points: pointsLeaderboard.find(p => p.childId === t.childId)?.points || 0,
        streak: streaksLeaderboard.find(s => s.childId === t.childId)?.streak || 0,
      })),
      'tasksCompleted'
    );

    const finalStreaksLeaderboard = sortAndRank(
      streaksLeaderboard.map(s => ({
        ...s,
        points: pointsLeaderboard.find(p => p.childId === s.childId)?.points || 0,
        tasksCompleted: tasksLeaderboard.find(t => t.childId === s.childId)?.tasksCompleted || 0,
      })),
      'streak'
    );

    return NextResponse.json({
      leaderboards: {
        points: finalPointsLeaderboard,
        tasks: finalTasksLeaderboard,
        streaks: finalStreaksLeaderboard,
      },
      weekInfo: {
        startDate: weekStart.toISOString(),
        endDate: weekEnd.toISOString(),
        daysLeft: getDaysLeftInWeek(),
      }
    });

  } catch (error) {
    console.error('Error fetching weekly leaderboards:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}