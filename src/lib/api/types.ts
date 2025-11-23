export type SerializableChild = {
  id: string;
  name: string;
  pin: string;
  points: number;
  totalPointsEver: number;
  xp: number;
  totalXpEver: number;
  avatar: string;
  createdAt: string | null;
};

export type SerializableChore = {
  id: string;
  name: string;
  points: number;
  xpReward: number;
  assignedTo: string[];
  status: string;
  submittedBy?: string | null;
  submittedAt: string | null;
  emotion?: string | null;
  photoUrl?: string | null;
  questChainId?: string | null;
  isMainQuest: boolean;
  chainOrder?: number | null;
  createdAt: string | null;
  recurrenceType?: string | null;
  isTemplate?: boolean;
};

export type SerializableReward = {
  id: string;
  name: string;
  points: number;
  type: string;
  assignedTo: string[];
  createdAt: string | null;
};

export type SerializablePendingReward = {
  id: string;
  childId: string;
  childName: string;
  rewardId: string;
  rewardName: string;
  points: number;
  redeemedAt: string | null;
};

export type SerializableSubscription = {
  plan: string | null;
  status: string | null;
  interval: string | null;
  renewalDate: string | null;
  lastPaymentAt: string | null;
  orderId: string | null;
};

export type SerializableFamily = {
  id: string;
  familyCode: string;
  familyName: string;
  city: string;
  email: string;
  createdAt: string | null;
  recoveryEmail?: string | null;
  subscription: SerializableSubscription;
  children: SerializableChild[];
  chores: SerializableChore[];
  rewards: SerializableReward[];
  pendingRewards: SerializablePendingReward[];
};

export type SerializableGoodCause = {
  id: string;
  name: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  logoUrl: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type SerializableBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl: string | null;
  tags: string[];
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
};

export type SerializableReview = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  rating: number;
  author: string;
  status: string;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
};

export type AdminStatsPayload = {
  totalFamilies: number;
  totalChildren: number;
  totalPointsEver: number;
  totalDonationPoints: number;
};

export type SerializableAdminFamily = {
  id: string;
  familyName: string;
  city: string;
  email: string;
  familyCode: string;
  createdAt: string | null;
  childrenCount: number;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionInterval: string | null;
};

export type SerializableSubscriptionEvent = {
  id: string;
  familyName: string;
  email: string;
  plan: string;
  amount: number;
  interval: string;
  createdAt: string;
  status: string;
};

export type FinancialOverviewPayload = {
  stats: {
    totalRevenue: number;
    activeSubscriptions: number;
    monthlyGrowth: number;
    avgSubscriptionValue: number;
  };
  recentSubscriptions: SerializableSubscriptionEvent[];
};
