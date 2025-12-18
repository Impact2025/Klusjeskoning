import type {
  Family,
  Child,
  Chore,
  Reward,
  PendingReward,
  SubscriptionInfo,
  GoodCause,
  BlogPost,
  Review,
  AdminStats,
  ChoreStatus,
  RewardType,
  PublishStatus,
  PlanTier,
  SubscriptionStatus,
  BillingInterval,
  RecurrenceType,
} from '@/lib/types';
import { Timestamp, deserializeTimestamp } from '@/lib/timestamp';

import type {
  SerializableFamily,
  SerializableChild,
  SerializableChore,
  SerializableReward,
  SerializablePendingReward,
  SerializableGoodCause,
  SerializableBlogPost,
  SerializableReview,
  AdminStatsPayload,
  SerializableAdminFamily,
  SerializableSubscriptionEvent,
  FinancialOverviewPayload,
} from './types';

export type AdminFamilySummary = {
  id: string;
  familyName: string;
  city: string;
  email: string;
  familyCode: string;
  createdAt: Timestamp | null;
  childrenCount: number;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
  subscriptionInterval: string | null;
};

export type SubscriptionEvent = {
  id: string;
  familyName: string;
  email: string;
  plan: string;
  amount: number;
  interval: string;
  createdAt: Timestamp;
  status: string;
};

const toTimestamp = (value: string | null): Timestamp | null => deserializeTimestamp(value);

const mapChild = (child: SerializableChild): Child => ({
  id: child.id,
  name: child.name,
  pin: child.pin,
  points: child.points,
  totalPointsEver: child.totalPointsEver,
  xp: child.xp,
  totalXpEver: child.totalXpEver,
  avatar: child.avatar,
});

const mapChore = (chore: SerializableChore): Chore => ({
  id: chore.id,
  name: chore.name,
  points: chore.points,
  xpReward: chore.xpReward,
  assignedTo: chore.assignedTo,
  status: chore.status as ChoreStatus,
  submittedBy: chore.submittedBy ?? null,
  submittedAt: toTimestamp(chore.submittedAt),
  emotion: chore.emotion ?? null,
  photoUrl: chore.photoUrl ?? null,
  questChainId: chore.questChainId ?? null,
  isMainQuest: chore.isMainQuest,
  chainOrder: chore.chainOrder ?? null,
  createdAt: toTimestamp(chore.createdAt),
  recurrenceType: (chore.recurrenceType as RecurrenceType) ?? null,
  isTemplate: chore.isTemplate ?? false,
});

const mapReward = (reward: SerializableReward): Reward => ({
  id: reward.id,
  name: reward.name,
  points: reward.points,
  type: reward.type as RewardType,
  assignedTo: reward.assignedTo,
});

const mapPendingReward = (pending: SerializablePendingReward): PendingReward => ({
  id: pending.id,
  childId: pending.childId,
  childName: pending.childName,
  rewardId: pending.rewardId,
  rewardName: pending.rewardName,
  points: pending.points,
  redeemedAt: toTimestamp(pending.redeemedAt) ?? Timestamp.now(),
});

const mapSubscription = (subscription: SerializableFamily['subscription']): SubscriptionInfo => ({
  plan: (subscription.plan ?? 'starter') as PlanTier,
  status: (subscription.status ?? 'inactive') as SubscriptionStatus,
  interval: (subscription.interval ?? null) as BillingInterval | null,
  renewalDate: toTimestamp(subscription.renewalDate),
  lastPaymentAt: toTimestamp(subscription.lastPaymentAt),
  orderId: subscription.orderId,
});

export const mapFamily = (family: SerializableFamily): Family => ({
  id: family.id,
  familyCode: family.familyCode,
  familyName: family.familyName,
  city: family.city,
  email: family.email,
  createdAt: toTimestamp(family.createdAt) ?? Timestamp.now(),
  recoveryEmail: family.recoveryEmail ?? undefined,
  children: family.children.map(mapChild),
  chores: family.chores.map(mapChore),
  rewards: family.rewards.map(mapReward),
  pendingRewards: family.pendingRewards.map(mapPendingReward),
  subscription: mapSubscription(family.subscription),
});

