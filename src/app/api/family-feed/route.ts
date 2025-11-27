import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { familyFeed, children } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/family-feed - Get family feed items
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get('familyId');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!familyId) {
      return NextResponse.json({ error: 'familyId is required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get feed items with child info
    const feedItems = await db
      .select({
        id: familyFeed.id,
        familyId: familyFeed.familyId,
        childId: familyFeed.childId,
        type: familyFeed.type,
        message: familyFeed.message,
        data: familyFeed.data,
        reactions: familyFeed.reactions,
        createdAt: familyFeed.createdAt,
        childName: children.name,
        childAvatar: children.avatar,
      })
      .from(familyFeed)
      .leftJoin(children, eq(familyFeed.childId, children.id))
      .where(eq(familyFeed.familyId, familyId))
      .orderBy(desc(familyFeed.createdAt))
      .limit(limit)
      .offset(offset);

    // Parse JSON fields
    const parsedItems = feedItems.map(item => ({
      ...item,
      data: item.data ? JSON.parse(item.data) : null,
      reactions: item.reactions ? JSON.parse(item.reactions) : [],
    }));

    return NextResponse.json({ feedItems: parsedItems });
  } catch (error) {
    console.error('Error fetching family feed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/family-feed - Create a feed item or add reaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    if (action === 'react') {
      // Add/remove reaction
      const { feedItemId, emoji, userId, userName } = body;

      if (!feedItemId || !emoji || !userId) {
        return NextResponse.json({ error: 'feedItemId, emoji, and userId are required' }, { status: 400 });
      }

      // Get current item
      const [item] = await db
        .select()
        .from(familyFeed)
        .where(eq(familyFeed.id, feedItemId));

      if (!item) {
        return NextResponse.json({ error: 'Feed item not found' }, { status: 404 });
      }

      // Parse current reactions
      const reactions: Array<{ emoji: string; count: number; users: Array<{ id: string; name: string }> }> =
        item.reactions ? JSON.parse(item.reactions) : [];

      // Find or create reaction
      const existingReaction = reactions.find(r => r.emoji === emoji);

      if (existingReaction) {
        const userIndex = existingReaction.users.findIndex(u => u.id === userId);
        if (userIndex >= 0) {
          // Remove user's reaction
          existingReaction.users.splice(userIndex, 1);
          existingReaction.count--;
          // Remove reaction if no users left
          if (existingReaction.count <= 0) {
            const reactionIndex = reactions.findIndex(r => r.emoji === emoji);
            reactions.splice(reactionIndex, 1);
          }
        } else {
          // Add user's reaction
          existingReaction.users.push({ id: userId, name: userName || 'Gebruiker' });
          existingReaction.count++;
        }
      } else {
        // Create new reaction
        reactions.push({
          emoji,
          count: 1,
          users: [{ id: userId, name: userName || 'Gebruiker' }],
        });
      }

      // Update database
      await db
        .update(familyFeed)
        .set({ reactions: JSON.stringify(reactions) })
        .where(eq(familyFeed.id, feedItemId));

      return NextResponse.json({ success: true, reactions });
    } else {
      // Create new feed item
      const { familyId, childId, type, message, data } = body;

      if (!familyId || !type || !message) {
        return NextResponse.json({ error: 'familyId, type, and message are required' }, { status: 400 });
      }

      const [newItem] = await db
        .insert(familyFeed)
        .values({
          familyId,
          childId,
          type,
          message,
          data: data ? JSON.stringify(data) : null,
          reactions: '[]',
        })
        .returning();

      return NextResponse.json({ success: true, feedItem: newItem });
    }
  } catch (error) {
    console.error('Error in family feed POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
