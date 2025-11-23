import { AvatarItem } from './types';
import { Timestamp } from './timestamp';

export const avatarItems: AvatarItem[] = [
  // Accessories - Common
  {
    id: 'hat-baseball',
    name: 'Honkbalpet',
    type: 'accessory',
    xpRequired: 25,
    rarity: 'common',
    createdAt: Timestamp.now(),
  },
  {
    id: 'hat-crown',
    name: 'Kroon',
    type: 'accessory',
    xpRequired: 100,
    rarity: 'rare',
    createdAt: Timestamp.now(),
  },
  {
    id: 'glasses-sunglasses',
    name: 'Zonnebril',
    type: 'accessory',
    xpRequired: 50,
    rarity: 'common',
    createdAt: Timestamp.now(),
  },
  {
    id: 'hat-wizard',
    name: 'Tovenaarshoed',
    type: 'accessory',
    xpRequired: 200,
    rarity: 'epic',
    createdAt: Timestamp.now(),
  },

  // Outfits - Common
  {
    id: 'outfit-superhero',
    name: 'Supheld Kostuum',
    type: 'outfit',
    xpRequired: 75,
    rarity: 'rare',
    createdAt: Timestamp.now(),
  },
  {
    id: 'outfit-princess',
    name: 'Prinses Jurk',
    type: 'outfit',
    xpRequired: 150,
    rarity: 'epic',
    createdAt: Timestamp.now(),
  },
  {
    id: 'outfit-astronaut',
    name: 'Astronaut Pak',
    type: 'outfit',
    xpRequired: 300,
    rarity: 'legendary',
    createdAt: Timestamp.now(),
  },

  // Backgrounds - Common
  {
    id: 'bg-castle',
    name: 'Kasteel Achtergrond',
    type: 'background',
    xpRequired: 50,
    rarity: 'common',
    createdAt: Timestamp.now(),
  },
  {
    id: 'bg-space',
    name: 'Ruimte Achtergrond',
    type: 'background',
    xpRequired: 150,
    rarity: 'rare',
    createdAt: Timestamp.now(),
  },
  {
    id: 'bg-ocean',
    name: 'Ocean Achtergrond',
    type: 'background',
    xpRequired: 250,
    rarity: 'epic',
    createdAt: Timestamp.now(),
  },
];

export const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'text-gray-600';
    case 'rare': return 'text-blue-600';
    case 'epic': return 'text-purple-600';
    case 'legendary': return 'text-yellow-600';
    default: return 'text-gray-600';
  }
};

export const getRarityBgColor = (rarity: string) => {
  switch (rarity) {
    case 'common': return 'bg-gray-100 border-gray-300';
    case 'rare': return 'bg-blue-100 border-blue-300';
    case 'epic': return 'bg-purple-100 border-purple-300';
    case 'legendary': return 'bg-yellow-100 border-yellow-300';
    default: return 'bg-gray-100 border-gray-300';
  }
};