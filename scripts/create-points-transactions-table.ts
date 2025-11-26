import { sql } from 'drizzle-orm';
import { db } from '../src/server/db/client';

async function createPointsTransactionsTable() {
  try {
    console.log('Creating points_transactions table...');

    if (!db) {
      console.error('Database connection not available. Make sure DATABASE_URL is set.');
      process.exit(1);
    }

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS points_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
        type varchar(50) NOT NULL CHECK (type IN ('earned', 'spent', 'refunded', 'bonus', 'penalty')),
        amount integer NOT NULL,
        description varchar(255) NOT NULL,
        related_chore_id uuid REFERENCES chores(id) ON DELETE SET NULL,
        related_reward_id uuid REFERENCES rewards(id) ON DELETE SET NULL,
        balance_before integer NOT NULL,
        balance_after integer NOT NULL,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_points_transactions_family_child ON points_transactions(family_id, child_id);
      CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);
    `);

    console.log('✅ Points transactions table created successfully!');
  } catch (error) {
    console.error('❌ Error creating points transactions table:', error);
    process.exit(1);
  }
}

createPointsTransactionsTable().then(() => {
  console.log('Migration completed.');
  process.exit(0);
}).catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});