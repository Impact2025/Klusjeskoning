import { sql } from 'drizzle-orm';
import { db } from '../src/server/db/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runSQL() {
  try {
    const sqlFile = join(process.cwd(), 'scripts', 'create-verification-codes-table.sql');
    const sqlContent = readFileSync(sqlFile, 'utf-8');

    console.log('Creating verification_codes table...');
    await db.execute(sql.unsafe(sqlContent));
    console.log('Verification codes table created successfully!');
  } catch (error) {
    console.error('Error creating verification codes table:', error);
    process.exit(1);
  }
}

runSQL().then(() => {
  console.log('Migration completed.');
  process.exit(0);
});