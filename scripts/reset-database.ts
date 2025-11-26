import { sql } from 'drizzle-orm';
import { db } from '../src/server/db/client';

async function resetDatabase() {
  console.log('🗑️  Resetting database...');

  if (!db) {
    console.error('Database connection not available. Make sure DATABASE_URL is set.');
    process.exit(1);
  }

  try {
    // Drop all tables in reverse dependency order
    const dropTables = [
      'wallet_transactions',
      'wallets',
      'parent_approvals',
      'external_chore_requests',
      'trusted_contact_verifications',
      'trusted_contacts',
      'weekly_champions',
      'ranking_settings',
      'rank_snapshots',
      'friend_connections',
      'family_feed',
      'daily_spins',
      'family_leaderboards',
      'achievements',
      'sticker_collections',
      'pet_evolution_stages',
      'virtual_pets',
      'social_reactions',
      'team_chores',
      'weekly_winner',
      'savings_history',
      'savings_goals',
      'quest_progress',
      'quest_chains',
      'avatar_customizations',
      'avatar_items',
      'user_badges',
      'badges',
      'notifications',
      'automation_settings',
      'points_transactions',
      'pending_rewards',
      'reward_assignments',
      'reward_redemptions',
      'family_rewards',
      'reward_templates',
      'rewards',
      'chore_assignments',
      'chores',
      'sessions',
      'verification_codes',
      'coupon_usages',
      'coupons',
      'good_causes',
      'blog_posts',
      'reviews',
      'children',
      'families',
    ];

    for (const tableName of dropTables) {
      try {
        await db.execute(sql`DROP TABLE IF EXISTS ${sql.identifier(tableName)} CASCADE`);
        console.log(`✅ Dropped table: ${tableName}`);
      } catch (error) {
        console.log(`⚠️  Could not drop table: ${tableName} - ${error}`);
      }
    }

    console.log('🎉 Database reset complete!');
    console.log('💡 Run "npx drizzle-kit push" to recreate all tables');

  } catch (error) {
    console.error('❌ Database reset failed:', error);
    process.exit(1);
  }
}

resetDatabase();