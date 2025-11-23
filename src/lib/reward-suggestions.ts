import { RewardType } from './types';

export interface RewardSuggestion {
  name: string;
  points: number;
  type: RewardType;
  description: string;
  ageRange: [number, number]; // [min, max] age
  category: 'screen_time' | 'activities' | 'privileges' | 'treats' | 'experiences';
}

export const REWARD_SUGGESTIONS: RewardSuggestion[] = [
  // Screen Time (4-12 years)
  {
    name: 'Extra schermtijd (30 min)',
    points: 50,
    type: 'privilege',
    description: '30 minuten extra tijd op tablet/telefoon',
    ageRange: [4, 12],
    category: 'screen_time'
  },
  {
    name: 'Game avondje',
    points: 150,
    type: 'privilege',
    description: 'Een avondje gamen op de tablet',
    ageRange: [6, 14],
    category: 'screen_time'
  },

  // Activities (all ages)
  {
    name: 'Filmavond kiezen',
    points: 75,
    type: 'privilege',
    description: 'Jij mag kiezen welke film we kijken',
    ageRange: [4, 18],
    category: 'activities'
  },
  {
    name: 'Park wandeling',
    points: 25,
    type: 'experience',
    description: 'Een speciale wandeling naar het park',
    ageRange: [4, 10],
    category: 'activities'
  },

  // Privileges (8-18 years)
  {
    name: 'Later naar bed',
    points: 100,
    type: 'privilege',
    description: 'Een kwartiertje later naar bed',
    ageRange: [8, 18],
    category: 'privileges'
  },
  {
    name: 'Vriendje/vriendinnetje uitnodigen',
    points: 200,
    type: 'privilege',
    description: 'Een vriendje of vriendinnetje uitnodigen',
    ageRange: [8, 16],
    category: 'privileges'
  },

  // Treats (all ages)
  {
    name: 'Lekker ijsje',
    points: 30,
    type: 'experience',
    description: 'Een bolletje ijs naar keuze',
    ageRange: [4, 18],
    category: 'treats'
  },
  {
    name: 'Nieuwe stickerboek',
    points: 120,
    type: 'experience',
    description: 'Een nieuw stickerboek of kleurboek',
    ageRange: [4, 10],
    category: 'treats'
  },
  {
    name: 'Nieuwe LEGO set',
    points: 500,
    type: 'experience',
    description: 'Een nieuwe LEGO set naar keuze',
    ageRange: [6, 14],
    category: 'treats'
  },

  // Experiences (10-18 years)
  {
    name: 'Bowlen',
    points: 300,
    type: 'experience',
    description: 'Een middagje bowlen met het gezin',
    ageRange: [10, 18],
    category: 'experiences'
  },
  {
    name: 'Pretpark dagje',
    points: 1000,
    type: 'experience',
    description: 'Een dagje naar een pretpark',
    ageRange: [8, 18],
    category: 'experiences'
  }
];

export function getRewardSuggestionsForFamily(children: { name: string; age: number }[]): RewardSuggestion[] {
  const suggestions: RewardSuggestion[] = [];
  const ageGroups = {
    young: children.filter(c => c.age <= 8).length,
    middle: children.filter(c => c.age > 8 && c.age <= 12).length,
    teen: children.filter(c => c.age > 12).length
  };

  // Always include some basic rewards
  suggestions.push(
    REWARD_SUGGESTIONS.find(r => r.name === 'Extra schermtijd (30 min)')!,
    REWARD_SUGGESTIONS.find(r => r.name === 'Filmavond kiezen')!,
    REWARD_SUGGESTIONS.find(r => r.name === 'Lekker ijsje')!
  );

  // Add age-appropriate rewards
  if (ageGroups.young > 0) {
    suggestions.push(
      REWARD_SUGGESTIONS.find(r => r.name === 'Nieuwe stickerboek')!
    );
  }

  if (ageGroups.middle > 0 || ageGroups.teen > 0) {
    suggestions.push(
      REWARD_SUGGESTIONS.find(r => r.name === 'Later naar bed')!
    );
  }

  if (ageGroups.teen > 0) {
    suggestions.push(
      REWARD_SUGGESTIONS.find(r => r.name === 'Bowlen')!
    );
  }

  // Add one expensive reward for motivation
  suggestions.push(
    REWARD_SUGGESTIONS.find(r => r.name === 'Nieuwe LEGO set')!
  );

  // Remove duplicates
  return [...new Set(suggestions)];
}

export function getDefaultRewardsForFamily(children: { name: string; age: number }[]): Array<{
  name: string;
  points: number;
  type: RewardType;
  assignedTo: string[]; // Will be converted to child IDs later
}> {
  const suggestions = getRewardSuggestionsForFamily(children);

  return suggestions.slice(0, 6).map(suggestion => ({
    name: suggestion.name,
    points: suggestion.points,
    type: suggestion.type,
    assignedTo: [] // Available to all children
  }));
}