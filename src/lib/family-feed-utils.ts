import { db } from '@/server/db/client';
import { familyFeed } from '@/server/db/schema';

export type FeedEventType =
  | 'chore_completed'
  | 'level_up'
  | 'badge_earned'
  | 'sticker_unlocked'
  | 'pet_evolved'
  | 'quest_chain_completed'
  | 'streak_achieved'
  | 'reward_claimed'
  | 'weekly_champion';

interface CreateFeedItemParams {
  familyId: string;
  childId: string;
  childName: string;
  type: FeedEventType;
  data?: Record<string, unknown>;
}

// Message templates for different event types
const MESSAGE_TEMPLATES: Record<FeedEventType, (childName: string, data?: Record<string, unknown>) => string> = {
  chore_completed: (name, data) =>
    `heeft "${data?.choreName || 'een klusje'}" voltooid! ${data?.points ? `+${data.points} punten` : ''} 🎉`,
  level_up: (name, data) =>
    `is opgegaan naar level ${data?.newLevel || '?'}! ${data?.title ? `"${data.title}"` : ''} ⭐`,
  badge_earned: (name, data) =>
    `heeft de "${data?.badgeName || 'nieuwe'}" badge verdiend! 🏆`,
  sticker_unlocked: (name, data) =>
    `heeft een nieuwe sticker ontgrendeld: ${data?.stickerName || 'Mysterieuze Sticker'}! 🎨`,
  pet_evolved: (name, data) =>
    `'s huisdier is geëvolueerd naar ${data?.petStage || 'een nieuw niveau'}! 🐾`,
  quest_chain_completed: (name, data) =>
    `heeft de "${data?.questName || 'quest'}" quest chain voltooid! 🎯`,
  streak_achieved: (name, data) =>
    `heeft een ${data?.streakDays || ''} dagen streak bereikt! 🔥`,
  reward_claimed: (name, data) =>
    `heeft "${data?.rewardName || 'een beloning'}" geclaimd! 🎁`,
  weekly_champion: (name, data) =>
    `is de Weekkampioen geworden! 👑`,
};

// Emoji for each event type
const EVENT_EMOJIS: Record<FeedEventType, string> = {
  chore_completed: '✅',
  level_up: '⬆️',
  badge_earned: '🏆',
  sticker_unlocked: '🎨',
  pet_evolved: '🐾',
  quest_chain_completed: '🎯',
  streak_achieved: '🔥',
  reward_claimed: '🎁',
  weekly_champion: '👑',
};

/**
 * Creates a family feed item for an event
 * Call this from server-side code when events occur
 */
export async function createFeedItem(params: CreateFeedItemParams): Promise<boolean> {
  try {
    if (!db) {
      console.error('Database not available for feed item creation');
      return false;
    }

    const { familyId, childId, childName, type, data } = params;

    // Generate message from template
    const messageTemplate = MESSAGE_TEMPLATES[type];
    const message = messageTemplate ? messageTemplate(childName, data) : `deed iets geweldigs!`;

    // Add emoji to data
    const enrichedData = {
      ...data,
      emoji: EVENT_EMOJIS[type],
      childName,
    };

    await db.insert(familyFeed).values({
      familyId,
      childId,
      type,
      message,
      data: JSON.stringify(enrichedData),
      reactions: '[]',
    });

    return true;
  } catch (error) {
    console.error('Error creating feed item:', error);
    return false;
  }
}

/**
 * Client-side function to create feed items via API
 */
export async function createFeedItemClient(params: CreateFeedItemParams): Promise<boolean> {
  try {
    const { familyId, childId, childName, type, data } = params;

    const messageTemplate = MESSAGE_TEMPLATES[type];
    const message = messageTemplate ? messageTemplate(childName, data) : `deed iets geweldigs!`;

    const enrichedData = {
      ...data,
      emoji: EVENT_EMOJIS[type],
      childName,
    };

    const response = await fetch('/api/family-feed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        familyId,
        childId,
        type,
        message,
        data: enrichedData,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Error creating feed item via API:', error);
    return false;
  }
}