export const mapGoodCause = (cause: SerializableGoodCause): GoodCause => ({
  id: cause.id,
  name: cause.name,
  description: cause.description,
  startDate: toTimestamp(cause.startDate) ?? Timestamp.now(),
  endDate: toTimestamp(cause.endDate) ?? Timestamp.now(),
  logoUrl: cause.logoUrl ?? undefined,
});

export const mapBlogPost = (post: SerializableBlogPost): BlogPost => ({
  id: post.id,
  title: post.title,
  slug: post.slug,
  excerpt: post.excerpt,
  content: post.content,
  coverImageUrl: post.coverImageUrl,
  tags: post.tags,
  status: post.status as PublishStatus,
  seoTitle: post.seoTitle,
  seoDescription: post.seoDescription,
  createdAt: toTimestamp(post.createdAt) ?? Timestamp.now(),
  updatedAt: toTimestamp(post.updatedAt) ?? Timestamp.now(),
  publishedAt: toTimestamp(post.publishedAt),
});

export const mapReview = (review: SerializableReview): Review => ({
  id: review.id,
  title: review.title,
  slug: review.slug,
  excerpt: review.excerpt,
  content: review.content,
  rating: review.rating,
  author: review.author,
  status: review.status as PublishStatus,
  seoTitle: review.seoTitle,
  seoDescription: review.seoDescription,
  createdAt: toTimestamp(review.createdAt) ?? Timestamp.now(),
  updatedAt: toTimestamp(review.updatedAt) ?? Timestamp.now(),
  publishedAt: toTimestamp(review.publishedAt),
});

export const mapAdminStats = (payload: AdminStatsPayload): AdminStats => ({
  totalFamilies: payload.totalFamilies,
  totalChildren: payload.totalChildren,
  totalPointsEver: payload.totalPointsEver,
  totalDonationPoints: payload.totalDonationPoints,
});

export const mapAdminFamily = (family: SerializableAdminFamily): AdminFamilySummary => ({
  id: family.id,
  familyName: family.familyName,
  city: family.city,
  email: family.email,
  familyCode: family.familyCode,
  createdAt: toTimestamp(family.createdAt),
  childrenCount: family.childrenCount,
  subscriptionStatus: family.subscriptionStatus,
  subscriptionPlan: family.subscriptionPlan,
  subscriptionInterval: family.subscriptionInterval,
});

export const mapSubscriptionEvent = (event: SerializableSubscriptionEvent): SubscriptionEvent => ({
  id: event.id,
  familyName: event.familyName,
  email: event.email,
  plan: event.plan,
  amount: event.amount,
  interval: event.interval,
  createdAt: toTimestamp(event.createdAt) ?? Timestamp.now(),
  status: event.status,
});

export const mapFinancialOverview = (payload: FinancialOverviewPayload) => ({
  stats: payload.stats,
  recentSubscriptions: payload.recentSubscriptions.map(mapSubscriptionEvent),
});

type AppApiResponse<T> = {
  error?: string;
} & T;

// ============================================
// REQUEST DEDUPLICATION & CACHING
// ============================================

// In-flight request cache to prevent duplicate API calls
const inflightRequests = new Map<string, Promise<unknown>>();

// Simple client-side cache with TTL
const clientCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds for client-side cache

// Actions that should NOT be deduplicated (mutations)
const MUTATION_ACTIONS = new Set([
  'addChild', 'updateChild', 'deleteChild',
  'addChore', 'updateChore', 'deleteChore',
  'submitChoreForApproval', 'approveChore', 'rejectChore',
  'addReward', 'updateReward', 'deleteReward',
  'redeemReward', 'registerFamily', 'logout',
]);

