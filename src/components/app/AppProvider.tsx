"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import confetti from 'canvas-confetti';

import {
  PLAN_DEFINITIONS,
  getActivePlan,
  canAddChild,
  canAddChore,
  isPremiumPlan,
  choresThisMonth,
  hasFeature as planHasFeature,
  type PlanDefinition,
  type PlanFeatureKey,
} from '@/lib/plans';
import type {
  Screen,
  Family,
  Child,
  Chore,
  Reward,
  RewardType,
  AdminStats,
  GoodCause,
  PlanTier,
  SubscriptionInfo,
  BillingInterval,
  BlogPost,
  Review,
  PublishStatus,
} from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Timestamp, serializeTimestamp } from '@/lib/timestamp';
import {
  callAppApi,
  fetchCurrentFamily,
  mapFamily,
  mapGoodCause,
  mapBlogPost,
  mapReview,
  mapAdminStats,
  mapAdminFamily,
  mapFinancialOverview,
  mapSubscriptionEvent,
  type AdminFamilySummary,
  type SubscriptionEvent,
} from '@/lib/api/app-client';
import type { SerializableAdminFamily, SerializableSubscriptionEvent } from '@/lib/api/types';
import type {
  SerializableFamily,
  SerializableGoodCause,
  SerializableBlogPost,
  SerializableReview,
  AdminStatsPayload,
} from '@/lib/api/types';

type NotificationType = 'info' | 'success' | 'destructive';

type BlogPostInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string | null;
  tags: string[];
  status: PublishStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Timestamp | null;
};

type ReviewInput = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  rating: number;
  author: string;
  status: PublishStatus;
  seoTitle?: string | null;
  seoDescription?: string | null;
  publishedAt?: Timestamp | null;
};

type AdminFamilyInput = {
  familyName: string;
  city: string;
  email: string;
  password: string;
  familyCode?: string;
};

type AdminFamilyUpdateInput = {
  familyId: string;
  familyName?: string;
  city?: string;
  email?: string;
  password?: string;
  familyCode?: string;
};

type FinancialOverview = {
  stats: {
    totalRevenue: number;
    activeSubscriptions: number;
    monthlyGrowth: number;
    avgSubscriptionValue: number;
  };
  recentSubscriptions: SubscriptionEvent[];
};

