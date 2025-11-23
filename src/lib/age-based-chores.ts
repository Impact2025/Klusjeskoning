export interface AgeBasedChore {
  name: string;
  description: string;
  points: number;
  xpReward: number;
  minAge: number;
  maxAge: number;
  frequency: 'daily' | 'weekly' | 'monthly';
  category: 'cleaning' | 'personal' | 'help' | 'learning';
}

export const AGE_BASED_CHORES: AgeBasedChore[] = [
  // Ages 4-6 (Preschool)
  {
    name: "Speelgoed opruimen",
    description: "Ruim je speelgoed op in de kist",
    points: 5,
    xpReward: 10,
    minAge: 4,
    maxAge: 6,
    frequency: 'daily',
    category: 'cleaning'
  },
  {
    name: "Tanden poetsen",
    description: "Poets je tanden goed schoon",
    points: 3,
    xpReward: 5,
    minAge: 4,
    maxAge: 6,
    frequency: 'daily',
    category: 'personal'
  },
  {
    name: "Bed opmaken",
    description: "Maak je bed netjes op",
    points: 4,
    xpReward: 8,
    minAge: 4,
    maxAge: 6,
    frequency: 'daily',
    category: 'personal'
  },

  // Ages 7-9 (Early Elementary)
  {
    name: "Kamer opruimen",
    description: "Ruim je hele kamer op",
    points: 15,
    xpReward: 25,
    minAge: 7,
    maxAge: 9,
    frequency: 'weekly',
    category: 'cleaning'
  },
  {
    name: "Vaatwasser uitruimen",
    description: "Haal de schone vaat uit de vaatwasser",
    points: 8,
    xpReward: 15,
    minAge: 7,
    maxAge: 9,
    frequency: 'daily',
    category: 'help'
  },
  {
    name: "Tafel dekken",
    description: "Dek de tafel voor het eten",
    points: 6,
    xpReward: 12,
    minAge: 7,
    maxAge: 9,
    frequency: 'daily',
    category: 'help'
  },
  {
    name: "Huiswerk maken",
    description: "Maak je huiswerk af",
    points: 10,
    xpReward: 20,
    minAge: 7,
    maxAge: 9,
    frequency: 'daily',
    category: 'learning'
  },

  // Ages 10-12 (Late Elementary)
  {
    name: "Vloer stofzuigen",
    description: "Stoofzuig de woonkamer",
    points: 12,
    xpReward: 20,
    minAge: 10,
    maxAge: 12,
    frequency: 'weekly',
    category: 'cleaning'
  },
  {
    name: "Boodschappen helpen",
    description: "Help met het dragen van boodschappen",
    points: 8,
    xpReward: 15,
    minAge: 10,
    maxAge: 12,
    frequency: 'weekly',
    category: 'help'
  },
  {
    name: "Keuken schoonmaken",
    description: "Maak de keuken schoon na koken",
    points: 20,
    xpReward: 35,
    minAge: 10,
    maxAge: 12,
    frequency: 'weekly',
    category: 'cleaning'
  },
  {
    name: "Tuin helpen",
    description: "Help met onkruid wieden in de tuin",
    points: 15,
    xpReward: 25,
    minAge: 10,
    maxAge: 12,
    frequency: 'weekly',
    category: 'help'
  },

  // Ages 13-15 (Teen)
  {
    name: "Auto wassen",
    description: "Was de auto van buiten",
    points: 25,
    xpReward: 40,
    minAge: 13,
    maxAge: 15,
    frequency: 'monthly',
    category: 'help'
  },
  {
    name: "Grote schoonmaak",
    description: "Schoonmaak van een hele verdieping",
    points: 30,
    xpReward: 50,
    minAge: 13,
    maxAge: 15,
    frequency: 'monthly',
    category: 'cleaning'
  },
  {
    name: "Koken helpen",
    description: "Help met koken voor het gezin",
    points: 18,
    xpReward: 30,
    minAge: 13,
    maxAge: 15,
    frequency: 'weekly',
    category: 'help'
  },
  {
    name: "Vuilnis buiten zetten",
    description: "Zet alle vuilnisbakken buiten",
    points: 8,
    xpReward: 15,
    minAge: 13,
    maxAge: 15,
    frequency: 'weekly',
    category: 'help'
  }
];

export function getChoresForAge(age: number, limit: number = 15): AgeBasedChore[] {
  return AGE_BASED_CHORES
    .filter(chore => age >= chore.minAge && age <= chore.maxAge)
    .slice(0, limit);
}

export function getDefaultAllowanceForAge(age: number): number {
  if (age <= 6) return 250; // €2.50 per week
  if (age <= 9) return 500; // €5.00 per week
  if (age <= 12) return 750; // €7.50 per week
  return 1000; // €10.00 per week
}