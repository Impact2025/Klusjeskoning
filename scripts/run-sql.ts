import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { join } from 'path';

async function runSQL() {
  try {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not configured');
    }

    const sql = neon(connectionString);
    const sqlFile = join(process.cwd(), 'scripts', 'create-test-coupon.sql');
    const sqlContent = readFileSync(sqlFile, 'utf-8');

    console.log('Executing SQL script...');
    await sql`${sqlContent}`;
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