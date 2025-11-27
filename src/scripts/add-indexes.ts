/**
 * Script to add performance indexes to the database
 * Run with: npx tsx src/scripts/add-indexes.ts
 */

import { sql } from 'drizzle-orm';
import { db } from '../server/db/client';

const indexes = [
  // Families
  { name: 'idx_families_email', sql: 'CREATE INDEX IF NOT EXISTS idx_families_email ON families(email)' },
  { name: 'idx_families_family_code', sql: 'CREATE INDEX IF NOT EXISTS idx_families_family_code ON families(family_code)' },

  // Children
  { name: 'idx_children_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id)' },
  { name: 'idx_children_family_pin', sql: 'CREATE INDEX IF NOT EXISTS idx_children_family_pin ON children(family_id, pin)' },

  // Chores
  { name: 'idx_chores_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id)' },
  { name: 'idx_chores_status', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status)' },
  { name: 'idx_chores_family_status', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_family_status ON chores(family_id, status)' },
  { name: 'idx_chores_submitted_by', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_submitted_by ON chores(submitted_by_child_id) WHERE submitted_by_child_id IS NOT NULL' },

  // Chore Assignments
  { name: 'idx_chore_assignments_chore_id', sql: 'CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore_id ON chore_assignments(chore_id)' },
  { name: 'idx_chore_assignments_child_id', sql: 'CREATE INDEX IF NOT EXISTS idx_chore_assignments_child_id ON chore_assignments(child_id)' },

  // Rewards
  { name: 'idx_rewards_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id)' },
  { name: 'idx_rewards_type', sql: 'CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type)' },

  // Reward Assignments
  { name: 'idx_reward_assignments_reward_id', sql: 'CREATE INDEX IF NOT EXISTS idx_reward_assignments_reward_id ON reward_assignments(reward_id)' },
  { name: 'idx_reward_assignments_child_id', sql: 'CREATE INDEX IF NOT EXISTS idx_reward_assignments_child_id ON reward_assignments(child_id)' },

  // Pending Rewards
  { name: 'idx_pending_rewards_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_pending_rewards_family_id ON pending_rewards(family_id)' },
  { name: 'idx_pending_rewards_child_id', sql: 'CREATE INDEX IF NOT EXISTS idx_pending_rewards_child_id ON pending_rewards(child_id)' },

  // Sessions
  { name: 'idx_sessions_token', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)' },
  { name: 'idx_sessions_expires_at', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)' },
  { name: 'idx_sessions_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id)' },
];

async function addIndexes() {
  if (!db) {
    console.error('❌ Database not initialized');
    process.exit(1);
  }

  console.log('🚀 Starting to add performance indexes...\n');

  let successCount = 0;
  let errorCount = 0;

  for (const index of indexes) {
    try {
      console.log(`⏳ Creating ${index.name}...`);
      await db.execute(sql.raw(index.sql));
      console.log(`✅ ${index.name} created successfully`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error creating ${index.name}:`, error instanceof Error ? error.message : error);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successfully created: ${successCount} indexes`);
  console.log(`❌ Failed: ${errorCount} indexes`);

  // Analyze tables
  console.log('\n🔍 Analyzing tables for query optimization...');
  const tables = [
    'families',
    'children',
    'chores',
    'chore_assignments',
    'rewards',
    'reward_assignments',
    'pending_rewards',
    'sessions'
  ];

  for (const table of tables) {
    try {
      await db.execute(sql.raw(`ANALYZE ${table}`));
      console.log(`✅ Analyzed ${table}`);
    } catch (error) {
      console.error(`⚠️  Could not analyze ${table}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log('\n✨ Done! Your database queries should be much faster now.');
}

addIndexes()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
