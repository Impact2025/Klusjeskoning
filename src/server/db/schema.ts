import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  pgEnum,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const planTierEnum = pgEnum('plan_tier', ['starter', 'premium']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['inactive', 'active', 'past_due', 'canceled']);
export const billingIntervalEnum = pgEnum('billing_interval', ['monthly', 'yearly']);
export const choreStatusEnum = pgEnum('chore_status', ['available', 'submitted', 'approved']);
export const rewardTypeEnum = pgEnum('reward_type', ['privilege', 'experience', 'donation', 'money']);
export const publishStatusEnum = pgEnum('publish_status', ['draft', 'published']);

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
  childId: uuid('child_id').references(() => children.id, { onDelete: 'cascade' }), // null for parent sessions
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
