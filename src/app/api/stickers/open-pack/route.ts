import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { stickerCollections, children, pointsTransactions } from '@/server/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// Sample sticker database - in production this would be in the database
const STICKER_DATABASE = [
  // Animals
  { id: 'dog', name: 'Hond', category: 'dieren', rarity: 'common' },
  { id: 'cat', name: 'Kat', category: 'dieren', rarity: 'common' },
  { id: 'elephant', name: 'Olifant', category: 'dieren', rarity: 'rare' },
  { id: 'lion', name: 'Leeuw', category: 'dieren', rarity: 'rare' },
  { id: 'unicorn', name: 'Eenhoorn', category: 'dieren', rarity: 'epic' },
  { id: 'dragon', name: 'Draak', category: 'dieren', rarity: 'legendary' },

  // Fairy Tales
  { id: 'cinderella', name: 'Assepoester', category: 'sprookjes', rarity: 'common' },
  { id: 'snow_white', name: 'Sneeuwwitje', category: 'sprookjes', rarity: 'common' },
  { id: 'little_red', name: 'Roodkapje', category: 'sprookjes', rarity: 'rare' },
  { id: 'sleeping_beauty', name: 'Doornroosje', category: 'sprookjes', rarity: 'epic' },
  { id: 'fairy_godmother', name: 'Goede Fee', category: 'sprookjes', rarity: 'legendary' },

  // Space
  { id: 'rocket', name: 'Rakket', category: 'ruimte', rarity: 'common' },
  { id: 'planet', name: 'Planeet', category: 'ruimte', rarity: 'common' },
  { id: 'alien', name: 'Alien', category: 'ruimte', rarity: 'rare' },
  { id: 'spaceship', name: 'Ruimteschip', category: 'ruimte', rarity: 'epic' },
  { id: 'black_hole', name: 'Zwart Gat', category: 'ruimte', rarity: 'legendary' },

  // Sports
  { id: 'football', name: 'Voetbal', category: 'sport', rarity: 'common' },
  { id: 'basketball', name: 'Basketbal', category: 'sport', rarity: 'common' },
  { id: 'tennis', name: 'Tennis', category: 'sport', rarity: 'rare' },
  { id: 'swimming', name: 'Zwemmen', category: 'sport', rarity: 'epic' },
  { id: 'olympics', name: 'Olympische Spelen', category: 'sport', rarity: 'legendary' },

  // Vehicles
  { id: 'car', name: 'Auto', category: 'voertuigen', rarity: 'common' },
  { id: 'bicycle', name: 'Fiets', category: 'voertuigen', rarity: 'common' },
  { id: 'motorcycle', name: 'Motor', category: 'voertuigen', rarity: 'rare' },
  { id: 'helicopter', name: 'Helikopter', category: 'voertuigen', rarity: 'epic' },
  { id: 'formula1', name: 'Formule 1', category: 'voertuigen', rarity: 'legendary' },

  // Food
  { id: 'pizza', name: 'Pizza', category: 'eten', rarity: 'common' },
  { id: 'ice_cream', name: 'IJs', category: 'eten', rarity: 'common' },
  { id: 'cake', name: 'Taart', category: 'eten', rarity: 'rare' },
  { id: 'sushi', name: 'Sushi', category: 'eten', rarity: 'epic' },
  { id: 'golden_apple', name: 'Gouden Appel', category: 'eten', rarity: 'legendary' },
];

const PACK_CONFIGS = {
  basic_pack: {
    cost: 25,
    guaranteedRarity: null,
    size: 5,
    probabilities: {
      common: 70,
      rare: 25,
      epic: 4.5,
      legendary: 0.5
    }
  },
  premium_pack: {
    cost: 50,
    guaranteedRarity: 'rare',
    size: 5,
    probabilities: {
      common: 40,
      rare: 45,
      epic: 13,
      legendary: 2
    }
  },
  legendary_pack: {
    cost: 100,
    guaranteedRarity: 'epic',
    size: 5,
    probabilities: {
      common: 20,
      rare: 30,
      epic: 40,
      legendary: 10
    }
  }
};

function selectStickerByRarity(rarity: string): any {
  const stickersOfRarity = STICKER_DATABASE.filter(s => s.rarity === rarity);
  return stickersOfRarity[Math.floor(Math.random() * stickersOfRarity.length)];
}

