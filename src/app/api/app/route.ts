import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sql, eq, and } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { children, avatarItems, avatarCustomizations } from '@/server/db/schema';

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
          name: data.name ?? existing.name,
          points: data.points ?? existing.points,
          assignedTo: data.assignedTo ?? existing.assignments.map((assignment) => assignment.childId),
          status: data.status ?? existing.status,
          submittedBy: data.submittedBy ?? existing.submittedByChildId,
          submittedAt: data.submittedBy ? new Date() : existing.submittedAt,
          emotion: data.emotion ?? existing.emotion,
          photoUrl: data.photoUrl ?? existing.photoUrl,
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

        // Send email notification to parent about chore submission
        await sendNotification(request, {
          type: 'chore_submitted',
          to: session.family.email,
          data: {
            parentName: session.family.familyName,
            choreId: data.choreId,
            childId: data.childId,
            emotion: data.emotion,
            submittedAt: data.submittedAt || new Date().toISOString(),
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
          assignedTo: data.assignedTo ?? existing.assignments.map((assignment) => assignment.childId),
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
