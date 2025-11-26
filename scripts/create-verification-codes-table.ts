import { db } from '../src/server/db/client';
import { verificationCodes } from '../src/server/db/schema';
import { sql } from 'drizzle-orm';

async function createVerificationCodesTable() {
  console.log('Creating verification_codes table...');

  if (!db) {
    console.error('Database connection not available. Make sure DATABASE_URL is set.');
    process.exit(1);
  }

  const dbClient = db; // Type assertion after null check

  try {
    // Create the table
    await dbClient.execute(sql`
      CREATE TABLE IF NOT EXISTS verification_codes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
      );
    `);

    // Create indexes for better performance
    await dbClient.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes(email);
    `);

    await dbClient.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_verification_codes_code ON verification_codes(code);
    `);

    await dbClient.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
    `);

    console.log('✅ verification_codes table created successfully!');
  } catch (error) {
    console.error('❌ Error creating verification_codes table:', error);
    throw error;
  }
}

// Run the migration
createVerificationCodesTable()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });