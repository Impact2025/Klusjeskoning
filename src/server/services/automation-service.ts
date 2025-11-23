import { db } from '../db/client';
import { automationSettings, notifications, chores } from '../db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { Timestamp } from '@/lib/timestamp';

export class AutomationService {
  /**
   * Get automation settings for a family
   */
  static async getAutomationSettings(familyId: string) {
    const settings = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.familyId, familyId))
      .limit(1);

    return settings[0] || null;
  }

  /**
   * Create or update automation settings for a family
   */
  static async upsertAutomationSettings(familyId: string, data: {
    autoPayoutEnabled?: boolean;
    payoutDay?: string;
    payoutTime?: string;
    approvalWindowEnabled?: boolean;
    approvalWindowStart?: string;
    approvalWindowEnd?: string;
  }) {
    const existing = await this.getAutomationSettings(familyId);

    if (existing) {
      return await db
        .update(automationSettings)
        .set({
          autoPayoutEnabled: data.autoPayoutEnabled ? 1 : 0,
          payoutDay: data.payoutDay as any,
          payoutTime: data.payoutTime,
          approvalWindowEnabled: data.approvalWindowEnabled ? 1 : 0,
          approvalWindowStart: data.approvalWindowStart,
          approvalWindowEnd: data.approvalWindowEnd,
          updatedAt: Timestamp.now().toDate(),
        })
        .where(eq(automationSettings.id, existing.id))
        .returning();
    } else {
      return await db
        .insert(automationSettings)
        .values({
          familyId,
          autoPayoutEnabled: data.autoPayoutEnabled ? 1 : 0,
          payoutDay: (data.payoutDay as any) || 'friday',
          payoutTime: data.payoutTime || '19:00',
          approvalWindowEnabled: data.approvalWindowEnabled ? 1 : 0,
          approvalWindowStart: data.approvalWindowStart,
          approvalWindowEnd: data.approvalWindowEnd,
        })
        .returning();
    }
  }

  /**
   * Process automatic payouts for families
   */
  static async processAutomaticPayouts() {
    const now = Timestamp.now();
    const currentDay = now.toDate().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toDate().toTimeString().slice(0, 5); // HH:MM format

    // Find families with auto payout enabled for today
    const familiesToPayout = await db
      .select({
        familyId: automationSettings.familyId,
        payoutTime: automationSettings.payoutTime,
      })
      .from(automationSettings)
      .where(
        and(
          eq(automationSettings.autoPayoutEnabled, 1),
          eq(automationSettings.payoutDay, currentDay as any)
        )
      );

    for (const family of familiesToPayout) {
      // Check if it's payout time (within 5 minutes)
      if (this.isTimeInRange(currentTime, family.payoutTime, 5)) {
        await this.executePayout(family.familyId);
      }
    }
  }

  /**
   * Execute payout for a family
   */
  private static async executePayout(familyId: string) {
    // Get all approved chores that haven't been paid out yet
    const approvedChores = await db
      .select()
      .from(chores)
      .where(
        and(
          eq(chores.familyId, familyId),
          eq(chores.status, 'approved')
        )
      );

    if (approvedChores.length === 0) return;

    // Calculate total payout
    const totalPoints = approvedChores.reduce((sum, chore) => sum + chore.points, 0);

    // Create payout notification
    await db.insert(notifications).values({
      familyId,
      type: 'payout_executed',
      title: 'Automatische Uitbetaling',
      message: `€${(totalPoints / 100).toFixed(2)} is automatisch uitgekeerd naar de spaarpotten!`,
      data: JSON.stringify({ totalPoints, choreCount: approvedChores.length }),
    });

    // Mark chores as paid (you might want to add a paidAt field to chores)
    // For now, we'll just create the notification

    // Update last payout time
    await db
      .update(automationSettings)
      .set({ lastPayoutAt: Timestamp.now().toDate() })
      .where(eq(automationSettings.familyId, familyId));
  }

  /**
   * Send payout reminder notifications
   */
  static async sendPayoutReminders() {
    const now = Timestamp.now();
    const currentDay = now.toDate().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

    // Find families with auto payout enabled for today
    const familiesToRemind = await db
      .select({
        familyId: automationSettings.familyId,
        payoutTime: automationSettings.payoutTime,
      })
      .from(automationSettings)
      .where(
        and(
          eq(automationSettings.autoPayoutEnabled, 1),
          eq(automationSettings.payoutDay, currentDay as any)
        )
      );

    for (const family of familiesToRemind) {
      // Send reminder 1 hour before payout
      const reminderTime = this.subtractHours(family.payoutTime, 1);
      const currentTime = now.toDate().toTimeString().slice(0, 5);

      if (this.isTimeInRange(currentTime, reminderTime, 5)) {
        // Count pending approvals
        const pendingCount = await db
          .select()
          .from(chores)
          .where(
            and(
              eq(chores.familyId, family.familyId),
              eq(chores.status, 'submitted')
            )
          );

        if (pendingCount.length > 0) {
          await db.insert(notifications).values({
            familyId: family.familyId,
            type: 'payout_reminder',
            title: 'Laatste Kans!',
            message: `Automatische uitbetaling over 1 uur. Nog ${pendingCount.length} klusje(s) wachten op goedkeuring!`,
            data: JSON.stringify({ pendingCount: pendingCount.length }),
          });
        }
      }
    }
  }

  /**
   * Send batch approval notifications during approval window
   */
  static async sendBatchApprovalNotifications() {
    const now = Timestamp.now();
    const currentTime = now.toDate().toTimeString().slice(0, 5);

    // Find families with approval windows enabled
    const familiesWithWindows = await db
      .select()
      .from(automationSettings)
      .where(eq(automationSettings.approvalWindowEnabled, 1));

    for (const family of familiesWithWindows) {
      if (family.approvalWindowStart && family.approvalWindowEnd) {
        if (this.isTimeInRange(currentTime, family.approvalWindowStart, 0)) {
          // Count pending approvals
          const pendingChores = await db
            .select()
            .from(chores)
            .where(
              and(
                eq(chores.familyId, family.familyId),
                eq(chores.status, 'submitted')
              )
            );

          if (pendingChores.length > 0) {
            await db.insert(notifications).values({
              familyId: family.familyId,
              type: 'approval_batch',
              title: 'Goedkeuringsronde',
              message: `${pendingChores.length} klusje(s) wachten op jouw goedkeuring.`,
              data: JSON.stringify({
                pendingChores: pendingChores.map(c => ({ id: c.id, name: c.name })),
                windowEnd: family.approvalWindowEnd
              }),
            });
          }
        }
      }
    }
  }

  /**
   * Process recurring chores - create new instances when due
   */
  static async processRecurringChores() {
    const now = Timestamp.now();

    // Find template chores that are due
    const dueTemplates = await db
      .select()
      .from(chores)
      .where(
        and(
          eq(chores.isTemplate, 1),
          gte(chores.nextDueDate, now.toDate())
        )
      );

    for (const template of dueTemplates) {
      // Create new chore instance
      const newChore = {
        ...template,
        id: undefined, // Let DB generate new ID
        isTemplate: 0,
        templateId: template.id,
        status: 'available' as const,
        submittedByChildId: null,
        submittedAt: null,
        emotion: null,
        photoUrl: null,
        nextDueDate: null,
        createdAt: now.toDate(),
      };

      await db.insert(chores).values(newChore);

      // Calculate next due date
      const nextDue = this.calculateNextDueDate(template);
      if (nextDue) {
        await db
          .update(chores)
          .set({ nextDueDate: nextDue.toDate() })
          .where(eq(chores.id, template.id));
      }
    }
  }

  /**
   * Calculate next due date for recurring chore
   */
  private static calculateNextDueDate(chore: any): Timestamp | null {
    const now = Timestamp.now();

    switch (chore.recurrenceType) {
      case 'daily':
        return Timestamp.fromDate(new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000));

      case 'weekly':
        const days = chore.recurrenceDays ? JSON.parse(chore.recurrenceDays) : ['monday', 'wednesday', 'friday'];
        return this.getNextWeekday(now, days);

      case 'custom':
        // Custom logic based on recurrenceDays
        return null;

      default:
        return null;
    }
  }

  /**
   * Get next weekday from array of weekdays
   */
  private static getNextWeekday(from: Timestamp, weekdays: string[]): Timestamp | null {
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const targetDays = weekdays.map(day => dayNames.indexOf(day.toLowerCase())).filter(day => day >= 0);

    if (targetDays.length === 0) return null;

    const currentDay = from.toDate().getDay();
    const nextDay = targetDays.find(day => day > currentDay) ?? targetDays[0];

    const daysToAdd = nextDay > currentDay ? nextDay - currentDay : 7 - currentDay + nextDay;
    return Timestamp.fromDate(new Date(from.toDate().getTime() + daysToAdd * 24 * 60 * 60 * 1000));
  }

  /**
   * Check if current time is within range of target time
   */
  private static isTimeInRange(currentTime: string, targetTime: string, minutesRange: number): boolean {
    const [currentHours, currentMinutes] = currentTime.split(':').map(Number);
    const [targetHours, targetMinutes] = targetTime.split(':').map(Number);

    const currentTotalMinutes = currentHours * 60 + currentMinutes;
    const targetTotalMinutes = targetHours * 60 + targetMinutes;

    const diff = Math.abs(currentTotalMinutes - targetTotalMinutes);
    return diff <= minutesRange;
  }

  /**
   * Subtract hours from time string
   */
  private static subtractHours(time: string, hours: number): string {
    const [h, m] = time.split(':').map(Number);
    const totalMinutes = h * 60 + m - hours * 60;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMinutes = totalMinutes % 60;
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  }
}