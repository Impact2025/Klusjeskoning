import 'server-only';

import { eq, and, sql, desc } from 'drizzle-orm';

import { db } from '../db/client';
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
  billingIntervalEnum,
  planTierEnum,
  subscriptionStatusEnum,
} from '../db/schema';
import { hashPassword, verifyPassword } from '../auth/password';
import { PLAN_DEFINITIONS } from '@/lib/plans';

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
};

const toSerializableDate = (date?: Date | null): SerializableDate => date?.toISOString() ?? null;

const DEFAULT_CODE_ATTEMPTS = 10;

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

const PLAN_PRICING = {
  monthly: PLAN_DEFINITIONS.premium.priceMonthlyCents / 100,
  yearly: PLAN_DEFINITIONS.premium.priceYearlyCents / 100,
};

export const generateUniqueFamilyCode = async (): Promise<string> => {
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
}) => {
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

export const authenticateFamily = async (email: string, password: string) => {
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

export const getFamilyByEmail = async (email: string) => {
  return db.query.families.findFirst({ where: eq(families.email, email) });
};

export const getFamilyById = async (familyId: string) => {
  return db.query.families.findFirst({ where: eq(families.id, familyId) });
};

export const getFamilyByCode = async (code: string) => {
  return db.query.families.findFirst({
    where: eq(families.familyCode, code.toUpperCase()),
    with: {
      children: true,
      chores: {
        with: {
          assignments: true,
        },
      },
      rewards: {
        with: {
          assignments: true,
        },
      },
      pendingRewards: {
        with: {
          child: true,
          reward: true,
        },
      },
    },
  });
};

export const loadFamilyWithRelations = async (familyId: string) => {
  return db.query.families.findFirst({
    where: eq(families.id, familyId),
    with: {
      children: true,
      chores: {
        with: {
          assignments: true,
        },
      },
      rewards: {
        with: {
          assignments: true,
        },
      },
      pendingRewards: {
        with: {
          child: true,
          reward: true,
        },
      },
    },
  });
};

export const getChildById = async (familyId: string, childId: string) => {
  return db.query.children.findFirst({
    where: and(eq(children.id, childId), eq(children.familyId, familyId)),
  });
};

export const getChoreById = async (familyId: string, choreId: string) => {
  return db.query.chores.findFirst({
    where: and(eq(chores.id, choreId), eq(chores.familyId, familyId)),
    with: {
      assignments: true,
    },
  });
};

export const getRewardById = async (familyId: string, rewardId: string) => {
  return db.query.rewards.findFirst({
    where: and(eq(rewards.id, rewardId), eq(rewards.familyId, familyId)),
    with: {
      assignments: true,
    },
  });
};

export const serializeFamily = (family: NonNullable<Awaited<ReturnType<typeof loadFamilyWithRelations>>>): SerializableFamily => {
  const childrenData: SerializableChild[] = family.children.map((child) => ({
    id: child.id,
    name: child.name,
    pin: child.pin,
    points: child.points,
    totalPointsEver: child.totalPointsEver,
    avatar: child.avatar,
    createdAt: toSerializableDate(child.createdAt),
  }));

  const childIdToName = new Map(childrenData.map((child) => [child.id, child.name] as const));

  const rewardsData: SerializableReward[] = family.rewards.map((reward) => ({
    id: reward.id,
    name: reward.name,
    points: reward.points,
    type: reward.type,
    assignedTo: reward.assignments.map((assignment) => assignment.childId),
    createdAt: toSerializableDate(reward.createdAt),
  }));

  const rewardsMap = new Map(rewardsData.map((reward) => [reward.id, reward.name] as const));

  const choresData: SerializableChore[] = family.chores.map((chore) => ({
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

  const pendingRewardsData: SerializablePendingReward[] = family.pendingRewards.map((pending) => ({
    id: pending.id,
    childId: pending.childId,
    childName: childIdToName.get(pending.childId) ?? '',
    rewardId: pending.rewardId,
    rewardName: rewardsMap.get(pending.rewardId) ?? '',
    points: pending.points,
    redeemedAt: toSerializableDate(pending.redeemedAt),
  }));

  return {
    id: family.id,
    familyCode: family.familyCode,
    familyName: family.familyName,
    city: family.city,
    email: family.email,
    createdAt: toSerializableDate(family.createdAt),
    recoveryEmail: family.recoveryEmail,
    subscription: {
      plan: family.subscriptionPlan ?? null,
      status: family.subscriptionStatus ?? null,
      interval: family.subscriptionInterval ?? null,
      renewalDate: toSerializableDate(family.subscriptionRenewalDate),
      lastPaymentAt: toSerializableDate(family.subscriptionLastPaymentAt),
      orderId: family.subscriptionOrderId ?? null,
    },
    children: childrenData,
    chores: choresData,
    rewards: rewardsData,
    pendingRewards: pendingRewardsData,
  };
};

export const saveChild = async (params: {
  familyId: string;
  childId?: string;
  name: string;
  pin: string;
  avatar: string;
}) => {
  if (params.childId) {
    await db
      .update(children)
      .set({ name: params.name, pin: params.pin, avatar: params.avatar })
      .where(and(eq(children.id, params.childId), eq(children.familyId, params.familyId)));
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

  return child.id;
};

export const removeChild = async (familyId: string, childId: string) => {
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
}) => {
  const assignedTo = Array.from(new Set(params.assignedTo));

  if (params.choreId) {
    const updatePayload: Partial<typeof chores.$inferInsert> = {
      name: params.name,
      points: params.points,
      status: params.status ?? 'available',
      submittedByChildId: params.submittedBy ?? null,
      submittedAt: params.submittedAt ?? null,
      emotion: params.emotion ?? null,
      photoUrl: params.photoUrl ?? null,
    };
    await db
      .update(chores)
      .set(updatePayload)
      .where(and(eq(chores.id, params.choreId), eq(chores.familyId, params.familyId)));

    await db.delete(choreAssignments).where(eq(choreAssignments.choreId, params.choreId));
    if (assignedTo.length > 0) {
      await db.insert(choreAssignments).values(
        assignedTo.map((childId) => ({ choreId: params.choreId!, childId }))
      );
    }
    return params.choreId;
  }

  const insertPayload: typeof chores.$inferInsert = {
    familyId: params.familyId,
    name: params.name,
    points: params.points,
    status: params.status ?? 'available',
    submittedByChildId: params.submittedBy ?? null,
    submittedAt: params.submittedAt ?? null,
    emotion: params.emotion ?? null,
    photoUrl: params.photoUrl ?? null,
  };

  const [chore] = await db
    .insert(chores)
    .values(insertPayload)
    .returning({ id: chores.id });

  if (assignedTo.length > 0) {
    await db.insert(choreAssignments).values(
      assignedTo.map((childId) => ({ choreId: chore.id, childId }))
    );
  }

  return chore.id;
};

export const removeChore = async (familyId: string, choreId: string) => {
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

export const redeemReward = async (params: {
  familyId: string;
  childId: string;
  rewardId: string;
}) => {
  const reward = await db
    .query.rewards.findFirst({
      where: and(eq(rewards.id, params.rewardId), eq(rewards.familyId, params.familyId)),
    });

  if (!reward) {
    throw new Error('REWARD_NOT_FOUND');
  }

  const child = await db.query.children.findFirst({ where: eq(children.id, params.childId) });
  if (!child) {
    throw new Error('CHILD_NOT_FOUND');
  }

  if (child.points < reward.points) {
    throw new Error('INSUFFICIENT_POINTS');
  }

  await db
    .update(children)
    .set({ points: child.points - reward.points })
    .where(eq(children.id, child.id));

  await recordPendingReward({
    familyId: params.familyId,
    childId: params.childId,
    rewardId: params.rewardId,
    points: reward.points,
  });

  return { reward, child };
};

export const submitChoreForApproval = async (params: {
  familyId: string;
  choreId: string;
  childId: string;
  emotion?: string | null;
  photoUrl?: string | null;
  submittedAt?: Date;
}) => {
  await db
    .update(chores)
    .set({
      status: 'submitted',
      submittedByChildId: params.childId,
      submittedAt: params.submittedAt ?? new Date(),
      emotion: params.emotion ?? null,
      photoUrl: params.photoUrl ?? null,
    })
    .where(and(eq(chores.id, params.choreId), eq(chores.familyId, params.familyId)));
};

export const approveChore = async (familyId: string, choreId: string) => {
  const chore = await db.query.chores.findFirst({ where: and(eq(chores.id, choreId), eq(chores.familyId, familyId)) });
  if (!chore || !chore.submittedByChildId) {
    throw new Error('CHORE_NOT_SUBMITTED');
  }

  await db
    .update(chores)
    .set({
      status: 'approved',
    })
    .where(eq(chores.id, choreId));

  await updateChildPoints(chore.submittedByChildId, chore.points);
};

export const rejectChore = async (familyId: string, choreId: string) => {
  await db
    .update(chores)
    .set({
      status: 'available',
      submittedByChildId: null,
      submittedAt: null,
      emotion: null,
      photoUrl: null,
    })
    .where(and(eq(chores.id, choreId), eq(chores.familyId, familyId)));
};

export const clearPendingReward = async (familyId: string, pendingRewardId: string) => {
  await db.delete(pendingRewards).where(and(eq(pendingRewards.id, pendingRewardId), eq(pendingRewards.familyId, familyId)));
};

export const updateChildPoints = async (childId: string, delta: number) => {
  const incrementTotalEver = Math.max(delta, 0);
  await db.execute(sql`
    UPDATE children
    SET points = points + ${delta},
        total_points_ever = total_points_ever + ${incrementTotalEver}
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
  await db.update(families).set({ recoveryEmail }).where(eq(families.id, familyId));
};

export const getGoodCausesList = async () => {
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
  await db.delete(goodCauses).where(eq(goodCauses.id, causeId));
};

export const listBlogPosts = async () => {
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
  await db.delete(blogPosts).where(eq(blogPosts.id, postId));
};

export const listReviews = async () => {
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
  await db.delete(reviews).where(eq(reviews.id, reviewId));
};

export const getAdminStatsSummary = async () => {
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
  const records = await db.query.families.findMany({
    with: {
      children: true,
    },
    orderBy: desc(families.createdAt),
  });

  return records.map((family) => ({
    id: family.id,
    familyName: family.familyName,
    city: family.city,
    email: family.email,
    familyCode: family.familyCode,
    createdAt: family.createdAt,
    childrenCount: family.children.length,
    subscriptionStatus: family.subscriptionStatus ?? null,
    subscriptionPlan: family.subscriptionPlan ?? null,
    subscriptionInterval: family.subscriptionInterval ?? null,
  }));
};

export const createFamilyAdmin = async (params: {
  familyName: string;
  city: string;
  email: string;
  password: string;
  familyCode?: string;
}) => {
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
  const passwordHash = await hashPassword(password);
  await db
    .update(families)
    .set({ passwordHash })
    .where(eq(families.id, familyId));
};

export const deleteFamilyAdmin = async (familyId: string) => {
  await db.delete(families).where(eq(families.id, familyId));
};

export const getFinancialOverview = async () => {
  const familiesData = await db.query.families.findMany({ orderBy: desc(families.createdAt) });

  const premiumFamilies = familiesData.filter((family) => family.subscriptionStatus === 'active');

  const recentSubscriptions = premiumFamilies.slice(0, 10).map((family) => ({
    id: family.id,
    familyName: family.familyName,
    email: family.email,
    plan: family.subscriptionPlan ?? 'premium',
    amount: family.subscriptionInterval === 'yearly' ? PLAN_PRICING.yearly : PLAN_PRICING.monthly,
    interval: family.subscriptionInterval ?? 'monthly',
    createdAt: family.subscriptionLastPaymentAt ?? family.createdAt ?? new Date(),
    status: family.subscriptionStatus ?? 'inactive',
  }));

  const totalRevenue = premiumFamilies.reduce((sum, family) => {
    const price = family.subscriptionInterval === 'yearly' ? PLAN_PRICING.yearly : PLAN_PRICING.monthly;
    return sum + price;
  }, 0);

  return {
    stats: {
      totalRevenue,
      activeSubscriptions: premiumFamilies.length,
      monthlyGrowth: 0,
      avgSubscriptionValue: premiumFamilies.length > 0 ? totalRevenue / premiumFamilies.length : 0,
    },
    recentSubscriptions,
  };
};
