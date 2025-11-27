import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { choreSuggestions, choreTemplates, children, choreCategories } from '@/server/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireSession } from '@/server/auth/session';

// GET /api/suggestions - Get pending suggestions for a child
export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('childId');

    if (!childId) {
      return NextResponse.json({ error: 'childId is required' }, { status: 400 });
    }

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
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

    // Get pending suggestions with template details
    const suggestions = await db
      .select({
        suggestion: choreSuggestions,
        template: choreTemplates,
        category: choreCategories,
      })
      .from(choreSuggestions)
      .innerJoin(choreTemplates, eq(choreSuggestions.choreTemplateId, choreTemplates.id))
      .innerJoin(choreCategories, eq(choreTemplates.categoryId, choreCategories.id))
      .where(and(
        eq(choreSuggestions.childId, childId),
        eq(choreSuggestions.status, 'pending')
      ))
      .orderBy(desc(choreSuggestions.priority), desc(choreSuggestions.suggestedAt));

    // Format response
    const formattedSuggestions = suggestions.map(({ suggestion, template, category }) => ({
      id: suggestion.id,
      triggerReason: suggestion.triggerReason,
      triggerData: suggestion.triggerData,
      priority: suggestion.priority,
      suggestedAt: suggestion.suggestedAt,
      expiresAt: suggestion.expiresAt,
      template: {
        id: template.id,
        name: template.name,
        description: template.description,
        frequency: template.frequency,
        basePoints: template.basePoints,
        baseXp: template.baseXp,
        difficulty: template.difficulty,
        icon: template.icon,
        estimatedMinutes: template.estimatedMinutes,
        tips: template.tips,
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        },
      },
    }));

    return NextResponse.json({
      suggestions: formattedSuggestions,
      count: formattedSuggestions.length,
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
