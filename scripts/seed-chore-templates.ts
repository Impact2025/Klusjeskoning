import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/server/db/schema';
import seedData from '../src/lib/klusjes_seed_data.json';

// Direct database connection for scripts (bypasses server-only)
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is not set');
  process.exit(1);
}
const sql = neon(connectionString);
const db = drizzle(sql, { schema });

const {
  choreCategories,
  choreTemplates,
  starterPacks,
  starterPackChores,
  addonPacks,
  addonPackChores,
} = schema;

async function seedChoreTemplates() {
  try {
    console.log('🌱 Seeding chore templates system...');

    // 1. Seed Categories
    console.log('📁 Seeding categories...');
    await db.delete(choreCategories);

    const categoriesData = seedData.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      sortOrder: cat.sort_order,
    }));

    await db.insert(choreCategories).values(categoriesData);
    console.log(`✅ Seeded ${categoriesData.length} categories`);

    // 2. Seed Chore Templates
    console.log('📋 Seeding chore templates...');
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
    console.log(`✅ Seeded ${templatesData.length} chore templates`);

    // 3. Seed Starter Packs
    console.log('📦 Seeding starter packs...');
    await db.delete(starterPackChores); // Delete link table first
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
    console.log(`✅ Seeded ${starterPacksData.length} starter packs`);

    // 4. Seed Starter Pack Chores (link table)
    console.log('🔗 Seeding starter pack chore links...');
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
    console.log(`✅ Seeded ${starterPackChoresData.length} starter pack chore links`);

    // 5. Seed Addon Packs
    console.log('🎁 Seeding addon packs...');
    await db.delete(addonPackChores); // Delete link table first
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
    console.log(`✅ Seeded ${addonPacksData.length} addon packs`);

    // 6. Seed Addon Pack Chores (link table)
    console.log('🔗 Seeding addon pack chore links...');
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
    console.log(`✅ Seeded ${addonPackChoresData.length} addon pack chore links`);

    console.log('');
    console.log('📊 Summary:');
    console.log(`   Categories: ${categoriesData.length}`);
    console.log(`   Chore Templates: ${templatesData.length}`);
    console.log(`   Starter Packs: ${starterPacksData.length}`);
    console.log(`   Starter Pack Links: ${starterPackChoresData.length}`);
    console.log(`   Addon Packs: ${addonPacksData.length}`);
    console.log(`   Addon Pack Links: ${addonPackChoresData.length}`);

  } catch (error) {
    console.error('❌ Error seeding chore templates:', error);
    throw error;
  }
}

// Run the seeder if this script is executed directly
if (require.main === module) {
  seedChoreTemplates()
    .then(() => {
      console.log('');
      console.log('🎉 Chore templates seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Chore templates seeding failed:', error);
      process.exit(1);
    });
}

export { seedChoreTemplates };
