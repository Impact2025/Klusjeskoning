import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
  date,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const planTierEnum = pgEnum('plan_tier', ['starter', 'premium']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['inactive', 'active', 'past_due', 'canceled']);
export const billingIntervalEnum = pgEnum('billing_interval', ['monthly', 'yearly']);
export const choreStatusEnum = pgEnum('chore_status', ['available', 'submitted', 'approved']);
export const rewardTypeEnum = pgEnum('reward_type', ['privilege', 'experience', 'donation', 'money']);
export const rewardCategoryEnum = pgEnum('reward_category', ['privileges', 'experience', 'financial']);
export const redemptionStatusEnum = pgEnum('redemption_status', ['pending', 'approved', 'completed', 'cancelled']);
export const publishStatusEnum = pgEnum('publish_status', ['draft', 'published']);
export const rankingTypeEnum = pgEnum('ranking_type', ['family', 'friends', 'powerklusjes']);
export const rankingTierEnum = pgEnum('ranking_tier', ['diamond', 'gold', 'silver', 'bronze']);
export const rankingCategoryEnum = pgEnum('ranking_category', ['xp', 'chores', 'powerpoints', 'streak', 'pet_care']);

export const families = pgTable('families', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyCode: varchar('family_code', { length: 16 }).notNull().unique(),
  familyName: varchar('family_name', { length: 255 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  recoveryEmail: varchar('recovery_email', { length: 255 }),
  subscriptionPlan: planTierEnum('subscription_plan'),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('inactive'),
  subscriptionInterval: billingIntervalEnum('subscription_interval'),
  subscriptionRenewalDate: timestamp('subscription_renewal_date', { withTimezone: true }),
  subscriptionLastPaymentAt: timestamp('subscription_last_payment_at', { withTimezone: true }),
  subscriptionOrderId: varchar('subscription_order_id', { length: 255 }),
});

export const children = pgTable('children', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 120 }).notNull(),
  pin: varchar('pin', { length: 32 }).notNull(),
  points: integer('points').notNull().default(0),
  totalPointsEver: integer('total_points_ever').notNull().default(0),
  xp: integer('xp').notNull().default(0),
  totalXpEver: integer('total_xp_ever').notNull().default(0),
  avatar: varchar('avatar', { length: 255 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const recurrenceTypeEnum = pgEnum('recurrence_type', ['none', 'daily', 'weekly', 'custom']);
export const payoutDayEnum = pgEnum('payout_day', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

export const chores = pgTable('chores', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  points: integer('points').notNull().default(0),
  xpReward: integer('xp_reward').notNull().default(0),
  status: choreStatusEnum('status').notNull().default('available'),
  submittedByChildId: uuid('submitted_by_child_id').references(() => children.id, {
    onDelete: 'set null',
  }),
  submittedAt: timestamp('submitted_at', { withTimezone: true }),
  emotion: varchar('emotion', { length: 255 }),
  photoUrl: text('photo_url'),
  questChainId: uuid('quest_chain_id'),
  isMainQuest: integer('is_main_quest').notNull().default(0), // 1 = true, 0 = false
  chainOrder: integer('chain_order'),
  // Recurrence fields
  recurrenceType: recurrenceTypeEnum('recurrence_type').notNull().default('none'),
  recurrenceDays: text('recurrence_days'), // JSON array of days for custom recurrence
  isTemplate: integer('is_template').notNull().default(0), // 1 = template for recurring chores, 0 = regular chore
  templateId: uuid('template_id'), // Reference to the original template chore
  nextDueDate: timestamp('next_due_date', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const choreAssignments = pgTable(
  'chore_assignments',
  {
    choreId: uuid('chore_id')
      .notNull()
      .references(() => chores.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.choreId, table.childId] }),
  })
);

export const choreAssignmentsRelations = relations(choreAssignments, ({ one }) => ({
  chore: one(chores, {
    fields: [choreAssignments.choreId],
    references: [chores.id],
  }),
  child: one(children, {
    fields: [choreAssignments.childId],
    references: [children.id],
  }),
}));

export const rewards = pgTable('rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  points: integer('points').notNull().default(0),
  type: rewardTypeEnum('type').notNull().default('privilege'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// New Rewards Catalog System
export const rewardTemplates = pgTable('reward_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: rewardCategoryEnum('category').notNull(),
  defaultPoints: integer('default_points').notNull(),
  minAge: integer('min_age').notNull().default(4),
  emoji: varchar('emoji', { length: 10 }),
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyRewards = pgTable('family_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  templateId: uuid('template_id').references(() => rewardTemplates.id, { onDelete: 'set null' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: rewardCategoryEnum('category').notNull(),
  points: integer('points').notNull(),
  minAge: integer('min_age').notNull().default(4),
  emoji: varchar('emoji', { length: 10 }),
  estimatedCost: integer('estimated_cost'), // in cents
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const rewardRedemptions = pgTable('reward_redemptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => familyRewards.id, { onDelete: 'cascade' }),
  pointsSpent: integer('points_spent').notNull(),
  status: redemptionStatusEnum('status').notNull().default('pending'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const rewardAssignments = pgTable(
  'reward_assignments',
  {
    rewardId: uuid('reward_id')
      .notNull()
      .references(() => rewards.id, { onDelete: 'cascade' }),
    childId: uuid('child_id')
      .notNull()
      .references(() => children.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rewardId, table.childId] }),
  })
);

export const rewardAssignmentsRelations = relations(rewardAssignments, ({ one }) => ({
  reward: one(rewards, {
    fields: [rewardAssignments.rewardId],
    references: [rewards.id],
  }),
  child: one(children, {
    fields: [rewardAssignments.childId],
    references: [children.id],
  }),
}));

export const pendingRewards = pgTable('pending_rewards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  rewardId: uuid('reward_id')
    .notNull()
    .references(() => rewards.id, { onDelete: 'cascade' }),
  points: integer('points').notNull().default(0),
  redeemedAt: timestamp('redeemed_at', { withTimezone: true }).defaultNow().notNull(),
});

export const transactionTypeEnum = pgEnum('transaction_type', ['earned', 'spent', 'refunded', 'bonus', 'penalty']);

export const pointsTransactions = pgTable('points_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  type: transactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(), // positive for earned, negative for spent
  description: varchar('description', { length: 255 }).notNull(),
  relatedChoreId: uuid('related_chore_id').references(() => chores.id, { onDelete: 'set null' }),
  relatedRewardId: uuid('related_reward_id').references(() => rewards.id, { onDelete: 'set null' }),
  balanceBefore: integer('balance_before').notNull(),
  balanceAfter: integer('balance_after').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const goodCauses = pgTable('good_causes', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  startDate: timestamp('start_date', { withTimezone: true }).notNull(),
  endDate: timestamp('end_date', { withTimezone: true }).notNull(),
  logoUrl: text('logo_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const blogPosts = pgTable('blog_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  coverImageUrl: text('cover_image_url'),
  tags: text('tags').array(),
  status: publishStatusEnum('status').notNull().default('draft'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  rating: integer('rating').notNull().default(0),
  author: varchar('author', { length: 255 }).notNull(),
  status: publishStatusEnum('status').notNull().default('draft'),
  seoTitle: varchar('seo_title', { length: 255 }),
  seoDescription: text('seo_description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull(),
  code: varchar('code', { length: 6 }).notNull(),
  purpose: varchar('purpose', { length: 50 }).notNull(), // 'registration', 'password_reset', etc.
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const discountTypeEnum = pgEnum('discount_type', ['percentage', 'fixed']);

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: varchar('code', { length: 50 }).notNull().unique(),
  description: text('description'),
  discountType: discountTypeEnum('discount_type').notNull(),
  discountValue: integer('discount_value').notNull(), // percentage (0-100) or fixed amount in cents
  maxUses: integer('max_uses'), // null = unlimited
  usedCount: integer('used_count').notNull().default(0),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = inactive
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const couponUsages = pgTable('coupon_usages', {
  id: uuid('id').defaultRandom(),
  couponId: uuid('coupon_id')
    .notNull()
    .references(() => coupons.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  orderId: varchar('order_id', { length: 255 }),
  discountApplied: integer('discount_applied').notNull(), // amount in cents
  usedAt: timestamp('used_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueUsage: primaryKey({ columns: [table.couponId, table.familyId] }),
}));

export type Family = typeof families.$inferSelect;
export type NewFamily = typeof families.$inferInsert;
export type Child = typeof children.$inferSelect;
export type NewChild = typeof children.$inferInsert;
export type Chore = typeof chores.$inferSelect;
export type NewChore = typeof chores.$inferInsert;
export type Reward = typeof rewards.$inferSelect;
export type NewReward = typeof rewards.$inferInsert;
export type PendingReward = typeof pendingRewards.$inferSelect;
export type NewPendingReward = typeof pendingRewards.$inferInsert;

// New Rewards Catalog Types
export type RewardTemplate = typeof rewardTemplates.$inferSelect;
export type NewRewardTemplate = typeof rewardTemplates.$inferInsert;
export type FamilyReward = typeof familyRewards.$inferSelect;
export type NewFamilyReward = typeof familyRewards.$inferInsert;
export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type NewRewardRedemption = typeof rewardRedemptions.$inferInsert;
export type GoodCause = typeof goodCauses.$inferSelect;
export type NewGoodCause = typeof goodCauses.$inferInsert;
export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;
export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type CouponUsage = typeof couponUsages.$inferSelect;
export type NewCouponUsage = typeof couponUsages.$inferInsert;
export type PointsTransaction = typeof pointsTransactions.$inferSelect;
export type NewPointsTransaction = typeof pointsTransactions.$inferInsert;

// Gamification Types
export type Badge = typeof badges.$inferSelect;
export type NewBadge = typeof badges.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;
export type AvatarItem = typeof avatarItems.$inferSelect;
export type NewAvatarItem = typeof avatarItems.$inferInsert;
export type AvatarCustomization = typeof avatarCustomizations.$inferSelect;
export type NewAvatarCustomization = typeof avatarCustomizations.$inferInsert;
export type QuestChain = typeof questChains.$inferSelect;
export type NewQuestChain = typeof questChains.$inferInsert;
export type QuestProgress = typeof questProgress.$inferSelect;
export type NewQuestProgress = typeof questProgress.$inferInsert;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;
export type SavingsHistory = typeof savingsHistory.$inferSelect;
export type NewSavingsHistory = typeof savingsHistory.$inferInsert;
export type WeeklyWinner = typeof weeklyWinner.$inferSelect;
export type NewWeeklyWinner = typeof weeklyWinner.$inferInsert;
export type TeamChore = typeof teamChores.$inferSelect;
export type NewTeamChore = typeof teamChores.$inferInsert;
export type SocialReaction = typeof socialReactions.$inferSelect;
export type NewSocialReaction = typeof socialReactions.$inferInsert;

// Automation Types
export type AutomationSettings = typeof automationSettings.$inferSelect;
export type NewAutomationSettings = typeof automationSettings.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export const familiesRelations = relations(families, ({ many }) => ({
  children: many(children),
  chores: many(chores),
  rewards: many(rewards),
  pendingRewards: many(pendingRewards),
  sessions: many(sessions),
}));

export const childrenRelations = relations(children, ({ one, many }) => ({
  family: one(families, {
    fields: [children.familyId],
    references: [families.id],
  }),
  choreAssignments: many(choreAssignments),
  rewardAssignments: many(rewardAssignments),
  pendingRewards: many(pendingRewards),
  submittedChores: many(chores, {
    relationName: 'submittedChores',
  }),
}));

export const choresRelations = relations(chores, ({ one, many }) => ({
  family: one(families, {
    fields: [chores.familyId],
    references: [families.id],
  }),
  assignments: many(choreAssignments),
  pendingRewards: many(pendingRewards),
  submittedByChild: one(children, {
    fields: [chores.submittedByChildId],
    references: [children.id],
    relationName: 'submittedChores',
  }),
}));

export const rewardsRelations = relations(rewards, ({ one, many }) => ({
  family: one(families, {
    fields: [rewards.familyId],
    references: [families.id],
  }),
  assignments: many(rewardAssignments),
  pendingRewards: many(pendingRewards),
}));

// New Rewards Catalog Relations
export const rewardTemplatesRelations = relations(rewardTemplates, ({ many }) => ({
  familyRewards: many(familyRewards),
}));

export const familyRewardsRelations = relations(familyRewards, ({ one, many }) => ({
  family: one(families, {
    fields: [familyRewards.familyId],
    references: [families.id],
  }),
  template: one(rewardTemplates, {
    fields: [familyRewards.templateId],
    references: [rewardTemplates.id],
  }),
  redemptions: many(rewardRedemptions),
}));

export const rewardRedemptionsRelations = relations(rewardRedemptions, ({ one }) => ({
  family: one(families, {
    fields: [rewardRedemptions.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [rewardRedemptions.childId],
    references: [children.id],
  }),
  reward: one(familyRewards, {
    fields: [rewardRedemptions.rewardId],
    references: [familyRewards.id],
  }),
}));

export const pendingRewardsRelations = relations(pendingRewards, ({ one }) => ({
  family: one(families, {
    fields: [pendingRewards.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [pendingRewards.childId],
    references: [children.id],
  }),
  reward: one(rewards, {
    fields: [pendingRewards.rewardId],
    references: [rewards.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  family: one(families, {
    fields: [sessions.familyId],
    references: [families.id],
  }),
}));

export const couponsRelations = relations(coupons, ({ many }) => ({
  usages: many(couponUsages),
}));

export const couponUsagesRelations = relations(couponUsages, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUsages.couponId],
    references: [coupons.id],
  }),
  family: one(families, {
    fields: [couponUsages.familyId],
    references: [families.id],
  }),
}));

// Gamification Tables
export const badgeTypeEnum = pgEnum('badge_type', ['achievement', 'level', 'quest', 'social']);
export const avatarItemTypeEnum = pgEnum('avatar_item_type', ['accessory', 'outfit', 'background']);
export const rarityEnum = pgEnum('rarity', ['common', 'rare', 'epic', 'legendary']);

export const badges = pgTable('badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  icon: varchar('icon', { length: 50 }).notNull(),
  type: badgeTypeEnum('type').notNull(),
  criteria: text('criteria'), // JSON string for complex criteria
  xpReward: integer('xp_reward').notNull().default(0),
  rarity: rarityEnum('rarity').notNull().default('common'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const userBadges = pgTable('user_badges', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  badgeId: uuid('badge_id')
    .notNull()
    .references(() => badges.id, { onDelete: 'cascade' }),
  earnedAt: timestamp('earned_at', { withTimezone: true }).defaultNow().notNull(),
});

export const avatarItems = pgTable('avatar_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  type: avatarItemTypeEnum('type').notNull(),
  xpRequired: integer('xp_required').notNull().default(0),
  imageUrl: text('image_url'),
  rarity: rarityEnum('rarity').notNull().default('common'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const avatarCustomizations = pgTable('avatar_customizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  itemId: uuid('item_id')
    .notNull()
    .references(() => avatarItems.id, { onDelete: 'cascade' }),
  isEquipped: integer('is_equipped').notNull().default(0), // 1 = true, 0 = false
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questChains = pgTable('quest_chains', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  rewardBadgeId: uuid('reward_badge_id').references(() => badges.id),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const questProgress = pgTable('quest_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  questChainId: uuid('quest_chain_id')
    .notNull()
    .references(() => questChains.id, { onDelete: 'cascade' }),
  completedSteps: text('completed_steps').array().notNull().default([]), // array of chore IDs
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const savingsGoals = pgTable('savings_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  itemName: varchar('item_name', { length: 255 }).notNull(),
  targetAmount: integer('target_amount').notNull(), // in cents
  currentAmount: integer('current_amount').notNull().default(0), // in cents
  imageUrl: text('image_url'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const savingsHistory = pgTable('savings_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  amount: integer('amount').notNull(), // positive for deposits, negative for withdrawals
  description: varchar('description', { length: 255 }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const weeklyWinner = pgTable('weekly_winner', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  weekStart: timestamp('week_start', { withTimezone: true }).notNull(),
  criteria: varchar('criteria', { length: 100 }).notNull(), // 'most_chores', 'fastest', 'most_unpaid'
  points: integer('points').notNull(),
  selectedAt: timestamp('selected_at', { withTimezone: true }).defaultNow().notNull(),
});

export const teamChores = pgTable('team_chores', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  participatingChildren: uuid('participating_children').array().notNull(),
  totalPoints: integer('total_points').notNull().default(0),
  progress: integer('progress').notNull().default(0), // percentage 0-100
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const socialReactions = pgTable('social_reactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  fromChildId: uuid('from_child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  toChildId: uuid('to_child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  reactionType: varchar('reaction_type', { length: 50 }).notNull(), // 'thumbs_up', 'fire', 'star', 'clap', 'trophy'
  relatedChoreId: uuid('related_chore_id').references(() => chores.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Automation Tables
export const automationSettings = pgTable('automation_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  autoPayoutEnabled: integer('auto_payout_enabled').notNull().default(1), // 1 = enabled, 0 = disabled
  payoutDay: payoutDayEnum('payout_day').notNull().default('friday'),
  payoutTime: varchar('payout_time', { length: 5 }).notNull().default('19:00'), // HH:MM format
  approvalWindowEnabled: integer('approval_window_enabled').notNull().default(0), // 1 = enabled, 0 = disabled
  approvalWindowStart: varchar('approval_window_start', { length: 5 }), // HH:MM format
  approvalWindowEnd: varchar('approval_window_end', { length: 5 }), // HH:MM format
  lastPayoutAt: timestamp('last_payout_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }), // null for family-wide notifications
  type: varchar('type', { length: 50 }).notNull(), // 'payout_reminder', 'approval_batch', 'chore_due', etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  data: text('data'), // JSON string for additional data
  isRead: integer('is_read').notNull().default(0), // 1 = read, 0 = unread
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }),
  sentAt: timestamp('sent_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations for gamification tables
export const badgesRelations = relations(badges, ({ many }) => ({
  userBadges: many(userBadges),
  questChains: many(questChains),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  child: one(children, {
    fields: [userBadges.childId],
    references: [children.id],
  }),
  badge: one(badges, {
    fields: [userBadges.badgeId],
    references: [badges.id],
  }),
}));

export const avatarItemsRelations = relations(avatarItems, ({ many }) => ({
  customizations: many(avatarCustomizations),
}));

export const avatarCustomizationsRelations = relations(avatarCustomizations, ({ one }) => ({
  child: one(children, {
    fields: [avatarCustomizations.childId],
    references: [children.id],
  }),
  item: one(avatarItems, {
    fields: [avatarCustomizations.itemId],
    references: [avatarItems.id],
  }),
}));

export const questChainsRelations = relations(questChains, ({ one, many }) => ({
  family: one(families, {
    fields: [questChains.familyId],
    references: [families.id],
  }),
  rewardBadge: one(badges, {
    fields: [questChains.rewardBadgeId],
    references: [badges.id],
  }),
  progress: many(questProgress),
  chores: many(chores),
}));

export const questProgressRelations = relations(questProgress, ({ one }) => ({
  child: one(children, {
    fields: [questProgress.childId],
    references: [children.id],
  }),
  questChain: one(questChains, {
    fields: [questProgress.questChainId],
    references: [questChains.id],
  }),
}));

export const savingsGoalsRelations = relations(savingsGoals, ({ one }) => ({
  child: one(children, {
    fields: [savingsGoals.childId],
    references: [children.id],
  }),
}));

export const savingsHistoryRelations = relations(savingsHistory, ({ one }) => ({
  child: one(children, {
    fields: [savingsHistory.childId],
    references: [children.id],
  }),
}));

export const weeklyWinnerRelations = relations(weeklyWinner, ({ one }) => ({
  family: one(families, {
    fields: [weeklyWinner.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [weeklyWinner.childId],
    references: [children.id],
  }),
}));

export const teamChoresRelations = relations(teamChores, ({ one }) => ({
  family: one(families, {
    fields: [teamChores.familyId],
    references: [families.id],
  }),
}));

export const socialReactionsRelations = relations(socialReactions, ({ one }) => ({
  fromChild: one(children, {
    fields: [socialReactions.fromChildId],
    references: [children.id],
    relationName: 'sentReactions',
  }),
  toChild: one(children, {
    fields: [socialReactions.toChildId],
    references: [children.id],
    relationName: 'receivedReactions',
  }),
  relatedChore: one(chores, {
    fields: [socialReactions.relatedChoreId],
    references: [chores.id],
  }),
}));

// Relations for automation tables
export const automationSettingsRelations = relations(automationSettings, ({ one }) => ({
  family: one(families, {
    fields: [automationSettings.familyId],
    references: [families.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  family: one(families, {
    fields: [notifications.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [notifications.childId],
    references: [children.id],
  }),
}));

export const pointsTransactionsRelations = relations(pointsTransactions, ({ one }) => ({
  family: one(families, {
    fields: [pointsTransactions.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [pointsTransactions.childId],
    references: [children.id],
  }),
  relatedChore: one(chores, {
    fields: [pointsTransactions.relatedChoreId],
    references: [chores.id],
  }),
  relatedReward: one(rewards, {
    fields: [pointsTransactions.relatedRewardId],
    references: [rewards.id],
  }),
}));

// New Gamification Tables
export const petSpeciesEnum = pgEnum('pet_species', ['dragon', 'unicorn', 'phoenix', 'wolf', 'cat']);
export const petEmotionEnum = pgEnum('pet_emotion', ['happy', 'sleepy', 'proud', 'bored', 'hungry', 'excited']);
export const achievementCategoryEnum = pgEnum('achievement_category', ['quests', 'social', 'collection', 'pet', 'special']);
export const stickerRarityEnum = pgEnum('sticker_rarity', ['common', 'rare', 'epic', 'legendary']);

export const virtualPets = pgTable('virtual_pets', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 50 }).notNull(),
  species: petSpeciesEnum('species').notNull(),
  level: integer('level').notNull().default(1),
  xp: integer('xp').notNull().default(0),
  xpToNextLevel: integer('xp_to_next_level').notNull().default(100),
  hunger: integer('hunger').notNull().default(100),
  happiness: integer('happiness').notNull().default(100),
  emotion: petEmotionEnum('emotion').notNull().default('happy'),
  evolutionStage: integer('evolution_stage').notNull().default(1),
  lastFed: timestamp('last_fed', { withTimezone: true }),
  lastInteraction: timestamp('last_interaction', { withTimezone: true }).defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const petEvolutionStages = pgTable('pet_evolution_stages', {
  id: uuid('id').primaryKey().defaultRandom(),
  species: petSpeciesEnum('species').notNull(),
  stage: integer('stage').notNull(),
  levelRequirement: integer('level_requirement').notNull(),
  spriteUrl: varchar('sprite_url', { length: 255 }),
  unlockedItems: text('unlocked_items').array(),
  specialAbilities: text('special_abilities').array(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const stickerCollections = pgTable('sticker_collections', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  stickerId: varchar('sticker_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  rarity: stickerRarityEnum('rarity').notNull().default('common'),
  category: varchar('category', { length: 50 }).notNull(),
  imageUrl: varchar('image_url', { length: 255 }),
  isGlitter: integer('is_glitter').notNull().default(0),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const achievements = pgTable('achievements', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  achievementId: varchar('achievement_id', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  category: achievementCategoryEnum('category').notNull(),
  icon: varchar('icon', { length: 50 }),
  xpReward: integer('xp_reward').notNull().default(0),
  unlockedAt: timestamp('unlocked_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyLeaderboards = pgTable('family_leaderboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  weekStart: date('week_start').notNull(),
  weekEnd: date('week_end').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  rankings: text('rankings').notNull(), // JSON string
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const dailySpins = pgTable('daily_spins', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  lastSpinDate: date('last_spin_date').notNull(),
  spinsAvailable: integer('spins_available').notNull().default(1),
  totalSpins: integer('total_spins').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const familyFeed = pgTable('family_feed', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  message: text('message').notNull(),
  data: text('data'), // JSON string
  reactions: text('reactions').default('[]'), // JSON array
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Gamification Types
export type VirtualPet = typeof virtualPets.$inferSelect;
export type NewVirtualPet = typeof virtualPets.$inferInsert;
export type PetEvolutionStage = typeof petEvolutionStages.$inferSelect;
export type NewPetEvolutionStage = typeof petEvolutionStages.$inferInsert;
export type StickerCollection = typeof stickerCollections.$inferSelect;
export type NewStickerCollection = typeof stickerCollections.$inferInsert;
export type Achievement = typeof achievements.$inferSelect;
export type NewAchievement = typeof achievements.$inferInsert;
export type FamilyLeaderboard = typeof familyLeaderboards.$inferSelect;
export type NewFamilyLeaderboard = typeof familyLeaderboards.$inferInsert;
export type DailySpin = typeof dailySpins.$inferSelect;
export type NewDailySpin = typeof dailySpins.$inferInsert;
export type FamilyFeedItem = typeof familyFeed.$inferSelect;
export type NewFamilyFeedItem = typeof familyFeed.$inferInsert;

// Ranking System Types
export type RankSnapshot = typeof rankSnapshots.$inferSelect;
export type NewRankSnapshot = typeof rankSnapshots.$inferInsert;
export type FriendConnection = typeof friendConnections.$inferSelect;
export type NewFriendConnection = typeof friendConnections.$inferInsert;
export type RankingSetting = typeof rankingSettings.$inferSelect;
export type NewRankingSetting = typeof rankingSettings.$inferInsert;
export type WeeklyChampion = typeof weeklyChampions.$inferSelect;
export type NewWeeklyChampion = typeof weeklyChampions.$inferInsert;

// ===== RANKING SYSTEM TABLES =====

export const rankSnapshots = pgTable('rank_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  rankingType: rankingTypeEnum('ranking_type').notNull(),
  category: rankingCategoryEnum('ranking_category').notNull(),
  weekStart: date('week_start').notNull(),
  weekEnd: date('week_end').notNull(),
  score: integer('score').notNull().default(0),
  rank: integer('rank'),
  tier: rankingTierEnum('tier'),
  title: varchar('title', { length: 100 }),
  isWeeklyChampion: integer('is_weekly_champion').notNull().default(0), // 1 = true, 0 = false
  streakDays: integer('streak_days').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const friendConnections = pgTable('friend_connections', {
  id: uuid('id').defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  friendChildId: uuid('friend_child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  friendCode: varchar('friend_code', { length: 16 }).notNull().unique(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, accepted, blocked
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
}, (table) => ({
  uniqueFriendship: primaryKey({ columns: [table.childId, table.friendChildId] }),
}));

export const rankingSettings = pgTable('ranking_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  rankingsEnabled: integer('rankings_enabled').notNull().default(1), // 1 = enabled, 0 = disabled
  familyRankingEnabled: integer('family_ranking_enabled').notNull().default(1),
  friendsRankingEnabled: integer('friends_ranking_enabled').notNull().default(0),
  powerRankingEnabled: integer('power_ranking_enabled').notNull().default(1),
  showPositions: integer('show_positions').notNull().default(1), // 1 = show ranks, 0 = show percentages only
  showNegativeChanges: integer('show_negative_changes').notNull().default(0), // 1 = show drops, 0 = hide drops
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const weeklyChampions = pgTable('weekly_champions', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  rankingType: rankingTypeEnum('ranking_type').notNull(),
  category: rankingCategoryEnum('ranking_category').notNull(),
  weekStart: date('week_start').notNull(),
  weekEnd: date('week_end').notNull(),
  score: integer('score').notNull(),
  rewards: text('rewards'), // JSON string of rewards given
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ===== POWERKLUSJES (External Chore Requests) TABLES =====

// Trusted Contacts (external people who can offer chores)
export const trustedContacts = pgTable('trusted_contacts', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentFamilyId: uuid('parent_family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  avatarUrl: text('avatar_url'),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, verified, blocked
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Trusted Contact Verifications (for security tracking)
export const trustedContactVerifications = pgTable('trusted_contact_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  contactId: uuid('contact_id')
    .notNull()
    .references(() => trustedContacts.id, { onDelete: 'cascade' }),
  verificationCode: varchar('verification_code', { length: 10 }).notNull(),
  verificationMethod: varchar('verification_method', { length: 20 }).notNull(), // email, sms, manual
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// External Chore Requests (offers from trusted contacts)
export const externalChoreRequests = pgTable('external_chore_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  childId: uuid('child_id')
    .notNull()
    .references(() => children.id, { onDelete: 'cascade' }),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  contactId: uuid('contact_id').references(() => trustedContacts.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  offeredAmountCents: integer('offered_amount_cents').notNull(), // in euro cents
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  paymentMode: varchar('payment_mode', { length: 20 }).notNull().default('manual'), // manual, in_app
  status: varchar('status', { length: 30 }).notNull().default('awaiting_parent'), // awaiting_parent, approved, rejected, in_progress, completed
  createdBy: varchar('created_by', { length: 20 }).notNull(), // 'contact' or 'child'
  evidenceUrl: text('evidence_url'), // photo/video proof
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Parent Approvals (audit trail for parent decisions)
export const parentApprovals = pgTable('parent_approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  externalChoreId: uuid('external_chore_id')
    .notNull()
    .references(() => externalChoreRequests.id, { onDelete: 'cascade' }),
  parentFamilyId: uuid('parent_family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  decision: varchar('decision', { length: 20 }).notNull(), // approved, rejected, modified
  originalAmountCents: integer('original_amount_cents'),
  approvedAmountCents: integer('approved_amount_cents'),
  notes: text('notes'),
  approvedAt: timestamp('approved_at', { withTimezone: true }).defaultNow().notNull(),
});

// Wallets (for in-app payments - premium feature)
export const wallets = pgTable('wallets', {
  id: uuid('id').primaryKey().defaultRandom(),
  familyId: uuid('family_id')
    .notNull()
    .references(() => families.id, { onDelete: 'cascade' }),
  balanceCents: integer('balance_cents').notNull().default(0),
  currency: varchar('currency', { length: 3 }).notNull().default('EUR'),
  isActive: integer('is_active').notNull().default(1), // 1 = active, 0 = suspended
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

// Wallet Transactions (complete audit trail)
export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  walletId: uuid('wallet_id')
    .notNull()
    .references(() => wallets.id, { onDelete: 'cascade' }),
  externalChoreId: uuid('external_chore_id').references(() => externalChoreRequests.id, { onDelete: 'set null' }),
  amountCents: integer('amount_cents').notNull(), // positive for credit, negative for debit
  type: varchar('type', { length: 20 }).notNull(), // credit, debit, hold, release, withdrawal
  status: varchar('status', { length: 20 }).notNull().default('pending'), // pending, completed, failed, cancelled
  description: varchar('description', { length: 255 }),
  metadata: text('metadata'), // JSON string for additional data
  processedAt: timestamp('processed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ===== POWERKLUSJES TYPES =====
export type TrustedContact = typeof trustedContacts.$inferSelect;
export type NewTrustedContact = typeof trustedContacts.$inferInsert;
export type ExternalChoreRequest = typeof externalChoreRequests.$inferSelect;
export type NewExternalChoreRequest = typeof externalChoreRequests.$inferInsert;
export type ParentApproval = typeof parentApprovals.$inferSelect;
export type NewParentApproval = typeof parentApprovals.$inferInsert;
export type Wallet = typeof wallets.$inferSelect;
export type NewWallet = typeof wallets.$inferInsert;
export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;
export type TrustedContactVerification = typeof trustedContactVerifications.$inferSelect;
export type NewTrustedContactVerification = typeof trustedContactVerifications.$inferInsert;

// Relations for gamification tables
export const virtualPetsRelations = relations(virtualPets, ({ one }) => ({
  child: one(children, {
    fields: [virtualPets.childId],
    references: [children.id],
  }),
  family: one(families, {
    fields: [virtualPets.familyId],
    references: [families.id],
  }),
}));

export const petEvolutionStagesRelations = relations(petEvolutionStages, ({}) => ({}));

export const stickerCollectionsRelations = relations(stickerCollections, ({ one }) => ({
  child: one(children, {
    fields: [stickerCollections.childId],
    references: [children.id],
  }),
  family: one(families, {
    fields: [stickerCollections.familyId],
    references: [families.id],
  }),
}));

export const achievementsRelations = relations(achievements, ({ one }) => ({
  child: one(children, {
    fields: [achievements.childId],
    references: [children.id],
  }),
  family: one(families, {
    fields: [achievements.familyId],
    references: [families.id],
  }),
}));

export const familyLeaderboardsRelations = relations(familyLeaderboards, ({ one }) => ({
  family: one(families, {
    fields: [familyLeaderboards.familyId],
    references: [families.id],
  }),
}));

export const dailySpinsRelations = relations(dailySpins, ({ one }) => ({
  child: one(children, {
    fields: [dailySpins.childId],
    references: [children.id],
  }),
  family: one(families, {
    fields: [dailySpins.familyId],
    references: [families.id],
  }),
}));

export const familyFeedRelations = relations(familyFeed, ({ one }) => ({
  family: one(families, {
    fields: [familyFeed.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [familyFeed.childId],
    references: [children.id],
  }),
}));

// Ranking System Relations
export const rankSnapshotsRelations = relations(rankSnapshots, ({ one }) => ({
  family: one(families, {
    fields: [rankSnapshots.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [rankSnapshots.childId],
    references: [children.id],
  }),
}));

export const friendConnectionsRelations = relations(friendConnections, ({ one }) => ({
  child: one(children, {
    fields: [friendConnections.childId],
    references: [children.id],
    relationName: 'friendships',
  }),
  friendChild: one(children, {
    fields: [friendConnections.friendChildId],
    references: [children.id],
    relationName: 'friendOf',
  }),
}));

export const rankingSettingsRelations = relations(rankingSettings, ({ one }) => ({
  family: one(families, {
    fields: [rankingSettings.familyId],
    references: [families.id],
  }),
}));

export const weeklyChampionsRelations = relations(weeklyChampions, ({ one }) => ({
  family: one(families, {
    fields: [weeklyChampions.familyId],
    references: [families.id],
  }),
  child: one(children, {
    fields: [weeklyChampions.childId],
    references: [children.id],
  }),
}));

// ===== POWERKLUSJES RELATIONS =====

export const trustedContactsRelations = relations(trustedContacts, ({ one, many }) => ({
  parentFamily: one(families, {
    fields: [trustedContacts.parentFamilyId],
    references: [families.id],
  }),
  externalChoreRequests: many(externalChoreRequests),
  verifications: many(trustedContactVerifications),
}));

export const trustedContactVerificationsRelations = relations(trustedContactVerifications, ({ one }) => ({
  contact: one(trustedContacts, {
    fields: [trustedContactVerifications.contactId],
    references: [trustedContacts.id],
  }),
}));

export const externalChoreRequestsRelations = relations(externalChoreRequests, ({ one, many }) => ({
  child: one(children, {
    fields: [externalChoreRequests.childId],
    references: [children.id],
  }),
  family: one(families, {
    fields: [externalChoreRequests.familyId],
    references: [families.id],
  }),
  contact: one(trustedContacts, {
    fields: [externalChoreRequests.contactId],
    references: [trustedContacts.id],
  }),
  approvals: many(parentApprovals),
  walletTransactions: many(walletTransactions),
}));

export const parentApprovalsRelations = relations(parentApprovals, ({ one }) => ({
  externalChore: one(externalChoreRequests, {
    fields: [parentApprovals.externalChoreId],
    references: [externalChoreRequests.id],
  }),
  parentFamily: one(families, {
    fields: [parentApprovals.parentFamilyId],
    references: [families.id],
  }),
}));

export const walletsRelations = relations(wallets, ({ one, many }) => ({
  family: one(families, {
    fields: [wallets.familyId],
    references: [families.id],
  }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  wallet: one(wallets, {
    fields: [walletTransactions.walletId],
    references: [wallets.id],
  }),
  externalChore: one(externalChoreRequests, {
    fields: [walletTransactions.externalChoreId],
    references: [externalChoreRequests.id],
  }),
}));


