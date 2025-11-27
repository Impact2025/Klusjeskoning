import 'server-only';

import { eq, and, sql, desc, gte, lte, or, isNull } from 'drizzle-orm';

import { db } from '../db/client';
import { coupons, couponUsages } from '../db/schema';
import { FamilyCache, CacheInvalidation } from '@/lib/cache';
import {
  families,
  children,
  chores,
  choreAssignments,
  rewards,
  rewardAssignments,
  pendingRewards,
  goodCauses,
  blogPosts,
  reviews,
  verificationCodes,
  billingIntervalEnum,
  planTierEnum,
  subscriptionStatusEnum,
  pointsTransactions,
  penaltyConfigurations,
  appliedPenalties,
  economicConfigurations,
  economicMetrics,
  familyFeed,
} from '../db/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { PLAN_DEFINITIONS } from '@/lib/plans';
import { calculateXpReward, checkLevelUp } from '@/lib/xp-utils';
import { PenaltyConfig, DEFAULT_PENALTY_CONFIG } from '@/lib/penalty-framework';
import { EconomicConfig, DEFAULT_ECONOMIC_CONFIG } from '@/lib/economic-system';

type SerializableDate = string | null;

export type SerializableChild = {
  id: string;
  name: string;
  pin: string;
  points: number;
  totalPointsEver: number;
  avatar: string;
  createdAt: SerializableDate;
};

export type SerializableChore = {
  id: string;
  name: string;
  points: number;
  assignedTo: string[];
  status: string;
  submittedBy?: string | null;
  submittedAt: SerializableDate;
  emotion?: string | null;
  photoUrl?: string | null;
  createdAt: SerializableDate;
};

export type SerializableReward = {
  id: string;
  name: string;
  points: number;
  type: string;
  assignedTo: string[];
  createdAt: SerializableDate;
};

export type SerializablePendingReward = {
  id: string;
  childId: string;
  childName: string;
  rewardId: string;
  rewardName: string;
  points: number;
  redeemedAt: SerializableDate;
};

export type SerializableTeamChore = {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  participatingChildren: string[];
  totalPoints: number;
  progress: number;
  completedAt?: SerializableDate;
  createdAt: SerializableDate;
};

export type SerializableSubscription = {
  plan: string | null;
  status: string | null;
  interval: string | null;
  renewalDate: SerializableDate;
  lastPaymentAt: SerializableDate;
  orderId: string | null;
};

export type SerializableFamily = {
  id: string;
  familyCode: string;
  familyName: string;
  city: string;
  email: string;
  createdAt: SerializableDate;
  recoveryEmail?: string | null;
  subscription: SerializableSubscription;
  children: SerializableChild[];
  chores: SerializableChore[];
  rewards: SerializableReward[];
  pendingRewards: SerializablePendingReward[];
  teamChores?: SerializableTeamChore[];
};

const toSerializableDate = (date?: Date | string | null): SerializableDate => {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString();
};

const DEFAULT_CODE_ATTEMPTS = 10;

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const PLAN_PRICING = {
  monthly: PLAN_DEFINITIONS.premium.priceMonthlyCents,
  yearly: PLAN_DEFINITIONS.premium.priceYearlyCents,
};

export const generateUniqueFamilyCode = async (): Promise<string> => {
  if (!db) throw new Error('Database not initialized');

  for (let attempt = 0; attempt < DEFAULT_CODE_ATTEMPTS; attempt += 1) {
    const code = generateCode();
    const existing = await db.query.families.findFirst({ where: eq(families.familyCode, code) });
    if (!existing) {
      return code;
    }
  }
  throw new Error('Kon geen uniek familiecode genereren. Probeer opnieuw.');
};

export const createFamily = async (params: {
  familyName: string;
  city: string;
  email: string;
  password: string;
  skipVerification?: boolean; // For admin use
}) => {
  if (!db) throw new Error('Database not initialized');

  const existing = await db.query.families.findFirst({ where: eq(families.email, params.email) });
  if (existing) {
    throw new Error('EMAIL_IN_USE');
  }

  const familyCode = await generateUniqueFamilyCode();
  const passwordHash = await hashPassword(params.password);

  const [family] = await db
    .insert(families)
    .values({
      familyName: params.familyName,
      city: params.city,
      email: params.email,
      passwordHash,
      familyCode,
    })
    .returning({ id: families.id, familyCode: families.familyCode });

  return family;
};

/**
 * Start family registration process (creates verification code)
 */
export const startFamilyRegistration = async (params: {
  familyName: string;
  city: string;
  email: string;
  password: string;
}) => {
  if (!db) throw new Error('Database not initialized');

  const existing = await db.query.families.findFirst({ where: eq(families.email, params.email) });
  if (existing) {
    throw new Error('EMAIL_IN_USE');
  }

  // Generate verification code
  const verificationCode = await createVerificationCode({
    email: params.email,
    purpose: 'registration',
  });

  // Store registration data temporarily (we'll use the verification code to link it)
  // For now, we'll just return the code - in a production system you'd want to store
  // the registration data temporarily until verification is complete

  return {
    verificationCode,
    email: params.email,
    familyName: params.familyName,
    city: params.city,
  };
};

/**
 * Complete family registration after verification
 */
export const completeFamilyRegistration = async (params: {
  email: string;
  code: string;
  familyName: string;
  city: string;
  password: string;
}) => {
  if (!db) throw new Error('Database not initialized');

  // Verify the code
  const isValid = await verifyCode({
    email: params.email,
    code: params.code,
    purpose: 'registration',
  });

  if (!isValid) {
    throw new Error('INVALID_VERIFICATION_CODE');
  }

  // Create the family
  return await createFamily({
    familyName: params.familyName,
    city: params.city,
    email: params.email,
    password: params.password,
  });
};

export const authenticateFamily = async (email: string, password: string) => {
  if (!db) throw new Error('Database not initialized');

  const family = await db.query.families.findFirst({ where: eq(families.email, email) });
  if (!family) {
    return null;
  }
  const isValid = await verifyPassword(password, family.passwordHash);
  if (!isValid) {
    return null;
  }
  return family;
};

/**
 * Optimized authentication that also preloads family data
 * Reduces login time by eliminating separate loadFamilyWithRelations call
 */
export const authenticateFamilyWithData = async (email: string, password: string) => {
  if (!db) throw new Error('Database not initialized');

  // Step 1: Get family and verify password
  const family = await db.query.families.findFirst({ where: eq(families.email, email) });
  if (!family) {
    return null;
  }

  const isValid = await verifyPassword(password, family.passwordHash);
  if (!isValid) {
    return null;
  }

  // Step 2: Check cache first (may have been loaded recently)
  const cachedFamily = await FamilyCache.get(family.id);
  if (cachedFamily) {
    return { family, familyData: cachedFamily };
  }

  // Step 3: Load family data in parallel (same as loadFamilyWithRelations but reuses family object)
  const familyData = await loadFamilyDataOptimized(family.id, family);

  return { family, familyData };
};

/**
 * Internal helper to load family data with optional pre-fetched family record
 */
const loadFamilyDataOptimized = async (familyId: string, familyRecord?: any) => {
  if (!db) throw new Error('Database not initialized');

  // Use provided family record or fetch it
  let family = familyRecord;
  if (!family) {
    const familyResult = await db.execute(sql`
      SELECT
        f.id, f.family_code, f.family_name, f.city, f.email, f.created_at,
        f.recovery_email, f.subscription_plan, f.subscription_status,
        f.subscription_interval, f.subscription_renewal_date,
        f.subscription_last_payment_at, f.subscription_order_id
      FROM families f
      WHERE f.id = ${familyId}
    `);
    if (familyResult.rows.length === 0) return null;
    family = familyResult.rows[0];
  }

  // Execute all queries in parallel - SINGLE database roundtrip with Promise.all
  const [
    childrenResult,
    choresResult,
    rewardsResult,
    pendingRewardsResult,
    teamChoresResult
  ] = await Promise.all([
    db.execute(sql`
      SELECT id, family_id, name, pin, points, total_points_ever, avatar, created_at
      FROM children WHERE family_id = ${familyId}
    `),
    db.execute(sql`
      SELECT c.id, c.family_id, c.name, c.points, c.status, c.submitted_by_child_id,
        c.submitted_at, c.emotion, c.photo_url, c.created_at,
        ca.child_id as assigned_child_id, ca.assigned_at
      FROM chores c
      LEFT JOIN chore_assignments ca ON c.id = ca.chore_id
      WHERE c.family_id = ${familyId}
    `),
    db.execute(sql`
      SELECT r.id, r.family_id, r.name, r.points, r.type, r.created_at,
        ra.child_id as assigned_child_id, ra.assigned_at
      FROM rewards r
      LEFT JOIN reward_assignments ra ON r.id = ra.reward_id
      WHERE r.family_id = ${familyId}
    `),
    db.execute(sql`
      SELECT pr.id, pr.family_id, pr.child_id, pr.reward_id, pr.points, pr.redeemed_at,
        c.name as child_name, r.name as reward_name
      FROM pending_rewards pr
      LEFT JOIN children c ON pr.child_id = c.id
      LEFT JOIN rewards r ON pr.reward_id = r.id
      WHERE pr.family_id = ${familyId}
    `),
    db.execute(sql`
      SELECT id, family_id, name, description, participating_children, total_points, progress, completed_at, created_at
      FROM team_chores WHERE family_id = ${familyId} ORDER BY created_at DESC
    `)
  ]);

  // Build family data object
  const familyData = {
    id: family.id ?? family.familyId,
    familyCode: family.family_code ?? family.familyCode,
    familyName: family.family_name ?? family.familyName,
    city: family.city,
    email: family.email,
    createdAt: family.created_at ?? family.createdAt,
    recoveryEmail: family.recovery_email ?? family.recoveryEmail,
    subscriptionPlan: family.subscription_plan ?? family.subscriptionPlan,
    subscriptionStatus: family.subscription_status ?? family.subscriptionStatus,
    subscriptionInterval: family.subscription_interval ?? family.subscriptionInterval,
    subscriptionRenewalDate: family.subscription_renewal_date ?? family.subscriptionRenewalDate,
    subscriptionLastPaymentAt: family.subscription_last_payment_at ?? family.subscriptionLastPaymentAt,
    subscriptionOrderId: family.subscription_order_id ?? family.subscriptionOrderId,
    children: childrenResult.rows.map((child: any) => ({
      id: child.id,
      familyId: child.family_id,
      name: child.name,
      pin: child.pin,
      points: Number(child.points),
      totalPointsEver: Number(child.total_points_ever),
      avatar: child.avatar,
      createdAt: child.created_at,
    })),
    chores: Object.values(
      choresResult.rows.reduce((acc: any, row: any) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id, familyId: row.family_id, name: row.name,
            points: Number(row.points), status: row.status,
            submittedByChildId: row.submitted_by_child_id,
            submittedAt: row.submitted_at, emotion: row.emotion,
            photoUrl: row.photo_url, createdAt: row.created_at,
            assignments: [],
          };
        }
        if (row.assigned_child_id) {
          acc[row.id].assignments.push({
            chore_id: row.id, child_id: row.assigned_child_id, assigned_at: row.assigned_at,
          });
        }
        return acc;
      }, {})
    ),
    rewards: Object.values(
      rewardsResult.rows.reduce((acc: any, row: any) => {
        if (!acc[row.id]) {
          acc[row.id] = {
            id: row.id, familyId: row.family_id, name: row.name,
            points: Number(row.points), type: row.type, createdAt: row.created_at,
            assignments: [],
          };
        }
        if (row.assigned_child_id) {
          acc[row.id].assignments.push({
            reward_id: row.id, child_id: row.assigned_child_id, assigned_at: row.assigned_at,
          });
        }
        return acc;
      }, {})
    ),
    pendingRewards: pendingRewardsResult.rows.map((pending: any) => ({
      id: pending.id, familyId: pending.family_id, childId: pending.child_id,
      rewardId: pending.reward_id, points: Number(pending.points),
      redeemedAt: pending.redeemed_at,
      child: { name: pending.child_name },
      reward: { name: pending.reward_name },
    })),
    teamChores: teamChoresResult.rows.map((tc: any) => ({
      id: tc.id, familyId: tc.family_id, name: tc.name, description: tc.description,
      participatingChildren: tc.participating_children || [],
      totalPoints: Number(tc.total_points), progress: Number(tc.progress),
      completedAt: tc.completed_at, createdAt: tc.created_at,
    })),
  };

  // Cache the result
  await FamilyCache.set(familyId, familyData);

  return familyData;
};

