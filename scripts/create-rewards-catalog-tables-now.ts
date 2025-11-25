import { db } from '../src/server/db/client';
import { sql } from 'drizzle-orm';

async function createRewardsCatalogTables() {
  try {
    console.log('Creating rewards catalog tables...');

    // Create enums
    await db.execute(sql`
      CREATE TYPE IF NOT EXISTS reward_category AS ENUM ('privileges', 'experience', 'financial');
      CREATE TYPE IF NOT EXISTS redemption_status AS ENUM ('pending', 'approved', 'completed', 'cancelled');
    `);

    // Create reward templates table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reward_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category reward_category NOT NULL,
        default_points INTEGER NOT NULL,
        min_age INTEGER NOT NULL DEFAULT 4,
        emoji VARCHAR(10),
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create family rewards table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS family_rewards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        template_id UUID REFERENCES reward_templates(id) ON DELETE SET NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        category reward_category NOT NULL,
        points INTEGER NOT NULL,
        min_age INTEGER NOT NULL DEFAULT 4,
        emoji VARCHAR(10),
        estimated_cost INTEGER, -- in cents
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Create reward redemptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reward_redemptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        reward_id UUID NOT NULL REFERENCES family_rewards(id) ON DELETE CASCADE,
        points_spent INTEGER NOT NULL,
        status redemption_status NOT NULL DEFAULT 'pending',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      );
    `);

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_family_rewards_family_id ON family_rewards(family_id);
      CREATE INDEX IF NOT EXISTS idx_family_rewards_category ON family_rewards(category);
      CREATE INDEX IF NOT EXISTS idx_family_rewards_active ON family_rewards(is_active);
      CREATE INDEX IF NOT EXISTS idx_reward_redemptions_family_id ON reward_redemptions(family_id);
      CREATE INDEX IF NOT EXISTS idx_reward_redemptions_child_id ON reward_redemptions(child_id);
      CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status);
      CREATE INDEX IF NOT EXISTS idx_reward_templates_category ON reward_templates(category);
      CREATE INDEX IF NOT EXISTS idx_reward_templates_active ON reward_templates(is_active);
    `);

    console.log('Rewards catalog tables created successfully!');
  } catch (error) {
    console.error('Error creating rewards catalog tables:', error);
    throw error;
  }
}

createRewardsCatalogTables().then(() => {
  console.log('Migration completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});