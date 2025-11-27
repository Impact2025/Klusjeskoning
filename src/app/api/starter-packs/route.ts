import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { starterPacks, starterPackChores, choreTemplates, children } from '@/server/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';

// GET /api/starter-packs - Get starter packs for a given age
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');
    const age = searchParams.get('age');

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    let childAge: number | null = null;

    // If childId provided, get age from child's birthdate
    if (childId) {
      const [child] = await db
        .select()
        .from(children)
        .where(and(
          eq(children.id, childId),
          eq(children.familyId, session.familyId)
        ));

      if (child && child.birthdate) {
        const birthDate = new Date(child.birthdate);
        const today = new Date();
        childAge = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          childAge--;
        }
      }
    } else if (age) {
      childAge = parseInt(age);
    }

    if (childAge === null) {
      return NextResponse.json({ error: 'Age or childId is required' }, { status: 400 });
    }

    // Get starter packs for this age
    const packs = await db
      .select()
      .from(starterPacks)
      .where(and(
        eq(starterPacks.isActive, true),
        lte(starterPacks.minAge, childAge),
        gte(starterPacks.maxAge, childAge)
      ))
      .orderBy(starterPacks.difficultyLevel);

    // Get chores for each pack
    const packsWithChores = await Promise.all(
      packs.map(async (pack) => {
        const packChores = await db!
          .select({
            template: choreTemplates,
            sortOrder: starterPackChores.sortOrder,
          })
          .from(starterPackChores)
          .innerJoin(choreTemplates, eq(starterPackChores.choreTemplateId, choreTemplates.id))
          .where(eq(starterPackChores.starterPackId, pack.id))
          .orderBy(starterPackChores.sortOrder);

        return {
          ...pack,
          chores: packChores.map(pc => pc.template),
        };
      })
    );

    // Find the default/recommended pack
    const recommendedPack = packsWithChores.find(p => p.isDefault) || packsWithChores[1] || packsWithChores[0];

    return NextResponse.json({
      packs: packsWithChores,
      recommendedPack,
      childAge,
    });
  } catch (error) {
    console.error('Error fetching starter packs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
