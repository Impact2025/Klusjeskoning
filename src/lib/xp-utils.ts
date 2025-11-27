/**
 * XP and Level System for KlusjesKoning
 *
 * This module implements the exponential level progression system
 * where XP requirements grow exponentially with each level.
 */

// Level configuration with exponential growth
export const LEVEL_CONFIG = [
  { level: 1, xpRequired: 0, title: 'Starter', unlocks: ['Basis avatar'] },
  { level: 2, xpRequired: 100, title: 'Helper', unlocks: [] },
  { level: 3, xpRequired: 250, title: 'Helper', unlocks: [] },
  { level: 4, xpRequired: 450, title: 'Helper', unlocks: [] },
  { level: 5, xpRequired: 700, title: 'Helper', unlocks: ['Virtueel huisdier'] },
  { level: 6, xpRequired: 1000, title: 'Doener', unlocks: [] },
  { level: 7, xpRequired: 1350, title: 'Doener', unlocks: [] },
  { level: 8, xpRequired: 1750, title: 'Doener', unlocks: [] },
  { level: 9, xpRequired: 2200, title: 'Doener', unlocks: [] },
  { level: 10, xpRequired: 2700, title: 'Doener', unlocks: ['Team klusjes'] },
  { level: 11, xpRequired: 3250, title: 'Expert', unlocks: [] },
  { level: 12, xpRequired: 3850, title: 'Expert', unlocks: [] },
  { level: 13, xpRequired: 4500, title: 'Expert', unlocks: [] },
  { level: 14, xpRequired: 5200, title: 'Expert', unlocks: [] },
  { level: 15, xpRequired: 5950, title: 'Expert', unlocks: ['Basis badges'] },
  { level: 16, xpRequired: 6750, title: 'Meester', unlocks: [] },
  { level: 17, xpRequired: 7600, title: 'Meester', unlocks: [] },
  { level: 18, xpRequired: 8500, title: 'Meester', unlocks: [] },
  { level: 19, xpRequired: 9450, title: 'Meester', unlocks: [] },
  { level: 20, xpRequired: 10450, title: 'Meester', unlocks: ['Zeldzame badges'] },
  { level: 21, xpRequired: 11500, title: 'Kampioen', unlocks: [] },
  { level: 22, xpRequired: 12600, title: 'Kampioen', unlocks: [] },
  { level: 23, xpRequired: 13750, title: 'Kampioen', unlocks: [] },
  { level: 24, xpRequired: 14950, title: 'Kampioen', unlocks: [] },
  { level: 25, xpRequired: 16200, title: 'Kampioen', unlocks: ['Epische items'] },
  { level: 26, xpRequired: 17500, title: 'Legende', unlocks: [] },
  { level: 27, xpRequired: 18850, title: 'Legende', unlocks: [] },
  { level: 28, xpRequired: 20250, title: 'Legende', unlocks: [] },
  { level: 29, xpRequired: 21700, title: 'Legende', unlocks: [] },
  { level: 30, xpRequired: 23200, title: 'Legende', unlocks: ['Donatie boost'] },
  { level: 31, xpRequired: 24750, title: 'Held', unlocks: [] },
  { level: 32, xpRequired: 26350, title: 'Held', unlocks: [] },
  { level: 33, xpRequired: 28000, title: 'Held', unlocks: [] },
  { level: 34, xpRequired: 29700, title: 'Held', unlocks: [] },
  { level: 35, xpRequired: 31450, title: 'Held', unlocks: ['Virtuele huisdier upgrades'] },
  { level: 36, xpRequired: 33250, title: 'Icoon', unlocks: [] },
  { level: 37, xpRequired: 35100, title: 'Icoon', unlocks: [] },
  { level: 38, xpRequired: 37000, title: 'Icoon', unlocks: [] },
  { level: 39, xpRequired: 38950, title: 'Icoon', unlocks: [] },
  { level: 40, xpRequired: 40950, title: 'Icoon', unlocks: ['Familie leiderbord'] },
  { level: 41, xpRequired: 43000, title: 'Mythe', unlocks: [] },
  { level: 42, xpRequired: 45100, title: 'Mythe', unlocks: [] },
  { level: 43, xpRequired: 47250, title: 'Mythe', unlocks: [] },
  { level: 44, xpRequired: 49450, title: 'Mythe', unlocks: [] },
  { level: 45, xpRequired: 51700, title: 'Mythe', unlocks: ['Legendary items'] },
  { level: 46, xpRequired: 54000, title: 'Titaan', unlocks: [] },
  { level: 47, xpRequired: 56350, title: 'Titaan', unlocks: [] },
  { level: 48, xpRequired: 58750, title: 'Titaan', unlocks: [] },
  { level: 49, xpRequired: 61200, title: 'Titaan', unlocks: [] },
  { level: 50, xpRequired: 63700, title: 'Titaan', unlocks: ['Klusjes Koning status'] },
];

