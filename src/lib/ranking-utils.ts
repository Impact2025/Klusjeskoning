import { db } from '@/server/db/client';
import {
  rankSnapshots,
  children,
  families,
  friendConnections,
  rankingSettings,
  weeklyChampions,
  chores,
  pointsTransactions,
  virtualPets,
  externalChoreRequests,
  dailySpins,
  achievements,
  familyFeed
} from '@/server/db/schema';
import { eq, and, gte, lte, desc, sql, inArray } from 'drizzle-orm';
import { startOfWeek, endOfWeek, subWeeks, addWeeks, format } from 'date-fns';

/**
 * Convert Date to ISO date string for database storage
 */
function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export type RankingType = 'family' | 'friends' | 'powerklusjes';
export type RankingCategory = 'xp' | 'chores' | 'powerpoints' | 'streak' | 'pet_care';
export type RankingTier = 'diamond' | 'gold' | 'silver' | 'bronze';

export interface RankingEntry {
  childId: string;
  childName: string;
  score: number;
  rank: number;
  tier: RankingTier;
  title?: string;
  avatar?: string;
  previousRank?: number;
  streakDays?: number;
}

export interface RankingResult {
  entries: RankingEntry[];
  currentUserRank?: number;
  currentUserScore?: number;
  weekStart: Date;
  weekEnd: Date;
}

/**
 * Get the current week boundaries (Monday to Sunday)
 */
export function getCurrentWeekBounds(): { start: Date; end: Date } {
  const now = new Date();
  return {
    start: startOfWeek(now, { weekStartsOn: 1 }), // Monday
    end: endOfWeek(now, { weekStartsOn: 1 }) // Sunday
  };
}

/**
 * Calculate XP score for a child in a given week
 */
export async function calculateXPScore(childId: string, weekStart: Date, weekEnd: Date): Promise<number> {
  const result = await db
    .select({
      totalXP: sql<number>`COALESCE(SUM(${pointsTransactions.amount}), 0)`,
    })
    .from(pointsTransactions)
    .where(and(
      eq(pointsTransactions.childId, childId),
      eq(pointsTransactions.type, 'earned'),
      gte(pointsTransactions.createdAt, weekStart),
      lte(pointsTransactions.createdAt, weekEnd)
    ));

  return result[0]?.totalXP || 0;
}

/**
 * Calculate chores completed score for a child in a given week
 */
export async function calculateChoresScore(childId: string, weekStart: Date, weekEnd: Date): Promise<number> {
  const result = await db
    .select({
      completedChores: sql<number>`COUNT(*)`,
    })
    .from(chores)
    .where(and(
      eq(chores.submittedByChildId, childId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, weekStart),
      lte(chores.submittedAt, weekEnd)
    ));

  return result[0]?.completedChores || 0;
}

/**
 * Calculate PowerKlusjes score for a child in a given week
 */
export async function calculatePowerPointsScore(childId: string, weekStart: Date, weekEnd: Date): Promise<number> {
  const result = await db
    .select({
      totalPowerPoints: sql<number>`COALESCE(SUM(${externalChoreRequests.offeredAmountCents}), 0)`,
    })
    .from(externalChoreRequests)
    .where(and(
      eq(externalChoreRequests.childId, childId),
      eq(externalChoreRequests.status, 'completed'),
      gte(externalChoreRequests.completedAt, weekStart),
      lte(externalChoreRequests.completedAt, weekEnd)
    ));

  return result[0]?.totalPowerPoints || 0;
}

/**
 * Calculate pet care score for a child in a given week
 */
export async function calculatePetCareScore(childId: string, weekStart: Date, weekEnd: Date): Promise<number> {
  // For now, use virtual pet interactions as score
  // In future, could track feeding, playing, etc.
  const result = await db
    .select({
      interactions: sql<number>`COUNT(*)`,
    })
    .from(virtualPets)
    .where(and(
      eq(virtualPets.childId, childId),
      gte(virtualPets.lastInteraction, weekStart),
      lte(virtualPets.lastInteraction, weekEnd)
    ));

  return result[0]?.interactions || 0;
}

/**
 * Calculate streak score (consecutive days of activity)
 */
export async function calculateStreakScore(childId: string): Promise<number> {
  // This would need more complex logic to track consecutive days
  // For now, return a simple score based on recent activity
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const result = await db
    .select({
      activeDays: sql<number>`COUNT(DISTINCT DATE(${chores.submittedAt}))`,
    })
    .from(chores)
    .where(and(
      eq(chores.submittedByChildId, childId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, weekAgo)
    ));

  return result[0]?.activeDays || 0;
}

