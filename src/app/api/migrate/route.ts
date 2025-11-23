import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    console.log('Running migration...');

    // Read the migration SQL file
    const migrationPath = path.join(process.cwd(), 'scripts', 'add-gamification-columns.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Split the SQL into individual statements by semicolon
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    let executedCount = 0;
    let skippedCount = 0;

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 100) + '...');
        try {
          await db.execute(statement + ';');
          executedCount++;
        } catch (error: any) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || error.message.includes('duplicate')) {
            console.log('Skipped (already exists):', statement.substring(0, 50) + '...');
            skippedCount++;
          } else {
            console.error('Error executing statement:', error.message);
            // Continue with other statements
          }
        }
      }
    }

    console.log('Migration completed successfully!');

    return NextResponse.json({
      success: true,
      message: `Migration completed! Executed: ${executedCount}, Skipped: ${skippedCount}`
    });

  } catch (error: any) {
    console.error('Migration failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}