function generatePack(packId: string): any[] {
  const config = PACK_CONFIGS[packId as keyof typeof PACK_CONFIGS];
  if (!config) return [];

  const stickers = [];
  let guaranteedUsed = false;

  for (let i = 0; i < config.size; i++) {
    let selectedRarity: string;

    if (!guaranteedUsed && config.guaranteedRarity && Math.random() < 0.3) {
      // 30% chance to get guaranteed rarity
      selectedRarity = config.guaranteedRarity;
      guaranteedUsed = true;
    } else {
      // Select based on probabilities
      const rand = Math.random() * 100;
      let cumulative = 0;
      selectedRarity = 'common'; // Default fallback

      for (const [rarity, probability] of Object.entries(config.probabilities)) {
        cumulative += probability;
        if (rand <= cumulative) {
          selectedRarity = rarity;
          break;
        }
      }
    }

    const sticker = selectStickerByRarity(selectedRarity);
    if (sticker) {
      stickers.push({
        ...sticker,
        isGlitter: selectedRarity === 'legendary' || Math.random() < 0.1 // 10% chance for glitter
      });
    }
  }

  return stickers;
}

// POST /api/stickers/open-pack - Open a sticker pack
export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const familyId = session.familyId;

    const { childId, packId } = await request.json();

    if (!childId || !packId) {
      return NextResponse.json({ error: 'Child ID and pack ID required' }, { status: 400 });
    }

    const config = PACK_CONFIGS[packId as keyof typeof PACK_CONFIGS];
    if (!config) {
      return NextResponse.json({ error: 'Invalid pack ID' }, { status: 400 });
    }

    // Check if db client is available
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Verify child belongs to family and has enough points
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

    if (child.points < config.cost) {
      return NextResponse.json({ error: 'Not enough points' }, { status: 400 });
    }

    // Generate pack contents
    const packStickers = generatePack(packId);
    if (packStickers.length === 0) {
      return NextResponse.json({ error: 'Failed to generate pack' }, { status: 500 });
    }

    // Select one random sticker from the pack to "open"
    const randomSticker = packStickers[Math.floor(Math.random() * packStickers.length)];

    // Perform operations sequentially since Neon HTTP driver doesn't support transactions
    try {
      // Deduct points
      await db
        .update(children)
        .set({
          points: sql`${children.points} - ${config.cost}`,
          totalPointsEver: sql`${children.totalPointsEver} - ${config.cost}`,
        })
        .where(eq(children.id, childId));

      // Record transaction
      await db.insert(pointsTransactions).values({
        familyId,
        childId,
        type: 'spent',
        amount: config.cost,
        description: `Sticker pack: ${packId}`,
        balanceBefore: child.points,
        balanceAfter: child.points - config.cost,
      });

      // Check if sticker already owned
      const existingSticker = await db
        .select()
        .from(stickerCollections)
        .where(and(
          eq(stickerCollections.childId, childId),
          eq(stickerCollections.stickerId, randomSticker.id)
        ))
        .limit(1);

      let result;
      if (existingSticker.length > 0) {
        // Already owned - give bonus points instead
        await db
          .update(children)
          .set({
            points: sql`${children.points} + 10`,
            totalPointsEver: sql`${children.totalPointsEver} + 10`,
          })
          .where(eq(children.id, childId));

        await db.insert(pointsTransactions).values({
          familyId,
          childId,
          type: 'bonus',
          amount: 10,
          description: 'Dubbele sticker bonus',
          balanceBefore: child.points - config.cost,
          balanceAfter: child.points - config.cost + 10,
        });

        result = {
          ...randomSticker,
          alreadyOwned: true,
          bonusPoints: 10
        };
      } else {
        // Add to collection
        await db.insert(stickerCollections).values({
          childId,
          familyId,
          stickerId: randomSticker.id,
          name: randomSticker.name,
          rarity: randomSticker.rarity,
          category: randomSticker.category,
          isGlitter: randomSticker.isGlitter,
        });

        result = {
          ...randomSticker,
          alreadyOwned: false
        };
      }

      return NextResponse.json({
        success: true,
        sticker: result,
        pointsSpent: config.cost,
        alreadyOwned: result.alreadyOwned
      });

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({ error: 'Database operation failed' }, { status: 500 });
    }

  } catch (error) {
    console.error('Error opening sticker pack:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}