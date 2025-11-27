import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { avatarItems, avatarCustomizations, children } from '@/server/db/schema';
import { requireSession } from '@/server/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, childId } = await request.json();

    if (!itemId || !childId) {
      return NextResponse.json({ error: 'Item ID and Child ID required' }, { status: 400 });
    }

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get the child and item details
    const [child] = await db
      .select()
      .from(children)
      .where(eq(children.id, childId))
      .limit(1);

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    const [item] = await db
      .select()
      .from(avatarItems)
      .where(eq(avatarItems.id, itemId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if child has enough XP
    if (child.xp < item.xpRequired) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 });
    }

    // Check if already unlocked
    const [existing] = await db
      .select()
      .from(avatarCustomizations)
      .where(and(
        eq(avatarCustomizations.childId, childId),
        eq(avatarCustomizations.itemId, itemId)
      ))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: 'Item already unlocked' }, { status: 400 });
    }

    // Unlock the item
    await db.insert(avatarCustomizations).values({
      childId,
      itemId,
    });

    // Deduct XP from child
    await db
      .update(children)
      .set({ xp: child.xp - item.xpRequired })
      .where(eq(children.id, childId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unlocking avatar item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}