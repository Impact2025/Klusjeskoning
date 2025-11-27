import { db } from '@/server/db/client';
import {
  children,
  chores,
  choreAssignments,
  choreTemplates,
  choreSuggestions,
  families,
} from '@/server/db/schema';
import { eq, and, gte, lte, sql, desc, isNull, or, not, inArray } from 'drizzle-orm';

interface ChildStats {
  childId: string;
  familyId: string;
  completedChores: number;
  totalAssignedChores: number;
  completionRate: number;
  currentStreak: number;
  maxStreak: number;
  lastCompletedAt: Date | null;
}

interface SuggestionCandidate {
  templateId: string;
  reason: 'streak' | 'completion_rate' | 'age_milestone' | 'time_based';
  priority: number;
  triggerData: Record<string, unknown>;
}

/**
 * Calculate child stats for the past N days
 */
async function getChildStats(childId: string, days: number = 14): Promise<ChildStats | null> {
  if (!db) return null;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get child and family info
  const [child] = await db
    .select()
    .from(children)
    .where(eq(children.id, childId));

  if (!child) return null;

  // Get completed chores count
  const completedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(chores)
    .where(and(
      eq(chores.submittedByChildId, childId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, startDate)
    ));

  // Get total assigned chores count
  const assignedResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(choreAssignments)
    .innerJoin(chores, eq(choreAssignments.choreId, chores.id))
    .where(and(
      eq(choreAssignments.childId, childId),
      gte(chores.createdAt, startDate)
    ));

  const completedCount = Number(completedResult[0]?.count ?? 0);
  const assignedCount = Number(assignedResult[0]?.count ?? 0);

  // Calculate streak (simplified - counts consecutive days with completed chores)
  const recentCompletions = await db
    .select({
      date: sql<string>`DATE(${chores.submittedAt})`,
    })
    .from(chores)
    .where(and(
      eq(chores.submittedByChildId, childId),
      eq(chores.status, 'approved'),
      gte(chores.submittedAt, startDate)
    ))
    .groupBy(sql`DATE(${chores.submittedAt})`)
    .orderBy(desc(sql`DATE(${chores.submittedAt})`));

  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let lastDate: Date | null = null;

  for (const row of recentCompletions) {
    const date = new Date(row.date);

    if (!lastDate) {
      // Check if it's today or yesterday
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date >= yesterday) {
        tempStreak = 1;
      }
    } else {
      const dayDiff = Math.floor((lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        maxStreak = Math.max(maxStreak, tempStreak);
        tempStreak = 1;
      }
    }
    lastDate = date;
  }

  currentStreak = tempStreak;
  maxStreak = Math.max(maxStreak, currentStreak);

  return {
    childId,
    familyId: child.familyId,
    completedChores: completedCount,
    totalAssignedChores: assignedCount,
    completionRate: assignedCount > 0 ? completedCount / assignedCount : 0,
    currentStreak,
    maxStreak,
    lastCompletedAt: recentCompletions[0] ? new Date(recentCompletions[0].date) : null,
  };
}

/**
 * Get templates that the child doesn't already have assigned
 */
async function getAvailableTemplates(
  childId: string,
  familyId: string,
  childAge: number,
  hasGarden: boolean,
  hasPets: boolean,
  hasKitchen: boolean
): Promise<typeof choreTemplates.$inferSelect[]> {
  if (!db) return [];

  // Get IDs of templates already assigned to this child (via chores)
  const existingChores = await db
    .select({ name: chores.name })
    .from(choreAssignments)
    .innerJoin(chores, eq(choreAssignments.choreId, chores.id))
    .where(eq(choreAssignments.childId, childId));

  const existingNames = existingChores.map(c => c.name);

  // Get all suitable templates
  const templates = await db
    .select()
    .from(choreTemplates)
    .where(and(
      eq(choreTemplates.isActive, true),
      lte(choreTemplates.minAge, childAge),
      or(isNull(choreTemplates.maxAge), gte(choreTemplates.maxAge, childAge))
    ));

  // Filter by requirements and exclude already assigned
  return templates.filter(t => {
    if (existingNames.includes(t.name)) return false;
    if (t.requiresGarden && !hasGarden) return false;
    if (t.requiresPet && !hasPets) return false;
    if (t.requiresKitchenAccess && !hasKitchen) return false;
    return true;
  });
}

/**
 * Generate suggestions for a single child based on their stats
 */