/**
 * Badge icons for different level milestones
 */
export const LEVEL_BADGES = [
  { level: 1, icon: '🌱' },
  { level: 5, icon: '⭐' },
  { level: 10, icon: '🏆' },
  { level: 15, icon: '💎' },
  { level: 20, icon: '👑' },
  { level: 25, icon: '🎖️' },
  { level: 30, icon: '🔥' },
  { level: 35, icon: '⚡' },
  { level: 40, icon: '🚀' },
  { level: 45, icon: '💫' },
  { level: 50, icon: '👑' },
];

/**
 * Get level from XP (helper function)
 */
export function getLevelFromXp(totalXp: number): number {
  let currentLevel = 1;
  for (const levelConfig of LEVEL_CONFIG) {
    if (totalXp >= levelConfig.xpRequired) {
      currentLevel = levelConfig.level;
    } else {
      break;
    }
  }
  return currentLevel;
}

/**
 * Calculate the current level based on total XP
 */
export function calculateLevel(totalXp: number): {
  level: number;
  title: string;
  currentLevelXp: number;
  nextLevelXp: number;
  progressToNext: number;
  unlocks: string[];
} {
  // Find the highest level the user has reached
  let currentLevel = 1;
  for (const levelConfig of LEVEL_CONFIG) {
    if (totalXp >= levelConfig.xpRequired) {
      currentLevel = levelConfig.level;
    } else {
      break;
    }
  }

  const levelConfig = LEVEL_CONFIG.find(l => l.level === currentLevel);
  const nextLevelConfig = LEVEL_CONFIG.find(l => l.level === currentLevel + 1);

  if (!levelConfig) {
    throw new Error(`Invalid level configuration for level ${currentLevel}`);
  }

  const currentLevelXp = levelConfig.xpRequired;
  const nextLevelXp = nextLevelConfig ? nextLevelConfig.xpRequired : currentLevelXp;
  const xpInCurrentLevel = totalXp - currentLevelXp;
  const xpNeededForNext = nextLevelXp - currentLevelXp;
  const progressToNext = xpNeededForNext > 0 ? (xpInCurrentLevel / xpNeededForNext) * 100 : 100;

  return {
    level: currentLevel,
    title: levelConfig.title,
    currentLevelXp,
    nextLevelXp,
    progressToNext: Math.min(100, Math.max(0, progressToNext)),
    unlocks: levelConfig.unlocks,
  };
}

/**
 * Get XP required for a specific level
 */
export function getXpForLevel(level: number): number {
  const levelConfig = LEVEL_CONFIG.find(l => l.level === level);
  return levelConfig ? levelConfig.xpRequired : 0;
}

/**
 * Check if a child just leveled up and get level-up information
 */
export function checkLevelUp(oldXp: number, newXp: number): {
  leveledUp: boolean;
  newLevel?: number;
  oldLevel?: number;
  unlocks?: string[];
} {
  const oldLevelInfo = calculateLevel(oldXp);
  const newLevelInfo = calculateLevel(newXp);

  if (newLevelInfo.level > oldLevelInfo.level) {
    return {
      leveledUp: true,
      newLevel: newLevelInfo.level,
      oldLevel: oldLevelInfo.level,
      unlocks: newLevelInfo.unlocks,
    };
  }

  return { leveledUp: false };
}

/**
 * Calculate XP reward for chore completion
 * Returns 10-20% of points earned as XP
 */
export function calculateXpReward(pointsEarned: number): number {
  if (pointsEarned <= 0) return 0;

  // Base XP is 15% of points earned
  const baseXp = Math.floor(pointsEarned * 0.15);

  // Add some randomness (±10%) to make it feel more gamified
  const variance = Math.floor(baseXp * 0.1 * (Math.random() * 2 - 1));
  const finalXp = Math.max(1, baseXp + variance); // Minimum 1 XP

  return finalXp;
}

/**
 * Get level progress information for UI display
 */
export function getLevelProgressInfo(totalXp: number): {
  currentLevel: number;
  currentTitle: string;
  progressPercent: number;
  xpToNextLevel: number;
  nextLevelTitle?: string;
} {
  const levelInfo = calculateLevel(totalXp);

  return {
    currentLevel: levelInfo.level,
    currentTitle: levelInfo.title,
    progressPercent: levelInfo.progressToNext,
    xpToNextLevel: levelInfo.nextLevelXp - totalXp,
    nextLevelTitle: LEVEL_CONFIG.find(l => l.level === levelInfo.level + 1)?.title,
  };
}