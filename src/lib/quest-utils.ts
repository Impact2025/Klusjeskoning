import { QuestChain, Chore } from './types';
import { Timestamp } from './timestamp';

export const SAMPLE_QUEST_CHAINS: QuestChain[] = [
  {
    id: 'morning-routine',
    familyId: 'sample', // This will be set dynamically
    name: 'Ochtend Routine',
    description: 'Maak je klaar voor de dag met deze ochtend taken',
    rewardBadgeId: 'morning-champion',
    createdAt: Timestamp.now(),
  },
  {
    id: 'bedroom-cleanup',
    familyId: 'sample',
    name: 'Slaapkamer Opruimen',
    description: 'Houd je slaapkamer netjes en georganiseerd',
    rewardBadgeId: 'tidy-bedroom',
    createdAt: Timestamp.now(),
  },
  {
    id: 'kitchen-helper',
    familyId: 'sample',
    name: 'Keuken Helper',
    description: 'Help mee in de keuken voor een schone en georganiseerde ruimte',
    rewardBadgeId: 'kitchen-master',
    createdAt: Timestamp.now(),
  },
];

export const QUEST_CHAIN_CHORES: Record<string, Chore[]> = {
  'morning-routine': [
    {
      id: 'brush-teeth',
      name: 'Tanden poetsen',
      points: 5,
      xpReward: 10,
      assignedTo: [],
      status: 'available',
      questChainId: 'morning-routine',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
    },
    {
      id: 'make-bed',
      name: 'Bed opmaken',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'morning-routine',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
    },
    {
      id: 'get-dressed',
      name: 'Aankleden',
      points: 5,
      xpReward: 10,
      assignedTo: [],
      status: 'available',
      questChainId: 'morning-routine',
      isMainQuest: true, // Main quest badge
      chainOrder: 3,
      createdAt: Timestamp.now(),
    },
  ],
  'bedroom-cleanup': [
    {
      id: 'pickup-toys',
      name: 'Speelgoed opruimen',
      points: 15,
      xpReward: 25,
      assignedTo: [],
      status: 'available',
      questChainId: 'bedroom-cleanup',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
    },
    {
      id: 'fold-clothes',
      name: 'Kleren opvouwen',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'bedroom-cleanup',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
    },
    {
      id: 'vacuum-floor',
      name: 'Vloer stofzuigen',
      points: 20,
      xpReward: 35,
      assignedTo: [],
      status: 'available',
      questChainId: 'bedroom-cleanup',
      isMainQuest: true,
      chainOrder: 3,
      createdAt: Timestamp.now(),
    },
  ],
  'kitchen-helper': [
    {
      id: 'clear-table',
      name: 'Tafel afruimen',
      points: 10,
      xpReward: 20,
      assignedTo: [],
      status: 'available',
      questChainId: 'kitchen-helper',
      isMainQuest: false,
      chainOrder: 1,
      createdAt: Timestamp.now(),
    },
    {
      id: 'load-dishwasher',
      name: 'Vaatwasser inruimen',
      points: 15,
      xpReward: 30,
      assignedTo: [],
      status: 'available',
      questChainId: 'kitchen-helper',
      isMainQuest: false,
      chainOrder: 2,
      createdAt: Timestamp.now(),
    },
    {
      id: 'wipe-counters',
      name: 'Aanrecht afnemen',
      points: 15,
      xpReward: 30,
      assignedTo: [],
      status: 'available',
      questChainId: 'kitchen-helper',
      isMainQuest: true,
      chainOrder: 3,
      createdAt: Timestamp.now(),
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