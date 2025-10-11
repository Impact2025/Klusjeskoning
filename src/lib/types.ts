import type { Timestamp } from 'firebase/firestore';

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
  avatar: string;
};

export type ChoreStatus = 'available' | 'submitted' | 'approved';

export type Chore = {
  id: string;
  name: string;
  points: number;
  assignedTo: string[]; // array of child IDs, empty for 'everyone'
  status: ChoreStatus;
  submittedBy?: string | null;
  submittedAt?: Timestamp | null;
  emotion?: string | null;
  photoUrl?: string | null;
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