export const getFamilyByEmail = async (email: string) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.families.findFirst({ where: eq(families.email, email) });
};

export const getFamilyById = async (familyId: string) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.families.findFirst({ where: eq(families.id, familyId) });
};

export const getFamilyByCode = async (code: string) => {
  if (!db) throw new Error('Database not initialized');

  // Use raw SQL to avoid schema issues with missing columns
  const familyResult = await db.execute(sql`
    SELECT
      f.id, f.family_code, f.family_name, f.city, f.email, f.created_at,
      f.recovery_email, f.subscription_plan, f.subscription_status,
      f.subscription_interval, f.subscription_renewal_date,
      f.subscription_last_payment_at, f.subscription_order_id
    FROM families f
    WHERE f.family_code = ${code.toUpperCase()}
  `);

  if (familyResult.rows.length === 0) {
    return null;
  }

  const family = familyResult.rows[0];

  // Execute all queries in parallel for better performance (optimized with JOINs)
  const [
    childrenResult,
    choresResult,
    assignmentsResult,
    rewardsResult,
    rewardAssignmentsResult,
    pendingRewardsResult,
    teamChoresResult
  ] = await Promise.all([
    // Get children
    db.execute(sql`
      SELECT id, family_id, name, pin, points, total_points_ever, avatar, created_at
      FROM children
      WHERE family_id = ${family.id}
    `),
    // Get chores with assignments in one query using LEFT JOIN
    db.execute(sql`
      SELECT
        c.id, c.family_id, c.name, c.points, c.status, c.submitted_by_child_id,
        c.submitted_at, c.emotion, c.photo_url, c.created_at,
        ca.child_id as assigned_child_id, ca.assigned_at
      FROM chores c
      LEFT JOIN chore_assignments ca ON c.id = ca.chore_id
      WHERE c.family_id = ${family.id}
    `),
    // Removed - merged with chores query above
    Promise.resolve({ rows: [] }),
    // Get rewards with assignments in one query using LEFT JOIN
    db.execute(sql`
      SELECT
        r.id, r.family_id, r.name, r.points, r.type, r.created_at,
        ra.child_id as assigned_child_id, ra.assigned_at
      FROM rewards r
      LEFT JOIN reward_assignments ra ON r.id = ra.reward_id
      WHERE r.family_id = ${family.id}
    `),
    // Removed - merged with rewards query above
    Promise.resolve({ rows: [] }),
    // Get pending rewards
    db.execute(sql`
      SELECT
        pr.id, pr.family_id, pr.child_id, pr.reward_id, pr.points, pr.redeemed_at,
        c.name as child_name, r.name as reward_name
      FROM pending_rewards pr
      LEFT JOIN children c ON pr.child_id = c.id
      LEFT JOIN rewards r ON pr.reward_id = r.id
      WHERE pr.family_id = ${family.id}
    `),
    // Get team chores
    db.execute(sql`
      SELECT id, family_id, name, description, participating_children, total_points, progress, completed_at, created_at
      FROM team_chores
      WHERE family_id = ${family.id}
      ORDER BY created_at DESC
    `)
  ]);

  // Build the family object
  return {
    id: family.id,
    familyCode: family.family_code,
    familyName: family.family_name,
    city: family.city,
    email: family.email,
    createdAt: family.created_at,
    recoveryEmail: family.recovery_email,
    subscriptionPlan: family.subscription_plan,
    subscriptionStatus: family.subscription_status,
    subscriptionInterval: family.subscription_interval,
    subscriptionRenewalDate: family.subscription_renewal_date,
    subscriptionLastPaymentAt: family.subscription_last_payment_at,
    subscriptionOrderId: family.subscription_order_id,
    children: childrenResult.rows.map(child => ({
      id: child.id,
      familyId: child.family_id,
      name: child.name,
      pin: child.pin,
      points: Number(child.points),
      totalPointsEver: Number(child.total_points_ever),
      avatar: child.avatar,
      createdAt: child.created_at,
    })),
    chores: choresResult.rows.map(chore => ({
      id: chore.id,
      familyId: chore.family_id,
      name: chore.name,
      points: Number(chore.points),
      status: chore.status,
      submittedByChildId: chore.submitted_by_child_id,
      submittedAt: chore.submitted_at,
      emotion: chore.emotion,
      photoUrl: chore.photo_url,
      createdAt: chore.created_at,
      assignments: (assignmentsResult.rows as any[]).filter((a: any) => a.chore_id === chore.id),
    })),
    rewards: rewardsResult.rows.map(reward => ({
      id: reward.id,
      familyId: reward.family_id,
      name: reward.name,
      points: Number(reward.points),
      type: reward.type,
      createdAt: reward.created_at,
      assignments: (rewardAssignmentsResult.rows as any[]).filter((a: any) => a.reward_id === reward.id),
    })),
    pendingRewards: pendingRewardsResult.rows.map(pending => ({
      id: pending.id,
      familyId: pending.family_id,
      childId: pending.child_id,
      rewardId: pending.reward_id,
      points: Number(pending.points),
      redeemedAt: pending.redeemed_at,
      child: {
        name: pending.child_name,
      },
      reward: {
        name: pending.reward_name,
      },
    })),
  };
};

export const loadFamilyWithRelations = async (familyId: string) => {
  if (!db) throw new Error('Database not initialized');

  // Try to get from cache first
  const cachedFamily = await FamilyCache.get(familyId);
  if (cachedFamily) {
    return cachedFamily;
  }

  // Fetch from database - use raw SQL to avoid schema issues with missing columns
  const familyResult = await db.execute(sql`
    SELECT
      f.id, f.family_code, f.family_name, f.city, f.email, f.created_at,
      f.recovery_email, f.subscription_plan, f.subscription_status,
      f.subscription_interval, f.subscription_renewal_date,
      f.subscription_last_payment_at, f.subscription_order_id
    FROM families f
    WHERE f.id = ${familyId}
  `);

  if (familyResult.rows.length === 0) {
    return null;
  }

  const family = familyResult.rows[0];

  // Execute all queries in parallel for better performance
  const [
    childrenResult,
    choresResult,
    assignmentsResult,
    rewardsResult,
    rewardAssignmentsResult,
    pendingRewardsResult,
    teamChoresResult
  ] = await Promise.all([
    // Get children
    db.execute(sql`
      SELECT id, family_id, name, pin, points, total_points_ever, avatar, created_at
      FROM children
      WHERE family_id = ${familyId}
    `),
    // Get chores with assignments in one query using LEFT JOIN
    db.execute(sql`
      SELECT
        c.id, c.family_id, c.name, c.points, c.status, c.submitted_by_child_id,
        c.submitted_at, c.emotion, c.photo_url, c.created_at,
        ca.child_id as assigned_child_id, ca.assigned_at
      FROM chores c
      LEFT JOIN chore_assignments ca ON c.id = ca.chore_id
      WHERE c.family_id = ${familyId}
    `),
    // Removed - merged with chores query above
    Promise.resolve({ rows: [] }),
    // Get rewards with assignments in one query using LEFT JOIN
    db.execute(sql`
      SELECT
        r.id, r.family_id, r.name, r.points, r.type, r.created_at,
        ra.child_id as assigned_child_id, ra.assigned_at
      FROM rewards r
      LEFT JOIN reward_assignments ra ON r.id = ra.reward_id
      WHERE r.family_id = ${familyId}
    `),
    // Removed - merged with rewards query above
    Promise.resolve({ rows: [] }),
    // Get pending rewards
    db.execute(sql`
      SELECT
        pr.id, pr.family_id, pr.child_id, pr.reward_id, pr.points, pr.redeemed_at,
        c.name as child_name, r.name as reward_name
      FROM pending_rewards pr
      LEFT JOIN children c ON pr.child_id = c.id
      LEFT JOIN rewards r ON pr.reward_id = r.id
      WHERE pr.family_id = ${familyId}
    `),
    // Get team chores (moved into parallel execution)
    db.execute(sql`
      SELECT id, family_id, name, description, participating_children, total_points, progress, completed_at, created_at
      FROM team_chores
      WHERE family_id = ${familyId}
      ORDER BY created_at DESC
    `)
  ]);

  // Build the family object
  const familyData = {
    id: family.id,
    familyCode: family.family_code,
    familyName: family.family_name,
    city: family.city,
    email: family.email,
    createdAt: family.created_at,
    recoveryEmail: family.recovery_email,
    subscriptionPlan: family.subscription_plan,
    subscriptionStatus: family.subscription_status,
    subscriptionInterval: family.subscription_interval,
    subscriptionRenewalDate: family.subscription_renewal_date,
    subscriptionLastPaymentAt: family.subscription_last_payment_at,
    subscriptionOrderId: family.subscription_order_id,
    children: childrenResult.rows.map(child => ({
      id: child.id,
      familyId: child.family_id,
      name: child.name,
      pin: child.pin,
      points: Number(child.points),
      totalPointsEver: Number(child.total_points_ever),
      avatar: child.avatar,
      createdAt: child.created_at,
      // Exclude gamification columns for now
      // xp: child.xp,
      // totalXpEver: child.total_xp_ever,
    })),
    chores: Object.values(
      choresResult.rows.reduce((acc, row: any) => {
        if (!acc[row.id as string]) {
          acc[row.id as string] = {
            id: row.id,
            familyId: row.family_id,
            name: row.name,
            points: Number(row.points),
            status: row.status,
            submittedByChildId: row.submitted_by_child_id,
            submittedAt: row.submitted_at,
            emotion: row.emotion,
            photoUrl: row.photo_url,
            createdAt: row.created_at,
            assignments: [],
          };
        }
        if (row.assigned_child_id) {
          (acc[row.id as string] as any).assignments.push({
            chore_id: row.id,
            child_id: row.assigned_child_id,
            assigned_at: row.assigned_at,
          });
        }
        return acc;
      }, {} as Record<string, any>)
    ),
    rewards: Object.values(
      rewardsResult.rows.reduce((acc, row: any) => {
        if (!acc[row.id as string]) {
          acc[row.id as string] = {
            id: row.id,
            familyId: row.family_id,
            name: row.name,
            points: Number(row.points),
            type: row.type,
            createdAt: row.created_at,
            assignments: [],
          };
        }
        if (row.assigned_child_id) {
          (acc[row.id as string] as any).assignments.push({
            reward_id: row.id as string,
            child_id: row.assigned_child_id,
            assigned_at: row.assigned_at,
          });
        }
        return acc;
      }, {} as Record<string, any>)
    ),
    pendingRewards: pendingRewardsResult.rows.map(pending => ({
      id: pending.id,
      familyId: pending.family_id,
      childId: pending.child_id,
      rewardId: pending.reward_id,
      points: Number(pending.points),
      redeemedAt: pending.redeemed_at,
      child: {
        name: pending.child_name,
      },
      reward: {
        name: pending.reward_name,
      },
    })),
  };

  // Add team chores to family data
  const teamChoresData = teamChoresResult.rows.map(teamChore => ({
    id: teamChore.id,
    familyId: teamChore.family_id,
    name: teamChore.name,
    description: teamChore.description,
    participatingChildren: teamChore.participating_children || [],
    totalPoints: Number(teamChore.total_points),
    progress: Number(teamChore.progress),
    completedAt: teamChore.completed_at,
    createdAt: teamChore.created_at,
  }));

  const completeFamilyData = {
    ...familyData,
    teamChores: teamChoresData,
  };

  // Cache the result if found
  await FamilyCache.set(familyId, completeFamilyData);

  return completeFamilyData;
};

