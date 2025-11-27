import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { coachMessages, coachPreferences, children } from '@/server/db/schema';
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';

// GET /api/coach/messages - Get coach messages for a child
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

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

    // Build query conditions
    const conditions = [
      eq(coachMessages.childId, childId),
      eq(coachMessages.familyId, session.familyId),
    ];

    if (unreadOnly) {
      conditions.push(eq(coachMessages.isRead, false));
    }

    // Get messages
    const messages = await db
      .select()
      .from(coachMessages)
      .where(and(...conditions))
      .orderBy(desc(coachMessages.createdAt))
      .limit(limit);

    // Get unread count
    const [unreadResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(coachMessages)
      .where(and(
        eq(coachMessages.childId, childId),
        eq(coachMessages.isRead, false)
      ));

    return NextResponse.json({
      messages,
      unreadCount: unreadResult?.count || 0,
    });
  } catch (error) {
    console.error('Error fetching coach messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/coach/messages - Mark messages as read
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
    const { messageIds, childId, markAllRead } = body;

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

    if (markAllRead) {
      // Mark all messages as read
      await db
        .update(coachMessages)
        .set({ isRead: true })
        .where(and(
          eq(coachMessages.childId, childId),
          eq(coachMessages.isRead, false)
        ));
    } else if (messageIds && Array.isArray(messageIds)) {
      // Mark specific messages as read
      for (const messageId of messageIds) {
        await db
          .update(coachMessages)
          .set({ isRead: true })
          .where(and(
            eq(coachMessages.id, messageId),
            eq(coachMessages.childId, childId)
          ));
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating coach messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
