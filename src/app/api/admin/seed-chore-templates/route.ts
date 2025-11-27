import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import {
  choreCategories,
  choreTemplates,
  starterPacks,
  starterPackChores,
  addonPacks,
  addonPackChores,
} from '@/server/db/schema';
import seedData from '@/lib/klusjes_seed_data.json';

// POST /api/admin/seed-chore-templates - Seed the chore templates database
export async function POST(request: NextRequest) {
  try {
    // Optional: Add admin authentication check here
    // const session = await requireSession();
    // if (!session.isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 503 });
    }

    const results = {
      categories: 0,
      templates: 0,
      starterPacks: 0,
      starterPackChores: 0,
      addonPacks: 0,
      addonPackChores: 0,
    };

    // 1. Seed Categories
    await db.delete(choreCategories);
    const categoriesData = seedData.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      sortOrder: cat.sort_order,
    }));
    await db.insert(choreCategories).values(categoriesData);
    results.categories = categoriesData.length;

    // 2. Seed Chore Templates
    await db.delete(choreTemplates);
    const templatesData = seedData.chore_templates.map((tpl) => ({
      id: tpl.id,
      name: tpl.name,
      description: tpl.description,
      categoryId: tpl.category,
      frequency: tpl.frequency as 'daily' | 'weekly' | 'monthly',
      basePoints: tpl.base_points,
      baseXp: tpl.base_xp,
      minAge: tpl.min_age,
      maxAge: tpl.max_age,
      requiresGarden: tpl.requires_garden,
      requiresPet: tpl.requires_pet,
      requiresKitchenAccess: tpl.requires_kitchen_access,
      difficulty: tpl.difficulty as 'easy' | 'medium' | 'hard',
      icon: tpl.icon,
      estimatedMinutes: tpl.estimated_minutes,
      tips: tpl.tips,
      sortOrder: tpl.sort_order,
    }));
    await db.insert(choreTemplates).values(templatesData);
    results.templates = templatesData.length;

    // 3. Seed Starter Packs
    await db.delete(starterPackChores);
    await db.delete(starterPacks);
    const starterPacksData = seedData.starter_packs.map((sp) => ({
      id: sp.id,
      name: sp.name,
      description: sp.description,
      minAge: sp.min_age,
      maxAge: sp.max_age,
      difficultyLevel: sp.difficulty_level as 'minimal' | 'easy' | 'medium' | 'hard',
      choreCount: sp.chore_count,
      isDefault: sp.is_default,
      recommendedFor: sp.recommended_for,
    }));
    await db.insert(starterPacks).values(starterPacksData);
    results.starterPacks = starterPacksData.length;

    // 4. Seed Starter Pack Chores
    const starterPackChoresData: { starterPackId: string; choreTemplateId: string; sortOrder: number }[] = [];
    for (const sp of seedData.starter_packs) {
      sp.chore_template_ids.forEach((choreId, index) => {
        starterPackChoresData.push({
          starterPackId: sp.id,
          choreTemplateId: choreId,
          sortOrder: index,
        });
      });
    }
    if (starterPackChoresData.length > 0) {
      await db.insert(starterPackChores).values(starterPackChoresData);
    }
    results.starterPackChores = starterPackChoresData.length;

    // 5. Seed Addon Packs
    await db.delete(addonPackChores);
    await db.delete(addonPacks);
    const addonPacksData = seedData.addon_packs.map((ap) => ({
      id: ap.id,
      name: ap.name,
      description: ap.description,
      minAge: ap.min_age,
      requiresGarden: ap.requires_garden,
      requiresPet: ap.requires_pet,
    }));
    await db.insert(addonPacks).values(addonPacksData);
    results.addonPacks = addonPacksData.length;

    // 6. Seed Addon Pack Chores
    const addonPackChoresData: { addonPackId: string; choreTemplateId: string; sortOrder: number }[] = [];
    for (const ap of seedData.addon_packs) {
      ap.chore_template_ids.forEach((choreId, index) => {
        addonPackChoresData.push({
          addonPackId: ap.id,
          choreTemplateId: choreId,
          sortOrder: index,
        });
      });
    }
    if (addonPackChoresData.length > 0) {
      await db.insert(addonPackChores).values(addonPackChoresData);
    }
    results.addonPackChores = addonPackChoresData.length;

    return NextResponse.json({
      success: true,
      message: 'Chore templates seeded successfully',
      results,
    });
  } catch (error) {
    console.error('Error seeding chore templates:', error);
    return NextResponse.json({ error: 'Internal server error', details: String(error) }, { status: 500 });
  }
}
