import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, eq, and, isNull } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { children, avatarItems, avatarCustomizations, rewardTemplates, teamChores, pointsTransactions, chores } from '@/server/db/schema';

import {
  authenticateFamily,
  createFamily,
  startFamilyRegistration,
  completeFamilyRegistration,
  loadFamilyWithRelations,
  serializeFamily,
  getFamilyByCode,
  saveChild,
  getChildById,
  removeChild,
  saveChore,
  getChoreById,
  removeChore,
  saveReward,
  getRewardById,
  removeReward,
  redeemReward as redeemRewardService,
  clearPendingReward,
  submitChoreForApproval as submitChoreForApprovalService,
  approveChore as approveChoreService,
  rejectChore as rejectChoreService,
  updateRecoveryEmail,
  getGoodCausesList,
  upsertGoodCause,
  removeGoodCause,
  listBlogPosts,
  upsertBlogPost,
  removeBlogPost,
  listReviews,
  upsertReview,
  removeReview,
  getAdminStatsSummary,
  getFamilyByEmail,
  listFamiliesForAdmin,
  createFamilyAdmin,
  updateFamilyAdmin,
  deleteFamilyAdmin,
  getFinancialOverview,
  setFamilyPassword,
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCouponToOrder,
  getCouponStats,
  generateCouponCode,
  setFamilySubscription,
  upgradeFamilyToPro,
  downgradeFamilyAccount,
  extendFamilySubscription,
  getSubscriptionStats,
  getExpiringSubscriptions,
  bulkUpdateSubscriptions,
} from '@/server/services/family-service';
import { createSession, clearSession, getSession, requireSession } from '@/server/auth/session';
import { checkAuthRateLimit, checkApiRateLimit } from '@/lib/rate-limit';
import { securityMiddleware, sanitizeInput } from '@/lib/security-middleware';
import type { ChoreStatus } from '@/lib/types';

const actionSchema = z.object({
  action: z.string(),
  payload: z.unknown().optional(),
});

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL ?? process.env.SENDGRID_FROM_EMAIL ?? 'info@Klusjeskoning.app';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@klusjeskoning.nl';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'SuperGeheim123!';

