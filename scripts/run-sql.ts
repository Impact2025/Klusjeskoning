import { db } from '../src/server/db/client';
import { sql } from 'drizzle-orm';

async function runSQL() {
  try {
    console.log('Adding child_id column to sessions table...');

    await db.execute(sql`
      ALTER TABLE sessions ADD COLUMN IF NOT EXISTS child_id uuid REFERENCES children(id) ON DELETE CASCADE;
    `);

    console.log('Child ID column added to sessions table successfully!');
  } catch (error) {
    console.error('Error adding child_id column to sessions table:', error);
    process.exit(1);
  }
}

runSQL().then(() => {
  console.log('Migration completed.');
  process.exit(0);
});