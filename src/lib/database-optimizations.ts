import 'server-only';

/**
 * Database optimization utilities and query improvements
 * for the KlusjesKoning application
 */

import { eq, and, sql, desc, asc } from 'drizzle-orm';
import { db } from '@/server/db/client';
import {
  families,
  children,
  chores,
  rewards,
  pendingRewards,
  choreAssignments,
  rewardAssignments,
} from '@/server/db/schema';

/**
 * Optimized family loading with selective field loading
 * Reduces memory usage by only loading required fields
 */
export async function loadFamilyOptimized(familyId: string, includePendingRewards = true) {
  if (!db) throw new Error('Database not initialized');

  const family = await (db as any).query.families.findFirst({
    where: eq(families.id, familyId),
    columns: {
      id: true,
      familyCode: true,
      familyName: true,
      city: true,
      email: true,
      createdAt: true,
      recoveryEmail: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      subscriptionInterval: true,
      subscriptionRenewalDate: true,
      subscriptionLastPaymentAt: true,
      subscriptionOrderId: true,
    },
    with: {
      children: {
        columns: {
          id: true,
          name: true,
          points: true,
          totalPointsEver: true,
          avatar: true,
          createdAt: true,
        },
      },
      chores: {
        columns: {
          id: true,
          name: true,
          points: true,
          status: true,
          submittedByChildId: true,
          submittedAt: true,
          emotion: true,
          photoUrl: true,
          createdAt: true,
        },
        with: {
          assignments: {
            columns: {
              childId: true,
            },
          },
        },
      },
      rewards: {
        columns: {
          id: true,
          name: true,
          points: true,
          type: true,
          createdAt: true,
        },
        with: {
          assignments: {
            columns: {
              childId: true,
            },
          },
        },
      },
      ...(includePendingRewards && {
        pendingRewards: {
          columns: {
            id: true,
            childId: true,
            rewardId: true,
            points: true,
            redeemedAt: true,
          },
          with: {
            child: {
              columns: {
                name: true,
              },
            },
            reward: {
              columns: {
                name: true,
              },
            },
          },
        },
      }),
    },
  });

  return family;
}

/**
 * Optimized admin stats query using single query with aggregations
 * Eliminates multiple separate queries
 */
export async function getOptimizedAdminStats() {
  if (!db) throw new Error('Database not initialized');

  // Single query with window functions for better performance
  const statsResult = await db!.execute(sql`
    SELECT
      (SELECT COUNT(*) FROM families) as total_families,
      (SELECT COUNT(*) FROM children) as total_children,
      (SELECT COALESCE(SUM(total_points_ever), 0) FROM children) as total_points_ever,
      (SELECT COALESCE(SUM(pr.points), 0)
       FROM pending_rewards pr
       JOIN rewards r ON pr.reward_id = r.id
       WHERE r.type = 'donation') as total_donation_points
  `);

  const stats = statsResult.rows[0] as any;

  return {
    totalFamilies: Number(stats.total_families) || 0,
    totalChildren: Number(stats.total_children) || 0,
    totalPointsEver: Number(stats.total_points_ever) || 0,
    totalDonationPoints: Number(stats.total_donation_points) || 0,
  };
}

/**
 * Optimized family list for admin with pagination
 * Prevents loading all families at once
 */