// ===== COUPON MANAGEMENT FUNCTIONS =====

/**
 * Create a new coupon
 */
export const createCoupon = async (couponData: {
  code: string;
  description?: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  maxUses?: number;
  validFrom?: Date;
  validUntil?: Date;
  isActive?: boolean;
}) => {
  if (!db) throw new Error('Database not initialized');

  const [coupon] = await db
    .insert(coupons)
    .values({
      code: couponData.code.toUpperCase(),
      description: couponData.description,
      discountType: couponData.discountType,
      discountValue: couponData.discountValue,
      maxUses: couponData.maxUses,
      validFrom: couponData.validFrom,
      validUntil: couponData.validUntil,
      isActive: couponData.isActive !== false ? 1 : 0,
    })
    .returning();

  return coupon;
};

/**
 * Get all coupons for admin
 */
export const getAllCoupons = async () => {
  if (!db) throw new Error('Database not initialized');

  return db.query.coupons.findMany({
    with: {
      usages: {
        with: {
          family: {
            columns: {
              familyName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: desc(coupons.createdAt),
  });
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (couponId: string) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.coupons.findFirst({
    where: eq(coupons.id, couponId),
    with: {
      usages: {
        with: {
          family: {
            columns: {
              familyName: true,
              email: true,
            },
          },
        },
      },
    },
  });
};

/**
 * Update coupon
 */
export const updateCoupon = async (
  couponId: string,
  updates: Partial<{
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxUses: number;
    validFrom: Date;
    validUntil: Date;
    isActive: boolean;
  }>
) => {
  if (!db) throw new Error('Database not initialized');

  const updateData: any = { ...updates };
  if (updates.isActive !== undefined) {
    updateData.isActive = updates.isActive ? 1 : 0;
  }
  updateData.updatedAt = new Date();

  const [coupon] = await db
    .update(coupons)
    .set(updateData)
    .where(eq(coupons.id, couponId))
    .returning();

  return coupon;
};

/**
 * Delete coupon
 */
export const deleteCoupon = async (couponId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(coupons).where(eq(coupons.id, couponId));
};

/**
 * Validate and apply coupon
 */
export const validateCoupon = async (code: string, familyId: string) => {
  if (!db) throw new Error('Database not initialized');

  const coupon = await db.query.coupons.findFirst({
    where: and(
      eq(coupons.code, code.toUpperCase()),
      eq(coupons.isActive, 1)
    ),
  });

  if (!coupon) {
    throw new Error('Coupon code niet gevonden of niet actief');
  }

  // Check validity period
  const now = new Date();
  if (coupon.validFrom && coupon.validFrom > now) {
    throw new Error('Coupon is nog niet geldig');
  }
  if (coupon.validUntil && coupon.validUntil < now) {
    throw new Error('Coupon is verlopen');
  }

  // Check usage limits
  if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
    throw new Error('Coupon is niet meer beschikbaar');
  }

  // Check if family already used this coupon
  const existingUsage = await db.query.couponUsages.findFirst({
    where: and(
      eq(couponUsages.couponId, coupon.id),
      eq(couponUsages.familyId, familyId)
    ),
  });

  if (existingUsage) {
    throw new Error('Deze coupon is al gebruikt door je gezin');
  }

  return coupon;
};

/**
 * Apply coupon to order
 */
export const applyCouponToOrder = async (
  couponId: string,
  familyId: string,
  orderId: string,
  originalAmount: number
) => {
  if (!db) throw new Error('Database not initialized');

  const coupon = await db.query.coupons.findFirst({
    where: eq(coupons.id, couponId),
  });

  if (!coupon) {
    throw new Error('Coupon niet gevonden');
  }

  // Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round((originalAmount * coupon.discountValue) / 100);
  } else {
    discountAmount = Math.min(coupon.discountValue, originalAmount);
  }

  // Apply discount (don't exceed original amount)
  discountAmount = Math.min(discountAmount, originalAmount);

  // Record usage
  await db.insert(couponUsages).values({
    couponId,
    familyId,
    orderId,
    discountApplied: discountAmount,
  });

  // Update coupon usage count
  await db
    .update(coupons)
    .set({
      usedCount: sql`${coupons.usedCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(coupons.id, couponId));

  return {
    discountAmount,
    finalAmount: originalAmount - discountAmount,
    coupon,
  };
};

/**
 * Get coupon usage statistics
 */
export const getCouponStats = async () => {
  if (!db) throw new Error('Database not initialized');

  const [stats] = await db
    .select({
      totalCoupons: sql<number>`count(distinct ${coupons.id})`,
      activeCoupons: sql<number>`count(distinct case when ${coupons.isActive} = 1 then ${coupons.id} end)`,
      totalUsages: sql<number>`count(${couponUsages.id})`,
      totalDiscountGiven: sql<number>`coalesce(sum(${couponUsages.discountApplied}), 0)`,
    })
    .from(coupons)
    .leftJoin(couponUsages, eq(coupons.id, couponUsages.couponId));

  return stats;
};

/**
 * Generate unique coupon code
 */
export const generateCouponCode = (prefix = 'KK', length = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = prefix;
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// ===== ADMIN SUBSCRIPTION MANAGEMENT =====

/**
 * Manually set subscription for a family (admin only)
 */
export const setFamilySubscription = async (familyId: string, subscriptionData: {
  plan?: 'starter' | 'premium' | null;
  status?: 'inactive' | 'active' | 'past_due' | 'canceled';
  interval?: 'monthly' | 'yearly' | null;
  renewalDate?: Date | null;
  orderId?: string | null;
}) => {
  if (!db) throw new Error('Database not initialized');

  // Update subscription data
  const [updatedFamily] = await db
    .update(families)
    .set({
      subscriptionPlan: subscriptionData.plan,
      subscriptionStatus: subscriptionData.status,
      subscriptionInterval: subscriptionData.interval,
      subscriptionRenewalDate: subscriptionData.renewalDate,
      subscriptionOrderId: subscriptionData.orderId,
      subscriptionLastPaymentAt: subscriptionData.status === 'active' ? new Date() : undefined,
    })
    .where(eq(families.id, familyId))
    .returning();

  if (!updatedFamily) {
    throw new Error('Family not found');
  }

  // Invalidate cache
  await CacheInvalidation.invalidateFamilyData(familyId);

  return updatedFamily;
};

/**
 * Upgrade family to pro account with custom duration
 */
export const upgradeFamilyToPro = async (
  familyId: string,
  options: {
    plan?: 'premium';
    interval?: 'monthly' | 'yearly';
    durationMonths?: number; // Custom duration in months
    orderId?: string;
  } = {}
) => {
  if (!db) throw new Error('Database not initialized');

  const {
    plan = 'premium',
    interval = 'monthly',
    durationMonths = interval === 'yearly' ? 12 : 1,
    orderId
  } = options;

  // Calculate renewal date
  const renewalDate = new Date();
  renewalDate.setMonth(renewalDate.getMonth() + durationMonths);

  return setFamilySubscription(familyId, {
    plan,
    status: 'active',
    interval,
    renewalDate,
    orderId,
  });
};

/**
 * Downgrade family account
 */
export const downgradeFamilyAccount = async (familyId: string, options: {
  immediate?: boolean; // Cancel immediately vs end of period
  orderId?: string;
} = {}) => {
  if (!db) throw new Error('Database not initialized');

  const { immediate = false, orderId } = options;

  if (immediate) {
    // Immediate cancellation
    return setFamilySubscription(familyId, {
      plan: null,
      status: 'canceled',
      interval: null,
      renewalDate: null,
      orderId,
    });
  } else {
    // Cancel at end of billing period
    return setFamilySubscription(familyId, {
      status: 'canceled',
      orderId,
    });
  }
};

/**
 * Extend pro subscription
 */
export const extendFamilySubscription = async (
  familyId: string,
  additionalMonths: number,
  orderId?: string
) => {
  if (!db) throw new Error('Database not initialized');

  // Get current subscription
  const family = await db.query.families.findFirst({
    where: eq(families.id, familyId),
    columns: {
      subscriptionRenewalDate: true,
      subscriptionStatus: true,
    },
  });

  if (!family) {
    throw new Error('Family not found');
  }

  if (family.subscriptionStatus !== 'active') {
    throw new Error('Family does not have an active subscription');
  }

  // Calculate new renewal date
  const currentRenewal = family.subscriptionRenewalDate || new Date();
  const newRenewalDate = new Date(currentRenewal);
  newRenewalDate.setMonth(newRenewalDate.getMonth() + additionalMonths);

  return setFamilySubscription(familyId, {
    renewalDate: newRenewalDate,
    orderId,
  });
};

/**
 * Get subscription management statistics
 */
export const getSubscriptionStats = async () => {
  if (!db) throw new Error('Database not initialized');

  const [stats] = await db
    .select({
      totalFamilies: sql<number>`count(*)`,
      activeSubscriptions: sql<number>`count(case when subscription_status = 'active' then 1 end)`,
      premiumSubscriptions: sql<number>`count(case when subscription_plan = 'premium' and subscription_status = 'active' then 1 end)`,
      starterSubscriptions: sql<number>`count(case when subscription_plan = 'starter' and subscription_status = 'active' then 1 end)`,
      canceledSubscriptions: sql<number>`count(case when subscription_status = 'canceled' then 1 end)`,
      expiringSoon: sql<number>`count(case when subscription_status = 'active' and subscription_renewal_date <= ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} then 1 end)`, // Next 30 days
    })
    .from(families);

  return stats;
};

/**
 * Get families with expiring subscriptions
 */
export const getExpiringSubscriptions = async (daysAhead = 30) => {
  if (!db) throw new Error('Database not initialized');

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() + daysAhead);

  return db.query.families.findMany({
    where: and(
      eq(families.subscriptionStatus, 'active'),
      lte(families.subscriptionRenewalDate, cutoffDate)
    ),
    columns: {
      id: true,
      familyName: true,
      email: true,
      subscriptionPlan: true,
      subscriptionRenewalDate: true,
    },
    orderBy: families.subscriptionRenewalDate,
  });
};

/**
 * Bulk subscription operations
 */
export const bulkUpdateSubscriptions = async (operations: Array<{
  familyId: string;
  action: 'upgrade' | 'downgrade' | 'extend' | 'cancel';
  options?: any;
}>) => {
  if (!db) throw new Error('Database not initialized');

  const results = [];

  for (const operation of operations) {
    try {
      let result;

      switch (operation.action) {
        case 'upgrade':
          result = await upgradeFamilyToPro(operation.familyId, operation.options);
          break;
        case 'downgrade':
          result = await downgradeFamilyAccount(operation.familyId, operation.options);
          break;
        case 'extend':
          result = await extendFamilySubscription(
            operation.familyId,
            operation.options?.months || 1,
            operation.options?.orderId
          );
          break;
        case 'cancel':
          result = await downgradeFamilyAccount(operation.familyId, { immediate: true, ...operation.options });
          break;
        default:
          throw new Error(`Unknown action: ${operation.action}`);
      }

      results.push({
        familyId: operation.familyId,
        success: true,
        result,
      });
    } catch (error) {
      results.push({
        familyId: operation.familyId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
};

export const getChildById = async (familyId: string, childId: string) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.children.findFirst({
    where: and(eq(children.id, childId), eq(children.familyId, familyId)),
  });
};

export const getChoreById = async (familyId: string, choreId: string) => {
  if (!db) throw new Error('Database not initialized');

  // Use raw SQL to avoid schema issues
  const result = await db.execute(sql`
    SELECT
      c.id, c.family_id, c.name, c.points, c.status, c.submitted_by_child_id,
      c.submitted_at, c.emotion, c.photo_url, c.created_at
    FROM chores c
    WHERE c.id = ${choreId} AND c.family_id = ${familyId}
  `);

  if (result.rows.length === 0) {
    return null;
  }

  const chore = result.rows[0];

  // Get assignments
  const assignmentsResult = await db.execute(sql`
    SELECT child_id, assigned_at FROM chore_assignments WHERE chore_id = ${choreId}
  `);

  return {
    id: chore.id,
    familyId: chore.family_id,
    name: chore.name,
    points: Number(chore.points),
    status: chore.status,
    submittedByChildId: chore.submitted_by_child_id,
    submittedAt: chore.submitted_at,
    emotion: chore.emotion,
    photoUrl: chore.photo_url,
    createdAt: chore.created_at,
    assignments: assignmentsResult.rows,
  };
};

export const getRewardById = async (familyId: string, rewardId: string) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.rewards.findFirst({
    where: and(eq(rewards.id, rewardId), eq(rewards.familyId, familyId)),
    with: {
      assignments: true,
    },
  });
};

export const serializeFamily = (family: NonNullable<Awaited<ReturnType<typeof loadFamilyWithRelations>>> | NonNullable<Awaited<ReturnType<typeof getFamilyByCode>>>): SerializableFamily => {
  // Type assertion - we know this structure from the database queries
  const typedFamily = family as {
    id: string;
    familyCode: string;
    familyName: string;
    city: string;
    email: string;
    createdAt: Date | null;
    recoveryEmail: string | null;
    subscriptionPlan: string | null;
    subscriptionStatus: string | null;
    subscriptionInterval: string | null;
    subscriptionRenewalDate: Date | null;
    subscriptionLastPaymentAt: Date | null;
    subscriptionOrderId: string | null;
    children: Array<{
      id: string;
      name: string;
      pin: string;
      points: number;
      totalPointsEver: number;
      avatar: string;
      createdAt: Date | null;
    }>;
    chores: Array<{
      id: string;
      name: string;
      points: number;
      status: string;
      submittedByChildId: string | null;
      submittedAt: Date | null;
      emotion: string | null;
      photoUrl: string | null;
      createdAt: Date | null;
      assignments: Array<{ childId: string }>;
    }>;
    rewards: Array<{
      id: string;
      name: string;
      points: number;
      type: string;
      createdAt: Date | null;
      assignments: Array<{ childId: string }>;
    }>;
    pendingRewards: Array<{
      id: string;
      childId: string;
      rewardId: string;
      points: number;
      redeemedAt: Date;
      child: { name: string };
      reward: { name: string };
    }>;
  };

  const childrenData: SerializableChild[] = typedFamily.children.map((child) => ({
    id: child.id,
    name: child.name,
    pin: child.pin,
    points: child.points,
    totalPointsEver: child.totalPointsEver,
    avatar: child.avatar,
    createdAt: toSerializableDate(child.createdAt),
  }));

  const childIdToName = new Map(childrenData.map((child) => [child.id, child.name] as const));

  const rewardsData: SerializableReward[] = typedFamily.rewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    points: reward.points,
    type: reward.type,
    assignedTo: reward.assignments.map((assignment) => assignment.childId),
    createdAt: toSerializableDate(reward.createdAt),
  }));

  const rewardsMap = new Map(rewardsData.map((reward) => [reward.id, reward.name] as const));

  const choresData: SerializableChore[] = typedFamily.chores.map((chore) => ({
    id: chore.id,
    name: chore.name,
    points: chore.points,
    assignedTo: chore.assignments.map((assignment) => assignment.childId),
    status: chore.status,
    submittedBy: chore.submittedByChildId,
    submittedAt: toSerializableDate(chore.submittedAt),
    emotion: chore.emotion,
    photoUrl: chore.photoUrl,
    createdAt: toSerializableDate(chore.createdAt),
  }));

  const pendingRewardsData: SerializablePendingReward[] = typedFamily.pendingRewards.map((pending) => ({
    id: pending.id,
    childId: pending.childId,
    childName: childIdToName.get(pending.childId) ?? '',
    rewardId: pending.rewardId,
    rewardName: rewardsMap.get(pending.rewardId) ?? '',
    points: pending.points,
    redeemedAt: toSerializableDate(pending.redeemedAt),
  }));

  return {
    id: typedFamily.id,
    familyCode: typedFamily.familyCode,
    familyName: typedFamily.familyName,
    city: typedFamily.city,
    email: typedFamily.email,
    createdAt: toSerializableDate(typedFamily.createdAt),
    recoveryEmail: typedFamily.recoveryEmail,
    subscription: {
      plan: typedFamily.subscriptionPlan ?? null,
      status: typedFamily.subscriptionStatus ?? null,
      interval: typedFamily.subscriptionInterval ?? null,
      renewalDate: toSerializableDate(typedFamily.subscriptionRenewalDate),
      lastPaymentAt: toSerializableDate(typedFamily.subscriptionLastPaymentAt),
      orderId: typedFamily.subscriptionOrderId ?? null,
    },
    children: childrenData,
    chores: choresData,
    rewards: rewardsData,
    pendingRewards: pendingRewardsData,
    teamChores: (typedFamily as any).teamChores?.map((teamChore: any) => ({
      id: teamChore.id,
      familyId: teamChore.familyId,
      name: teamChore.name,
      description: teamChore.description,
      participatingChildren: teamChore.participatingChildren || [],
      totalPoints: teamChore.totalPoints,
      progress: teamChore.progress,
      completedAt: toSerializableDate(teamChore.completedAt),
      createdAt: toSerializableDate(teamChore.createdAt),
    })),
  };
};

export const saveChild = async (params: {
  familyId: string;
  childId?: string;
  name: string;
  pin: string;
  avatar: string;
}) => {
  if (!db) throw new Error('Database not initialized');

  if (params.childId) {
    await db
      .update(children)
      .set({ name: params.name, pin: params.pin, avatar: params.avatar })
      .where(and(eq(children.id, params.childId), eq(children.familyId, params.familyId)));
    await CacheInvalidation.invalidateFamilyData(params.familyId);
    return params.childId;
  }

  const [child] = await db
    .insert(children)
    .values({
      familyId: params.familyId,
      name: params.name,
      pin: params.pin,
      avatar: params.avatar,
    })
    .returning({ id: children.id });

  await CacheInvalidation.invalidateFamilyData(params.familyId);
  return child.id;
};

export const removeChild = async (familyId: string, childId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(choreAssignments).where(eq(choreAssignments.childId, childId));
  await db.delete(rewardAssignments).where(eq(rewardAssignments.childId, childId));
  await db.delete(pendingRewards).where(eq(pendingRewards.childId, childId));
  await db
    .update(chores)
    .set({
      status: 'available',
      submittedByChildId: null,
      submittedAt: null,
      emotion: null,
      photoUrl: null,
    })
    .where(and(eq(chores.familyId, familyId), eq(chores.submittedByChildId, childId)));
  await db.delete(children).where(and(eq(children.id, childId), eq(children.familyId, familyId)));
};

export const saveChore = async (params: {
  familyId: string;
  choreId?: string;
  name: string;
  points: number;
  assignedTo: string[];
  status?: typeof chores.$inferInsert['status'];
  submittedBy?: string | null;
  submittedAt?: Date | null;
  emotion?: string | null;
  photoUrl?: string | null;
  recurrenceType?: 'none' | 'daily' | 'weekly' | 'custom';
  recurrenceDays?: string | null;
}) => {
  if (!db) throw new Error('Database not initialized');

  const assignedTo = Array.from(new Set(params.assignedTo));

  if (params.choreId) {
    // Handle recurring chores update
    const recurrenceType = params.recurrenceType ?? 'none';
    const isTemplate = recurrenceType !== 'none' ? 1 : 0;

    // Calculate next due date for recurring chores
    let nextDueDate: Date | null = null;
    if (isTemplate) {
      const now = new Date();
      if (recurrenceType === 'daily') {
        nextDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
      } else if (recurrenceType === 'weekly') {
        // Use the first selected day of the week
        const recurrenceDays = params.recurrenceDays ? JSON.parse(params.recurrenceDays) : ['monday'];
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetDays = recurrenceDays.map((day: string) => dayNames.indexOf(day.toLowerCase())).filter((day: number) => day >= 0);

        if (targetDays.length > 0) {
          const currentDay = now.getDay();
          const nextDay = targetDays.find((day: number) => day > currentDay) ?? targetDays[0];
          const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
          nextDueDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        }
      }
    }

    // Use raw SQL to avoid Drizzle schema issues
    await db.execute(sql`
      UPDATE chores
      SET name = ${params.name},
          points = ${params.points},
          status = ${params.status ?? 'available'},
          submitted_by_child_id = ${params.submittedBy ?? null},
          submitted_at = ${params.submittedAt ?? null},
          emotion = ${params.emotion ?? null},
          photo_url = ${params.photoUrl ?? null},
          recurrence_type = ${recurrenceType},
          recurrence_days = ${params.recurrenceDays ?? null},
          is_template = ${isTemplate},
          next_due_date = ${nextDueDate}
      WHERE id = ${params.choreId} AND family_id = ${params.familyId}
    `);

    await db.delete(choreAssignments).where(eq(choreAssignments.choreId, params.choreId));
    if (assignedTo.length > 0) {
      await db.insert(choreAssignments).values(
        assignedTo.map((childId) => ({ choreId: params.choreId!, childId }))
      );
    }
    return params.choreId;
  }

  // Handle recurring chores
  const recurrenceType = params.recurrenceType ?? 'none';
  const isTemplate = recurrenceType !== 'none' ? 1 : 0;

  // Calculate next due date for recurring chores
  let nextDueDate: Date | null = null;
  if (isTemplate) {
    const now = new Date();
    if (recurrenceType === 'daily') {
      nextDueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    } else if (recurrenceType === 'weekly') {
      // Use the first selected day of the week
      const recurrenceDays = params.recurrenceDays ? JSON.parse(params.recurrenceDays) : ['monday'];
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const targetDays = recurrenceDays.map((day: string) => dayNames.indexOf(day.toLowerCase())).filter((day: number) => day >= 0);

      if (targetDays.length > 0) {
        const currentDay = now.getDay();
        const nextDay = targetDays.find((day: number) => day > currentDay) ?? targetDays[0];
        const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
        nextDueDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
      }
    }
  }

  const insertPayload: any = {
    familyId: params.familyId,
    name: params.name,
    points: params.points,
    status: params.status ?? 'available',
    submittedByChildId: params.submittedBy ?? null,
    submittedAt: params.submittedAt ?? null,
    emotion: params.emotion ?? null,
    photoUrl: params.photoUrl ?? null,
    // Recurrence fields
    recurrenceType,
    recurrenceDays: params.recurrenceDays ?? null,
    isTemplate,
    nextDueDate,
  };

  // Use raw SQL to avoid Drizzle schema issues with missing columns
  const result = await db.execute(sql`
    INSERT INTO chores (family_id, name, points, status, submitted_by_child_id, submitted_at, emotion, photo_url, created_at, recurrence_type, recurrence_days, is_template, next_due_date)
    VALUES (${params.familyId}, ${params.name}, ${params.points}, ${params.status ?? 'available'}, ${params.submittedBy ?? null}, ${params.submittedAt ?? null}, ${params.emotion ?? null}, ${params.photoUrl ?? null}, ${new Date()}, ${recurrenceType}, ${params.recurrenceDays ?? null}, ${isTemplate}, ${nextDueDate})
    RETURNING id
  `);
  const chore = { id: (result as any).rows[0].id };

  if (assignedTo.length > 0) {
    await db.insert(choreAssignments).values(
      assignedTo.map((childId) => ({ choreId: chore.id, childId }))
    );
  }

  return chore.id;
};

export const removeChore = async (familyId: string, choreId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(choreAssignments).where(eq(choreAssignments.choreId, choreId));
  await db.delete(chores).where(and(eq(chores.id, choreId), eq(chores.familyId, familyId)));
};

export const saveReward = async (params: {
  familyId: string;
  rewardId?: string;
  name: string;
  points: number;
  type: typeof rewards.$inferInsert['type'];
  assignedTo: string[];
}) => {
  if (!db) throw new Error('Database not initialized');

  const assignedTo = Array.from(new Set(params.assignedTo));

  if (params.rewardId) {
    const updatePayload: Partial<typeof rewards.$inferInsert> = {
      name: params.name,
      points: params.points,
      type: params.type,
    };
    await db
      .update(rewards)
      .set(updatePayload)
      .where(and(eq(rewards.id, params.rewardId), eq(rewards.familyId, params.familyId)));

    await db.delete(rewardAssignments).where(eq(rewardAssignments.rewardId, params.rewardId));
    if (assignedTo.length > 0) {
      await db.insert(rewardAssignments).values(
        assignedTo.map((childId) => ({ rewardId: params.rewardId!, childId }))
      );
    }
    return params.rewardId;
  }

  const insertPayload: typeof rewards.$inferInsert = {
    familyId: params.familyId,
    name: params.name,
    points: params.points,
    type: params.type,
  };

  const [reward] = await db
    .insert(rewards)
    .values(insertPayload)
    .returning({ id: rewards.id });

  if (assignedTo.length > 0) {
    await db.insert(rewardAssignments).values(
      assignedTo.map((childId) => ({ rewardId: reward.id, childId }))
    );
  }

  return reward.id;
};

export const removeReward = async (familyId: string, rewardId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(rewardAssignments).where(eq(rewardAssignments.rewardId, rewardId));
  await db.delete(pendingRewards).where(eq(pendingRewards.rewardId, rewardId));
  await db.delete(rewards).where(and(eq(rewards.id, rewardId), eq(rewards.familyId, familyId)));
};

export const recordPendingReward = async (params: {
  familyId: string;
  childId: string;
  rewardId: string;
  points: number;
}) => {
  if (!db) throw new Error('Database not initialized');

  const [record] = await db
    .insert(pendingRewards)
    .values({
      familyId: params.familyId,
      childId: params.childId,
      rewardId: params.rewardId,
      points: params.points,
    })
    .returning({ id: pendingRewards.id });
  return record.id;
};

export const recordPointsTransaction = async (params: {
  familyId: string;
  childId: string;
  type: 'earned' | 'spent' | 'refunded' | 'bonus' | 'penalty';
  amount: number;
  description: string;
  relatedChoreId?: string;
  relatedRewardId?: string;
  balanceBefore: number;
  balanceAfter: number;
}) => {
  if (!db) throw new Error('Database not initialized');

  const [record] = await db
    .insert(pointsTransactions)
    .values({
      familyId: params.familyId,
      childId: params.childId,
      type: params.type,
      amount: params.amount,
      description: params.description,
      relatedChoreId: params.relatedChoreId || null,
      relatedRewardId: params.relatedRewardId || null,
      balanceBefore: params.balanceBefore,
      balanceAfter: params.balanceAfter,
    })
    .returning({ id: pointsTransactions.id });
  return record.id;
};

export const getPointsTransactionHistory = async (familyId: string, childId?: string, limit = 50) => {
  if (!db) throw new Error('Database not initialized');

  const query = db.query.pointsTransactions.findMany({
    where: and(
      eq(pointsTransactions.familyId, familyId),
      childId ? eq(pointsTransactions.childId, childId) : undefined
    ),
    with: {
      child: {
        columns: {
          name: true,
        },
      },
      relatedChore: {
        columns: {
          name: true,
        },
      },
      relatedReward: {
        columns: {
          name: true,
        },
      },
    },
    orderBy: desc(pointsTransactions.createdAt),
    limit,
  });

  return query;
};

export const redeemReward = async (params: {
  familyId: string;
  childId: string;
  rewardId: string;
}) => {
  if (!db) throw new Error('Database not initialized');

  // Validate inputs
  if (!params.familyId || !params.childId || !params.rewardId) {
    throw new Error('INVALID_PARAMETERS');
  }

  // Get reward with family validation
  const reward = await db
    .query.rewards.findFirst({
      where: and(eq(rewards.id, params.rewardId), eq(rewards.familyId, params.familyId)),
    });

  if (!reward) {
    throw new Error('REWARD_NOT_FOUND');
  }

  // Get child and validate they belong to the family
  const child = await db.query.children.findFirst({
    where: and(eq(children.id, params.childId), eq(children.familyId, params.familyId))
  });

  if (!child) {
    throw new Error('CHILD_NOT_FOUND');
  }

  // CRITICAL: Validate sufficient points BEFORE any database operations
  if (child.points < reward.points) {
    console.warn(`[POINTS_VALIDATION] Child ${params.childId} attempted to redeem reward ${params.rewardId} but only has ${child.points} points, needs ${reward.points}`);
    throw new Error('INSUFFICIENT_POINTS');
  }

  // Prevent negative points (additional safety check)
  const newPointsBalance = child.points - reward.points;
  if (newPointsBalance < 0) {
    console.error(`[POINTS_SAFETY] Prevented negative balance for child ${params.childId}: ${child.points} - ${reward.points} = ${newPointsBalance}`);
    throw new Error('INSUFFICIENT_POINTS');
  }

  // Use transaction to ensure atomicity
  try {
    // Deduct points
    await db
      .update(children)
      .set({
        points: newPointsBalance,
        totalPointsEver: child.totalPointsEver // Keep total ever the same
      })
      .where(eq(children.id, child.id));

    // Record the points transaction
    await recordPointsTransaction({
      familyId: params.familyId,
      childId: params.childId,
      type: 'spent',
      amount: -reward.points, // Negative for spending
      description: `Ingewisseld voor "${reward.name}"`,
      relatedRewardId: params.rewardId,
      balanceBefore: child.points,
      balanceAfter: newPointsBalance,
    });

    // Record the pending reward
    await recordPendingReward({
      familyId: params.familyId,
      childId: params.childId,
      rewardId: params.rewardId,
      points: reward.points,
    });

    console.log(`[POINTS_TRANSACTION] Child ${params.childId} redeemed reward ${params.rewardId} for ${reward.points} points. Balance: ${child.points} → ${newPointsBalance}`);

    return { reward, child: { ...child, points: newPointsBalance } };
  } catch (error) {
    console.error('[POINTS_TRANSACTION_ERROR] Failed to complete reward redemption:', error);
    throw new Error('REDEMPTION_FAILED');
  }
};

export const submitChoreForApproval = async (params: {
  familyId: string;
  choreId: string;
  childId: string;
  emotion?: string | null;
  photoUrl?: string | null;
  submittedAt?: Date;
}) => {
  if (!db) throw new Error('Database not initialized');

  // First check if the chore exists in the database using raw SQL
  // Handle both UUID and string IDs (for sample quest chores)
  let existingChoreResult;
  try {
    existingChoreResult = await db.execute(sql`
      SELECT id, family_id, name, points, status FROM chores
      WHERE id = ${params.choreId} AND family_id = ${params.familyId}
    `);
  } catch (error) {
    // If the query fails (likely due to UUID validation), assume it's a sample quest chore
    existingChoreResult = { rows: [] };
  }

  if (existingChoreResult.rows.length > 0) {
    // Update existing chore to submitted (pending approval)
    await db.execute(sql`
      UPDATE chores SET
        status = 'submitted',
        submitted_by_child_id = ${params.childId},
        submitted_at = ${params.submittedAt ?? new Date()},
        emotion = ${params.emotion ?? null},
        photo_url = ${params.photoUrl ?? null}
      WHERE id = ${params.choreId} AND family_id = ${params.familyId}
    `);
  } else {
    // Check if this is a sample quest chore that needs to be created
    // Import the sample chores dynamically to avoid circular dependencies
    const { QUEST_CHAIN_CHORES } = await import('@/lib/quest-utils');
    const allQuestChores = Object.values(QUEST_CHAIN_CHORES).flat();
    const sampleChore = allQuestChores.find(c => c.id === params.choreId);

    if (sampleChore) {
      // Create a new chore record as submitted (pending approval)
      // Use raw SQL to avoid UUID validation issues
      await db.execute(sql`
        INSERT INTO chores (
          family_id, name, points, status, submitted_by_child_id,
          submitted_at, emotion, photo_url, created_at
        ) VALUES (
          ${params.familyId}, ${sampleChore.name},
          ${sampleChore.points}, 'submitted', ${params.childId},
          ${params.submittedAt ?? new Date()}, ${params.emotion ?? null},
          ${params.photoUrl ?? null}, ${new Date()}
        )
      `);
    } else {
      throw new Error('Chore not found');
    }
  }
};

export const approveChore = async (familyId: string, choreId: string) => {
  if (!db) throw new Error('Database not initialized');

  // Get chore using raw SQL
  const choreResult = await db.execute(sql`
    SELECT id, family_id, name, points, status, submitted_by_child_id, submitted_at, emotion, photo_url, created_at
    FROM chores
    WHERE id = ${choreId} AND family_id = ${familyId}
  `);

  if (choreResult.rows.length === 0) {
    throw new Error('CHORE_NOT_FOUND');
  }

  const chore = choreResult.rows[0];

  if (!chore.submitted_by_child_id) {
    throw new Error('CHORE_NOT_SUBMITTED');
  }

  // Update chore status
  await db.execute(sql`
    UPDATE chores SET status = 'approved' WHERE id = ${choreId}
  `);

  // Award points and XP (XP is now automatically calculated in updateChildPoints)
  await updateChildPoints(chore.submitted_by_child_id as string, Number(chore.points), `Klus "${chore.name}" goedgekeurd`, choreId);

  // Create family feed item
  try {
    // Get child name
    const childResult = await db.execute(sql`
      SELECT name FROM children WHERE id = ${chore.submitted_by_child_id}
    `);
    const childName = childResult.rows[0]?.name as string || 'Kind';

    await db.insert(familyFeed).values({
      familyId,
      childId: chore.submitted_by_child_id as string,
      type: 'chore_completed',
      message: `heeft "${chore.name}" voltooid! +${chore.points} punten 🎉`,
      data: JSON.stringify({
        choreId,
        choreName: chore.name,
        points: chore.points,
        emoji: '✅',
        childName,
      }),
      reactions: '[]',
    });
  } catch (feedError) {
    // Don't fail the approval if feed creation fails
    console.error('Error creating feed item:', feedError);
  }
};

export const rejectChore = async (familyId: string, choreId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.execute(sql`
    UPDATE chores SET
      status = 'available',
      submitted_by_child_id = NULL,
      submitted_at = NULL,
      emotion = NULL,
      photo_url = NULL
    WHERE id = ${choreId} AND family_id = ${familyId}
  `);
};

export const clearPendingReward = async (familyId: string, pendingRewardId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(pendingRewards).where(and(eq(pendingRewards.id, pendingRewardId), eq(pendingRewards.familyId, familyId)));
};

export const updateChildPoints = async (childId: string, delta: number, description?: string, relatedChoreId?: string) => {
  if (!db) throw new Error('Database not initialized');

  // Get current points and XP before update
  const [child] = await db
    .select({
      points: children.points,
      xp: children.xp,
      familyId: children.familyId
    })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);

  if (!child) {
    throw new Error('CHILD_NOT_FOUND');
  }

  const incrementTotalEver = Math.max(delta, 0);
  const newPointsBalance = child.points + delta;

  // Prevent negative points (additional safety)
  if (newPointsBalance < 0) {
    console.error(`[POINTS_SAFETY] Prevented negative balance for child ${childId}: ${child.points} + ${delta} = ${newPointsBalance}`);
    throw new Error('INSUFFICIENT_POINTS');
  }

  // Calculate XP reward using the new system (only for positive transactions)
  const xpReward = delta > 0 ? calculateXpReward(delta) : 0;
  const newXpBalance = child.xp + xpReward;
  const incrementXpTotalEver = Math.max(xpReward, 0);

  // Check for level up
  const levelUpInfo = checkLevelUp(child.xp, newXpBalance);

  // Update points and XP
  await db.execute(sql`
    UPDATE children
    SET points = points + ${delta},
        total_points_ever = total_points_ever + ${incrementTotalEver},
        xp = xp + ${xpReward},
        total_xp_ever = total_xp_ever + ${incrementXpTotalEver}
    WHERE id = ${childId}
  `);

  // Record transaction if there's a description (meaningful transaction)
  if (description) {
    await recordPointsTransaction({
      familyId: child.familyId,
      childId,
      type: delta > 0 ? 'earned' : 'penalty',
      amount: delta,
      description: description,
      relatedChoreId: relatedChoreId || undefined,
      balanceBefore: child.points,
      balanceAfter: newPointsBalance,
    });

    // Log XP gain separately if earned
    if (xpReward > 0) {
      console.log(`[XP_REWARD] Child ${childId} earned ${xpReward} XP. Total XP: ${child.xp} → ${newXpBalance}`);
    }

    // Log level up if it occurred and create feed item
    if (levelUpInfo.leveledUp) {
      console.log(`[LEVEL_UP] Child ${childId} leveled up from ${levelUpInfo.oldLevel} to ${levelUpInfo.newLevel}! Unlocks: ${levelUpInfo.unlocks?.join(', ') || 'none'}`);

      // Create level-up feed item
      try {
        const childData = await db
          .select({ name: children.name })
          .from(children)
          .where(eq(children.id, childId))
          .limit(1);
        const childName = childData[0]?.name || 'Kind';

        await db.insert(familyFeed).values({
          familyId: child.familyId,
          childId,
          type: 'level_up',
          message: `is opgegaan naar level ${levelUpInfo.newLevel}! ${levelUpInfo.unlocks?.length ? `Nieuwe unlocks: ${levelUpInfo.unlocks.join(', ')}` : ''} ⭐`,
          data: JSON.stringify({
            oldLevel: levelUpInfo.oldLevel,
            newLevel: levelUpInfo.newLevel,
            unlocks: levelUpInfo.unlocks,
            emoji: '⬆️',
            childName,
          }),
          reactions: '[]',
        });
      } catch (feedError) {
        console.error('Error creating level-up feed item:', feedError);
      }
    }
  }
};

export const updateChildXp = async (childId: string, delta: number) => {
  if (!db) throw new Error('Database not initialized');

  const incrementTotalEver = Math.max(delta, 0);
  await db.execute(sql`
    UPDATE children
    SET xp = xp + ${delta},
        total_xp_ever = total_xp_ever + ${incrementTotalEver}
    WHERE id = ${childId}
  `);
};

export const updateFamilySubscription = async (params: {
  familyId: string;
  plan?: string | null;
  status?: string | null;
  interval?: string | null;
  renewalDate?: Date | null;
  lastPaymentAt?: Date | null;
  orderId?: string | null;
}) => {
  if (!db) throw new Error('Database not initialized');

  await db
    .update(families)
    .set({
      subscriptionPlan: params.plan as (typeof planTierEnum.enumValues)[number] | null,
      subscriptionStatus: params.status as (typeof subscriptionStatusEnum.enumValues)[number] | null,
      subscriptionInterval: params.interval as (typeof billingIntervalEnum.enumValues)[number] | null,
      subscriptionRenewalDate: params.renewalDate ?? null,
      subscriptionLastPaymentAt: params.lastPaymentAt ?? null,
      subscriptionOrderId: params.orderId ?? null,
    })
    .where(eq(families.id, params.familyId));
};

export const updateRecoveryEmail = async (familyId: string, recoveryEmail: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.update(families).set({ recoveryEmail }).where(eq(families.id, familyId));
};

export const getGoodCausesList = async () => {
  if (!db) throw new Error('Database not initialized');

  const causes = await db.select().from(goodCauses);
  return causes.map((cause) => ({
    id: cause.id,
    name: cause.name,
    description: cause.description,
    startDate: toSerializableDate(cause.startDate),
    endDate: toSerializableDate(cause.endDate),
    logoUrl: cause.logoUrl ?? null,
    createdAt: toSerializableDate(cause.createdAt),
    updatedAt: toSerializableDate(cause.updatedAt),
  }));
};

export const upsertGoodCause = async (params: {
  causeId?: string;
  name: string;
  description: string;
  startDate: Date;
  endDate: Date;
  logoUrl?: string | null;
}) => {
  if (!db) throw new Error('Database not initialized');

  if (params.causeId) {
    await db
      .update(goodCauses)
      .set({
        name: params.name,
        description: params.description,
        startDate: params.startDate,
        endDate: params.endDate,
        logoUrl: params.logoUrl ?? null,
        updatedAt: new Date(),
      })
      .where(eq(goodCauses.id, params.causeId));
    return params.causeId;
  }

  const [cause] = await db
    .insert(goodCauses)
    .values({
      name: params.name,
      description: params.description,
      startDate: params.startDate,
      endDate: params.endDate,
      logoUrl: params.logoUrl ?? null,
    })
    .returning({ id: goodCauses.id });

  return cause.id;
};

export const removeGoodCause = async (causeId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(goodCauses).where(eq(goodCauses.id, causeId));
};

export const listBlogPosts = async () => {
  if (!db) throw new Error('Database not initialized');

  const posts = await db
    .select()
    .from(blogPosts)
    .orderBy(blogPosts.createdAt);
  return posts.map((post) => ({
    id: post.id,
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt,
    content: post.content,
    coverImageUrl: post.coverImageUrl ?? null,
    tags: post.tags ?? [],
    status: post.status,
    seoTitle: post.seoTitle ?? null,
    seoDescription: post.seoDescription ?? null,
    createdAt: toSerializableDate(post.createdAt),
    updatedAt: toSerializableDate(post.updatedAt),
    publishedAt: toSerializableDate(post.publishedAt),
  }));
};

export const upsertBlogPost = async (params: {
  postId?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  status: typeof blogPosts.$inferInsert['status'];
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Date | null;
}) => {
  if (!db) throw new Error('Database not initialized');

  const payload: typeof blogPosts.$inferInsert = {
    title: params.title,
    slug: params.slug,
    excerpt: params.excerpt,
    content: params.content,
    coverImageUrl: params.coverImageUrl ?? null,
    tags: params.tags,
    status: params.status,
    seoTitle: params.seoTitle ?? null,
    seoDescription: params.seoDescription ?? null,
    publishedAt: params.publishedAt ?? null,
    updatedAt: new Date(),
    createdAt: params.postId ? undefined : new Date(),
  };

  if (params.postId) {
    const { createdAt, ...updatePayload } = payload;
    await db.update(blogPosts).set(updatePayload).where(eq(blogPosts.id, params.postId));
    return params.postId;
  }

  const [post] = await db
    .insert(blogPosts)
    .values(payload)
    .returning({ id: blogPosts.id });

  return post.id;
};

export const removeBlogPost = async (postId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(blogPosts).where(eq(blogPosts.id, postId));
};

export const listReviews = async () => {
  if (!db) throw new Error('Database not initialized');

  const items = await db
    .select()
    .from(reviews)
    .orderBy(reviews.createdAt);
  return items.map((review) => ({
    id: review.id,
    title: review.title,
    slug: review.slug,
    excerpt: review.excerpt,
    content: review.content,
    rating: review.rating,
    author: review.author,
    status: review.status,
    seoTitle: review.seoTitle ?? null,
    seoDescription: review.seoDescription ?? null,
    createdAt: toSerializableDate(review.createdAt),
    updatedAt: toSerializableDate(review.updatedAt),
    publishedAt: toSerializableDate(review.publishedAt),
  }));
};

export const upsertReview = async (params: {
  reviewId?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  rating: number;
  author: string;
  status: typeof reviews.$inferInsert['status'];
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Date | null;
}) => {
  if (!db) throw new Error('Database not initialized');

  const payload: typeof reviews.$inferInsert = {
    title: params.title,
    slug: params.slug,
    excerpt: params.excerpt,
    content: params.content,
    rating: params.rating,
    author: params.author,
    status: params.status,
    seoTitle: params.seoTitle ?? null,
    seoDescription: params.seoDescription ?? null,
    publishedAt: params.publishedAt ?? null,
    updatedAt: new Date(),
    createdAt: params.reviewId ? undefined : new Date(),
  };

  if (params.reviewId) {
    const { createdAt, ...updatePayload } = payload;
    await db.update(reviews).set(updatePayload).where(eq(reviews.id, params.reviewId));
    return params.reviewId;
  }

  const [review] = await db
    .insert(reviews)
    .values(payload)
    .returning({ id: reviews.id });

  return review.id;
};

export const removeReview = async (reviewId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(reviews).where(eq(reviews.id, reviewId));
};

export const getAdminStatsSummary = async () => {
  if (!db) throw new Error('Database not initialized');

  const [{ totalFamilies }] = await db
    .select({ totalFamilies: sql<number>`coalesce(count(*), 0)` })
    .from(families);

  const [{ totalChildren, totalPointsEver }] = await db
    .select({
      totalChildren: sql<number>`coalesce(count(*), 0)` ,
      totalPointsEver: sql<number>`coalesce(sum(total_points_ever), 0)`,
    })
    .from(children);

  const [{ totalDonationPoints }] = await db
    .select({
      totalDonationPoints: sql<number>`coalesce(sum(case when ${rewards.type} = 'donation' then ${pendingRewards.points} else 0 end), 0)`,
    })
    .from(pendingRewards)
    .leftJoin(rewards, eq(pendingRewards.rewardId, rewards.id));

  return {
    totalFamilies: Number(totalFamilies) || 0,
    totalChildren: Number(totalChildren) || 0,
    totalPointsEver: Number(totalPointsEver) || 0,
    totalDonationPoints: Number(totalDonationPoints) || 0,
  };
};

type FamilySummaryRecord = {
  id: string;
  familyName: string;
  city: string;
  email: string;
  familyCode: string;
  createdAt: Date | null;
  childrenCount: number;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionInterval: string | null;
};

export const listFamiliesForAdmin = async (): Promise<FamilySummaryRecord[]> => {
  if (!db) throw new Error('Database not initialized');

  // Use a more efficient query that gets children count via SQL aggregation
  const records = await db
    .select({
      id: families.id,
      familyName: families.familyName,
      city: families.city,
      email: families.email,
      familyCode: families.familyCode,
      createdAt: families.createdAt,
      subscriptionStatus: families.subscriptionStatus,
      subscriptionPlan: families.subscriptionPlan,
      subscriptionInterval: families.subscriptionInterval,
      childrenCount: sql<number>`coalesce(count(${children.id}), 0)`,
    })
    .from(families)
    .leftJoin(children, eq(families.id, children.familyId))
    .groupBy(
      families.id,
      families.familyName,
      families.city,
      families.email,
      families.familyCode,
      families.createdAt,
      families.subscriptionStatus,
      families.subscriptionPlan,
      families.subscriptionInterval
    )
    .orderBy(desc(families.createdAt));

  return records.map((record) => ({
    id: record.id,
    familyName: record.familyName,
    city: record.city,
    email: record.email,
    familyCode: record.familyCode,
    createdAt: record.createdAt,
    childrenCount: Number(record.childrenCount) || 0,
    subscriptionStatus: record.subscriptionStatus ?? null,
    subscriptionPlan: record.subscriptionPlan ?? null,
    subscriptionInterval: record.subscriptionInterval ?? null,
  }));
};

export const createFamilyAdmin = async (params: {
  familyName: string;
  city: string;
  email: string;
  password: string;
  familyCode?: string;
}) => {
  if (!db) throw new Error('Database not initialized');

  const existing = await getFamilyByEmail(params.email);
  if (existing) {
    throw new Error('EMAIL_IN_USE');
  }

  const code = params.familyCode
    ? params.familyCode.toUpperCase()
    : await generateUniqueFamilyCode();

  const passwordHash = await hashPassword(params.password);

  const [family] = await db
    .insert(families)
    .values({
      familyName: params.familyName,
      city: params.city,
      email: params.email,
      passwordHash,
      familyCode: code,
    })
    .returning({ id: families.id, familyCode: families.familyCode });

  return family;
};

export const updateFamilyAdmin = async (params: {
  familyId: string;
  familyName?: string;
  city?: string;
  email?: string;
  familyCode?: string;
}) => {
  if (!db) throw new Error('Database not initialized');

  if (!params.familyId) {
    throw new Error('FAMILY_ID_REQUIRED');
  }

  const payload: Partial<typeof families.$inferInsert> = {};

  if (params.familyName !== undefined) payload.familyName = params.familyName;
  if (params.city !== undefined) payload.city = params.city;
  if (params.email !== undefined) payload.email = params.email;
  if (params.familyCode !== undefined) payload.familyCode = params.familyCode.toUpperCase();

  if (Object.keys(payload).length === 0) {
    return;
  }

  await db
    .update(families)
    .set(payload)
    .where(eq(families.id, params.familyId));
};

export const setFamilyPassword = async (familyId: string, password: string) => {
  if (!db) throw new Error('Database not initialized');

  const passwordHash = await hashPassword(password);
  await db
    .update(families)
    .set({ passwordHash })
    .where(eq(families.id, familyId));
};

export const deleteFamilyAdmin = async (familyId: string) => {
  if (!db) throw new Error('Database not initialized');

  await db.delete(families).where(eq(families.id, familyId));
};

export const getFinancialOverview = async () => {
  if (!db) throw new Error('Database not initialized');

  // Get aggregated stats using SQL for better performance
  const [statsResult] = await db
    .select({
      totalRevenue: sql<number>`
        coalesce(sum(
          case
            when subscription_status = 'active' and subscription_interval = 'yearly' then ${PLAN_PRICING.yearly}
            when subscription_status = 'active' and subscription_interval = 'monthly' then ${PLAN_PRICING.monthly}
            else 0
          end
        ), 0) / 100.0
      `,
      activeSubscriptions: sql<number>`count(case when subscription_status = 'active' then 1 end)`,
    })
    .from(families);

  // Get recent premium subscriptions (limit to 10 for performance)
  const recentSubscriptions = await db.query.families.findMany({
    where: eq(families.subscriptionStatus, 'active'),
    columns: {
      id: true,
      familyName: true,
      email: true,
      subscriptionPlan: true,
      subscriptionInterval: true,
      subscriptionLastPaymentAt: true,
      createdAt: true,
      subscriptionStatus: true,
    },
    orderBy: desc(families.subscriptionLastPaymentAt ?? families.createdAt),
    limit: 10,
  });

  const formattedRecentSubscriptions = recentSubscriptions.map((family) => ({
    id: family.id,
    familyName: family.familyName,
    email: family.email,
    plan: family.subscriptionPlan ?? 'premium',
    amount: family.subscriptionInterval === 'yearly' ? PLAN_PRICING.yearly : PLAN_PRICING.monthly,
    interval: family.subscriptionInterval ?? 'monthly',
    createdAt: family.subscriptionLastPaymentAt ?? family.createdAt ?? new Date(),
    status: family.subscriptionStatus ?? 'inactive',
  }));

  const totalRevenue = Number(statsResult.totalRevenue) || 0;
  const activeSubscriptions = Number(statsResult.activeSubscriptions) || 0;

  return {
    stats: {
      totalRevenue,
      activeSubscriptions,
      monthlyGrowth: 0, // TODO: Implement monthly growth calculation
      avgSubscriptionValue: activeSubscriptions > 0 ? totalRevenue / activeSubscriptions : 0,
    },
    recentSubscriptions: formattedRecentSubscriptions,
  };
};

// ===== EMAIL VERIFICATION FUNCTIONS =====

/**
 * Generate a 6-digit verification code
 */
export const generateVerificationCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Create and store a verification code
 */
export const createVerificationCode = async (params: {
  email: string;
  purpose: 'registration' | 'password_reset';
  expiresInMinutes?: number;
}): Promise<string> => {
  if (!db) throw new Error('Database not initialized');

  const { email, purpose, expiresInMinutes = 15 } = params;
  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  try {
    // Clean up expired codes for this email/purpose combination
    await db
      .delete(verificationCodes)
      .where(and(
        eq(verificationCodes.email, email),
        eq(verificationCodes.purpose, purpose),
        lte(verificationCodes.expiresAt, new Date())
      ));

    // Insert new verification code
    await db.insert(verificationCodes).values({
      email,
      code,
      purpose,
      expiresAt,
    });

    return code;
  } catch (error: any) {
    // If table doesn't exist, create it and retry
    if (error.message?.includes('relation "verification_codes" does not exist')) {
      console.log('Creating verification_codes table...');
      await db.execute(sql`
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
      `);

      // Retry the operation
      await db
        .delete(verificationCodes)
        .where(and(
          eq(verificationCodes.email, email),
          eq(verificationCodes.purpose, purpose),
          lte(verificationCodes.expiresAt, new Date())
        ));

      await db.insert(verificationCodes).values({
        email,
        code,
        purpose,
        expiresAt,
      });

      return code;
    }
    throw error;
  }
};

/**
 * Verify a code and mark it as used
 */
export const verifyCode = async (params: {
  email: string;
  code: string;
  purpose: 'registration' | 'password_reset';
}): Promise<boolean> => {
  if (!db) throw new Error('Database not initialized');

  const { email, code, purpose } = params;

  const verificationRecord = await db.query.verificationCodes.findFirst({
    where: and(
      eq(verificationCodes.email, email),
      eq(verificationCodes.code, code),
      eq(verificationCodes.purpose, purpose),
      gte(verificationCodes.expiresAt, new Date()),
      isNull(verificationCodes.usedAt)
    ),
  });

  if (!verificationRecord) {
    return false;
  }

  // Mark code as used
  await db
    .update(verificationCodes)
    .set({ usedAt: new Date() })
    .where(eq(verificationCodes.id, verificationRecord.id));

  return true;
};

/**
 * Clean up expired verification codes (can be called periodically)
 */
export const cleanupExpiredVerificationCodes = async (): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db
    .delete(verificationCodes)
    .where(lte(verificationCodes.expiresAt, new Date()));
};

// ===== PENALTY SYSTEM FUNCTIONS =====

/**
 * Get penalty configuration for a family
 */
export const getPenaltyConfiguration = async (familyId: string): Promise<PenaltyConfig> => {
  if (!db) throw new Error('Database not initialized');

  const config = await db.query.penaltyConfigurations.findFirst({
    where: eq(penaltyConfigurations.familyId, familyId),
  });

  if (!config) {
    // Return default configuration
    return DEFAULT_PENALTY_CONFIG;
  }

  try {
    return {
      ...DEFAULT_PENALTY_CONFIG,
      rules: JSON.parse(config.rules),
      globalSettings: {
        maxPenaltyPercent: config.maxPenaltyPercent,
        penaltyTimeoutHours: config.penaltyTimeoutHours,
        allowAppeals: config.allowAppeals === 1,
      },
    };
  } catch (error) {
    console.error('Error parsing penalty configuration:', error);
    return DEFAULT_PENALTY_CONFIG;
  }
};

/**
 * Update penalty configuration for a family
 */
export const updatePenaltyConfiguration = async (
  familyId: string,
  penaltyConfig: PenaltyConfig
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const existing = await db.query.penaltyConfigurations.findFirst({
    where: eq(penaltyConfigurations.familyId, familyId),
  });

  const configData = {
    rules: JSON.stringify(penaltyConfig.rules),
    maxPenaltyPercent: penaltyConfig.globalSettings.maxPenaltyPercent,
    penaltyTimeoutHours: penaltyConfig.globalSettings.penaltyTimeoutHours,
    allowAppeals: penaltyConfig.globalSettings.allowAppeals ? 1 : 0,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(penaltyConfigurations)
      .set(configData)
      .where(eq(penaltyConfigurations.id, existing.id));
  } else {
    await db.insert(penaltyConfigurations).values({
      familyId,
      ...configData,
    });
  }
};

/**
 * Apply a penalty to a chore
 */
export const applyPenalty = async (params: {
  familyId: string;
  childId: string;
  choreId: string;
  penaltyType: string;
  originalPoints: number;
  penaltyPoints: number;
  recoveryOption?: string;
  notes?: string;
}): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  await db.insert(appliedPenalties).values({
    familyId: params.familyId,
    childId: params.childId,
    choreId: params.choreId,
    penaltyType: params.penaltyType,
    originalPoints: params.originalPoints,
    penaltyPoints: params.penaltyPoints,
    recoveryOption: params.recoveryOption,
    notes: params.notes,
  });
};

/**
 * Get applied penalties for a family
 */
export const getAppliedPenalties = async (familyId: string) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.appliedPenalties.findMany({
    where: eq(appliedPenalties.familyId, familyId),
    orderBy: desc(appliedPenalties.appliedAt),
  });
};

// ===== ECONOMIC SYSTEM FUNCTIONS =====

/**
 * Get economic configuration for a family
 */
export const getEconomicConfiguration = async (familyId: string): Promise<EconomicConfig> => {
  if (!db) throw new Error('Database not initialized');

  const config = await db.query.economicConfigurations.findFirst({
    where: eq(economicConfigurations.familyId, familyId),
  });

  if (!config) {
    // Return default configuration
    return DEFAULT_ECONOMIC_CONFIG;
  }

  try {
    return {
      ...DEFAULT_ECONOMIC_CONFIG,
      dynamicPricing: {
        inflationThreshold: config.inflationThreshold,
        maxInflationCorrection: config.maxInflationCorrection / 100, // Convert back to decimal
        correctionStep: config.correctionStep / 100, // Convert back to decimal
        stabilizationPeriodDays: config.stabilizationPeriodDays,
      },
      pointSinks: JSON.parse(config.pointSinks),
      externalChoreRates: {
        euroToPoints: config.euroToPoints,
        pointsToEuro: config.pointsToEuro,
      },
    };
  } catch (error) {
    console.error('Error parsing economic configuration:', error);
    return DEFAULT_ECONOMIC_CONFIG;
  }
};

/**
 * Update economic configuration for a family
 */
export const updateEconomicConfiguration = async (
  familyId: string,
  economicConfig: EconomicConfig
): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  const existing = await db.query.economicConfigurations.findFirst({
    where: eq(economicConfigurations.familyId, familyId),
  });

  const configData = {
    inflationThreshold: economicConfig.dynamicPricing.inflationThreshold,
    maxInflationCorrection: Math.round(economicConfig.dynamicPricing.maxInflationCorrection * 100),
    correctionStep: Math.round(economicConfig.dynamicPricing.correctionStep * 100),
    stabilizationPeriodDays: economicConfig.dynamicPricing.stabilizationPeriodDays,
    pointSinks: JSON.stringify(economicConfig.pointSinks),
    euroToPoints: economicConfig.externalChoreRates.euroToPoints,
    pointsToEuro: economicConfig.externalChoreRates.pointsToEuro,
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(economicConfigurations)
      .set(configData)
      .where(eq(economicConfigurations.id, existing.id));
  } else {
    await db.insert(economicConfigurations).values({
      familyId,
      ...configData,
    });
  }
};

/**
 * Record economic metrics for monitoring
 */
export const recordEconomicMetrics = async (params: {
  familyId: string;
  weekStart: Date;
  weekEnd: Date;
  averagePointsBalance: number;
  totalPointsInCirculation: number;
  pointsEarnedThisWeek: number;
  pointsSpentThisWeek: number;
  inflationRate: number;
  rewardRedemptionRate: number;
}): Promise<void> => {
  if (!db) throw new Error('Database not initialized');

  // Convert Date objects to ISO date strings for Drizzle's date() type
  const formatDate = (d: Date) => d.toISOString().split('T')[0];

  await db.insert(economicMetrics).values({
    familyId: params.familyId,
    weekStart: formatDate(params.weekStart),
    weekEnd: formatDate(params.weekEnd),
    averagePointsBalance: params.averagePointsBalance,
    totalPointsInCirculation: params.totalPointsInCirculation,
    pointsEarnedThisWeek: params.pointsEarnedThisWeek,
    pointsSpentThisWeek: params.pointsSpentThisWeek,
    inflationRate: Math.round(params.inflationRate * 100), // Store as percentage * 100
    rewardRedemptionRate: Math.round(params.rewardRedemptionRate * 100),
  });
};

/**
 * Get economic metrics history for a family
 */
export const getEconomicMetricsHistory = async (familyId: string, limit = 12) => {
  if (!db) throw new Error('Database not initialized');

  return db.query.economicMetrics.findMany({
    where: eq(economicMetrics.familyId, familyId),
    orderBy: desc(economicMetrics.weekStart),
    limit,
  });
};
