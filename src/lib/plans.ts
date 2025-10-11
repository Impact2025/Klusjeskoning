import { isSameMonth } from 'date-fns';
import type { Family, PlanTier, SubscriptionInfo } from './types';

export type PlanFeatureKey =
  | 'aiHelper'
  | 'virtualPet'
  | 'donations'
  | 'themes'
  | 'familyGoalsManagement';

export type PlanDefinition = {
  id: PlanTier;
  label: string;
  tagline: string;
  priceMonthlyCents: number;
  priceYearlyCents: number;
  limits: {
    maxChildren: number | null;
    monthlyChoreQuota: number | null;
  };
  features: Record<PlanFeatureKey, boolean>;
  includedHighlights: string[];
  missingHighlights: string[];
};

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  starter: {
    id: 'starter',
    label: 'Gratis (Starter)',
    tagline: 'Voor kleine gezinnen om kennis te maken',
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    limits: {
      maxChildren: 2,
      monthlyChoreQuota: 10,
    },
    features: {
      aiHelper: false,
      virtualPet: false,
      donations: false,
      themes: false,
      familyGoalsManagement: false,
    },
    includedHighlights: [
      'Max. 2 kinderen',
      '10 klusjes per maand',
      'Basisdashboard',
      'Punten & spaardoelen',
    ],
    missingHighlights: [
      'Geen AI-helper',
      'Geen virtueel huisdier & badges',
      'Geen donaties naar goede doelen',
      'Geen thema’s aanpassen',
      'Geen beheer van spaardoelen door ouders',
    ],
  },
  premium: {
    id: 'premium',
    label: 'Premium (Gezin+)',
    tagline: 'Alles voor actieve gezinnen',
    priceMonthlyCents: 399,
    priceYearlyCents: 3900,
    limits: {
      maxChildren: null,
      monthlyChoreQuota: null,
    },
    features: {
      aiHelper: true,
      virtualPet: true,
      donations: true,
      themes: true,
      familyGoalsManagement: true,
    },
    includedHighlights: [
      'Onbeperkte klusjes & kinderen',
      'AI-klusassistent (Gemini)',
      'Virtueel huisdier & badges',
      'Gezinsdoelen & donaties',
      'Aanpasbare thema’s',
      'E-mail support',
    ],
    missingHighlights: [],
  },
};

export const planOrder: PlanTier[] = ['starter', 'premium'];

export const getPlanDefinition = (plan: PlanTier): PlanDefinition => PLAN_DEFINITIONS[plan];

export const getActivePlan = (subscription?: SubscriptionInfo | null): PlanTier => subscription?.plan ?? 'starter';

export const isPremiumPlan = (subscription?: SubscriptionInfo | null): boolean => getActivePlan(subscription) === 'premium';

export const hasFeature = (subscription: SubscriptionInfo | undefined, feature: PlanFeatureKey): boolean => {
  const plan = getActivePlan(subscription);
  return PLAN_DEFINITIONS[plan].features[feature];
};

type GateCheck = { allowed: boolean; reason?: string };

export const canAddChild = (family: Family | null | undefined): GateCheck => {
  if (!family) return { allowed: false, reason: 'Geen gezin geladen.' };
  const plan = PLAN_DEFINITIONS[getActivePlan(family.subscription)];
  const maxChildren = plan.limits.maxChildren;
  if (typeof maxChildren === 'number' && family.children.length >= maxChildren) {
    return {
      allowed: false,
      reason: `Upgrade naar Premium voor onbeperkte kinderen (max. ${maxChildren} op Starter).`,
    };
  }
  return { allowed: true };
};

export const choresThisMonth = (family: Family | null | undefined): number => {
  if (!family) return 0;
  const now = new Date();
  return family.chores.filter((chore) => {
    const { createdAt } = chore;
    if (!createdAt) return false;
    try {
      // Firestore Timestamp objects expose a toDate() method
      if (typeof (createdAt as any).toDate === 'function') {
        return isSameMonth((createdAt as any).toDate(), now);
      }
      if (createdAt instanceof Date) {
        return isSameMonth(createdAt, now);
      }
      return false;
    } catch (error) {
      return false;
    }
  }).length;
};

export const canAddChore = (family: Family | null | undefined): GateCheck => {
  if (!family) return { allowed: false, reason: 'Geen gezin geladen.' };
  const plan = PLAN_DEFINITIONS[getActivePlan(family.subscription)];
  const quota = plan.limits.monthlyChoreQuota;
  if (typeof quota === 'number' && choresThisMonth(family) >= quota) {
    return {
      allowed: false,
      reason: `Je hebt het maandquotum (${quota}) bereikt. Upgrade voor onbeperkte klusjes.`,
    };
  }
  return { allowed: true };
};

export const formatPrice = (amountInCents: number): string => {
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amountInCents / 100);
};
