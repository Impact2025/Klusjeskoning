import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { avatarCustomizations } from '@/server/db/schema';
import { requireSession } from '@/server/auth/session';

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId, equip, childId } = await request.json();

    if (!itemId || !childId) {
      return NextResponse.json({ error: 'Item ID and Child ID required' }, { status: 400 });
    }

    // Check if the child owns this item
    const [existing] = await db
      .select()
      .from(avatarCustomizations)
      .where(and(
        eq(avatarCustomizations.childId, childId),
        eq(avatarCustomizations.itemId, itemId)
      ))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: 'Item not owned' }, { status: 400 });
    }

    // Update the equipped status
    await db
      .update(avatarCustomizations)
      .set({ isEquipped: equip ? 1 : 0 })
      .where(and(
        eq(avatarCustomizations.childId, childId),
        eq(avatarCustomizations.itemId, itemId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error equipping avatar item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}