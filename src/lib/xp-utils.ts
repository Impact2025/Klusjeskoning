import { Child } from './types';

export const XP_LEVEL_THRESHOLDS = [
  0,      // Level 1
  100,    // Level 2
  250,    // Level 3
  450,    // Level 4
  700,    // Level 5
  1000,   // Level 6
  1400,   // Level 7
  1900,   // Level 8
  2500,   // Level 9
  3200,   // Level 10
  4000,   // Level 11
  4900,   // Level 12
  5900,   // Level 13
  7000,   // Level 14
  8200,   // Level 15
  9500,   // Level 16
  10900,  // Level 17
  12400,  // Level 18
  14000,  // Level 19
  15700,  // Level 20
  17500,  // Level 21
  19400,  // Level 22
  21400,  // Level 23
  23500,  // Level 24
  25700,  // Level 25
];

export const getLevelFromXp = (xp: number): number => {
  for (let i = XP_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVEL_THRESHOLDS[i]) {
      return i + 1;
    }
  }
  return 1;
};

export const getXpForNextLevel = (currentLevel: number): number => {
  if (currentLevel >= XP_LEVEL_THRESHOLDS.length) {
    return XP_LEVEL_THRESHOLDS[XP_LEVEL_THRESHOLDS.length - 1];
  }
  return XP_LEVEL_THRESHOLDS[currentLevel];
};

export const getXpProgressInLevel = (xp: number, level: number): { current: number; needed: number; percentage: number } => {
  const levelStart = XP_LEVEL_THRESHOLDS[level - 1] || 0;
  const levelEnd = getXpForNextLevel(level);
  const currentInLevel = xp - levelStart;
  const neededForNext = levelEnd - levelStart;
  const percentage = Math.min((currentInLevel / neededForNext) * 100, 100);

  return {
    current: currentInLevel,
    needed: neededForNext,
    percentage,
  };
};

export const getLevelInfo = (child: Child) => {
  const level = getLevelFromXp(child.totalXpEver);
  const progress = getXpProgressInLevel(child.totalXpEver, level);

  return {
    level,
    currentXp: child.xp,
    totalXp: child.totalXpEver,
    progress,
    nextLevelXp: getXpForNextLevel(level),
  };
};

export const calculateChoreXp = (points: number, isQuick: boolean = false, isBonus: boolean = false): number => {
  let baseXp = Math.floor(points * 0.5); // Base XP is 50% of points

  if (isQuick) baseXp += 10; // Bonus for quick completion
  if (isBonus) baseXp += 25; // Bonus for special achievements

  return Math.max(baseXp, 5); // Minimum 5 XP
};

export const LEVEL_BADGES = [
  { level: 1, name: 'Beginner', icon: '🌱' },
  { level: 5, name: 'Helper', icon: '🛠️' },
  { level: 10, name: 'Assistant', icon: '🤝' },
  { level: 15, name: 'Expert', icon: '⭐' },
  { level: 20, name: 'Master', icon: '👑' },
  { level: 25, name: 'Legend', icon: '🏆' },
];