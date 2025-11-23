import { neon } from '@neondatabase/serverless';

async function createTable() {
  try {
    console.log('Creating verification_codes table...');

    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL not configured');
    }

    const sql = neon(connectionString);

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS verification_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL,
        code varchar(6) NOT NULL,
        purpose varchar(50) NOT NULL,
        expires_at timestamp with time zone NOT NULL,
        used_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now() NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_verification_codes_email_purpose ON verification_codes(email, purpose);
      CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON verification_codes(expires_at);
    `;

    await sql`${createTableSQL}`;
    console.log('Verification codes table created successfully!');
  } catch (error) {
    console.error('Error creating verification codes table:', error);
    process.exit(1);
  }
}

createTable().then(() => {
  console.log('Migration completed.');
  process.exit(0);
});