interface AppContextType {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
  isLoading: boolean;
  activePlan: PlanTier;
  planDefinition: PlanDefinition;
  isPremium: boolean;
  monthlyChoreUsage: number;
  canAccessFeature: (feature: PlanFeatureKey) => boolean;
  family: Family | null;
  user: Child | null;
  adminStats: AdminStats | null;
  goodCauses: GoodCause[] | null;
  blogPosts: BlogPost[] | null;
  reviews: Review[] | null;
  adminFamilies: AdminFamilySummary[] | null;
  financialOverview: FinancialOverview | null;
  loginParent: (email: string, password: string) => Promise<void>;
  loginAdmin: (email: string, password: string) => Promise<void>;
  registerFamily: (familyName: string, city: string, email: string, password: string) => Promise<void>;
  startRegistration: (familyName: string, city: string, email: string, password: string) => Promise<{ email: string }>;
  verifyRegistration: (email: string, code: string, familyName: string, city: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginChildStep1: (familyCode: string) => Promise<void>;
  selectChildProfile: (childId: string) => void;
  submitPin: (pin: string) => void;
  addChild: (name: string, pin: string, avatar: string) => Promise<void>;
  updateChild: (childId: string, updates: Partial<Child>) => Promise<void>;
  addChore: (name: string, points: number, assignedTo: string[], options?: { recurrenceType?: string; recurrenceDays?: string | null }) => Promise<void>;
  updateChore: (choreId: string, updates: Partial<Chore>) => Promise<void>;
  addReward: (name: string, points: number, type: RewardType, assignedTo: string[]) => Promise<void>;
  updateReward: (rewardId: string, updates: Partial<Reward>) => Promise<void>;
  approveChore: (choreId: string) => Promise<void>;
  rejectChore: (choreId: string) => Promise<void>;
  deleteItem: (collection: 'children' | 'chores' | 'rewards', itemId: string) => Promise<void>;
  submitChoreForApproval: (choreId: string, emotion: string, photoFile: File | null) => Promise<void>;
  redeemReward: (rewardId: string) => Promise<void>;
  markRewardAsGiven: (pendingRewardId: string) => Promise<void>;
  saveRecoveryEmail: (email: string) => Promise<void>;
  recoverFamilyCode: (email: string) => Promise<void>;
  getAdminStats: () => Promise<void>;
  getGoodCauses: () => Promise<void>;
  addGoodCause: (cause: Omit<GoodCause, 'id'>) => Promise<void>;
  updateGoodCause: (causeId: string, updates: Partial<Omit<GoodCause, 'id'>>) => Promise<void>;
  deleteGoodCause: (causeId: string) => Promise<void>;
  getBlogPosts: () => Promise<void>;
  createBlogPost: (data: BlogPostInput) => Promise<void>;
  updateBlogPost: (postId: string, data: BlogPostInput) => Promise<void>;
  deleteBlogPost: (postId: string) => Promise<void>;
  getReviews: () => Promise<void>;
  createReview: (data: ReviewInput) => Promise<void>;
  updateReview: (reviewId: string, data: ReviewInput) => Promise<void>;
  deleteReview: (reviewId: string) => Promise<void>;
  startPremiumCheckout: (interval: BillingInterval, couponCode?: string) => Promise<string | null>;
  confirmPremiumCheckout: (orderId: string, interval: BillingInterval) => Promise<boolean>;
  getAdminFamilies: () => Promise<void>;
  createAdminFamily: (data: AdminFamilyInput) => Promise<void>;
  updateAdminFamily: (data: AdminFamilyUpdateInput) => Promise<void>;
  deleteAdminFamily: (familyId: string) => Promise<void>;
  getFinancialOverview: () => Promise<void>;
  getCoupons: () => Promise<any[]>;
  createCoupon: (data: any) => Promise<any>;
  updateCoupon: (couponId: string, data: any) => Promise<any>;
  deleteCoupon: (couponId: string) => Promise<void>;
  getCouponStats: () => Promise<any>;
  generateCouponCode: () => Promise<string>;
  upgradeFamilyToPro: (familyId: string, options?: any) => Promise<any>;
  downgradeFamilyAccount: (familyId: string, options?: any) => Promise<any>;
  setFamilySubscription: (familyId: string, subscriptionData: any) => Promise<any>;
  extendFamilySubscription: (familyId: string, additionalMonths: number, orderId?: string) => Promise<any>;
  unlockAvatarItem: (itemId: string) => Promise<void>;
  equipAvatarItem: (itemId: string, equip: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const getInitialScreen = (): Screen => {
  if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
    if (window.location.pathname === '/admin') {
      return 'adminLogin';
    }
  }
  return 'landing';
};

const useNotification = () => {
  const { toast } = useToast();
  return useCallback(
    (type: NotificationType, title: string, description: string) => {
      toast({ variant: type === 'destructive' ? 'destructive' : 'default', title, description });
    },
    [toast]
  );
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const notify = useNotification();

  const [currentScreen, setScreen] = useState<Screen>(() => getInitialScreen());
  const [isLoading, setIsLoading] = useState(false);
  const [family, setFamily] = useState<Family | null>(null);
  const [user, setUser] = useState<Child | null>(null);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [goodCauses, setGoodCauses] = useState<GoodCause[] | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[] | null>(null);
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [adminFamilies, setAdminFamilies] = useState<AdminFamilySummary[] | null>(null);
  const [financialOverview, setFinancialOverview] = useState<FinancialOverview | null>(null);

  const activePlan = useMemo(() => getActivePlan(family?.subscription as SubscriptionInfo | undefined), [family?.subscription]);
  const planDefinition = PLAN_DEFINITIONS[activePlan];
  const isPremium = isPremiumPlan(family?.subscription as SubscriptionInfo | undefined);
  const monthlyChoreUsage = choresThisMonth(family);
  const canAccessFeature = useCallback(
    (feature: PlanFeatureKey) => planHasFeature(family?.subscription as SubscriptionInfo | undefined, feature),
    [family?.subscription]
  );

  const applyFamily = useCallback((payload: SerializableFamily | null) => {
    if (payload) {
      const mapped = mapFamily(payload);
      setFamily(mapped);
      if (user) {
        const updatedUser = mapped.children.find((child) => child.id === user.id);
        setUser(updatedUser ?? null);
      }
    } else {
      setFamily(null);
      setUser(null);
    }
  }, [user]);

  const refreshFamily = useCallback(async () => {
    try {
      const current = await fetchCurrentFamily();
      if (current) {
        applyFamily(current);

        // Check if we have a child session by checking if user is set and we're in child flow
        if (user && (currentScreen === 'childPin' || currentScreen === 'childDashboard')) {
          // Keep the existing child user and screen
          return;
        }

        // Default parent dashboard for parent sessions
        setScreen((prev) => (prev === 'landing' || prev === 'parentLogin' ? 'parentDashboard' : prev));
      }
      // If no session but we're in child login flow, don't reset anything
    } catch (error) {
      console.error('refreshFamily error', error);
      // Don't reset family or screen during child login flow
    }
  }, [applyFamily, user, currentScreen]);

  useEffect(() => {
    void refreshFamily();
  }, [refreshFamily]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.pathname === '/admin' && currentScreen !== 'adminLogin' && currentScreen !== 'adminDashboard') {
      setScreen('adminLogin');
    }
  }, [currentScreen]);

