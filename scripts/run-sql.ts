import { sql } from 'drizzle-orm';
import { db } from '../src/server/db/client';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runSQL() {
  try {
    const sqlFile = join(process.cwd(), 'scripts', 'create-test-coupon.sql');
    const sqlContent = readFileSync(sqlFile, 'utf-8');

    console.log('Executing SQL script...');
    await db.execute(sql.unsafe(sqlContent));
    console.log('SQL script executed successfully!');
  } catch (error) {
    console.error('Error executing SQL script:', error);
    process.exit(1);
  }
}

runSQL().then(() => {
  console.log('Migration completed.');
  process.exit(0);
});