const registerSchema = z.object({
  familyName: z.string().min(1),
  city: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const childSchema = z.object({
  childId: z.string().optional(),
  name: z.string().min(1),
  pin: z.string().min(1),
  avatar: z.string().min(1),
});

const updateChildSchema = z.object({
  childId: z.string(),
  name: z.string().min(1).optional(),
  pin: z.string().min(1).optional(),
  avatar: z.string().min(1).optional(),
});

const deleteChildSchema = z.object({
  childId: z.string(),
});

const choreSchema = z.object({
  choreId: z.string().optional(),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  assignedTo: z.array(z.string()).default([]),
});

const updateChoreSchema = z.object({
  choreId: z.string(),
  name: z.string().min(1).optional(),
  points: z.number().int().nonnegative().optional(),
  assignedTo: z.array(z.string()).optional(),
  status: z.enum(['available', 'submitted', 'approved']).optional(),
  submittedBy: z.string().nullable().optional(),
  emotion: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
});

const deleteChoreSchema = z.object({ choreId: z.string() });

const rewardSchema = z.object({
  rewardId: z.string().optional(),
  name: z.string().min(1),
  points: z.number().int().nonnegative(),
  type: z.enum(['privilege', 'experience', 'donation', 'money']),
  assignedTo: z.array(z.string()).default([]),
});

const updateRewardSchema = z.object({
  rewardId: z.string(),
  name: z.string().min(1).optional(),
  points: z.number().int().nonnegative().optional(),
  type: z.enum(['privilege', 'experience', 'donation', 'money']).optional(),
  assignedTo: z.array(z.string()).optional(),
});

const deleteRewardSchema = z.object({ rewardId: z.string() });

const submitChoreSchema = z.object({
  choreId: z.string(),
  childId: z.string(),
  emotion: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  submittedAt: z.string().datetime().optional(),
});

const singleIdSchema = z.object({ id: z.string() });

const redeemRewardSchema = z.object({
  childId: z.string(),
  rewardId: z.string(),
});

const pendingRewardSchema = z.object({ pendingRewardId: z.string() });

const recoveryEmailSchema = z.object({ email: z.string().email() });

const recoverySchema = z.object({ email: z.string().email() });

const familyCodeSchema = z.object({ familyCode: z.string().min(1) });

const adminFamilySchema = z.object({
  familyName: z.string().min(1),
  city: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  familyCode: z.string().min(4).max(16).optional(),
});

const adminFamilyUpdateSchema = z.object({
  familyId: z.string(),
  familyName: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  email: z.string().email().optional(),
  familyCode: z.string().min(4).max(16).optional(),
  password: z.string().min(6).optional(),
});

const adminFamilyDeleteSchema = z.object({ familyId: z.string() });

const couponSchema = z.object({
  code: z.string().min(1).max(50),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().int().positive(),
  maxUses: z.number().int().nonnegative().optional(),
  validFrom: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  isActive: z.boolean().optional(),
}).transform((data) => ({
  code: data.code,
  description: data.description,
  discountType: data.discountType,
  discountValue: data.discountValue,
  maxUses: data.maxUses,
  validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
  validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
  isActive: data.isActive,
}));

const couponUpdateSchema = z.object({
  couponId: z.string(),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']).optional(),
  discountValue: z.number().int().positive().optional(),
  maxUses: z.number().int().nonnegative().optional(),
  validFrom: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  isActive: z.boolean().optional(),
}).transform((data) => ({
  couponId: data.couponId,
  description: data.description,
  discountType: data.discountType,
  discountValue: data.discountValue,
  maxUses: data.maxUses,
  validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
  validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
  isActive: data.isActive,
}));

const couponDeleteSchema = z.object({ couponId: z.string() });

const couponValidateSchema = z.object({ code: z.string().min(1) });

const couponApplySchema = z.object({
  couponId: z.string(),
  orderId: z.string(),
  originalAmount: z.number().int().nonnegative(),
});

const subscriptionSetSchema = z.object({
  familyId: z.string(),
  plan: z.enum(['starter', 'premium']).nullable(),
  status: z.enum(['inactive', 'active', 'past_due', 'canceled']),
  interval: z.enum(['monthly', 'yearly']).nullable().optional(),
  renewalDate: z.string().datetime().nullable().optional(),
  orderId: z.string().nullable().optional(),
}).transform((data) => ({
  familyId: data.familyId,
  plan: data.plan,
  status: data.status,
  interval: data.interval,
  renewalDate: data.renewalDate ? new Date(data.renewalDate) : null,
  orderId: data.orderId,
}));

const subscriptionUpgradeSchema = z.object({
  familyId: z.string(),
  plan: z.enum(['premium']).optional(),
  interval: z.enum(['monthly', 'yearly']).optional(),
  durationMonths: z.number().int().positive().optional(),
  orderId: z.string().optional(),
});

const subscriptionDowngradeSchema = z.object({
  familyId: z.string(),
  immediate: z.boolean().optional(),
  orderId: z.string().optional(),
});

const subscriptionExtendSchema = z.object({
  familyId: z.string(),
  additionalMonths: z.number().int().positive(),
  orderId: z.string().optional(),
});

const subscriptionOperationSchema = z.object({
  familyId: z.string().min(1),
  action: z.enum(['upgrade', 'downgrade', 'extend', 'cancel']),
  options: z.record(z.any()).optional(),
});

const bulkSubscriptionUpdateSchema = z.object({
  operations: z.array(subscriptionOperationSchema).min(1),
});

const unlockAvatarItemSchema = z.object({
  childId: z.string(),
  itemId: z.string(),
});

const equipAvatarItemSchema = z.object({
  childId: z.string(),
  itemId: z.string(),
  equip: z.boolean(),
});

const goodCauseSchema = z.object({
  causeId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  logoUrl: z.string().nullable().optional(),
});

const blogPostSchema = z.object({
  postId: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  coverImageUrl: z.string().nullable().optional(),
  tags: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published']),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

const reviewSchema = z.object({
  reviewId: z.string().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  rating: z.number().int().min(0).max(5),
  author: z.string().min(1),
  status: z.enum(['draft', 'published']),
  seoTitle: z.string().nullable().optional(),
  seoDescription: z.string().nullable().optional(),
  publishedAt: z.string().datetime().nullable().optional(),
});

const respondWithFamily = async (familyId: string) => {
  const familyRecord = await loadFamilyWithRelations(familyId);
  if (!familyRecord) {
    return NextResponse.json({ family: null }, { status: 404 });
  }
  return NextResponse.json({ family: serializeFamily(familyRecord) });
};

const requireAdminSession = async () => {
  const session = await requireSession();
  if (session.family.email !== ADMIN_EMAIL) {
    throw new Error('UNAUTHORIZED_ADMIN');
  }
  return session;
};

const serializeAdminFamily = (record: Awaited<ReturnType<typeof listFamiliesForAdmin>>[number]) => ({
  id: record.id,
  familyName: record.familyName,
  city: record.city,
  email: record.email,
  familyCode: record.familyCode,
  createdAt: record.createdAt ? record.createdAt.toISOString() : null,
  childrenCount: record.childrenCount,
  subscriptionStatus: record.subscriptionStatus,
  subscriptionPlan: record.subscriptionPlan,
  subscriptionInterval: record.subscriptionInterval,
});

const serializeSubscriptionEvent = (
  event: (Awaited<ReturnType<typeof getFinancialOverview>>['recentSubscriptions'])[number]
) => ({
  id: event.id,
  familyName: event.familyName,
  email: event.email,
  plan: event.plan,
  amount: event.amount,
  interval: event.interval,
  createdAt: event.createdAt ? event.createdAt.toISOString() : new Date().toISOString(),
  status: event.status,
});

const sendNotification = async (request: Request, payload: Record<string, unknown>) => {
  try {
    const origin = new URL(request.url).origin;
    await fetch(`${origin}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[notifications] failed', error);
  }
};

const errorResponse = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ family: null });
  }
  return respondWithFamily(session.familyId);
}

export async function POST(request: Request) {
  // Security middleware check
  const securityCheck = await securityMiddleware(request, {
    maxPayloadSize: 1024 * 1024, // 1MB limit
    allowedOrigins: ['klusjeskoning.nl', 'klusjeskoningapp.nl']
  });

  if (!securityCheck.valid) {
    return securityCheck.response!;
  }

  let body: z.infer<typeof actionSchema>;
  try {
    const json = await request.json();
    body = actionSchema.parse(json);
  } catch (error) {
    return errorResponse('Ongeldig verzoek.', 400);
  }

  const { action, payload } = body;

  // Rate limiting for authentication actions
  const authActions = ['registerFamily', 'loginParent', 'adminLogin', 'loginChild', 'recoverFamilyCode'];
  if (authActions.includes(action)) {
    const rateLimitResult = await checkAuthRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json({
        error: 'Te veel pogingen. Probeer het later opnieuw.',
        retryAfter: rateLimitResult.reset,
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.reset?.getTime() || Date.now() + 600000) / 1000).toString(),
        }
      });
    }
  }

  // General API rate limiting for other actions
  if (!authActions.includes(action)) {
    const rateLimitResult = await checkApiRateLimit(request);
    if (!rateLimitResult.success) {
      return NextResponse.json({
        error: 'Te veel API verzoeken. Probeer het later opnieuw.',
        retryAfter: rateLimitResult.reset,
      }, {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitResult.reset?.getTime() || Date.now() + 3600000) / 1000).toString(),
        }
      });
    }
  }

  // Check if db client is available for actions that require database access
  if (!db) {
    return NextResponse.json(
      { error: 'Database niet beschikbaar', details: 'Database client is niet geïnitialiseerd' },
      { status: 503 }
    );
  }

  try {
    switch (action) {
      case 'startRegistration': {
        const data = registerSchema.parse(payload);
        const result = await startFamilyRegistration({
          familyName: data.familyName,
          city: data.city,
          email: data.email,
          password: data.password,
        });

        // Send verification code via email
        await sendNotification(request, {
          type: 'verification_code',
          to: data.email,
          data: {
            verificationCode: result.verificationCode,
            familyName: data.familyName,
          },
        });

        // Send admin notification for new registration attempt
        await sendNotification(request, {
          type: 'admin_new_registration',
          to: ADMIN_NOTIFICATION_EMAIL,
          data: {
            familyName: data.familyName,
            email: data.email,
            city: data.city,
            familyCode: 'pending_verification',
            timestamp: new Date().toISOString(),
          },
        });

        return NextResponse.json({
          success: true,
          message: 'Verificatiecode verzonden naar je email',
          email: data.email,
        });
      }
      case 'verifyRegistration': {
        const data = z.object({
          email: z.string().email(),
          code: z.string().length(6),
          familyName: z.string(),
          city: z.string(),
          password: z.string().min(6),
        }).parse(payload);

        const { id: familyId, familyCode } = await completeFamilyRegistration({
          email: data.email,
          code: data.code,
          familyName: data.familyName,
          city: data.city,
          password: data.password,
        });

        await createSession(familyId);

        // Send welcome email with family code
        await sendNotification(request, {
          type: 'welcome_parent',
          to: data.email,
          data: { familyName: data.familyName, familyCode },
        });

        // Notify admin
        await sendNotification(request, {
          type: 'admin_new_registration',
          to: ADMIN_NOTIFICATION_EMAIL,
          data: {
            familyName: data.familyName,
            email: data.email,
            city: data.city,
            familyCode,
            timestamp: new Date().toISOString(),
          },
        });

        return respondWithFamily(familyId);
      }
      case 'registerFamily': {
        // Keep backward compatibility for admin use
        const data = registerSchema.parse(payload);
        const { id: familyId, familyCode } = await createFamily({
          familyName: data.familyName,
          city: data.city,
          email: data.email,
          password: data.password,
          skipVerification: true,
        });
        await createSession(familyId);
        await sendNotification(request, {
          type: 'welcome_parent',
          to: data.email,
          data: { familyName: data.familyName, familyCode },
        });
        await sendNotification(request, {
          type: 'admin_new_registration',
          to: ADMIN_NOTIFICATION_EMAIL,
          data: {
            familyName: data.familyName,
            email: data.email,
            city: data.city,
            familyCode,
            timestamp: new Date().toISOString(),
          },
        });
        return respondWithFamily(familyId);
      }
      case 'loginParent': {
        const data = loginSchema.parse(payload);
        const family = await authenticateFamily(data.email, data.password);
        if (!family) {
          return errorResponse('Onjuiste inloggegevens.', 401);
        }
        await createSession(family.id);
        return respondWithFamily(family.id);
      }
      case 'adminLogin': {
        const data = adminLoginSchema.parse(payload);
        if (data.email !== ADMIN_EMAIL || data.password !== ADMIN_PASSWORD) {
          return errorResponse('Onjuiste admin-gegevens.', 401);
        }

        let adminFamily = await authenticateFamily(ADMIN_EMAIL, ADMIN_PASSWORD);
        if (!adminFamily) {
          const existing = await getFamilyByEmail(ADMIN_EMAIL);
          if (existing) {
            await setFamilyPassword(existing.id, ADMIN_PASSWORD);
            adminFamily = await authenticateFamily(ADMIN_EMAIL, ADMIN_PASSWORD);
          } else {
            await createFamilyAdmin({
              familyName: 'Administrator',
              city: 'Online',
              email: ADMIN_EMAIL,
              password: ADMIN_PASSWORD,
            });
            adminFamily = await authenticateFamily(ADMIN_EMAIL, ADMIN_PASSWORD);
            if (!adminFamily) {
              const fallback = await getFamilyByEmail(ADMIN_EMAIL);
              adminFamily = fallback ?? null;
            }
          }
        }

        if (!adminFamily) {
          return errorResponse('Kon admin niet authenticeren.', 500);
        }

        await createSession(adminFamily.id);
        return respondWithFamily(adminFamily.id);
      }
      case 'logout': {
        await clearSession();
        return NextResponse.json({ success: true });
      }
      case 'refreshFamily': {
        const session = await requireSession();
        return respondWithFamily(session.familyId);
      }
      case 'lookupFamilyByCode': {
        const data = familyCodeSchema.parse(payload);
        const family = await getFamilyByCode(data.familyCode);
        if (!family) {
          return errorResponse('Gezin niet gevonden.', 404);
        }
        return NextResponse.json({ family: serializeFamily(family) });
      }
      case 'loginChild': {
        const data = z.object({ familyId: z.string(), childId: z.string(), pin: z.string() }).parse(payload);
        const family = await loadFamilyWithRelations(data.familyId);
        if (!family) {
          return errorResponse('Gezin niet gevonden.', 404);
        }
        const child = (family as any).children.find((c: any) => c.id === data.childId);
        if (!child || child.pin !== data.pin) {
          return errorResponse('Onjuiste pincode.', 401);
        }
        await createSession(data.familyId);
        return respondWithFamily(data.familyId);
      }
      case 'addChild': {
        const session = await requireSession();
        const data = childSchema.parse(payload);
        const childId = await saveChild({
          familyId: session.familyId,
          name: data.name,
          pin: data.pin,
          avatar: data.avatar,
        });
        return respondWithFamily(session.familyId);
      }
      case 'updateChild': {
        const session = await requireSession();
        const data = updateChildSchema.parse(payload);
        const existing = await getChildById(session.familyId, data.childId);
        if (!existing) {
          return errorResponse('Kind niet gevonden.', 404);
        }
        await saveChild({
          familyId: session.familyId,
          childId: data.childId,
          name: data.name ?? existing.name,
          pin: data.pin ?? existing.pin,
          avatar: data.avatar ?? existing.avatar,
        });
        return respondWithFamily(session.familyId);
      }
      case 'deleteChild': {
        const session = await requireSession();
        const data = deleteChildSchema.parse(payload);
        await removeChild(session.familyId, data.childId);
        return respondWithFamily(session.familyId);
      }
      case 'addChore': {
        const session = await requireSession();
        const data = choreSchema.parse(payload);
        await saveChore({
          familyId: session.familyId,
          name: data.name,
          points: data.points,
          assignedTo: data.assignedTo,
        });
        return respondWithFamily(session.familyId);
      }
      case 'updateChore': {
        const session = await requireSession();
        const data = updateChoreSchema.parse(payload);
        const existing = await getChoreById(session.familyId, data.choreId);
        if (!existing) {
          return errorResponse('Klusje niet gevonden.', 404);
        }
        await saveChore({
          familyId: session.familyId,
          choreId: data.choreId,
          name: (data.name as string) ?? existing.name,
          points: (data.points as number) ?? existing.points,
          assignedTo: (data.assignedTo as string[]) ?? (existing.assignments as any[]).map((assignment) => assignment.childId),
          status: (data.status as ChoreStatus) ?? existing.status,
          submittedBy: (data.submittedBy as any) ?? existing.submittedByChildId,
          submittedAt: (data.submittedBy as string | null | undefined) != null ? new Date() : (existing.submittedAt as any),
          emotion: (data.emotion as any) ?? existing.emotion,
          photoUrl: (data.photoUrl as any) ?? existing.photoUrl,
        });
        return respondWithFamily(session.familyId);
      }
      case 'deleteChore': {
        const session = await requireSession();
        const data = deleteChoreSchema.parse(payload);
        await removeChore(session.familyId, data.choreId);
        return respondWithFamily(session.familyId);
      }
      case 'submitChoreForApproval': {
        const session = await requireSession();
        const data = submitChoreSchema.parse(payload);
        await submitChoreForApprovalService({
          familyId: session.familyId,
          choreId: data.choreId,
          childId: data.childId,
          emotion: data.emotion,
          photoUrl: data.photoUrl,
          submittedAt: data.submittedAt ? new Date(data.submittedAt) : new Date(),
        });

        // Fetch child and chore details for notification
        const [child] = await db
          .select({ name: children.name })
          .from(children)
          .where(and(eq(children.id, data.childId), eq(children.familyId, session.familyId)))
          .limit(1);

        const [chore] = await db
          .select({ name: chores.name, points: chores.points })
          .from(chores)
          .where(and(eq(chores.id, data.choreId), eq(chores.familyId, session.familyId)))
          .limit(1);

        // Send email notification to parent about chore submission
        await sendNotification(request, {
          type: 'chore_submitted',
          to: session.family.email,
          data: {
            parentName: session.family.familyName,
            childName: child?.name || 'Onbekend kind',
            choreName: chore?.name || 'Onbekend klusje',
            points: chore?.points || 0,
          },
        });

        return respondWithFamily(session.familyId);
      }
      case 'approveChore': {
        const session = await requireSession();
        const data = singleIdSchema.parse(payload);
        await approveChoreService(session.familyId, data.id);
        return respondWithFamily(session.familyId);
      }
      case 'rejectChore': {
        const session = await requireSession();
        const data = singleIdSchema.parse(payload);
        await rejectChoreService(session.familyId, data.id);
        return respondWithFamily(session.familyId);
      }
      case 'adminListFamilies': {
        await requireAdminSession();
        const families = await listFamiliesForAdmin();
        return NextResponse.json({ families: families.map(serializeAdminFamily) });
      }
      case 'adminCreateFamily': {
        await requireAdminSession();
        const data = adminFamilySchema.parse(payload);
        await createFamilyAdmin({
          familyName: data.familyName,
          city: data.city,
          email: data.email,
          password: data.password,
          familyCode: data.familyCode,
        });
        const families = await listFamiliesForAdmin();
        return NextResponse.json({ families: families.map(serializeAdminFamily) });
      }
      case 'adminUpdateFamily': {
        await requireAdminSession();
        const data = adminFamilyUpdateSchema.parse(payload);
        const { password, familyId, ...fields } = data;
        await updateFamilyAdmin({ familyId, ...fields });
        if (password) {
          await setFamilyPassword(familyId, password);
        }
        const families = await listFamiliesForAdmin();
        return NextResponse.json({ families: families.map(serializeAdminFamily) });
      }
      case 'adminDeleteFamily': {
        await requireAdminSession();
        const data = adminFamilyDeleteSchema.parse(payload);
        await deleteFamilyAdmin(data.familyId);
        const families = await listFamiliesForAdmin();
        return NextResponse.json({ families: families.map(serializeAdminFamily) });
      }
      case 'addReward': {
        const session = await requireSession();
        const data = rewardSchema.parse(payload);
        await saveReward({
          familyId: session.familyId,
          name: data.name,
          points: data.points,
          type: data.type,
          assignedTo: data.assignedTo,
        });
        return respondWithFamily(session.familyId);
      }
      case 'updateReward': {
        const session = await requireSession();
        const data = updateRewardSchema.parse(payload);
        const existing = await getRewardById(session.familyId, data.rewardId);
        if (!existing) {
          return errorResponse('Beloning niet gevonden.', 404);
        }
        await saveReward({
          familyId: session.familyId,
          rewardId: data.rewardId,
          name: data.name ?? existing.name,
          points: data.points ?? existing.points,
          type: data.type ?? existing.type,
          assignedTo: data.assignedTo ?? (existing.assignments as any[]).map((assignment) => assignment.childId),
        });
        return respondWithFamily(session.familyId);
      }
      case 'deleteReward': {
        const session = await requireSession();
        const data = deleteRewardSchema.parse(payload);
        await removeReward(session.familyId, data.rewardId);
        return respondWithFamily(session.familyId);
      }
      case 'redeemReward': {
        const session = await requireSession();
        const data = redeemRewardSchema.parse(payload);
        const result = await redeemRewardService({
          familyId: session.familyId,
          childId: data.childId,
          rewardId: data.rewardId,
        });
        if (result.child && result.reward) {
          await sendNotification(request, {
            type: 'reward_redeemed',
            to: session.family.email,
            data: {
              parentName: session.family.familyName,
              childName: result.child.name,
              rewardName: result.reward.name,
              points: result.reward.points,
            },
          });
        }
        return respondWithFamily(session.familyId);
      }
      case 'markRewardAsGiven': {
        const session = await requireSession();
        const data = pendingRewardSchema.parse(payload);
        await clearPendingReward(session.familyId, data.pendingRewardId);
        return respondWithFamily(session.familyId);
      }
      case 'saveRecoveryEmail': {
        const session = await requireSession();
        const data = recoveryEmailSchema.parse(payload);
        await updateRecoveryEmail(session.familyId, data.email);
        return respondWithFamily(session.familyId);
      }
      case 'recoverFamilyCode': {
        const data = recoverySchema.parse(payload);
        const family = await getFamilyByEmail(data.email);
        if (family) {
          await sendNotification(request, {
            type: 'welcome_parent',
            to: data.email,
            data: { familyName: family.familyName, familyCode: family.familyCode },
          });
        }
        return NextResponse.json({ success: true });
      }
      case 'getGoodCauses': {
        const causes = await getGoodCausesList();
        return NextResponse.json({ goodCauses: causes });
      }
      case 'saveGoodCause': {
        await requireAdminSession();
        const data = goodCauseSchema.parse(payload);
        await upsertGoodCause({
          causeId: data.causeId,
          name: data.name,
          description: data.description,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          logoUrl: data.logoUrl ?? null,
        });
        const causes = await getGoodCausesList();
        return NextResponse.json({ goodCauses: causes });
      }
      case 'deleteGoodCause': {
        await requireAdminSession();
        const data = singleIdSchema.parse(payload);
        await removeGoodCause(data.id);
        const causes = await getGoodCausesList();
        return NextResponse.json({ goodCauses: causes });
      }
      case 'getBlogPosts': {
        await requireAdminSession();
        const posts = await listBlogPosts();
        return NextResponse.json({ blogPosts: posts });
      }
      case 'saveBlogPost': {
        await requireAdminSession();
        const data = blogPostSchema.parse(payload);
        await upsertBlogPost({
          postId: data.postId,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          coverImageUrl: data.coverImageUrl ?? null,
          tags: data.tags,
          status: data.status,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        });
        const posts = await listBlogPosts();
        return NextResponse.json({ blogPosts: posts });
      }
      case 'deleteBlogPost': {
        await requireAdminSession();
        const data = singleIdSchema.parse(payload);
        await removeBlogPost(data.id);
        const posts = await listBlogPosts();
        return NextResponse.json({ blogPosts: posts });
      }
      case 'getReviews': {
        await requireAdminSession();
        const items = await listReviews();
        return NextResponse.json({ reviews: items });
      }
      case 'saveReview': {
        await requireAdminSession();
        const data = reviewSchema.parse(payload);
        await upsertReview({
          reviewId: data.reviewId,
          title: data.title,
          slug: data.slug,
          excerpt: data.excerpt,
          content: data.content,
          rating: data.rating,
          author: data.author,
          status: data.status,
          seoTitle: data.seoTitle ?? null,
          seoDescription: data.seoDescription ?? null,
          publishedAt: data.publishedAt ? new Date(data.publishedAt) : null,
        });
        const items = await listReviews();
        return NextResponse.json({ reviews: items });
      }
      case 'deleteReview': {
        await requireAdminSession();
        const data = singleIdSchema.parse(payload);
        await removeReview(data.id);
        const items = await listReviews();
        return NextResponse.json({ reviews: items });
      }
      case 'getFinancialOverview': {
        await requireAdminSession();
        const overview = await getFinancialOverview();
        return NextResponse.json({
          stats: overview.stats,
          recentSubscriptions: overview.recentSubscriptions.map(serializeSubscriptionEvent),
        });
      }
      case 'getAdminStats': {
        await requireAdminSession();
        const stats = await getAdminStatsSummary();
        return NextResponse.json({ adminStats: stats });
      }
      case 'createCoupon': {
        await requireAdminSession();
        const data = couponSchema.parse(payload);
        const coupon = await createCoupon(data);
        return NextResponse.json({ coupon });
      }
      case 'getCoupons': {
        await requireAdminSession();
        const coupons = await getAllCoupons();
        return NextResponse.json({ coupons });
      }
      case 'updateCoupon': {
        await requireAdminSession();
        const data = couponUpdateSchema.parse(payload);
        const { couponId, ...updates } = data;
        const coupon = await updateCoupon(couponId, updates);
        return NextResponse.json({ coupon });
      }
      case 'deleteCoupon': {
        await requireAdminSession();
        const data = couponDeleteSchema.parse(payload);
        await deleteCoupon(data.couponId);
        return NextResponse.json({ success: true });
      }
      case 'validateCoupon': {
        const session = await requireSession();
        const data = couponValidateSchema.parse(payload);
        const coupon = await validateCoupon(data.code, session.familyId);
        return NextResponse.json({ coupon });
      }
      case 'applyCoupon': {
        const session = await requireSession();
        const data = couponApplySchema.parse(payload);
        const result = await applyCouponToOrder(
          data.couponId,
          session.familyId,
          data.orderId,
          data.originalAmount
        );
        return NextResponse.json(result);
      }
      case 'getCouponStats': {
        await requireAdminSession();
        const stats = await getCouponStats();
        return NextResponse.json({ couponStats: stats });
      }
      case 'generateCouponCode': {
        await requireAdminSession();
        const code = generateCouponCode();
        return NextResponse.json({ code });
      }
      case 'setFamilySubscription': {
        await requireAdminSession();
        const data = subscriptionSetSchema.parse(payload);
        const family = await setFamilySubscription(data.familyId, {
          plan: data.plan,
          status: data.status,
          interval: data.interval,
          renewalDate: data.renewalDate,
          orderId: data.orderId,
        });
        return NextResponse.json({ family });
      }
      case 'upgradeFamilyToPro': {
        await requireAdminSession();
        const data = subscriptionUpgradeSchema.parse(payload);
        const family = await upgradeFamilyToPro(data.familyId, {
          plan: data.plan,
          interval: data.interval,
          durationMonths: data.durationMonths,
          orderId: data.orderId,
        });
        return NextResponse.json({ family });
      }
      case 'downgradeFamilyAccount': {
        await requireAdminSession();
        const data = subscriptionDowngradeSchema.parse(payload);
        const family = await downgradeFamilyAccount(data.familyId, {
          immediate: data.immediate,
          orderId: data.orderId,
        });
        return NextResponse.json({ family });
      }
      case 'extendFamilySubscription': {
        await requireAdminSession();
        const data = subscriptionExtendSchema.parse(payload);
        const family = await extendFamilySubscription(data.familyId, data.additionalMonths, data.orderId);
        return NextResponse.json({ family });
      }
      case 'getSubscriptionStats': {
        await requireAdminSession();
        const stats = await getSubscriptionStats();
        return NextResponse.json({ subscriptionStats: stats });
      }
      case 'getExpiringSubscriptions': {
        await requireAdminSession();
        const families = await getExpiringSubscriptions();
        return NextResponse.json({ expiringSubscriptions: families });
      }
      case 'bulkUpdateSubscriptions': {
        await requireAdminSession();
        const data = bulkSubscriptionUpdateSchema.parse(payload);
        const results = await bulkUpdateSubscriptions(data.operations as Array<{
          familyId: string;
          action: 'upgrade' | 'downgrade' | 'extend' | 'cancel';
          options?: any;
        }>);
        return NextResponse.json({ results });
      }
      case 'createVerificationTable': {
        try {
          // Create verification_codes table
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
          return NextResponse.json({ success: true, message: 'Verification codes table created' });
        } catch (error) {
          console.error('Error creating verification table:', error);
          return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
        }
      }
      case 'createPointsTransactionsTable': {
        try {
          // Create points_transactions table
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS points_transactions (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
              type varchar(50) NOT NULL CHECK (type IN ('earned', 'spent', 'refunded', 'bonus', 'penalty')),
              amount integer NOT NULL,
              description varchar(255) NOT NULL,
              related_chore_id uuid REFERENCES chores(id) ON DELETE SET NULL,
              related_reward_id uuid REFERENCES rewards(id) ON DELETE SET NULL,
              balance_before integer NOT NULL,
              balance_after integer NOT NULL,
              created_at timestamp with time zone DEFAULT now() NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_points_transactions_family_child ON points_transactions(family_id, child_id);
            CREATE INDEX IF NOT EXISTS idx_points_transactions_created_at ON points_transactions(created_at DESC);
            CREATE INDEX IF NOT EXISTS idx_points_transactions_type ON points_transactions(type);
          `);
          return NextResponse.json({ success: true, message: 'Points transactions table created' });
        } catch (error) {
          console.error('Error creating points transactions table:', error);
          return NextResponse.json({ error: 'Failed to create table' }, { status: 500 });
        }
      }
      case 'createRewardsCatalogTables': {
        try {
          // Create enums (ignore if they already exist)
          try {
            await db.execute(sql`CREATE TYPE reward_category AS ENUM ('privileges', 'experience', 'financial')`);
          } catch (error) {
            // Type might already exist, continue
          }

          try {
            await db.execute(sql`CREATE TYPE redemption_status AS ENUM ('pending', 'approved', 'completed', 'cancelled')`);
          } catch (error) {
            // Type might already exist, continue
          }

          // Create reward templates table
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS reward_templates (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              name varchar(255) NOT NULL,
              description text NOT NULL,
              category reward_category NOT NULL,
              default_points integer NOT NULL,
              min_age integer NOT NULL DEFAULT 4,
              emoji varchar(10),
              is_active integer NOT NULL DEFAULT 1,
              created_at timestamp with time zone DEFAULT now()
            );
          `);

          // Create family rewards table
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS family_rewards (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              template_id uuid REFERENCES reward_templates(id) ON DELETE SET NULL,
              name varchar(255) NOT NULL,
              description text NOT NULL,
              category reward_category NOT NULL,
              points integer NOT NULL,
              min_age integer NOT NULL DEFAULT 4,
              emoji varchar(10),
              estimated_cost integer, -- in cents
              is_active integer NOT NULL DEFAULT 1,
              created_at timestamp with time zone DEFAULT now(),
              updated_at timestamp with time zone DEFAULT now()
            );
          `);

          // Create reward redemptions table
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS reward_redemptions (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
              reward_id uuid NOT NULL REFERENCES family_rewards(id) ON DELETE CASCADE,
              points_spent integer NOT NULL,
              status redemption_status NOT NULL DEFAULT 'pending',
              notes text,
              created_at timestamp with time zone DEFAULT now(),
              completed_at timestamp with time zone
            );
          `);

          // Create indexes
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_family_rewards_family_id ON family_rewards(family_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_family_rewards_category ON family_rewards(category)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_family_rewards_active ON family_rewards(is_active)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reward_redemptions_family_id ON reward_redemptions(family_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reward_redemptions_child_id ON reward_redemptions(child_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reward_redemptions_status ON reward_redemptions(status)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reward_templates_category ON reward_templates(category)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_reward_templates_active ON reward_templates(is_active)`);

          return NextResponse.json({ success: true, message: 'Rewards catalog tables created' });
        } catch (error) {
          console.error('Error creating rewards catalog tables:', error);
          return NextResponse.json({ error: 'Failed to create tables' }, { status: 500 });
        }
      }
      case 'seedRewardTemplates': {
        try {
          const rewardTemplatesData = [
            // Privileges & Autonomie
            {
              name: 'Pizzadag Kiezer 🍕',
              description: 'Kiest wat er op een bepaalde avond gegeten wordt (uit 3 ouder-goedgekeurde opties).',
              category: 'privileges' as const,
              defaultPoints: 5,
              minAge: 6,
              emoji: '🍕',
            },
            {
              name: 'Uitzendtijd Manager',
              description: 'Bepaalt de film of het TV-programma dat de familie samen kijkt.',
              category: 'privileges' as const,
              defaultPoints: 8,
              minAge: 8,
              emoji: '📺',
            },
            {
              name: 'Slaaptijd Uisteller',
              description: 'Mag 15 minuten later naar bed op een doordeweekse avond.',
              category: 'privileges' as const,
              defaultPoints: 10,
              minAge: 8,
              emoji: '🕐',
            },
            {
              name: 'Geen Groenten Vrijstelling',
              description: 'Krijgt vrijstelling van het eten van één soort groente bij één maaltijd.',
              category: 'privileges' as const,
              defaultPoints: 3,
              minAge: 6,
              emoji: '🥦',
            },
            {
              name: '1-op-1 Tijd Kaart',
              description: 'Een half uur ononderbroken speeltijd/leestijd met de ouder.',
              category: 'privileges' as const,
              defaultPoints: 12,
              minAge: 4,
              emoji: '👨‍👩‍👧',
            },
            {
              name: 'Joker Klus Pas',
              description: 'Mag één keer een toegewezen klusje overslaan of ruilen met een gezinslid.',
              category: 'privileges' as const,
              defaultPoints: 25,
              minAge: 10,
              emoji: '🃏',
            },

            // Tijd & Ervaring
            {
              name: 'Vriendjeslogeerpartij',
              description: 'Een overnachting van een vriend(in) plannen in het weekend.',
              category: 'experience' as const,
              defaultPoints: 50,
              minAge: 8,
              emoji: '🏠',
            },
            {
              name: 'Activiteit naar Keuze',
              description: 'Een bezoek aan de bioscoop, binnenspeeltuin of zwembad.',
              category: 'experience' as const,
              defaultPoints: 40,
              minAge: 6,
              emoji: '🎢',
            },
            {
              name: 'Gezins Date Night',
              description: 'Kiest een gezinsuitje (bijvoorbeeld een picknick of fietstocht) die de ouders organiseren.',
              category: 'experience' as const,
              defaultPoints: 35,
              minAge: 4,
              emoji: '👨‍👩‍👧‍👦',
            },
            {
              name: 'Bak- of Kooksessie',
              description: 'Samen met een ouder een specifiek recept bakken of koken (met ingrediënten betaald door ouder).',
              category: 'experience' as const,
              defaultPoints: 15,
              minAge: 6,
              emoji: '👩‍🍳',
            },
            {
              name: 'Mini-Kamer Herinrichting',
              description: 'Krijgt hulp van een ouder om de slaapkamer op een kleine manier te veranderen (bijv. meubels verplaatsen, nieuwe poster).',
              category: 'experience' as const,
              defaultPoints: 30,
              minAge: 10,
              emoji: '🛋️',
            },

            // Fysiek & Financieel
            {
              name: 'Cash-out Zakgeld 💰',
              description: 'Inwisselen van gespaarde punten voor een afgesproken geldbedrag.',
              category: 'financial' as const,
              defaultPoints: 100,
              minAge: 10,
              emoji: '💰',
            },
            {
              name: 'Nieuw Speelgoed Fonds',
              description: 'Een bijdrage in het spaarpotje voor een groot, specifiek item (bijv. videogame, fiets).',
              category: 'financial' as const,
              defaultPoints: 200,
              minAge: 8,
              emoji: '🎮',
            },
            {
              name: 'Boek/Tijdschrift naar Keuze',
              description: 'De aankoop van een nieuw boek of tijdschrift.',
              category: 'financial' as const,
              defaultPoints: 20,
              minAge: 4,
              emoji: '📚',
            },
            {
              name: 'Goede Doelen Donatie 🌍',
              description: 'De gespaarde punten doneren aan een vooraf geselecteerd goed doel (ouder matcht het bedrag).',
              category: 'financial' as const,
              defaultPoints: 50,
              minAge: 8,
              emoji: '🌍',
            },
            {
              name: 'Kleine Verrassing',
              description: 'Een kleinigheidje uit de winkel (tot €5) uitkiezen bij de volgende boodschappen.',
              category: 'financial' as const,
              defaultPoints: 15,
              minAge: 4,
              emoji: '🎁',
            },
          ];

          // Clear existing templates
          await db.delete(rewardTemplates);

          // Insert new templates
          await db.insert(rewardTemplates).values(rewardTemplatesData);

          return NextResponse.json({ success: true, message: `Seeded ${rewardTemplatesData.length} reward templates` });
        } catch (error) {
          console.error('Error seeding reward templates:', error);
          return NextResponse.json({ error: 'Failed to seed templates' }, { status: 500 });
        }
      }
      case 'createGamificationTables': {
        try {
          // Create enums for gamification
          try {
            await db.execute(sql`CREATE TYPE pet_species AS ENUM ('dragon', 'unicorn', 'phoenix', 'wolf', 'cat')`);
          } catch (error) {
            // Type might already exist
          }

          try {
            await db.execute(sql`CREATE TYPE pet_emotion AS ENUM ('happy', 'sleepy', 'proud', 'bored', 'hungry', 'excited')`);
          } catch (error) {
            // Type might already exist
          }

          try {
            await db.execute(sql`CREATE TYPE achievement_category AS ENUM ('quests', 'social', 'collection', 'pet', 'special')`);
          } catch (error) {
            // Type might already exist
          }

          try {
            await db.execute(sql`CREATE TYPE sticker_rarity AS ENUM ('common', 'rare', 'epic', 'legendary')`);
          } catch (error) {
            // Type might already exist
          }

          // Virtual Pets System
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS virtual_pets (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              name varchar(50) NOT NULL,
              species pet_species NOT NULL,
              level integer NOT NULL DEFAULT 1,
              xp integer NOT NULL DEFAULT 0,
              xp_to_next_level integer NOT NULL DEFAULT 100,
              hunger integer NOT NULL DEFAULT 100 CHECK (hunger >= 0 AND hunger <= 100),
              happiness integer NOT NULL DEFAULT 100 CHECK (happiness >= 0 AND happiness <= 100),
              emotion pet_emotion NOT NULL DEFAULT 'happy',
              evolution_stage integer NOT NULL DEFAULT 1,
              last_fed timestamp with time zone,
              last_interaction timestamp with time zone DEFAULT now(),
              created_at timestamp with time zone DEFAULT now(),
              updated_at timestamp with time zone DEFAULT now()
            );
          `);

          // Pet Evolution Stages
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS pet_evolution_stages (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              species pet_species NOT NULL,
              stage integer NOT NULL,
              level_requirement integer NOT NULL,
              sprite_url varchar(255),
              unlocked_items text[], -- JSON array of unlocked item IDs
              special_abilities text[], -- JSON array of abilities
              created_at timestamp with time zone DEFAULT now()
            );
          `);

          // Sticker Collection System
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS sticker_collections (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              sticker_id varchar(50) NOT NULL,
              name varchar(100) NOT NULL,
              rarity sticker_rarity NOT NULL DEFAULT 'common',
              category varchar(50) NOT NULL,
              image_url varchar(255),
              is_glitter boolean NOT NULL DEFAULT false,
              unlocked_at timestamp with time zone DEFAULT now(),
              created_at timestamp with time zone DEFAULT now()
            );
          `);

          // Achievement System
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS achievements (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              achievement_id varchar(50) NOT NULL,
              name varchar(100) NOT NULL,
              description text,
              category achievement_category NOT NULL,
              icon varchar(50),
              xp_reward integer NOT NULL DEFAULT 0,
              unlocked_at timestamp with time zone DEFAULT now(),
              created_at timestamp with time zone DEFAULT now()
            );
          `);

          // Family Leaderboard
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS family_leaderboards (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              week_start date NOT NULL,
              week_end date NOT NULL,
              category varchar(50) NOT NULL, -- 'koning_van_het_huis', 'superhelper', etc.
              rankings jsonb NOT NULL, -- {childId: score} pairs
              created_at timestamp with time zone DEFAULT now(),
              updated_at timestamp with time zone DEFAULT now()
            );
          `);

          // Daily Spin System
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS daily_spins (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              last_spin_date date NOT NULL,
              spins_available integer NOT NULL DEFAULT 1,
              total_spins integer NOT NULL DEFAULT 0,
              created_at timestamp with time zone DEFAULT now(),
              updated_at timestamp with time zone DEFAULT now()
            );
          `);

          // Family Feed
          await db.execute(sql`
            CREATE TABLE IF NOT EXISTS family_feed (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              family_id uuid NOT NULL REFERENCES families(id) ON DELETE CASCADE,
              child_id uuid REFERENCES children(id) ON DELETE CASCADE,
              type varchar(50) NOT NULL, -- 'quest_completed', 'level_up', 'badge_earned', etc.
              message text NOT NULL,
              data jsonb, -- Additional data for the feed item
              reactions jsonb DEFAULT '[]', -- Array of {childId, emoji} objects
              created_at timestamp with time zone DEFAULT now()
            );
          `);

          // Indexes for performance
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_virtual_pets_child_id ON virtual_pets(child_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_sticker_collections_child_id ON sticker_collections(child_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_achievements_child_id ON achievements(child_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_family_feed_family_id ON family_feed(family_id)`);
          await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_family_feed_created_at ON family_feed(created_at DESC)`);

          return NextResponse.json({ success: true, message: 'Gamification tables created successfully' });
        } catch (error) {
          console.error('Error creating gamification tables:', error);
          return NextResponse.json({ error: 'Failed to create gamification tables' }, { status: 500 });
        }
      }
      case 'createTeamChore': {
        const session = await requireSession();
        const data = z.object({
          name: z.string().min(1),
          description: z.string().min(1),
          totalPoints: z.number().int().positive(),
          participatingChildren: z.array(z.string()).min(1),
        }).parse(payload);

        // Verify all participating children belong to the family
        const family = await loadFamilyWithRelations(session.familyId);
        if (!family) {
          return errorResponse('Gezin niet gevonden.', 404);
        }

        const familyChildIds = (family as any).children.map((child: any) => child.id);
        const invalidChildren = data.participatingChildren.filter(childId => !familyChildIds.includes(childId));

        if (invalidChildren.length > 0) {
          return errorResponse('Sommige kinderen behoren niet tot dit gezin.', 400);
        }

        // Create the team chore
        const [teamChore] = await db
          .insert(teamChores)
          .values({
            familyId: session.familyId,
            name: data.name,
            description: data.description,
            totalPoints: data.totalPoints,
            participatingChildren: data.participatingChildren,
          })
          .returning();

        return respondWithFamily(session.familyId);
      }
      case 'updateTeamChore': {
        const session = await requireSession();
        const data = z.object({
          teamChoreId: z.string(),
          name: z.string().min(1),
          description: z.string().min(1),
          totalPoints: z.number().int().positive(),
          participatingChildren: z.array(z.string()).min(1),
        }).parse(payload);

        // Verify the team chore belongs to the family
        const [existing] = await db
          .select()
          .from(teamChores)
          .where(and(
            eq(teamChores.id, data.teamChoreId),
            eq(teamChores.familyId, session.familyId)
          ))
          .limit(1);

        if (!existing) {
          return errorResponse('Team klusje niet gevonden.', 404);
        }

        // Verify all participating children belong to the family
        const family = await loadFamilyWithRelations(session.familyId);
        if (!family) {
          return errorResponse('Gezin niet gevonden.', 404);
        }

        const familyChildIds = (family as any).children.map((child: any) => child.id);
        const invalidChildren = data.participatingChildren.filter(childId => !familyChildIds.includes(childId));

        if (invalidChildren.length > 0) {
          return errorResponse('Sommige kinderen behoren niet tot dit gezin.', 400);
        }

        // Update the team chore
        await db
          .update(teamChores)
          .set({
            name: data.name,
            description: data.description,
            totalPoints: data.totalPoints,
            participatingChildren: data.participatingChildren,
          })
          .where(eq(teamChores.id, data.teamChoreId));

        return respondWithFamily(session.familyId);
      }
      case 'deleteTeamChore': {
        const session = await requireSession();
        const data = z.object({ teamChoreId: z.string() }).parse(payload);

        // Verify the team chore belongs to the family
        const [existing] = await db
          .select()
          .from(teamChores)
          .where(and(
            eq(teamChores.id, data.teamChoreId),
            eq(teamChores.familyId, session.familyId)
          ))
          .limit(1);

        if (!existing) {
          return errorResponse('Team klusje niet gevonden.', 404);
        }

        // Delete the team chore
        await db.delete(teamChores).where(eq(teamChores.id, data.teamChoreId));

        return respondWithFamily(session.familyId);
      }
      case 'completeTeamChore': {
        const session = await requireSession();
        const data = z.object({ teamChoreId: z.string() }).parse(payload);

        // Verify the team chore belongs to the family and is not completed
        const [existing] = await db
          .select()
          .from(teamChores)
          .where(and(
            eq(teamChores.id, data.teamChoreId),
            eq(teamChores.familyId, session.familyId),
            isNull(teamChores.completedAt)
          ))
          .limit(1);

        if (!existing) {
          return errorResponse('Team klusje niet gevonden of al voltooid.', 404);
        }

        // Calculate points per child
        const pointsPerChild = Math.floor(existing.totalPoints / existing.participatingChildren.length);

        // Award points to each participating child
        for (const childId of existing.participatingChildren) {
          await db
            .update(children)
            .set({
              points: sql`${children.points} + ${pointsPerChild}`,
              totalPointsEver: sql`${children.totalPointsEver} + ${pointsPerChild}`,
            })
            .where(eq(children.id, childId));

          // Record transaction
          await db.insert(pointsTransactions).values({
            familyId: session.familyId,
            childId,
            type: 'earned',
            amount: pointsPerChild,
            description: `Team klusje "${existing.name}" voltooid`,
            balanceBefore: 0, // We don't have the before balance here, so using 0 as placeholder
            balanceAfter: pointsPerChild,
          });
        }

        // Mark team chore as completed
        await db
          .update(teamChores)
          .set({
            progress: 100,
            completedAt: new Date(),
          })
          .where(eq(teamChores.id, data.teamChoreId));

        return respondWithFamily(session.familyId);
      }
      case 'updateTeamChoreProgress': {
        const session = await requireSession();
        const data = z.object({
          teamChoreId: z.string(),
          progress: z.number().int().min(0).max(100),
        }).parse(payload);

        // Verify the team chore belongs to the family
        const [existing] = await db
          .select()
          .from(teamChores)
          .where(and(
            eq(teamChores.id, data.teamChoreId),
            eq(teamChores.familyId, session.familyId)
          ))
          .limit(1);

        if (!existing) {
          return errorResponse('Team klusje niet gevonden.', 404);
        }

        // Update progress
        await db
          .update(teamChores)
          .set({ progress: data.progress })
          .where(eq(teamChores.id, data.teamChoreId));

        return respondWithFamily(session.familyId);
      }
      case 'unlockAvatarItem': {
        const session = await requireSession();
        const data = unlockAvatarItemSchema.parse(payload);

        // Verify the child belongs to the family
        const family = await loadFamilyWithRelations(session.familyId) as { children: { id: string }[] } | null;
        if (!family?.children.some(child => child.id === data.childId)) {
          return errorResponse('Kind niet gevonden in gezin.', 404);
        }

        // Get the child and item details
        const [child] = await db
          .select()
          .from(children)
          .where(eq(children.id, data.childId))
          .limit(1);

        if (!child) {
          return errorResponse('Kind niet gevonden.', 404);
        }

        const [item] = await db
          .select()
          .from(avatarItems)
          .where(eq(avatarItems.id, data.itemId))
          .limit(1);

        if (!item) {
          return errorResponse('Item niet gevonden.', 404);
        }

        // Check if child has enough XP
        if (child.xp < item.xpRequired) {
          return errorResponse('Niet genoeg XP.', 400);
        }

        // Check if already unlocked
        const [existing] = await db
          .select()
          .from(avatarCustomizations)
          .where(and(
            eq(avatarCustomizations.childId, data.childId),
            eq(avatarCustomizations.itemId, data.itemId)
          ))
          .limit(1);

        if (existing) {
          return errorResponse('Item is al ontgrendeld.', 400);
        }

        // Unlock the item
        await db.insert(avatarCustomizations).values({
          childId: data.childId,
          itemId: data.itemId,
        });

        // Deduct XP from child
        await db
          .update(children)
          .set({ xp: child.xp - item.xpRequired })
          .where(eq(children.id, data.childId));

        return respondWithFamily(session.familyId);
      }
      case 'equipAvatarItem': {
        const session = await requireSession();
        const data = equipAvatarItemSchema.parse(payload);

        // Verify the child belongs to the family
        const family = await loadFamilyWithRelations(session.familyId) as { children: { id: string }[] } | null;
        if (!family?.children.some(child => child.id === data.childId)) {
          return errorResponse('Kind niet gevonden in gezin.', 404);
        }

        // Check if the child owns this item
        const [existing] = await db
          .select()
          .from(avatarCustomizations)
          .where(and(
            eq(avatarCustomizations.childId, data.childId),
            eq(avatarCustomizations.itemId, data.itemId)
          ))
          .limit(1);

        if (!existing) {
          return errorResponse('Item niet in bezit.', 400);
        }

        // Update the equipped status
        await db
          .update(avatarCustomizations)
          .set({ isEquipped: data.equip ? 1 : 0 })
          .where(and(
            eq(avatarCustomizations.childId, data.childId),
            eq(avatarCustomizations.itemId, data.itemId)
          ));

        return respondWithFamily(session.familyId);
      }
      case 'updateAutomationSettings': {
        const session = await requireSession();
        const data = z.object({
          autoPayouts: z.boolean(),
          dailyReminders: z.boolean(),
          photoApprovals: z.boolean(),
        }).parse(payload);

        // For now, we'll store this in a simple way
        // In a real app, you'd want to store this in a database
        // For demonstration purposes, we'll just return success
        console.log('Automation settings updated:', data);

        return NextResponse.json({
          success: true,
          message: 'Automation settings updated successfully',
          settings: data,
        });
      }
      default:
        return errorResponse('Onbekende actie.', 400);
    }
  } catch (error) {
    console.error('[api/app]', action, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('[api/app] Error details:', { action, errorMessage, errorStack });

    // Handle authentication errors
    if (errorMessage === 'Unauthenticated') {
      return errorResponse('Niet geauthenticeerd. Log opnieuw in.', 401);
    }

    if (errorMessage === 'UNAUTHORIZED_ADMIN') {
      return errorResponse('Onvoldoende rechten voor deze actie.', 403);
    }

    if (error instanceof z.ZodError) {
      return errorResponse('Ongeldige gegevens.', 400);
    }

    // Return more detailed error in development
    if (process.env.NODE_ENV === 'development') {
      return errorResponse(`Er ging iets mis: ${errorMessage}`, 500);
    }

    return errorResponse('Er ging iets mis.', 500);
  }
}