  const handleAction = useCallback(
    async <T extends object>(action: string, payload: unknown, onSuccess?: (data: T) => void) => {
      setIsLoading(true);
      try {
        const data = await callAppApi<T>(action, payload);
        onSuccess?.(data);
        return data;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Er ging iets mis.';
        notify('destructive', 'Fout', message);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [notify]
  );

  const loginParent = useCallback(async (email: string, password: string) => {
    await handleAction<{ family: SerializableFamily }>('loginParent', { email, password }, ({ family }) => {
      applyFamily(family ?? null);
      // Check if family needs setup wizard (no children yet)
      if (!family?.children || family.children.length === 0) {
        setScreen('familySetup');
      } else {
        setScreen('parentDashboard');
      }
      notify('success', 'Welkom terug!', 'Je bent succesvol ingelogd.');
    });
  }, [applyFamily, handleAction, notify]);

  // Handle post-login redirects - only for actual checkout flows
  useEffect(() => {
    if (family && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const checkout = urlParams.get('checkout');
      if (checkout === 'premium') {
        // Remove the checkout parameter and redirect to upgrade
        urlParams.delete('checkout');
        const newUrl = urlParams.toString()
          ? `${window.location.pathname}?${urlParams.toString()}`
          : window.location.pathname;
        window.history.replaceState({}, '', newUrl);
        // Small delay to ensure state is updated
        setTimeout(() => {
          if (typeof window !== 'undefined' && window.location) {
            window.location.href = '/app/upgrade';
          }
        }, 100);
      } else {
        // Clear any stale pendingCheckout that's not from an actual checkout flow
        const pendingCheckout = sessionStorage.getItem('pendingCheckout');
        if (pendingCheckout === 'premium' && !checkout) {
          sessionStorage.removeItem('pendingCheckout');
        }
      }
    }
  }, [family]);

  const loginAdmin = useCallback(async (email: string, password: string) => {
    await handleAction<{ family: SerializableFamily }>('adminLogin', { email, password }, ({ family }) => {
      applyFamily(family ?? null);
      setScreen('adminDashboard');
      notify('success', 'Welkom terug!', 'Je bent ingelogd als admin.');
    });
  }, [applyFamily, handleAction, notify]);

  const registerFamily = useCallback(async (familyName: string, city: string, email: string, password: string) => {
    await handleAction<{ family: SerializableFamily }>('registerFamily', { familyName, city, email, password }, ({ family }) => {
      applyFamily(family ?? null);
      // Check if family needs setup wizard (no children yet)
      if (!family?.children || family.children.length === 0) {
        setScreen('familySetup');
      } else {
        setScreen('parentDashboard');
      }
      notify('success', 'Welkom!', 'Je gezin is aangemaakt. Controleer je e-mail voor de gezinscode.');
    });
  }, [applyFamily, handleAction, notify]);

  const startRegistration = useCallback(async (familyName: string, city: string, email: string, password: string) => {
    const result = await handleAction<{ success: boolean; message: string; email: string }>('startRegistration', { familyName, city, email, password });
    notify('success', 'Code verzonden', 'Controleer je email voor de verificatiecode.');
    return { email: result.email };
  }, [handleAction, notify]);

  const verifyRegistration = useCallback(async (email: string, code: string, familyName: string, city: string, password: string) => {
    await handleAction<{ family: SerializableFamily }>('verifyRegistration', { email, code, familyName, city, password }, ({ family }) => {
      applyFamily(family ?? null);
      // Check if family needs setup wizard (no children yet)
      if (!family?.children || family.children.length === 0) {
        setScreen('familySetup');
      } else {
        setScreen('parentDashboard');
      }
      notify('success', 'Welkom!', 'Je account is succesvol aangemaakt.');
    });
  }, [applyFamily, handleAction, notify]);

  const logout = useCallback(async () => {
    await handleAction('logout', undefined, () => {
      applyFamily(null);
      setScreen('landing');
      setAdminFamilies(null);
      setFinancialOverview(null);
      setAdminStats(null);
      setBlogPosts(null);
      setReviews(null);
      setGoodCauses(null);
      notify('info', 'Uitgelogd', 'Je bent succesvol uitgelogd.');
    });
  }, [applyFamily, handleAction, notify]);

  const selectChildProfile = useCallback((childId: string) => {
    if (!family) return;
    const selected = family.children.find((child) => child.id === childId);
    if (selected) {
      setUser(selected);
      setScreen('childPin');
    }
  }, [family]);

  const submitPin = useCallback(async (pin: string) => {
    if (!user || !family) {
      notify('destructive', 'Fout', 'Geen kind geselecteerd.');
      return;
    }
    await handleAction<{ family: SerializableFamily }>('loginChild', {
      familyId: family.id,
      childId: user.id,
      pin
    }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      setScreen('childDashboard');
      notify('success', 'Welkom!', `Hoi ${user.name}!`);
    });
  }, [applyFamily, family, handleAction, notify, user]);

  const addChild = useCallback(async (name: string, pin: string, avatar: string) => {
    if (!family) return;
    const gate = canAddChild(family);
    if (!gate.allowed) {
      notify('destructive', 'Upgrade nodig', gate.reason || 'Het maximum aantal kinderen is bereikt.');
      return;
    }
    await handleAction<{ family: SerializableFamily }>('addChild', { name, pin, avatar }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', `${name} is toegevoegd!`);
    });
  }, [applyFamily, family, handleAction, notify]);