// Actions that can use stale-while-revalidate
const CACHEABLE_ACTIONS = new Set([
  'getAdminStats', 'adminListFamilies', 'getGoodCauses',
  'getBlogPosts', 'getReviews', 'getFinancialOverview',
]);

const getCacheKey = (action: string, payload?: unknown): string => {
  return `${action}:${JSON.stringify(payload || {})}`;
};

export const callAppApi = async <T extends object>(action: string, payload?: unknown): Promise<T> => {
  const cacheKey = getCacheKey(action, payload);
  const isMutation = MUTATION_ACTIONS.has(action);
  const isCacheable = CACHEABLE_ACTIONS.has(action);

  // For cacheable actions, return cached data immediately if available
  if (isCacheable) {
    const cached = clientCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      // Return cached data immediately, but revalidate in background
      if (Date.now() - cached.timestamp > CACHE_TTL / 2) {
        // Cache is getting stale, revalidate in background
        void doFetch<T>(action, payload, cacheKey);
      }
      return cached.data as T;
    }
  }

  // For non-mutations, deduplicate in-flight requests
  if (!isMutation) {
    const inflight = inflightRequests.get(cacheKey);
    if (inflight) {
      return inflight as Promise<T>;
    }
  }

  return doFetch<T>(action, payload, cacheKey);
};

const doFetch = async <T extends object>(action: string, payload: unknown, cacheKey: string, retryCount = 0): Promise<T> => {
  const MAX_RETRIES = 2;

  const fetchPromise = (async () => {
    const startTime = performance.now();

    const response = await fetch('/api/app', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
      credentials: 'include',
    });

    const data = (await response.json()) as AppApiResponse<T>;

    const duration = performance.now() - startTime;
    if (duration > 1000) {
      console.warn(`[API] Slow request: ${action} took ${duration.toFixed(0)}ms`);
    }

    // Handle rate limiting with automatic retry
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
      const waitTime = Math.min(retryAfter * 1000, 5000); // Max 5 seconds wait
      console.warn(`[API] Rate limited on ${action}, retrying in ${waitTime}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return doFetch<T>(action, payload, cacheKey, retryCount + 1);
    }

    if (!response.ok) {
      // For 429 after retries, give a friendlier message
      if (response.status === 429) {
        throw new Error('Even geduld alsjeblieft, probeer het zo opnieuw.');
      }
      throw new Error(data.error || 'Onbekende fout');
    }

    // Cache successful responses for cacheable actions
    if (CACHEABLE_ACTIONS.has(action)) {
      clientCache.set(cacheKey, { data, timestamp: Date.now() });
    }

    return data;
  })();

  // Track in-flight request (only for first attempt)
  if (retryCount === 0) {
    inflightRequests.set(cacheKey, fetchPromise);
  }

  try {
    return await fetchPromise;
  } finally {
    // Clean up in-flight tracking
    if (retryCount === 0) {
      inflightRequests.delete(cacheKey);
    }
  }
};

// Invalidate client cache (call after mutations)
export const invalidateClientCache = (patterns?: string[]) => {
  if (!patterns) {
    clientCache.clear();
    return;
  }
  for (const key of clientCache.keys()) {
    if (patterns.some(p => key.includes(p))) {
      clientCache.delete(key);
    }
  }
};

export const fetchCurrentFamily = async (): Promise<SerializableFamily | null> => {
  // Check for in-flight request
  const cacheKey = 'fetchCurrentFamily';
  const inflight = inflightRequests.get(cacheKey);
  if (inflight) {
    return inflight as Promise<SerializableFamily | null>;
  }

  const fetchPromise = (async () => {
    const response = await fetch('/api/app', { credentials: 'include' });
    if (!response.ok) {
      throw new Error('Kon huidige gezin niet laden.');
    }
    const data = (await response.json()) as { family: SerializableFamily | null };
    return data.family;
  })();

  inflightRequests.set(cacheKey, fetchPromise);

  try {
    return await fetchPromise;
  } finally {
    inflightRequests.delete(cacheKey);
  }
};