export async function getFamiliesPaginated(options: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: 'createdAt' | 'familyName' | 'childrenCount';
  sortOrder?: 'asc' | 'desc';
} = {}) {
  if (!db) throw new Error('Database not initialized');

  const {
    page = 1,
    limit = 50,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const offset = (page - 1) * limit;

  let whereClause = sql`TRUE`;

  if (search) {
    whereClause = sql`(
      family_name ILIKE ${`%${search}%`} OR
      email ILIKE ${`%${search}%`} OR
      city ILIKE ${`%${search}%`}
    )`;
  }

  // Build sort clause
  const sortField = sortBy === 'childrenCount'
    ? sql`(SELECT COUNT(*) FROM children c WHERE c.family_id = f.id)`
    : sortBy === 'familyName'
    ? sql`family_name`
    : sql`created_at`;

  const sortDirection = sortOrder === 'asc' ? asc : desc;

  const familiesResult = await db!.execute(sql`
    SELECT
      f.id,
      f.family_name,
      f.city,
      f.email,
      f.family_code,
      f.created_at,
      f.subscription_status,
      f.subscription_plan,
      f.subscription_interval,
      COUNT(c.id) as children_count
    FROM families f
    LEFT JOIN children c ON f.id = c.family_id
    WHERE ${whereClause}
    GROUP BY f.id, f.family_name, f.city, f.email, f.family_code, f.created_at,
             f.subscription_status, f.subscription_plan, f.subscription_interval
    ORDER BY ${sortField} ${sortDirection === asc ? sql`ASC` : sql`DESC`}
    LIMIT ${limit} OFFSET ${offset}
  `);

  const totalCountResult = await db!.execute(sql`
    SELECT COUNT(*) as total
    FROM families f
    WHERE ${whereClause}
  `);

  const familiesData = familiesResult.rows as any[];
  const totalCount = totalCountResult.rows[0] as any;

  return {
    families: familiesData.map((row: any) => ({
      id: row.id,
      familyName: row.family_name,
      city: row.city,
      email: row.email,
      familyCode: row.family_code,
      createdAt: row.created_at,
      childrenCount: Number(row.children_count) || 0,
      subscriptionStatus: row.subscription_status,
      subscriptionPlan: row.subscription_plan,
      subscriptionInterval: row.subscription_interval,
    })),
    pagination: {
      page,
      limit,
      total: Number(totalCount.total) || 0,
      totalPages: Math.ceil((Number(totalCount.total) || 0) / limit),
    },
  };
}

/**
 * Optimized financial overview with single query
 */
export async function getOptimizedFinancialOverview() {
  if (!db) throw new Error('Database not initialized');

  const overviewResult = await db!.execute(sql`
    SELECT
      COUNT(CASE WHEN subscription_status = 'active' THEN 1 END) as active_subscriptions,
      COUNT(CASE WHEN subscription_status = 'active' AND subscription_interval = 'monthly' THEN 1 END) as monthly_subs,
      COUNT(CASE WHEN subscription_status = 'active' AND subscription_interval = 'yearly' THEN 1 END) as yearly_subs,
      COALESCE(SUM(
        CASE
          WHEN subscription_status = 'active' AND subscription_interval = 'monthly' THEN 4.99
          WHEN subscription_status = 'active' AND subscription_interval = 'yearly' THEN 49.99
          ELSE 0
        END
      ), 0) as total_revenue
    FROM families
  `);

  // Get recent subscriptions with optimized query
  const recentSubscriptionsResult = await db!.execute(sql`
    SELECT
      id,
      family_name,
      email,
      subscription_plan,
      subscription_interval,
      subscription_last_payment_at,
      created_at,
      subscription_status
    FROM families
    WHERE subscription_status = 'active'
    ORDER BY COALESCE(subscription_last_payment_at, created_at) DESC
    LIMIT 10
  `);

  const overview = overviewResult.rows[0] as any;
  const recentSubscriptions = recentSubscriptionsResult.rows as any[];

  const activeSubscriptions = Number(overview.active_subscriptions) || 0;
  const totalRevenue = Number(overview.total_revenue) || 0;

  return {
    stats: {
      totalRevenue,
      activeSubscriptions,
      monthlyGrowth: 0, // Would need historical data for this
      avgSubscriptionValue: activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0,
    },
    recentSubscriptions: recentSubscriptions.map((sub: any) => ({
      id: sub.id,
      familyName: sub.family_name,
      email: sub.email,
      plan: sub.subscription_plan || 'premium',
      amount: sub.subscription_interval === 'yearly' ? 49.99 : 4.99,
      interval: sub.subscription_interval || 'monthly',
      createdAt: sub.subscription_last_payment_at || sub.created_at || new Date(),
      status: sub.subscription_status || 'inactive',
    })),
  };
}

/**
 * Batch update operations for better performance
 */
export async function batchUpdateChildPoints(updates: Array<{ childId: string; pointsDelta: number }>) {
  if (updates.length === 0) return;
  if (!db) throw new Error('Database not initialized');

  // Use a single query with CASE statements for batch updates
  const childIds = updates.map(u => u.childId);
  const cases = updates.map(u =>
    sql`WHEN id = ${u.childId} THEN points + ${u.pointsDelta}`
  );
  const totalEverCases = updates
    .filter(u => u.pointsDelta > 0)
    .map(u => sql`WHEN id = ${u.childId} THEN total_points_ever + ${u.pointsDelta}`);

  await db!.execute(sql`
    UPDATE children
    SET
      points = CASE ${sql.join(cases, sql` `)} ELSE points END,
      total_points_ever = CASE ${sql.join(totalEverCases, sql` `)} ELSE total_points_ever END
    WHERE id IN (${sql.join(childIds.map(id => sql`${id}`), sql`, `)})
  `);
}

/**
 * Database maintenance utilities
 */
export async function cleanupExpiredSessions() {
  if (!db) throw new Error('Database not initialized');

  const expiredCount = await db!.execute(sql`
    DELETE FROM sessions
    WHERE expires_at < NOW()
  `);

  return expiredCount.rowCount || 0;
}

export async function optimizeTableStatistics() {
  if (!db) throw new Error('Database not initialized');

  // Analyze tables for query optimization
  await db!.execute(sql`ANALYZE families, children, chores, rewards, pending_rewards`);
}

/**
 * Recommended database indexes for optimal performance
 *
 * These should be created in the database:
 *
 * -- Authentication indexes
 * CREATE INDEX idx_families_email ON families(email);
 * CREATE INDEX idx_sessions_token ON sessions(token);
 * CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
 *
 * -- Family relationship indexes
 * CREATE INDEX idx_children_family_id ON children(family_id);
 * CREATE INDEX idx_chores_family_id ON chores(family_id);
 * CREATE INDEX idx_rewards_family_id ON rewards(family_id);
 * CREATE INDEX idx_pending_rewards_family_id ON pending_rewards(family_id);
 *
 * -- Lookup indexes
 * CREATE INDEX idx_families_family_code ON families(family_code);
 * CREATE INDEX idx_chores_status ON chores(status);
 * CREATE INDEX idx_families_subscription_status ON families(subscription_status);
 *
 * -- Assignment indexes
 * CREATE INDEX idx_chore_assignments_chore_id ON chore_assignments(chore_id);
 * CREATE INDEX idx_chore_assignments_child_id ON chore_assignments(child_id);
 * CREATE INDEX idx_reward_assignments_reward_id ON reward_assignments(reward_id);
 * CREATE INDEX idx_reward_assignments_child_id ON reward_assignments(child_id);
 *
 * -- Composite indexes for common queries
 * CREATE INDEX idx_chores_family_status ON chores(family_id, status);
 * CREATE INDEX idx_rewards_family_type ON rewards(family_id, type);
 * CREATE INDEX idx_pending_rewards_child_reward ON pending_rewards(child_id, reward_id);
 */