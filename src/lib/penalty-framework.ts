/**
 * Penalty Framework for KlusjesKoning
 *
 * Implements structured penalty system with proportionality and recovery options.
 */

export type PenaltyType =
  | 'incomplete_chore'
  | 'quality_insufficient'
  | 'false_evidence'
  | 'repeated_rejection'
  | 'time_limit_exceeded';

export type RecoveryOption =
  | 'complete_task'
  | 'correct_task'
  | 'earn_bonus_points'
  | 'wait_timeout'
  | 'parent_approval';

export interface PenaltyRule {
  type: PenaltyType;
  maxPenaltyPercent: number; // Maximum penalty as percentage of original chore value
  recoveryOptions: RecoveryOption[];
  description: string;
  enabled: boolean;
}

export interface PenaltyConfig {
  rules: Record<PenaltyType, PenaltyRule>;
  globalSettings: {
    maxPenaltyPercent: number; // Overall maximum penalty percentage
    penaltyTimeoutHours: number; // Hours before penalty can be appealed
    allowAppeals: boolean;
  };
}

export interface AppliedPenalty {
  id: string;
  childId: string;
  choreId: string;
  penaltyType: PenaltyType;
  originalPoints: number;
  penaltyPoints: number;
  recoveryOption?: RecoveryOption;
  appliedAt: Date;
  recoveredAt?: Date;
  notes?: string;
}

// Default penalty configuration
export const DEFAULT_PENALTY_CONFIG: PenaltyConfig = {
  rules: {
    incomplete_chore: {
      type: 'incomplete_chore',
      maxPenaltyPercent: 0, // No penalty, just no reward
      recoveryOptions: ['complete_task'],
      description: 'Klusje niet voltooid - geen beloning, maar wel opnieuw proberen',
      enabled: true,
    },
    quality_insufficient: {
      type: 'quality_insufficient',
      maxPenaltyPercent: 50,
      recoveryOptions: ['correct_task', 'earn_bonus_points'],
      description: 'Kwaliteit onvoldoende - gedeeltelijke penalty met hersteloptie',
      enabled: true,
    },
    false_evidence: {
      type: 'false_evidence',
      maxPenaltyPercent: 25,
      recoveryOptions: ['earn_bonus_points', 'parent_approval'],
      description: 'Vals bewijs ingediend - penalty voor oneerlijkheid',
      enabled: true,
    },
    repeated_rejection: {
      type: 'repeated_rejection',
      maxPenaltyPercent: 100,
      recoveryOptions: ['wait_timeout', 'parent_approval'],
      description: 'Herhaaldelijke afwijzing - tijdelijke opschorting',
      enabled: false, // Disabled by default - parents must opt-in
    },
    time_limit_exceeded: {
      type: 'time_limit_exceeded',
      maxPenaltyPercent: 25,
      recoveryOptions: ['complete_task', 'earn_bonus_points'],
      description: 'Tijdslimiet overschreden - penalty voor te laat indienen',
      enabled: false, // Disabled by default
    },
  },
  globalSettings: {
    maxPenaltyPercent: 25, // Overall maximum
    penaltyTimeoutHours: 24, // 24 hours to appeal
    allowAppeals: true,
  },
};

/**
 * Calculate penalty amount based on rule and chore value
 */
export function calculatePenaltyAmount(
  penaltyType: PenaltyType,
  chorePoints: number,
  config: PenaltyConfig
): number {
  const rule = config.rules[penaltyType];
  if (!rule || !rule.enabled) {
    return 0;
  }

  const maxPenalty = Math.floor((chorePoints * rule.maxPenaltyPercent) / 100);
  const globalMaxPenalty = Math.floor((chorePoints * config.globalSettings.maxPenaltyPercent) / 100);

  // Use the more restrictive limit
  return Math.min(maxPenalty, globalMaxPenalty);
}

/**
 * Validate if a penalty can be applied
 */
