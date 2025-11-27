/**
 * Economic Inflation Control System for KlusjesKoning
 *
 * Implements dynamic pricing adjustments and point sinks to prevent inflation.
 */

export interface EconomicMetrics {
  averagePointsBalance: number;
  totalPointsInCirculation: number;
  pointsEarnedThisWeek: number;
  pointsSpentThisWeek: number;
  inflationRate: number;
  rewardRedemptionRate: number;
}

export interface DynamicPricingConfig {
  inflationThreshold: number; // Average balance threshold for inflation
  maxInflationCorrection: number; // Maximum price increase (1.5 = 50% increase)
  correctionStep: number; // How much to increase prices per threshold breach
  stabilizationPeriodDays: number; // Days to wait before adjusting prices back down
}

export interface PointSink {
  id: string;
  name: string;
  description: string;
  pointRequirement: number;
  category: 'avatar' | 'pet' | 'event' | 'donation';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  active: boolean;
  unlockLevel?: number;
}

export interface EconomicConfig {
  dynamicPricing: DynamicPricingConfig;
  pointSinks: PointSink[];
  externalChoreRates: {
    euroToPoints: number; // €1 = X points
    pointsToEuro: number; // X points = €1
  };
}

// Default economic configuration
export const DEFAULT_ECONOMIC_CONFIG: EconomicConfig = {
  dynamicPricing: {
    inflationThreshold: 500, // Average balance threshold
    maxInflationCorrection: 1.5, // 50% max increase
    correctionStep: 0.1, // 10% increase per threshold breach
    stabilizationPeriodDays: 7, // Wait 7 days before reducing prices
  },
  pointSinks: [
    // Avatar cosmetics
    {
      id: 'avatar_hat_rare',
      name: 'Zeldzame Hoed',
      description: 'Een coole zeldzame hoed voor je avatar',
      pointRequirement: 150,
      category: 'avatar',
      rarity: 'rare',
      active: true,
      unlockLevel: 15,
    },
    {
      id: 'avatar_background_epic',
      name: 'Epische Achtergrond',
      description: 'Een spectaculaire achtergrond voor je profiel',
      pointRequirement: 300,
      category: 'avatar',
      rarity: 'epic',
      active: true,
      unlockLevel: 25,
    },
    // Pet upgrades
    {
      id: 'pet_food_premium',
      name: 'Premium Huisdier Voer',
      description: 'Speciaal voer voor extra snelle groei',
      pointRequirement: 75,
      category: 'pet',
      rarity: 'common',
      active: true,
      unlockLevel: 5,
    },
    {
      id: 'pet_house_luxury',
      name: 'Luxe Huisdier Huis',
      description: 'Een prachtig huis voor je virtuele huisdier',
      pointRequirement: 200,
      category: 'pet',
      rarity: 'rare',
      active: true,
      unlockLevel: 20,
    },
    // Seasonal events
    {
      id: 'event_halloween_costume',
      name: 'Halloween Kostuum',
      description: 'Speciaal Halloween kostuum (seizoensgebonden)',
      pointRequirement: 100,
      category: 'event',
      rarity: 'rare',
      active: false, // Only active during events
    },
    // Donation boosts
    {
      id: 'donation_multiplier_2x',
      name: '2x Donatie Vermenigvuldiger',
      description: 'Je donaties tellen dubbel voor een week',
      pointRequirement: 250,
      category: 'donation',
      rarity: 'epic',
      active: true,
      unlockLevel: 30,
    },
  ],
  externalChoreRates: {
    euroToPoints: 100, // €1 = 100 points
    pointsToEuro: 150, // 150 points = €1
  },
};

/**
 * Calculate inflation correction factor based on economic metrics
 */
export function calculateInflationCorrection(
  metrics: EconomicMetrics,
  config: DynamicPricingConfig
): number {
  const { averagePointsBalance } = metrics;
  const { inflationThreshold, maxInflationCorrection, correctionStep } = config;

  if (averagePointsBalance <= inflationThreshold) {
    return 1.0; // No correction needed
  }

  // Calculate how many thresholds we've breached
  const thresholdBreaches = Math.floor(averagePointsBalance / inflationThreshold) - 1;
  const correction = 1.0 + (thresholdBreaches * correctionStep);

  // Cap at maximum correction
  return Math.min(correction, maxInflationCorrection);
}