async function generateSuggestionsForChild(childId: string): Promise<number> {
  if (!db) return 0;

  const stats = await getChildStats(childId);
  if (!stats) return 0;

  // Get child and family details
  const [child] = await db
    .select()
    .from(children)
    .where(eq(children.id, childId));

  if (!child) return 0;

  const [family] = await db
    .select()
    .from(families)
    .where(eq(families.id, child.familyId));

  if (!family) return 0;

  // Calculate child age
  const childAge = child.birthdate
    ? Math.floor((new Date().getTime() - new Date(child.birthdate).getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    : 8;

  const candidates: SuggestionCandidate[] = [];

  // Rule 1: Streak Achievement (7+ days)
  if (stats.currentStreak >= 7) {
    candidates.push({
      templateId: '', // Will be filled later
      reason: 'streak',
      priority: 8,
      triggerData: { streak: stats.currentStreak },
    });
  }

  // Rule 2: High Completion Rate (>80% over 2 weeks)
  if (stats.completionRate >= 0.8 && stats.totalAssignedChores >= 5) {
    candidates.push({
      templateId: '',
      reason: 'completion_rate',
      priority: 7,
      triggerData: { rate: Math.round(stats.completionRate * 100), chores: stats.totalAssignedChores },
    });
  }

  // Rule 3: Time-based (no new chores in 4 weeks) - lower priority
  // This would need more sophisticated tracking

  if (candidates.length === 0) return 0;

  // Get available templates
  const availableTemplates = await getAvailableTemplates(
    childId,
    child.familyId,
    childAge,
    family.hasGarden ?? false,
    family.hasPets ?? false,
    child.kitchenAccess ?? false
  );

  if (availableTemplates.length === 0) return 0;

  // Check for existing pending suggestions
  const existingSuggestions = await db
    .select({ templateId: choreSuggestions.choreTemplateId })
    .from(choreSuggestions)
    .where(and(
      eq(choreSuggestions.childId, childId),
      eq(choreSuggestions.status, 'pending')
    ));

  const existingTemplateIds = existingSuggestions.map(s => s.templateId);

  // Filter out templates that already have pending suggestions
  const newTemplates = availableTemplates.filter(t => !existingTemplateIds.includes(t.id));

  if (newTemplates.length === 0) return 0;

  // Sort by difficulty (suggest easier ones first for progression)
  const sortedTemplates = newTemplates.sort((a, b) => {
    const diffOrder = { easy: 1, medium: 2, hard: 3 };
    return (diffOrder[a.difficulty] || 2) - (diffOrder[b.difficulty] || 2);
  });

  // Create suggestions (max 2 per run)
  let created = 0;
  const maxSuggestions = Math.min(2, candidates.length, sortedTemplates.length);

  for (let i = 0; i < maxSuggestions; i++) {
    const candidate = candidates[i];
    const template = sortedTemplates[i];

    // Set expiration to 14 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 14);

    await db.insert(choreSuggestions).values({
      childId,
      choreTemplateId: template.id,
      triggerReason: candidate.reason,
      triggerData: candidate.triggerData,
      priority: candidate.priority,
      expiresAt,
    });

    created++;
  }

  return created;
}

/**
 * Generate suggestions for all children in a family
 */
export async function generateFamilySuggestions(familyId: string): Promise<number> {
  if (!db) return 0;

  const familyChildren = await db
    .select()
    .from(children)
    .where(eq(children.familyId, familyId));

  let totalCreated = 0;
  for (const child of familyChildren) {
    const created = await generateSuggestionsForChild(child.id);
    totalCreated += created;
  }

  return totalCreated;
}

/**
 * Generate suggestions for all active families (for cron job)
 */
export async function generateDailySuggestions(): Promise<{ families: number; suggestions: number }> {
  if (!db) return { families: 0, suggestions: 0 };

  // Get all families with completed onboarding
  const activeFamilies = await db
    .select({ id: families.id })
    .from(families)
    .where(eq(families.onboardingCompleted, true));

  let totalSuggestions = 0;
  for (const family of activeFamilies) {
    const created = await generateFamilySuggestions(family.id);
    totalSuggestions += created;
  }

  return { families: activeFamilies.length, suggestions: totalSuggestions };
}

/**
 * Expire old suggestions
 */
export async function expireOldSuggestions(): Promise<number> {
  if (!db) return 0;

  const now = new Date();

  const result = await db
    .update(choreSuggestions)
    .set({ status: 'expired', updatedAt: now })
    .where(and(
      eq(choreSuggestions.status, 'pending'),
      lte(choreSuggestions.expiresAt, now)
    ))
    .returning({ id: choreSuggestions.id });

  return result.length;
}

/**
 * Reactivate snoozed suggestions that are past their snooze date
 */
export async function reactivateSnoozedSuggestions(): Promise<number> {
  if (!db) return 0;

  const now = new Date();

  const result = await db
    .update(choreSuggestions)
    .set({ status: 'pending', snoozedUntil: null, updatedAt: now })
    .where(and(
      eq(choreSuggestions.status, 'snoozed'),
      lte(choreSuggestions.snoozedUntil, now)
    ))
    .returning({ id: choreSuggestions.id });

  return result.length;
}
