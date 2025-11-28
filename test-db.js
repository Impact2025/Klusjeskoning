const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env.local' });

async function testDB() {
  try {
    console.log('Testing database connection...');

    const sql = neon(process.env.DATABASE_URL);

    // Test basic connection
    const result = await sql`SELECT 1 as test`;
    console.log('✅ Database connection works:', result[0]);

    // Check if families table exists and has data
    const familiesResult = await sql`SELECT COUNT(*) as count FROM families`;
    console.log('✅ Families table exists, count:', familiesResult[0].count);

    // Check if sessions table exists
    const sessionsResult = await sql`SELECT COUNT(*) as count FROM sessions`;
    console.log('✅ Sessions table exists, count:', sessionsResult[0].count);

    // List all families
    const allFamilies = await sql`SELECT id, family_name, email, family_code FROM families LIMIT 5`;
    console.log('📋 Families in database:');
    allFamilies.forEach(family => {
      console.log(`  - ${family.family_name} (${family.email}) - Code: ${family.family_code}`);
    });

    // Check sessions
    const allSessions = await sql`SELECT family_id, token, expires_at FROM sessions LIMIT 5`;
    console.log('📋 Sessions in database:');
    allSessions.forEach(session => {
      console.log(`  - Family ID: ${session.family_id}, Expires: ${session.expires_at}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testDB();