/**
 * Apply dynamic pricing to reward costs
 */
export function applyDynamicPricing(
  baseRewardCost: number,
  inflationCorrection: number
): number {
  return Math.ceil(baseRewardCost * inflationCorrection);
}

/**
 * Get active point sinks based on child level and current date
 */
export function getActivePointSinks(
  childLevel: number,
  config: EconomicConfig
): PointSink[] {
  const now = new Date();
  const currentMonth = now.getMonth();

  return config.pointSinks.filter(sink => {
    // Check if unlocked by level
    if (sink.unlockLevel && childLevel < sink.unlockLevel) {
      return false;
    }

    // Check seasonal activation (example: Halloween in October)
    if (sink.category === 'event') {
      // Halloween event in October
      if (sink.id.includes('halloween') && currentMonth === 9) { // October is month 9
        return true;
      }
      // Christmas event in December
      if (sink.id.includes('christmas') && currentMonth === 11) { // December is month 11
        return true;
      }
      return false; // Event not active
    }

    return sink.active;
  });
}

/**
 * Calculate economic health score (0-100)
 */
export function calculateEconomicHealth(
  metrics: EconomicMetrics
): {
  score: number;
  status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
} {
  const recommendations: string[] = [];
  let score = 100;

  // Check inflation
  if (metrics.inflationRate > 20) {
    score -= 30;
    recommendations.push('Hoge inflatie gedetecteerd - overweeg prijsaanpassingen');
  } else if (metrics.inflationRate > 10) {
    score -= 15;
    recommendations.push('Matige inflatie - monitor voortgang');
  }

  // Check spending vs earning ratio
  const spendingRatio = metrics.pointsSpentThisWeek / metrics.pointsEarnedThisWeek;
  if (spendingRatio < 0.3) {
    score -= 25;
    recommendations.push('Te weinig uitgaven - punten hopen zich op');
  } else if (spendingRatio < 0.6) {
    score -= 10;
    recommendations.push('Gemiddelde uitgaven - houd in de gaten');
  }

  // Check average balance
  if (metrics.averagePointsBalance > 1000) {
    score -= 20;
    recommendations.push('Hoge gemiddelde saldo - overweeg nieuwe beloningen');
  } else if (metrics.averagePointsBalance > 500) {
    score -= 10;
    recommendations.push('Gemiddeld saldo boven normaal');
  }

  // Determine status
  let status: 'healthy' | 'warning' | 'critical';
  if (score >= 80) {
    status = 'healthy';
  } else if (score >= 60) {
    status = 'warning';
  } else {
    status = 'critical';
  }

  return { score, status, recommendations };
}

/**
 * Calculate external chore payment conversion
 */
export function calculateExternalChorePayment(
  euroAmount: number,
  direction: 'euro_to_points' | 'points_to_euro',
  config: EconomicConfig
): number {
  const rates = config.externalChoreRates;

  if (direction === 'euro_to_points') {
    return euroAmount * rates.euroToPoints;
  } else {
    return euroAmount / rates.pointsToEuro;
  }
}

/**
 * Get economic dashboard data for parents
 */
export function getEconomicDashboardData(
  metrics: EconomicMetrics,
  config: EconomicConfig
): {
  health: ReturnType<typeof calculateEconomicHealth>;
  inflationCorrection: number;
  recommendedActions: string[];
  pointSinks: PointSink[];
} {
  const health = calculateEconomicHealth(metrics);
  const inflationCorrection = calculateInflationCorrection(metrics, config.dynamicPricing);
  const pointSinks = getActivePointSinks(1, config); // Default to level 1 for general view

  const recommendedActions = [
    ...health.recommendations,
    inflationCorrection > 1.1 ? 'Prijsaanpassingen actief - monitor impact' : null,
    pointSinks.length < 5 ? 'Overweeg nieuwe beloningen toe te voegen' : null,
  ].filter(Boolean) as string[];

  return {
    health,
    inflationCorrection,
    recommendedActions,
    pointSinks,
  };
}