/**
 * One-time script to add performance indexes to the database
 * Run with: npx tsx src/scripts/add-indexes-once.ts
 */
import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

// Load environment variables from .env.local
config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = neon(DATABASE_URL);

async function addIndexes() {
  console.log('🚀 Starting index creation...\n');

  let success = 0;
  let failed = 0;

  // Families - critical for login performance
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_families_email ON families(email)`;
    console.log('✅ idx_families_email'); success++;
  } catch (e) { console.error('❌ idx_families_email:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_families_family_code ON families(family_code)`;
    console.log('✅ idx_families_family_code'); success++;
  } catch (e) { console.error('❌ idx_families_family_code:', e); failed++; }

  // Children - critical for family data loading
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id)`;
    console.log('✅ idx_children_family_id'); success++;
  } catch (e) { console.error('❌ idx_children_family_id:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_children_family_pin ON children(family_id, pin)`;
    console.log('✅ idx_children_family_pin'); success++;
  } catch (e) { console.error('❌ idx_children_family_pin:', e); failed++; }

  // Chores - heavy queries during dashboard load
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id)`;
    console.log('✅ idx_chores_family_id'); success++;
  } catch (e) { console.error('❌ idx_chores_family_id:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status)`;
    console.log('✅ idx_chores_status'); success++;
  } catch (e) { console.error('❌ idx_chores_status:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_chores_family_status ON chores(family_id, status)`;
    console.log('✅ idx_chores_family_status'); success++;
  } catch (e) { console.error('❌ idx_chores_family_status:', e); failed++; }

  // Chore Assignments - JOINs are expensive without indexes
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore_id ON chore_assignments(chore_id)`;
    console.log('✅ idx_chore_assignments_chore_id'); success++;
  } catch (e) { console.error('❌ idx_chore_assignments_chore_id:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_chore_assignments_child_id ON chore_assignments(child_id)`;
    console.log('✅ idx_chore_assignments_child_id'); success++;
  } catch (e) { console.error('❌ idx_chore_assignments_child_id:', e); failed++; }

  // Rewards
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id)`;
    console.log('✅ idx_rewards_family_id'); success++;
  } catch (e) { console.error('❌ idx_rewards_family_id:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type)`;
    console.log('✅ idx_rewards_type'); success++;
  } catch (e) { console.error('❌ idx_rewards_type:', e); failed++; }

  // Reward Assignments
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_reward_assignments_reward_id ON reward_assignments(reward_id)`;
    console.log('✅ idx_reward_assignments_reward_id'); success++;
  } catch (e) { console.error('❌ idx_reward_assignments_reward_id:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_reward_assignments_child_id ON reward_assignments(child_id)`;
    console.log('✅ idx_reward_assignments_child_id'); success++;
  } catch (e) { console.error('❌ idx_reward_assignments_child_id:', e); failed++; }

  // Pending Rewards
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_rewards_family_id ON pending_rewards(family_id)`;
    console.log('✅ idx_pending_rewards_family_id'); success++;
  } catch (e) { console.error('❌ idx_pending_rewards_family_id:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_pending_rewards_child_id ON pending_rewards(child_id)`;
    console.log('✅ idx_pending_rewards_child_id'); success++;
  } catch (e) { console.error('❌ idx_pending_rewards_child_id:', e); failed++; }

  // Sessions - critical for every authenticated request
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`;
    console.log('✅ idx_sessions_token'); success++;
  } catch (e) { console.error('❌ idx_sessions_token:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`;
    console.log('✅ idx_sessions_expires_at'); success++;
  } catch (e) { console.error('❌ idx_sessions_expires_at:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id)`;
    console.log('✅ idx_sessions_family_id'); success++;
  } catch (e) { console.error('❌ idx_sessions_family_id:', e); failed++; }

  // Team Chores
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_team_chores_family_id ON team_chores(family_id)`;
    console.log('✅ idx_team_chores_family_id'); success++;
  } catch (e) { console.error('❌ idx_team_chores_family_id:', e); failed++; }

  // Points Transactions - for history queries
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_points_transactions_child_id ON points_transactions(child_id)`;
    console.log('✅ idx_points_transactions_child_id'); success++;
  } catch (e) { console.error('❌ idx_points_transactions_child_id:', e); failed++; }

  // Avatar customizations
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_avatar_customizations_child_id ON avatar_customizations(child_id)`;
    console.log('✅ idx_avatar_customizations_child_id'); success++;
  } catch (e) { console.error('❌ idx_avatar_customizations_child_id:', e); failed++; }

  // PowerKlusjes requests
  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_external_chore_requests_family ON external_chore_requests(family_id)`;
    console.log('✅ idx_external_chore_requests_family'); success++;
  } catch (e) { console.error('❌ idx_external_chore_requests_family:', e); failed++; }

  try {
    await sql`CREATE INDEX IF NOT EXISTS idx_external_chore_requests_child ON external_chore_requests(child_id)`;
    console.log('✅ idx_external_chore_requests_child'); success++;
  } catch (e) { console.error('❌ idx_external_chore_requests_child:', e); failed++; }

  // Analyze tables for query planner optimization
  console.log('\n📊 Analyzing tables...');
  const tables = [
    'families', 'children', 'chores', 'chore_assignments',
    'rewards', 'reward_assignments', 'pending_rewards', 'sessions',
    'team_chores', 'points_transactions', 'avatar_customizations',
    'external_chore_requests'
  ];

  for (const table of tables) {
    try {
      await sql`SELECT 1 FROM "${table}" LIMIT 1`;
      // Use raw query for ANALYZE
      await sql.query(`ANALYZE ${table}`);
      console.log(`✅ Analyzed ${table}`);
    } catch {
      // Ignore - table might not exist
    }
  }

  console.log(`\n🏁 Done! Created ${success} indexes, ${failed} failed.`);
  console.log('\n⚡ Login should now be significantly faster!');
}

addIndexes().catch(console.error);
