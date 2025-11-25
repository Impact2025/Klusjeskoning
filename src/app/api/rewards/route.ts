import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { rewardTemplates, familyRewards, rewardRedemptions } from '@/server/db/schema';
import { eq, and, gte } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';
import { getFamilyFromSession } from '@/lib/auth';

// GET /api/rewards/templates - Get all reward templates
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const minAge = searchParams.get('minAge');

    let query = db.select().from(rewardTemplates).where(eq(rewardTemplates.isActive, 1));

    if (category) {
      query = query.where(eq(rewardTemplates.category, category as any));
    }

    if (minAge) {
      query = query.where(gte(rewardTemplates.minAge, parseInt(minAge)));
    }

    const templates = await query.orderBy(rewardTemplates.category, rewardTemplates.name);

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching reward templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/rewards/templates - Create new reward template (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // TODO: Add admin check here

    const body = await request.json();
    const { name, description, category, defaultPoints, minAge, emoji } = body;

    if (!name || !description || !category || !defaultPoints) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const [template] = await db.insert(rewardTemplates).values({
      name,
      description,
      category,
      defaultPoints,
      minAge: minAge || 4,
      emoji,
    }).returning();

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error creating reward template:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}