export function validatePenaltyApplication(
  penaltyType: PenaltyType,
  chorePoints: number,
  config: PenaltyConfig
): { valid: boolean; reason?: string } {
  const rule = config.rules[penaltyType];

  if (!rule) {
    return { valid: false, reason: 'Onbekend penalty type' };
  }

  if (!rule.enabled) {
    return { valid: false, reason: 'Penalty type is uitgeschakeld' };
  }

  if (chorePoints <= 0) {
    return { valid: false, reason: 'Geen punten om penalty op toe te passen' };
  }

  return { valid: true };
}

/**
 * Get available recovery options for a penalty type
 */
export function getRecoveryOptions(
  penaltyType: PenaltyType,
  config: PenaltyConfig
): RecoveryOption[] {
  const rule = config.rules[penaltyType];
  return rule?.recoveryOptions || [];
}

/**
 * Check if a penalty can be appealed based on timeout
 */
export function canAppealPenalty(
  appliedAt: Date,
  config: PenaltyConfig
): boolean {
  if (!config.globalSettings.allowAppeals) {
    return false;
  }

  const hoursSinceApplied = (Date.now() - appliedAt.getTime()) / (1000 * 60 * 60);
  return hoursSinceApplied <= config.globalSettings.penaltyTimeoutHours;
}

/**
 * Create a penalty configuration for a family
 */
export function createFamilyPenaltyConfig(
  overrides: Partial<PenaltyConfig> = {}
): PenaltyConfig {
  return {
    ...DEFAULT_PENALTY_CONFIG,
    ...overrides,
    rules: {
      ...DEFAULT_PENALTY_CONFIG.rules,
      ...overrides.rules,
    },
    globalSettings: {
      ...DEFAULT_PENALTY_CONFIG.globalSettings,
      ...overrides.globalSettings,
    },
  };
}

/**
 * Apply a penalty to a chore completion
 */
export function applyPenaltyToChore(
  penaltyType: PenaltyType,
  chorePoints: number,
  config: PenaltyConfig
): {
  penaltyApplied: boolean;
  penaltyAmount: number;
  finalPoints: number;
  recoveryOptions: RecoveryOption[];
} {
  const validation = validatePenaltyApplication(penaltyType, chorePoints, config);

  if (!validation.valid) {
    return {
      penaltyApplied: false,
      penaltyAmount: 0,
      finalPoints: chorePoints,
      recoveryOptions: [],
    };
  }

  const penaltyAmount = calculatePenaltyAmount(penaltyType, chorePoints, config);
  const finalPoints = Math.max(0, chorePoints - penaltyAmount);
  const recoveryOptions = getRecoveryOptions(penaltyType, config);

  return {
    penaltyApplied: penaltyAmount > 0,
    penaltyAmount,
    finalPoints,
    recoveryOptions,
  };
}

/**
 * Get penalty statistics for monitoring
 */
export function getPenaltyStats(
  appliedPenalties: AppliedPenalty[]
): {
  totalPenalties: number;
  totalPointsPenalized: number;
  penaltiesByType: Record<PenaltyType, number>;
  recoveryRate: number;
} {
  const totalPenalties = appliedPenalties.length;
  const totalPointsPenalized = appliedPenalties.reduce((sum, p) => sum + p.penaltyPoints, 0);
  const recoveredPenalties = appliedPenalties.filter(p => p.recoveredAt).length;

  const penaltiesByType = appliedPenalties.reduce((acc, penalty) => {
    acc[penalty.penaltyType] = (acc[penalty.penaltyType] || 0) + 1;
    return acc;
  }, {} as Record<PenaltyType, number>);

  const recoveryRate = totalPenalties > 0 ? (recoveredPenalties / totalPenalties) * 100 : 0;

  return {
    totalPenalties,
    totalPointsPenalized,
    penaltiesByType,
    recoveryRate,
  };
}