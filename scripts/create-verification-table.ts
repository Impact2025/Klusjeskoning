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
    const sqlFile = join(process.cwd(), 'scripts', 'create-verification-codes-table.sql');
    const sqlContent = readFileSync(sqlFile, 'utf-8');

    console.log('Creating verification_codes table...');
    await sql`${sqlContent}`;
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