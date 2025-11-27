import { NextResponse } from 'next/server';
import { sql } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { requireSession } from '@/server/auth/session';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@klusjeskoning.nl';

const indexes = [
  // Families
  { name: 'idx_families_email', sql: 'CREATE INDEX IF NOT EXISTS idx_families_email ON families(email)' },
  { name: 'idx_families_family_code', sql: 'CREATE INDEX IF NOT EXISTS idx_families_family_code ON families(family_code)' },

  // Children
  { name: 'idx_children_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_children_family_id ON children(family_id)' },
  { name: 'idx_children_family_pin', sql: 'CREATE INDEX IF NOT EXISTS idx_children_family_pin ON children(family_id, pin)' },

  // Chores
  { name: 'idx_chores_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_family_id ON chores(family_id)' },
  { name: 'idx_chores_status', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_status ON chores(status)' },
  { name: 'idx_chores_family_status', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_family_status ON chores(family_id, status)' },
  { name: 'idx_chores_submitted_by', sql: 'CREATE INDEX IF NOT EXISTS idx_chores_submitted_by ON chores(submitted_by_child_id) WHERE submitted_by_child_id IS NOT NULL' },

  // Chore Assignments
  { name: 'idx_chore_assignments_chore_id', sql: 'CREATE INDEX IF NOT EXISTS idx_chore_assignments_chore_id ON chore_assignments(chore_id)' },
  { name: 'idx_chore_assignments_child_id', sql: 'CREATE INDEX IF NOT EXISTS idx_chore_assignments_child_id ON chore_assignments(child_id)' },

  // Rewards
  { name: 'idx_rewards_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_rewards_family_id ON rewards(family_id)' },
  { name: 'idx_rewards_type', sql: 'CREATE INDEX IF NOT EXISTS idx_rewards_type ON rewards(type)' },

  // Reward Assignments
  { name: 'idx_reward_assignments_reward_id', sql: 'CREATE INDEX IF NOT EXISTS idx_reward_assignments_reward_id ON reward_assignments(reward_id)' },
  { name: 'idx_reward_assignments_child_id', sql: 'CREATE INDEX IF NOT EXISTS idx_reward_assignments_child_id ON reward_assignments(child_id)' },

  // Pending Rewards
  { name: 'idx_pending_rewards_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_pending_rewards_family_id ON pending_rewards(family_id)' },
  { name: 'idx_pending_rewards_child_id', sql: 'CREATE INDEX IF NOT EXISTS idx_pending_rewards_child_id ON pending_rewards(child_id)' },

  // Sessions
  { name: 'idx_sessions_token', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)' },
  { name: 'idx_sessions_expires_at', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)' },
  { name: 'idx_sessions_family_id', sql: 'CREATE INDEX IF NOT EXISTS idx_sessions_family_id ON sessions(family_id)' },
];

export async function POST() {
  try {
    // Check admin auth
    const session = await requireSession();
    if (session.family.email !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      );
    }

    if (!db) {
      return NextResponse.json(
        { error: 'Database not initialized' },
        { status: 503 }
      );
    }

    const results = {
      success: [] as string[],
      failed: [] as { name: string; error: string }[],
    };

    // Create indexes
    for (const index of indexes) {
      try {
        await db.execute(sql.raw(index.sql));
        results.success.push(index.name);
      } catch (error) {
        results.failed.push({
          name: index.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Analyze tables
    const tables = [
      'families',
      'children',
      'chores',
      'chore_assignments',
      'rewards',
      'reward_assignments',
      'pending_rewards',
      'sessions'
    ];

    const analyzed = [] as string[];
    for (const table of tables) {
      try {
        await db.execute(sql.raw(`ANALYZE ${table}`));
        analyzed.push(table);
      } catch (error) {
        // Not critical if analyze fails
        console.warn(`Could not analyze ${table}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Performance indexes added successfully',
      details: {
        indexesCreated: results.success.length,
        indexesFailed: results.failed.length,
        tablesAnalyzed: analyzed.length,
        successList: results.success,
        failedList: results.failed,
        analyzedTables: analyzed,
      }
    });

  } catch (error) {
    console.error('Error adding indexes:', error);
    return NextResponse.json(
      {
        error: 'Failed to add indexes',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
