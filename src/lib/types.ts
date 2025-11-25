import { Timestamp } from './timestamp';

export type PlanTier = 'starter' | 'premium';
export type BillingInterval = 'monthly' | 'yearly';
export type SubscriptionStatus = 'inactive' | 'active' | 'past_due' | 'canceled';

export type SubscriptionInfo = {
  plan: PlanTier;
  status: SubscriptionStatus;
  interval?: BillingInterval | null;
  renewalDate?: Timestamp | null;
  lastPaymentAt?: Timestamp | null;
  orderId?: string | null;
};

export type Screen =
  | 'landing'
  | 'parentLogin'
  | 'emailVerification'
  | 'familySetup'
  | 'parentDashboard'
  | 'childLogin'
  | 'childProfileSelect'
  | 'childPin'
  | 'childDashboard'
  | 'recoverCode'
  | 'qrScanner'
  | 'adminLogin'
  | 'adminDashboard';

export type Child = {
  id: string;
  name: string;
  pin: string;
  points: number;
  totalPointsEver: number;
  xp: number;
  totalXpEver: number;
  avatar: string;
  avatarCustomizations?: AvatarCustomization[];
};

export type ChoreStatus = 'available' | 'submitted' | 'approved';

export type Chore = {
  id: string;
  name: string;
  points: number;
  xpReward: number;
  assignedTo: string[]; // array of child IDs, empty for 'everyone'
  status: ChoreStatus;
  submittedBy?: string | null;
  submittedAt?: Timestamp | null;
  emotion?: string | null;
  photoUrl?: string | null;
  questChainId?: string | null;
  isMainQuest: boolean;
  chainOrder?: number | null;
  // Recurrence fields
  recurrenceType: RecurrenceType;
  recurrenceDays?: string | null; // JSON array of days
  isTemplate: boolean;
  templateId?: string | null;
  nextDueDate?: Timestamp | null;
  createdAt?: Timestamp | null;
};

export type RewardType = 'privilege' | 'experience' | 'donation' | 'money';

export type Reward = {
  id: string;
  name: string;
  points: number;
  type: RewardType;
  assignedTo: string[]; // array of child IDs, empty for 'everyone'
};

export type PendingReward = {
  id: string;
  childId: string;
  childName: string;
  rewardId: string;
  rewardName: string;
  points: number;
  redeemedAt: Timestamp;
};

export type Family = {
  id: string; // This will be the auth UID of the parent
  familyCode: string;
  familyName: string;
  city: string;
  email: string;
  createdAt: Timestamp;
  recoveryEmail?: string;
  children: Child[];
  chores: Chore[];
  rewards: Reward[];
  pendingRewards: PendingReward[];
  teamChores?: TeamChore[];
  subscription?: SubscriptionInfo;
};

export type AdminStats = {
  totalFamilies: number;
  totalChildren: number;
  totalPointsEver: number;
  totalDonationPoints: number;
};

export type GoodCause = {
  id: string;
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  logoUrl?: string; // Optional for now
};

export type PublishStatus = 'draft' | 'published';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  status: PublishStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp | null;
};

export type Review = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  rating: number;
  author: string;
  status: PublishStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp | null;
};

// Gamification Types
export type BadgeType = 'achievement' | 'level' | 'quest' | 'social';
export type AvatarItemType = 'accessory' | 'outfit' | 'background';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';
export type ReactionType = 'thumbs_up' | 'fire' | 'star' | 'clap' | 'trophy';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'custom';
export type PayoutDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: BadgeType;
  criteria?: string;
  xpReward: number;
  rarity: Rarity;
  createdAt: Timestamp;
};

export type UserBadge = {
  id: string;
  childId: string;
  badgeId: string;
  earnedAt: Timestamp;
};

export type AvatarItem = {
  id: string;
  name: string;
  type: AvatarItemType;
  xpRequired: number;
  imageUrl?: string;
  rarity: Rarity;
  createdAt: Timestamp;
};

export type AvatarCustomization = {
  id: string;
  childId: string;
  itemId: string;
  isEquipped: boolean;
  unlockedAt: Timestamp;
};

export type QuestChain = {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  rewardBadgeId?: string;
  createdAt: Timestamp;
};

export type QuestProgress = {
  id: string;
  childId: string;
  questChainId: string;
  completedSteps: string[];
  completedAt?: Timestamp;
};

export type SavingsGoal = {
  id: string;
  childId: string;
  itemName: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  imageUrl?: string;
  completedAt?: Timestamp;
  createdAt: Timestamp;
};

export type SavingsHistory = {
  id: string;
  childId: string;
  amount: number; // positive for deposits, negative for withdrawals
  description?: string;
  createdAt: Timestamp;
};

export type WeeklyWinner = {
  id: string;
  familyId: string;
  childId: string;
  weekStart: Timestamp;
  criteria: string;
  points: number;
  selectedAt: Timestamp;
};

export type TeamChore = {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  participatingChildren: string[];
  totalPoints: number;
  progress: number; // percentage 0-100
  completedAt?: Timestamp;
  createdAt: Timestamp;
};

export type SocialReaction = {
  id: string;
  fromChildId: string;
  toChildId: string;
  reactionType: ReactionType;
  relatedChoreId?: string;
  createdAt: Timestamp;
};

// Automation Types
export type AutomationSettings = {
  id: string;
  familyId: string;
  autoPayoutEnabled: boolean;
  payoutDay: PayoutDay;
  payoutTime: string; // HH:MM format
  approvalWindowEnabled: boolean;
  approvalWindowStart?: string; // HH:MM format
  approvalWindowEnd?: string; // HH:MM format
  lastPayoutAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type Notification = {
  id: string;
  familyId: string;
  childId?: string; // null for family-wide notifications
  type: string; // 'payout_reminder', 'approval_batch', 'chore_due', etc.
  title: string;
  message: string;
  data?: string; // JSON string for additional data
  isRead: boolean;
  scheduledFor?: Timestamp;
  sentAt?: Timestamp;
  createdAt: Timestamp;
};