/**
 * Get tier based on rank position
 */
export function getTierFromRank(rank: number, totalParticipants: number): RankingTier {
  const percentile = (totalParticipants - rank + 1) / totalParticipants;

  if (percentile >= 0.9) return 'diamond';
  if (percentile >= 0.7) return 'gold';
  if (percentile >= 0.5) return 'silver';
  return 'bronze';
}

/**
 * Get title based on tier and category
 */
export function getTitleFromTier(tier: RankingTier, category: RankingCategory): string {
  const titles = {
    diamond: {
      xp: 'XP Kampioen',
      chores: 'Klusjes Koning',
      powerpoints: 'PowerKlusjes Held',
      streak: 'Streak Legende',
      pet_care: 'Dierenverzorger Extraordinaire'
    },
    gold: {
      xp: 'XP Held',
      chores: 'Super Helper',
      powerpoints: 'PowerKlusjes Ster',
      streak: 'Streak Kampioen',
      pet_care: 'Dierenverzorger'
    },
    silver: {
      xp: 'XP Expert',
      chores: 'Handige Helper',
      powerpoints: 'PowerKlusjes Vriend',
      streak: 'Streak Ster',
      pet_care: 'Huisdier Helper'
    },
    bronze: {
      xp: 'XP Starter',
      chores: 'Nieuwe Helper',
      powerpoints: 'PowerKlusjes Buddy',
      streak: 'Streak Starter',
      pet_care: 'Huisdier Vriend'
    }
  };

  return titles[tier][category] || 'Helper';
}

/**
 * Calculate ranking for a specific type and category
 */
export async function calculateRanking(
  familyId: string,
  rankingType: RankingType,
  category: RankingCategory,
  weekStart: Date,
  weekEnd: Date
): Promise<RankingResult> {
  let childIds: string[] = [];

  // Get children based on ranking type
  if (rankingType === 'family') {
    const familyChildren = await db
      .select({ id: children.id })
      .from(children)
      .where(eq(children.familyId, familyId));

    childIds = familyChildren.map(c => c.id);
  } else if (rankingType === 'friends') {
    // Get friends of all family children
    const familyChildren = await db
      .select({ id: children.id })
      .from(children)
      .where(eq(children.familyId, familyId));

    const friendIds = new Set<string>();

    for (const child of familyChildren) {
      // Get friends where child is the requester
      const friends1 = await db
        .select({ friendId: friendConnections.friendChildId })
        .from(friendConnections)
        .where(and(
          eq(friendConnections.childId, child.id),
          eq(friendConnections.status, 'accepted')
        ));

      // Get friends where child is the recipient
      const friends2 = await db
        .select({ friendId: friendConnections.childId })
        .from(friendConnections)
        .where(and(
          eq(friendConnections.friendChildId, child.id),
          eq(friendConnections.status, 'accepted')
        ));

      friends1.forEach(f => friendIds.add(f.friendId));
      friends2.forEach(f => friendIds.add(f.friendId));
    }

    childIds = Array.from(friendIds);
  } else if (rankingType === 'powerklusjes') {
    // Only children who have completed PowerKlusjes
    const powerChildren = await db
      .select({ childId: externalChoreRequests.childId })
      .from(externalChoreRequests)
      .where(and(
        eq(externalChoreRequests.familyId, familyId),
        eq(externalChoreRequests.status, 'completed'),
        gte(externalChoreRequests.completedAt, weekStart),
        lte(externalChoreRequests.completedAt, weekEnd)
      ));

    childIds = [...new Set(powerChildren.map(c => c.childId))];
  }

  if (childIds.length === 0) {
    return {
      entries: [],
      weekStart,
      weekEnd
    };
  }

  // Calculate scores for each child
  const scores: Array<{ childId: string; score: number }> = [];

  for (const childId of childIds) {
    let score = 0;

    switch (category) {
      case 'xp':
        score = await calculateXPScore(childId, weekStart, weekEnd);
        break;
      case 'chores':
        score = await calculateChoresScore(childId, weekStart, weekEnd);
        break;
      case 'powerpoints':
        score = await calculatePowerPointsScore(childId, weekStart, weekEnd);
        break;
      case 'pet_care':
        score = await calculatePetCareScore(childId, weekStart, weekEnd);
        break;
      case 'streak':
        score = await calculateStreakScore(childId);
        break;
    }

    scores.push({ childId, score });
  }

  // Sort by score (descending)
  scores.sort((a, b) => b.score - a.score);

  // Get child details and create ranking entries
  const childDetails = await db
    .select({
      id: children.id,
      name: children.name,
      avatar: children.avatar
    })
    .from(children)
    .where(inArray(children.id, childIds));

  const childMap = new Map(childDetails.map(c => [c.id, c]));

  const entries: RankingEntry[] = scores.map((scoreItem, index) => {
    const child = childMap.get(scoreItem.childId);
    const rank = index + 1;
    const tier = getTierFromRank(rank, scores.length);
    const title = getTitleFromTier(tier, category);

    return {
      childId: scoreItem.childId,
      childName: child?.name || 'Onbekend',
      score: scoreItem.score,
      rank,
      tier,
      title,
      avatar: child?.avatar
    };
  });

  return {
    entries,
    weekStart,
    weekEnd
  };
}

