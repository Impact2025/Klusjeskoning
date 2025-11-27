import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { choreTemplates, choreCategories } from '@/server/db/schema';
import { eq, and, gte, lte, or, isNull } from 'drizzle-orm';
import { getSession } from '@/server/auth/session';

// GET /api/chore-templates - Get all chore templates with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('category');
    const frequency = searchParams.get('frequency');
    const minAge = searchParams.get('minAge');
    const maxAge = searchParams.get('maxAge');
    const difficulty = searchParams.get('difficulty');
    const hasGarden = searchParams.get('hasGarden');
    const hasPet = searchParams.get('hasPet');
    const hasKitchen = searchParams.get('hasKitchen');

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    // Get all categories first
    const categories = await db
      .select()
      .from(choreCategories)
      .orderBy(choreCategories.sortOrder);

    // Build query for templates
    let conditions = [eq(choreTemplates.isActive, true)];

    if (categoryId) {
      conditions.push(eq(choreTemplates.categoryId, categoryId));
    }

    if (frequency) {
      conditions.push(eq(choreTemplates.frequency, frequency as 'daily' | 'weekly' | 'monthly'));
    }

    if (difficulty) {
      conditions.push(eq(choreTemplates.difficulty, difficulty as 'easy' | 'medium' | 'hard'));
    }

    if (minAge) {
      const age = parseInt(minAge);
      // Template is suitable if minAge <= child's age AND (maxAge is null OR maxAge >= child's age)
      conditions.push(lte(choreTemplates.minAge, age));
      const maxAgeCondition = or(isNull(choreTemplates.maxAge), gte(choreTemplates.maxAge, age));
      if (maxAgeCondition) conditions.push(maxAgeCondition);
    }

    // Filter out templates requiring garden/pet/kitchen if family doesn't have them
    if (hasGarden === 'false') {
      conditions.push(eq(choreTemplates.requiresGarden, false));
    }

    if (hasPet === 'false') {
      conditions.push(eq(choreTemplates.requiresPet, false));
    }

    if (hasKitchen === 'false') {
      conditions.push(eq(choreTemplates.requiresKitchenAccess, false));
    }

    const templates = await db
      .select()
      .from(choreTemplates)
      .where(and(...conditions))
      .orderBy(choreTemplates.sortOrder);

    // Group templates by category
    const templatesByCategory = categories.map(category => ({
      ...category,
      templates: templates.filter(t => t.categoryId === category.id)
    })).filter(cat => cat.templates.length > 0);

    return NextResponse.json({
      categories,
      templates,
      templatesByCategory,
    });
  } catch (error) {
    console.error('Error fetching chore templates:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
