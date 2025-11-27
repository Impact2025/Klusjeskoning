import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { coachMessages, coachPreferences, children, chores, choreAssignments } from '@/server/db/schema';
import { eq, and, desc, sql, gte } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { generateCoachResponse, PROMPT_TEMPLATES } from '@/lib/ai/openrouter';

type MessageType = 'greeting' | 'encouragement' | 'milestone' | 'reminder' | 'tip' | 'motivation' | 'explanation' | 'celebration';

// POST /api/coach/generate - Generate a new coach message
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
    const { childId, messageType, context } = body as {
      childId: string;
      messageType: MessageType;
      context?: Record<string, unknown>;
    };

    if (!childId || !messageType) {
      return NextResponse.json({ error: 'childId and messageType are required' }, { status: 400 });
    }

    // Verify child belongs to family and get child data
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

    // Check preferences - is coach enabled?
    const [preferences] = await db
      .select()
      .from(coachPreferences)
      .where(eq(coachPreferences.childId, childId));

    if (preferences && !preferences.isEnabled) {
      return NextResponse.json({ error: 'Coach is disabled for this child' }, { status: 403 });
    }

    // Check daily message limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coachMessages)
      .where(and(
        eq(coachMessages.childId, childId),
        gte(coachMessages.createdAt, today)
      ));

    const maxMessages = preferences?.maxMessagesPerDay || 5;
    if ((todayCount?.count || 0) >= maxMessages) {
      return NextResponse.json(
        { error: 'Daily message limit reached', limitReached: true },
        { status: 429 }
      );
    }

    // Calculate child age
    let childAge: number | undefined;
    if (child.birthdate) {
      const birthDate = new Date(child.birthdate);
      const ageDiff = Date.now() - birthDate.getTime();
      childAge = Math.floor(ageDiff / (365.25 * 24 * 60 * 60 * 1000));
    }

    // Build prompt based on message type
    let prompt: string;
    switch (messageType) {
      case 'greeting':
        // Get pending chores count
        const pendingChores = await getPendingChoresCount(childId);
        const streak = await getCurrentStreak(childId);
        prompt = PROMPT_TEMPLATES.dailyGreeting(child.name, pendingChores, streak);
        break;

      case 'encouragement':
        const choreName = (context?.choreName as string) || 'een klusje';
        const points = (context?.points as number) || child.points;
        prompt = PROMPT_TEMPLATES.choreCompleted(child.name, choreName, points);
        break;

      case 'milestone':
        const milestoneType = (context?.milestoneType as string) || 'prestatie';
        const value = (context?.value as number) || 0;
        prompt = PROMPT_TEMPLATES.milestoneAchieved(child.name, milestoneType, value);
        break;

      case 'reminder':
        const streakDays = (context?.streakDays as number) || await getCurrentStreak(childId);
        const hoursLeft = (context?.hoursLeft as number) || getHoursLeftToday();
        prompt = PROMPT_TEMPLATES.streakReminder(child.name, streakDays, hoursLeft);
        break;

      case 'tip':
        const tipChoreName = (context?.choreName as string) || 'kamer opruimen';
        prompt = PROMPT_TEMPLATES.tipForChore(child.name, tipChoreName, childAge || 10);
        break;

      case 'motivation':
        const daysSinceActive = (context?.daysSinceActive as number) || 1;
        const previousAverage = (context?.previousAverage as number) || 5;
        prompt = PROMPT_TEMPLATES.motivationDip(child.name, daysSinceActive, previousAverage);
        break;

      case 'explanation':
        const topic = (context?.topic as string) || 'punten';
        prompt = `Leg aan ${child.name} (${childAge || 10} jaar) uit hoe ${topic} werkt in KlusjesKoning. Houd het simpel en leuk.`;
        break;

      case 'celebration':
        const achievement = (context?.achievement as string) || 'een geweldige prestatie';
        prompt = `${child.name} heeft ${achievement} bereikt! Maak hier een feestelijk bericht van met confetti-energie!`;
        break;

      default:
        prompt = `Genereer een vriendelijk bericht voor ${child.name}.`;
    }

    // Generate AI response
    const tone = (preferences?.preferredTone as 'friendly' | 'enthusiastic' | 'calm') || 'friendly';
    const { content, model } = await generateCoachResponse(prompt, messageType, {
      childAge,
      tone,
    });

    // Save message to database
    const [newMessage] = await db
      .insert(coachMessages)
      .values({
        childId,
        familyId: session.familyId,
        messageType,
        content,
        contextData: context || null,
        triggeredBy: (context?.trigger as string) || 'manual',
        aiModel: model,
        expiresAt: messageType === 'greeting'
          ? new Date(Date.now() + 24 * 60 * 60 * 1000) // Expires in 24h
          : null,
      })
      .returning();

    return NextResponse.json({
      message: newMessage,
      success: true,
    });
  } catch (error) {
    console.error('Error generating coach message:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper functions
async function getPendingChoresCount(childId: string): Promise<number> {
  if (!db) return 0;

  // Count chores that are assigned to this child and still available
  const [result] = await db
    .select({ count: sql<number>`count(*)` })
    .from(chores)
    .innerJoin(choreAssignments, eq(chores.id, choreAssignments.choreId))
    .where(and(
      eq(choreAssignments.childId, childId),
      eq(chores.status, 'available')
    ));

  return result?.count || 0;
}

async function getCurrentStreak(childId: string): Promise<number> {
  if (!db) return 0;

  // Get approved chores in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const approvedChores = await db
    .select({ submittedAt: chores.submittedAt })
    .from(chores)
    .where(and(
      eq(chores.submittedByChildId, childId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, thirtyDaysAgo)
    ))
    .orderBy(desc(chores.submittedAt));

  if (approvedChores.length === 0) return 0;

  // Calculate streak
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  const choresByDate = new Map<string, boolean>();
  approvedChores.forEach(chore => {
    if (chore.submittedAt) {
      const date = new Date(chore.submittedAt);
      date.setHours(0, 0, 0, 0);
      choresByDate.set(date.toISOString(), true);
    }
  });

  // Check today and work backwards
  for (let i = 0; i < 30; i++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() - i);
    const dateKey = new Date(checkDate);
    dateKey.setHours(0, 0, 0, 0);

    if (choresByDate.has(dateKey.toISOString())) {
      streak++;
    } else if (i > 0) {
      // If not today and no chore, streak broken
      break;
    }
  }

  return streak;
}

function getHoursLeftToday(): number {
  const now = new Date();
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  return Math.floor((endOfDay.getTime() - now.getTime()) / (1000 * 60 * 60));
}
