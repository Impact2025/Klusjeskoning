import { QuestChain, Chore } from './types';
import { Timestamp } from './timestamp';

export const SAMPLE_QUEST_CHAINS: QuestChain[] = [
  {
    id: 'morning-routine',
    familyId: 'sample', // This will be set dynamically
    name: '🌅 De Ochtend Avonturier',
    description: 'Word de held van de ochtend! Een avonturier maakt zich klaar voor een nieuwe dag vol ontdekkingen. Jouw ochtend routine is het begin van een episch verhaal!',
    rewardBadgeId: 'morning-champion',
    createdAt: Timestamp.now(),
  },
  {
    id: 'bedroom-cleanup',
    familyId: 'sample',
    name: '🏰 Het Mysterie van de Verborgen Schat',
    description: 'In jouw slaapkamer ligt een verborgen schat begraven onder de rommel! Ruim op om de schat te vinden en word de ontdekker van verloren kostbaarheden!',
    rewardBadgeId: 'tidy-bedroom',
    createdAt: Timestamp.now(),
  },
  {
    id: 'kitchen-helper',
    familyId: 'sample',
    name: '👨‍🍳 De Keuken Alchemist',
    description: 'Jouw keuken is een laboratorium vol magische recepten! Help mee om de beste toverspreuken (recepten) tot leven te brengen en word de hoofdalchemist!',
    rewardBadgeId: 'kitchen-master',
    createdAt: Timestamp.now(),
  },
  {
    id: 'garden-adventure',
    familyId: 'sample',
    name: '🌱 De Tuin Tovenaar',
    description: 'Jouw tuin is een betoverd bos vol wonderen! Help de planten groeien, versla onkruid monsters en word de machtige Tuin Tovenaar die het groen doet bloeien!',
    rewardBadgeId: 'garden-wizard',
    createdAt: Timestamp.now(),
  },
  {
    id: 'home-detective',
    familyId: 'sample',
    name: '🕵️ De Huis Detective',
    description: 'Er zijn mysteries in huis die opgelost moeten worden! Zoek naar verloren voorwerpen, ruim geheime plekken op en word de beste detective die er is!',
    rewardBadgeId: 'detective-master',
    createdAt: Timestamp.now(),
  },
];

export const QUEST_CHAIN_CHORES: Record<string, Chore[]> = {
  'morning-routine': [
    {
      id: 'brush-teeth',
      name: '🦷 De Tandenpoets Ritueel',
      points: 5,
      xpReward: 10,
      assignedTo: [],
      status: 'available',
      questChainId: 'morning-routine',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'make-bed',
      name: '🛏️ Het Beddengoed Kasteel',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'morning-routine',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'get-dressed',
      name: '👔 De Held Uitdossen',
      points: 5,
      xpReward: 10,
      assignedTo: [],
      status: 'available',
      questChainId: 'morning-routine',
      isMainQuest: true, // Main quest badge
      chainOrder: 3,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
  ],
  'bedroom-cleanup': [
    {
      id: 'pickup-toys',
      name: '🧸 De Speelgoed Schatkamer',
      points: 15,
      xpReward: 25,
      assignedTo: [],
      status: 'available',
      questChainId: 'bedroom-cleanup',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'fold-clothes',
      name: '👕 De Kleren Betovering',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'bedroom-cleanup',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'vacuum-floor',
      name: '🧹 De Vloer Zuig Avontuur',
      points: 20,
      xpReward: 35,
      assignedTo: [],
      status: 'available',
      questChainId: 'bedroom-cleanup',
      isMainQuest: true,
      chainOrder: 3,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
  ],
  'kitchen-helper': [
    {
      id: 'clear-table',
      name: '🍽️ De Tafel Magie',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'kitchen-helper',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'load-dishwasher',
      name: '🔮 De Vaatwasser Toverspreuk',
      points: 15,
      xpReward: 30,
      assignedTo: [],
      status: 'available',
      questChainId: 'kitchen-helper',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'wipe-counters',
      name: '✨ Het Aanrecht Mysterie',
      points: 15,
      xpReward: 30,
      assignedTo: [],
      status: 'available',
      questChainId: 'kitchen-helper',
      isMainQuest: true,
      chainOrder: 3,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
  ],
  'garden-adventure': [
    {
      id: 'water-plants',
      name: '💧 De Planten Drinkpartij',
      points: 12,
      xpReward: 25,
      assignedTo: [],
      status: 'available',
      questChainId: 'garden-adventure',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'pull-weeds',
      name: '🌿 Onkruid Monsters Verslaan',
      points: 18,
      xpReward: 35,
      assignedTo: [],
      status: 'available',
      questChainId: 'garden-adventure',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'plant-seeds',
      name: '🌱 Zaadjes Wonder',
      points: 20,
      xpReward: 40,
      assignedTo: [],
      status: 'available',
      questChainId: 'garden-adventure',
      isMainQuest: true,
      chainOrder: 3,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
  ],
  'home-detective': [
    {
      id: 'find-lost-items',
      name: '🔍 De Verdwenen Voorwerpen',
      points: 15,
      xpReward: 30,
      assignedTo: [],
      status: 'available',
      questChainId: 'home-detective',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'organize-shelf',
      name: '📚 De Plank Puzzel',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'home-detective',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
    {
      id: 'clean-hidden-spots',
      name: '🕵️ Geheime Plekken Zuiveren',
      points: 25,
      xpReward: 45,
      assignedTo: [],
      status: 'available',
      questChainId: 'home-detective',
      isMainQuest: true,
      chainOrder: 3,
      createdAt: Timestamp.now(),
      recurrenceType: 'none',
      isTemplate: false,
    },
  ],
};

export function getChoresForQuestChain(chainId: string): Chore[] {
  return QUEST_CHAIN_CHORES[chainId] || [];
}

export function getQuestChainProgress(chainId: string, completedChoreIds: string[]): {
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
} {
  const chores = getChoresForQuestChain(chainId);
  const completed = chores.filter(chore => completedChoreIds.includes(chore.id)).length;
  const total = chores.length;
  const percentage = total > 0 ? (completed / total) * 100 : 0;
  const isComplete = completed === total;

  return { completed, total, percentage, isComplete };
}

export function getAvailableQuestChains(): QuestChain[] {
  return SAMPLE_QUEST_CHAINS;
}

export function getMainQuestForChain(chainId: string): Chore | null {
  const chores = getChoresForQuestChain(chainId);
  return chores.find(chore => chore.isMainQuest) || null;
}