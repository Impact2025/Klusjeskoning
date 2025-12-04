import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { stickerCollections, children } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// GET /api/stickers - Get child's sticker collection
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'Child ID required' }, { status: 400 });
    }

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Verify child belongs to family
    const [child] = await db
      .select()
      .from(children)
      .where(and(
        eq(children.id, childId),
        eq(children.familyId, familyId)
      ));

    if (!child) {
      return NextResponse.json({ error: 'Child not found' }, { status: 404 });
    }

    // Get sticker collection
    const stickers = await db
      .select()
      .from(stickerCollections)
      .where(and(
        eq(stickerCollections.childId, childId),
        eq(stickerCollections.familyId, familyId)
      ))
      .orderBy(stickerCollections.unlockedAt);

    return NextResponse.json({
      stickers: stickers.map(sticker => ({
        id: sticker.stickerId,
        name: sticker.name,
        rarity: sticker.rarity,
        category: sticker.category,
        imageUrl: sticker.imageUrl,
        isGlitter: sticker.isGlitter,
        unlockedAt: sticker.unlockedAt,
      }))
    });

  } catch (error) {
    console.error('Error fetching stickers:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}