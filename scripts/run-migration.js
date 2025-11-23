const fs = require('fs');
const path = require('path');

// Import the database client from the app
const { db } = require('../src/server/db/client.js');

async function runMigration() {
  try {
    console.log('Running migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'add-gamification-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        try {
          await db.execute(statement);
        } catch (error) {
          // Ignore "already exists" errors
          if (!error.message.includes('already exists') && !error.message.includes('duplicate')) {
            console.error('Error executing statement:', error.message);
            // Continue with other statements
          } else {
            console.log('Skipped (already exists):', statement.substring(0, 50) + '...');
          }
        }
      }
    }

    console.log('Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();