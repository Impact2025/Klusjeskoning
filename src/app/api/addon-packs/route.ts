import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { addonPacks, addonPackChores, choreTemplates, families } from '@/server/db/schema';
import { eq, and, lte, or } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// GET /api/addon-packs - Get available addon packs for family
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const age = searchParams.get('age');

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get family profile to check garden/pet status
    const [family] = await db
      .select()
      .from(families)
      .where(eq(families.id, session.familyId));

    if (!family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 });
    }

    const hasGarden = family.hasGarden ?? false;
    const hasPets = family.hasPets ?? false;
    const childAge = age ? parseInt(age) : 10; // Default to 10 if no age provided

    // Get addon packs that match family situation
    let conditions = [
      eq(addonPacks.isActive, true),
      lte(addonPacks.minAge, childAge),
    ];

    // Only show packs that match family situation
    // Filter: show pack if (requires_garden=false OR family has garden) AND (requires_pet=false OR family has pets)
    const allPacks = await db
      .select()
      .from(addonPacks)
      .where(and(...conditions));

    // Filter packs based on family profile
    const availablePacks = allPacks.filter(pack => {
      const gardenOk = !pack.requiresGarden || hasGarden;
      const petOk = !pack.requiresPet || hasPets;
      return gardenOk && petOk;
    });

    // Get chores for each pack (db is confirmed non-null above)
    const packsWithChores = await Promise.all(
      availablePacks.map(async (pack) => {
        const packChores = await db!
          .select({
            template: choreTemplates,
            sortOrder: addonPackChores.sortOrder,
          })
          .from(addonPackChores)
          .innerJoin(choreTemplates, eq(addonPackChores.choreTemplateId, choreTemplates.id))
          .where(eq(addonPackChores.addonPackId, pack.id))
          .orderBy(addonPackChores.sortOrder);

        return {
          ...pack,
          chores: packChores.map(pc => pc.template),
        };
      })
    );

    // Group by type for easier UI rendering
    const petPacks = packsWithChores.filter(p => p.requiresPet);
    const gardenPacks = packsWithChores.filter(p => p.requiresGarden && !p.requiresPet);
    const otherPacks = packsWithChores.filter(p => !p.requiresGarden && !p.requiresPet);

    return NextResponse.json({
      packs: packsWithChores,
      petPacks,
      gardenPacks,
      otherPacks,
      familyProfile: {
        hasGarden,
        hasPets,
      },
    });
  } catch (error) {
    console.error('Error fetching addon packs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