/**
 * Update weekly ranking snapshots
 */
export async function updateWeeklyRankings(familyId: string): Promise<void> {
  const { start, end } = getCurrentWeekBounds();

  const rankingTypes: RankingType[] = ['family', 'friends', 'powerklusjes'];
  const categories: RankingCategory[] = ['xp', 'chores', 'powerpoints', 'streak', 'pet_care'];

  for (const rankingType of rankingTypes) {
    for (const category of categories) {
      try {
        const result = await calculateRanking(familyId, rankingType, category, start, end);

        // Clear existing snapshots for this week/type/category
        await db
          .delete(rankSnapshots)
          .where(and(
            eq(rankSnapshots.familyId, familyId),
            eq(rankSnapshots.rankingType, rankingType),
            eq(rankSnapshots.category, category),
            eq(rankSnapshots.weekStart, toDateString(start)),
            eq(rankSnapshots.weekEnd, toDateString(end))
          ));

        // Insert new snapshots
        if (result.entries.length > 0) {
          const snapshots = result.entries.map(entry => ({
            familyId,
            childId: entry.childId,
            rankingType,
            category,
            weekStart: toDateString(start),
            weekEnd: toDateString(end),
            score: entry.score,
            rank: entry.rank,
            tier: entry.tier,
            title: entry.title
          }));

          await db.insert(rankSnapshots).values(snapshots);
        }
      } catch (error) {
        console.error(`Error updating rankings for ${rankingType}/${category}:`, error);
      }
    }
  }
}

/**
 * Get ranking settings for a family
 */
export async function getRankingSettings(familyId: string) {
  const settings = await db
    .select()
    .from(rankingSettings)
    .where(eq(rankingSettings.familyId, familyId))
    .limit(1);

  if (settings.length === 0) {
    // Create default settings
    const [newSettings] = await db
      .insert(rankingSettings)
      .values({
        familyId,
        rankingsEnabled: 1,
        familyRankingEnabled: 1,
        friendsRankingEnabled: 0,
        powerRankingEnabled: 1,
        showPositions: 1,
        showNegativeChanges: 0
      })
      .returning();

    return newSettings;
  }

  return settings[0];
}

/**
 * Update ranking settings for a family
 */
export async function updateRankingSettings(familyId: string, updates: Partial<typeof rankingSettings.$inferInsert>) {
  await db
    .update(rankingSettings)
    .set({ ...updates, updatedAt: new Date() })
    .where(eq(rankingSettings.familyId, familyId));
}

/**
 * Determine and reward weekly champions
 */
export async function processWeeklyChampions(familyId: string): Promise<void> {
  const { start, end } = getCurrentWeekBounds();
  const lastWeekStart = subWeeks(start, 1);
  const lastWeekEnd = subWeeks(end, 1);

  const rankingTypes: RankingType[] = ['family', 'friends', 'powerklusjes'];
  const categories: RankingCategory[] = ['xp', 'chores', 'powerpoints', 'streak', 'pet_care'];

  for (const rankingType of rankingTypes) {
    for (const category of categories) {
      try {
        // Get last week's rankings
        const lastWeekRankings = await calculateRanking(familyId, rankingType, category, lastWeekStart, lastWeekEnd);

        if (lastWeekRankings.entries.length > 0) {
          const champion = lastWeekRankings.entries[0]; // Top scorer

          // Check if we already processed this champion
          const existingChampion = await db
            .select()
            .from(weeklyChampions)
            .where(and(
              eq(weeklyChampions.familyId, familyId),
              eq(weeklyChampions.childId, champion.childId),
              eq(weeklyChampions.rankingType, rankingType),
              eq(weeklyChampions.category, category),
              eq(weeklyChampions.weekStart, toDateString(lastWeekStart))
            ));

          if (existingChampion.length === 0) {
            // Create champion record
            await db.insert(weeklyChampions).values({
              familyId,
              childId: champion.childId,
              rankingType,
              category,
              weekStart: toDateString(lastWeekStart),
              weekEnd: toDateString(lastWeekEnd),
              score: champion.score,
              rewards: JSON.stringify({
                goldenCrownBadge: true,
                extraSpin: true,
                goldenPetEffect: true,
                championTitle: `${category} Kampioen`
              })
            });

            // Award champion rewards
            await awardChampionRewards(familyId, champion.childId, rankingType, category);
          }
        }
      } catch (error) {
        console.error(`Error processing weekly champion for ${rankingType}/${category}:`, error);
      }
    }
  }
}