  const updateChild = useCallback(async (childId: string, updates: Partial<Child>) => {
    await handleAction<{ family: SerializableFamily }>('updateChild', { childId, ...updates }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Gegevens van het kind zijn bijgewerkt.');
    });
  }, [applyFamily, handleAction, notify]);

  const addChore = useCallback(async (name: string, points: number, assignedTo: string[], options?: { recurrenceType?: string; recurrenceDays?: string | null }) => {
    if (!family) return;
    const gate = canAddChore(family);
    if (!gate.allowed) {
      notify('destructive', 'Upgrade nodig', gate.reason || 'Je hebt de limiet voor deze maand bereikt.');
      return;
    }
    const xpReward = Math.floor(points / 10) + 1; // Simple XP calculation
    await handleAction<{ family: SerializableFamily }>('addChore', {
      name,
      points,
      assignedTo,
      xpReward,
      recurrenceType: options?.recurrenceType || 'none',
      recurrenceDays: options?.recurrenceDays || null
    }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Klusje toegevoegd.');
    });
  }, [applyFamily, family, handleAction, notify]);

  const updateChore = useCallback(async (choreId: string, updates: Partial<Chore>) => {
    await handleAction<{ family: SerializableFamily }>('updateChore', { choreId, ...updates }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Klusje bijgewerkt.');
    });
  }, [applyFamily, handleAction, notify]);

  const addReward = useCallback(async (name: string, points: number, type: RewardType, assignedTo: string[]) => {
    if (!family) return;
    if (type === 'donation' && !planHasFeature(family.subscription as SubscriptionInfo | undefined, 'donations')) {
      notify('destructive', 'Premium nodig', 'Donaties zijn onderdeel van het Gezin+ abonnement.');
      return;
    }
    await handleAction<{ family: SerializableFamily }>('addReward', { name, points, type, assignedTo }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Beloning toegevoegd.');
    });
  }, [applyFamily, family, handleAction, notify]);

  const updateReward = useCallback(async (rewardId: string, updates: Partial<Reward>) => {
    await handleAction<{ family: SerializableFamily }>('updateReward', { rewardId, ...updates }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Beloning bijgewerkt.');
    });
  }, [applyFamily, handleAction, notify]);

  const approveChore = useCallback(async (choreId: string) => {
    await handleAction<{ family: SerializableFamily }>('approveChore', { id: choreId }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Klusje goedgekeurd.');
    });
  }, [applyFamily, handleAction, notify]);

  const rejectChore = useCallback(async (choreId: string) => {
    await handleAction<{ family: SerializableFamily }>('rejectChore', { id: choreId }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('info', 'Info', 'Klusje is weer beschikbaar.');
    });
  }, [applyFamily, handleAction, notify]);

  const deleteItem = useCallback(async (collection: 'children' | 'chores' | 'rewards', itemId: string) => {
    const actionName = collection === 'children' ? 'deleteChild' : collection === 'chores' ? 'deleteChore' : 'deleteReward';
    const payload = collection === 'children' ? { childId: itemId } : collection === 'chores' ? { choreId: itemId } : { rewardId: itemId };
    await handleAction<{ family: SerializableFamily }>(actionName, payload, ({ family: payloadFamily }) => {
      applyFamily(payloadFamily ?? null);
      notify('success', 'Succes', 'Item verwijderd.');
    });
  }, [applyFamily, handleAction, notify]);

  const submitChoreForApproval = useCallback(async (choreId: string, emotion: string, photoFile: File | null) => {
    if (!user || !family) {
      notify('destructive', 'Fout', 'Geen kind geselecteerd.');
      return;
    }
    setIsLoading(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        try {
          const formData = new FormData();
          formData.append('file', photoFile);
          formData.append('folder', 'chore-proof');

          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });

          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json();
            photoUrl = uploadData.url;
          } else {
            console.warn('Photo upload failed, continuing without photo');
          }
        } catch (uploadError) {
          console.warn('Photo upload error:', uploadError);
          // Continue without photo
        }
      }
      const result = await callAppApi<{ family: SerializableFamily }>('submitChoreForApproval', {
        choreId,
        childId: user.id,
        emotion,
        photoUrl,
        submittedAt: new Date().toISOString(),
      });
      applyFamily(result.family ?? null);
      notify('success', 'Top gedaan!', 'Klusje is ter controle verstuurd.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Er ging iets mis bij het indienen van het klusje.';
      notify('destructive', 'Fout', message);
    } finally {
      setIsLoading(false);
    }
  }, [applyFamily, family, notify, user]);

  const redeemReward = useCallback(async (rewardId: string) => {
    if (!user) return;
    await handleAction<{ family: SerializableFamily }>('redeemReward', { childId: user.id, rewardId }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Goed gedaan!', 'Je hebt de beloning ingewisseld.');
      confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
    });
  }, [applyFamily, handleAction, notify, user]);

  const markRewardAsGiven = useCallback(async (pendingRewardId: string) => {
    await handleAction<{ family: SerializableFamily }>('markRewardAsGiven', { pendingRewardId }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Succes', 'Beloning afgehandeld.');
    });
  }, [applyFamily, handleAction, notify]);

  const saveRecoveryEmail = useCallback(async (email: string) => {
    await handleAction<{ family: SerializableFamily }>('saveRecoveryEmail', { email }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Opgeslagen', 'Herstel-e-mailadres opgeslagen.');
    });
  }, [applyFamily, handleAction, notify]);

  const recoverFamilyCode = useCallback(async (email: string) => {
    await handleAction('recoverFamilyCode', { email }, () => {
      notify('info', 'E-mail verzonden', 'Als het adres bestaat, is de gezinscode verstuurd.');
      setScreen('parentLogin');
    });
  }, [handleAction, notify]);

  const getAdminStats = useCallback(async () => {
    await handleAction<{ adminStats: AdminStatsPayload }>('getAdminStats', undefined, ({ adminStats: stats }) => {
      setAdminStats(mapAdminStats(stats));
    });
  }, [handleAction]);

  const getAdminFamilies = useCallback(async () => {
    await handleAction<{ families: SerializableAdminFamily[] }>('adminListFamilies', undefined, ({ families }) => {
      setAdminFamilies(families.map(mapAdminFamily));
    });
  }, [handleAction]);

  const createAdminFamily = useCallback(async (data: AdminFamilyInput) => {
    await handleAction<{ families: SerializableAdminFamily[] }>('adminCreateFamily', data, ({ families }) => {
      setAdminFamilies(families.map(mapAdminFamily));
      notify('success', 'Gezin toegevoegd', 'Het nieuwe gezin is aangemaakt.');
    });
  }, [handleAction, notify]);

  const updateAdminFamily = useCallback(async (data: AdminFamilyUpdateInput) => {
    await handleAction<{ families: SerializableAdminFamily[] }>('adminUpdateFamily', data, ({ families }) => {
      setAdminFamilies(families.map(mapAdminFamily));
      notify('success', 'Gezin bijgewerkt', 'De gezinsgegevens zijn opgeslagen.');
    });
  }, [handleAction, notify]);

  const deleteAdminFamily = useCallback(async (familyId: string) => {
    await handleAction<{ families: SerializableAdminFamily[] }>('adminDeleteFamily', { familyId }, ({ families }) => {
      setAdminFamilies(families.map(mapAdminFamily));
      notify('info', 'Gezin verwijderd', 'Het gezin is verwijderd.');
    });
  }, [handleAction, notify]);

  const getFinancialOverview = useCallback(async () => {
    await handleAction<{ stats: FinancialOverview['stats']; recentSubscriptions: SerializableSubscriptionEvent[] }>('getFinancialOverview', undefined, ({ stats, recentSubscriptions }) => {
      setFinancialOverview({
        stats,
        recentSubscriptions: recentSubscriptions.map(mapSubscriptionEvent),
      });
    });
  }, [handleAction]);

  const getCoupons = useCallback(async () => {
    const result = await handleAction<{ coupons: any[] }>('getCoupons', undefined);
    return result.coupons;
  }, [handleAction]);

  const createCoupon = useCallback(async (data: any) => {
    return await handleAction<any>('createCoupon', data);
  }, [handleAction]);

  const updateCoupon = useCallback(async (couponId: string, data: any) => {
    return await handleAction<any>('updateCoupon', { couponId, ...data });
  }, [handleAction]);

  const deleteCoupon = useCallback(async (couponId: string) => {
    await handleAction<{ success: boolean }>('deleteCoupon', { couponId });
  }, [handleAction]);

  const getCouponStats = useCallback(async () => {
    const result = await handleAction<{ couponStats: any }>('getCouponStats', undefined);
    return result.couponStats;
  }, [handleAction]);

  const generateCouponCode = useCallback(async () => {
    const result = await handleAction<{ code: string }>('generateCouponCode', undefined);
    return result.code;
  }, [handleAction]);

  const upgradeFamilyToPro = useCallback(async (familyId: string, options?: any) => {
    return await handleAction<any>('upgradeFamilyToPro', { familyId, ...options });
  }, [handleAction]);

  const downgradeFamilyAccount = useCallback(async (familyId: string, options?: any) => {
    return await handleAction<any>('downgradeFamilyAccount', { familyId, ...options });
  }, [handleAction]);

  const setFamilySubscription = useCallback(async (familyId: string, subscriptionData: any) => {
    return await handleAction<any>('setFamilySubscription', { familyId, ...subscriptionData });
  }, [handleAction]);

  const extendFamilySubscription = useCallback(async (familyId: string, additionalMonths: number, orderId?: string) => {
    return await handleAction<any>('extendFamilySubscription', { familyId, additionalMonths, orderId });
  }, [handleAction]);

  const unlockAvatarItem = useCallback(async (itemId: string) => {
    if (!user) return;
    await handleAction<{ family: SerializableFamily }>('unlockAvatarItem', { childId: user.id, itemId }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', 'Item ontgrendeld!', 'Je kunt dit item nu gebruiken.');
    });
  }, [applyFamily, handleAction, notify, user]);

  const equipAvatarItem = useCallback(async (itemId: string, equip: boolean) => {
    if (!user) return;
    await handleAction<{ family: SerializableFamily }>('equipAvatarItem', { childId: user.id, itemId, equip }, ({ family: payload }) => {
      applyFamily(payload ?? null);
      notify('success', equip ? 'Item aangehad!' : 'Item uitgedaan!', 'Je avatar is bijgewerkt.');
    });
  }, [applyFamily, handleAction, notify, user]);

  const getGoodCauses = useCallback(async () => {
    await handleAction<{ goodCauses: SerializableGoodCause[] }>('getGoodCauses', undefined, ({ goodCauses: payload }) => {
      setGoodCauses(payload.map(mapGoodCause));
    });
  }, [handleAction]);

  const loginChildStep1 = useCallback(async (familyCode: string) => {
    await handleAction<{ family: SerializableFamily }>('lookupFamilyByCode', { familyCode }, ({ family: payload }) => {
      if (!payload) {
        notify('destructive', 'Fout', 'Gezinscode niet gevonden.');
        return;
      }
      applyFamily(payload);
      setScreen('childProfileSelect');
      void getGoodCauses();
    });
  }, [applyFamily, getGoodCauses, handleAction, notify]);

  const addGoodCause = useCallback(async (cause: Omit<GoodCause, 'id'>) => {
    await handleAction<{ goodCauses: SerializableGoodCause[] }>('saveGoodCause', {
      name: cause.name,
      description: cause.description,
      startDate: serializeTimestamp(cause.startDate) ?? new Date().toISOString(),
      endDate: serializeTimestamp(cause.endDate) ?? new Date().toISOString(),
      logoUrl: cause.logoUrl ?? null,
    }, ({ goodCauses: payload }) => {
      setGoodCauses(payload.map(mapGoodCause));
      notify('success', 'Succes', 'Goed doel toegevoegd.');
    });
  }, [handleAction, notify]);

  const updateGoodCause = useCallback(async (causeId: string, updates: Partial<Omit<GoodCause, 'id'>>) => {
    await handleAction<{ goodCauses: SerializableGoodCause[] }>('saveGoodCause', {
      causeId,
      name: updates.name,
      description: updates.description,
      startDate: updates.startDate ? serializeTimestamp(updates.startDate) : undefined,
      endDate: updates.endDate ? serializeTimestamp(updates.endDate) : undefined,
      logoUrl: updates.logoUrl ?? null,
    }, ({ goodCauses: payload }) => {
      setGoodCauses(payload.map(mapGoodCause));
      notify('success', 'Succes', 'Goed doel bijgewerkt.');
    });
  }, [handleAction, notify]);

  const deleteGoodCause = useCallback(async (causeId: string) => {
    await handleAction<{ goodCauses: SerializableGoodCause[] }>('deleteGoodCause', { id: causeId }, ({ goodCauses: payload }) => {
      setGoodCauses(payload.map(mapGoodCause));
      notify('success', 'Succes', 'Goed doel verwijderd.');
    });
  }, [handleAction, notify]);

  const getBlogPosts = useCallback(async () => {
    await handleAction<{ blogPosts: SerializableBlogPost[] }>('getBlogPosts', undefined, ({ blogPosts: payload }) => {
      setBlogPosts(payload.map(mapBlogPost));
    });
  }, [handleAction]);

  const createBlogPost = useCallback(async (data: BlogPostInput) => {
    await handleAction<{ blogPosts: SerializableBlogPost[] }>('saveBlogPost', {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImageUrl: data.coverImageUrl ?? null,
      tags: data.tags,
      status: data.status,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      publishedAt: data.publishedAt ? serializeTimestamp(data.publishedAt) : null,
    }, ({ blogPosts: payload }) => {
      setBlogPosts(payload.map(mapBlogPost));
      notify('success', 'Succes', 'Blogpost opgeslagen.');
    });
  }, [handleAction, notify]);

  const updateBlogPost = useCallback(async (postId: string, data: BlogPostInput) => {
    await handleAction<{ blogPosts: SerializableBlogPost[] }>('saveBlogPost', {
      postId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      coverImageUrl: data.coverImageUrl ?? null,
      tags: data.tags,
      status: data.status,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      publishedAt: data.publishedAt ? serializeTimestamp(data.publishedAt) : null,
    }, ({ blogPosts: payload }) => {
      setBlogPosts(payload.map(mapBlogPost));
      notify('success', 'Succes', 'Blogpost bijgewerkt.');
    });
  }, [handleAction, notify]);

  const deleteBlogPost = useCallback(async (postId: string) => {
    await handleAction<{ blogPosts: SerializableBlogPost[] }>('deleteBlogPost', { id: postId }, ({ blogPosts: payload }) => {
      setBlogPosts(payload.map(mapBlogPost));
      notify('success', 'Succes', 'Blogpost verwijderd.');
    });
  }, [handleAction, notify]);

  const getReviews = useCallback(async () => {
    await handleAction<{ reviews: SerializableReview[] }>('getReviews', undefined, ({ reviews: payload }) => {
      setReviews(payload.map(mapReview));
    });
  }, [handleAction]);

  const createReview = useCallback(async (data: ReviewInput) => {
    await handleAction<{ reviews: SerializableReview[] }>('saveReview', {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      rating: data.rating,
      author: data.author,
      status: data.status,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      publishedAt: data.publishedAt ? serializeTimestamp(data.publishedAt) : null,
    }, ({ reviews: payload }) => {
      setReviews(payload.map(mapReview));
      notify('success', 'Succes', 'Review opgeslagen.');
    });
  }, [handleAction, notify]);

  const updateReview = useCallback(async (reviewId: string, data: ReviewInput) => {
    await handleAction<{ reviews: SerializableReview[] }>('saveReview', {
      reviewId,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      rating: data.rating,
      author: data.author,
      status: data.status,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      publishedAt: data.publishedAt ? serializeTimestamp(data.publishedAt) : null,
    }, ({ reviews: payload }) => {
      setReviews(payload.map(mapReview));
      notify('success', 'Succes', 'Review bijgewerkt.');
    });
  }, [handleAction, notify]);

  const deleteReview = useCallback(async (reviewId: string) => {
    await handleAction<{ reviews: SerializableReview[] }>('deleteReview', { id: reviewId }, ({ reviews: payload }) => {
      setReviews(payload.map(mapReview));
      notify('success', 'Succes', 'Review verwijderd.');
    });
  }, [handleAction, notify]);

  const startPremiumCheckout = useCallback(async (interval: BillingInterval, couponCode?: string) => {
    if (!family) {
      notify('destructive', 'Geen gezin gevonden', 'Log opnieuw in en probeer het nog eens.');
      return null;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family.id,
          email: family.email,
          familyName: family.familyName,
          interval,
          plan: 'premium',
          couponCode,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Kon betaalverzoek niet starten.');
      }
      const paymentUrl = data?.paymentUrl as string | undefined;
      if (!paymentUrl) {
        throw new Error('Geen betaal-URL ontvangen.');
      }
      sessionStorage.setItem('pendingCheckout', 'premium');
      return paymentUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Probeer het later opnieuw.';
      notify('destructive', 'Betaling mislukt', message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [family, notify]);

  const confirmPremiumCheckout = useCallback(async (orderId: string, interval: BillingInterval) => {
    if (!family) {
      notify('destructive', 'Geen gezin gevonden', 'Log opnieuw in en probeer het nog eens.');
      return false;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/billing/confirm-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Kon betaling niet bevestigen.');
      }
      if (data.status !== 'completed') {
        notify('destructive', 'Betaling niet afgerond', 'De betaling is nog niet voltooid.');
        return false;
      }
      await handleAction<{ family: SerializableFamily }>('refreshFamily', undefined, ({ family: payload }) => {
        applyFamily(payload ?? null);
      });
      notify('success', 'Welkom bij Gezin+', 'Je gezin heeft nu toegang tot alle premium functies.');
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Probeer het later opnieuw.';
      notify('destructive', 'Bevestigen mislukt', message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [applyFamily, family, handleAction, notify]);

  const contextValue = useMemo<AppContextType>(() => ({
    currentScreen,
    setScreen,
    isLoading,
    activePlan,
    planDefinition,
    isPremium,
    monthlyChoreUsage,
    canAccessFeature,
    family,
    user,
    adminStats,
    goodCauses,
    blogPosts,
    reviews,
    adminFamilies,
    financialOverview,
    loginParent,
    loginAdmin,
    registerFamily,
    startRegistration,
    verifyRegistration,
    logout,
    loginChildStep1,
    selectChildProfile,
    submitPin,
    addChild,
    updateChild,
    addChore,
    updateChore,
    addReward,
    updateReward,
    approveChore,
    rejectChore,
    deleteItem,
    submitChoreForApproval,
    redeemReward,
    markRewardAsGiven,
    saveRecoveryEmail,
    recoverFamilyCode,
    getAdminStats,
    getGoodCauses,
    addGoodCause,
    updateGoodCause,
    deleteGoodCause,
    getBlogPosts,
    createBlogPost,
    updateBlogPost,
    deleteBlogPost,
    getReviews,
    createReview,
    updateReview,
    deleteReview,
    startPremiumCheckout,
    confirmPremiumCheckout,
    getAdminFamilies,
    createAdminFamily,
    updateAdminFamily,
    deleteAdminFamily,
    getFinancialOverview,
    getCoupons,
    createCoupon,
    updateCoupon,
    deleteCoupon,
    getCouponStats,
    generateCouponCode,
    upgradeFamilyToPro,
    downgradeFamilyAccount,
    setFamilySubscription,
    extendFamilySubscription,
    unlockAvatarItem,
    equipAvatarItem,
  }), [
    activePlan,
    addChild,
    addChore,
    addGoodCause,
    addReward,
    approveChore,
    blogPosts,
    canAccessFeature,
    confirmPremiumCheckout,
    createBlogPost,
    createReview,
    currentScreen,
    deleteBlogPost,
    deleteGoodCause,
    deleteItem,
    deleteReview,
    family,
    adminFamilies,
    financialOverview,
    getAdminStats,
    getAdminFamilies,
    getBlogPosts,
    getGoodCauses,
    getFinancialOverview,
    getReviews,
    goodCauses,
    isLoading,
    isPremium,
    loginChildStep1,
    loginParent,
    loginAdmin,
    logout,
    markRewardAsGiven,
    monthlyChoreUsage,
    redeemReward,
    recoverFamilyCode,
    registerFamily,
    createAdminFamily,
    updateAdminFamily,
    deleteAdminFamily,
    rejectChore,
    reviews,
    saveRecoveryEmail,
    selectChildProfile,
    startPremiumCheckout,
    submitChoreForApproval,
    submitPin,
    updateBlogPost,
    updateChild,
    updateChore,
    updateGoodCause,
    updateReward,
    updateReview,
    user,
    adminStats,
    planDefinition,
    unlockAvatarItem,
    equipAvatarItem,
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const useApp = useAppContext;