/**
 * Award rewards to weekly champion
 */
async function awardChampionRewards(
  familyId: string,
  childId: string,
  rankingType: RankingType,
  category: RankingCategory
): Promise<void> {
  try {
    // 1. Give extra spin (add to daily spins)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if child already has a spin record for today
    let spinRecord = await db
      .select()
      .from(dailySpins)
      .where(and(
        eq(dailySpins.childId, childId),
        eq(dailySpins.familyId, familyId)
      ))
      .limit(1);

    if (!spinRecord.length) {
      // Create new spin record with bonus spin
      await db.insert(dailySpins).values({
        childId,
        familyId,
        lastSpinDate: toDateString(today),
        spinsAvailable: 2, // 1 regular + 1 bonus
        totalSpins: 0,
      });
    } else {
      // Add bonus spin to existing record
      await db
        .update(dailySpins)
        .set({
          spinsAvailable: sql`${dailySpins.spinsAvailable} + 1`,
        })
        .where(eq(dailySpins.id, spinRecord[0].id));
    }

    // 2. Add champion achievement/badge
    const championBadgeName = `Week Kampioen - ${category.charAt(0).toUpperCase() + category.slice(1)}`;
    await db.insert(achievements).values({
      childId,
      familyId,
      achievementId: `weekly_champion_${category}_${Date.now()}`,
      name: championBadgeName,
      description: `Gefeliciteerd! Je bent deze week kampioen in ${category}!`,
      category: 'special',
      icon: '👑',
      xpReward: 50
    });

    // 3. Add XP reward
    await db
      .update(children)
      .set({
        xp: sql`${children.xp} + 50`,
        totalXpEver: sql`${children.totalXpEver} + 50`,
      })
      .where(eq(children.id, childId));

    // 4. Add to family feed
    await db.insert(familyFeed).values({
      familyId,
      childId,
      type: 'weekly_champion',
      message: `🏆 ${await getChildName(childId)} is deze week kampioen in ${category}! Gefeliciteerd!`,
      data: JSON.stringify({
        rankingType,
        category,
        rewards: ['golden_crown', 'extra_spin', 'golden_pet', 'xp_bonus']
      })
    });

  } catch (error) {
    console.error('Error awarding champion rewards:', error);
  }
}

/**
 * Get child name by ID
 */
async function getChildName(childId: string): Promise<string> {
  const child = await db
    .select({ name: children.name })
    .from(children)
    .where(eq(children.id, childId))
    .limit(1);

  return child[0]?.name || 'KlusjesKoning';
}

/**
 * Check if child is current weekly champion
 */
export async function getWeeklyChampionStatus(childId: string, familyId: string): Promise<{
  isChampion: boolean;
  championCategories: string[];
  goldenPetActive: boolean;
  goldenPetExpiresAt?: Date;
}> {
  const lastWeekStart = subWeeks(getCurrentWeekBounds().start, 1);

  const champions = await db
    .select()
    .from(weeklyChampions)
    .where(and(
      eq(weeklyChampions.childId, childId),
      eq(weeklyChampions.familyId, familyId),
      eq(weeklyChampions.weekStart, toDateString(lastWeekStart))
    ));

  const isChampion = champions.length > 0;
  const championCategories = champions.map(c => c.category);

  // Check golden pet effect (24 hours from becoming champion)
  const goldenPetActive = isChampion;
  const goldenPetExpiresAt = goldenPetActive
    ? addWeeks(lastWeekStart, 1) // Expires next week
    : undefined;

  return {
    isChampion,
    championCategories,
    goldenPetActive,
    goldenPetExpiresAt
  };
}