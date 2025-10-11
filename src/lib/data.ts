import type { RewardType } from './types';

export const topChores = {
  binnen: [
    { name: 'Kamer opruimen', points: 25, description: 'Speelgoed, bureau en bed netjes maken' },
    { name: 'Tafel dekken en afruimen', points: 10, description: 'Helpen voor en na het eten' },
    { name: 'Afwassen / vaatwasser in- en uitruimen', points: 20, description: 'Borden, bestek en glazen' },
    { name: 'Stofzuigen of vegen', points: 30, description: 'Woonkamer, eigen kamer of hal' },
    { name: 'Afstoffen', points: 15, description: 'Meubels en vensterbanken schoonmaken' },
  ],
  buiten: [
    { name: 'Vuilnis buiten zetten', points: 15, description: 'Prullenbak legen, containers aan straat zetten' },
    { name: 'Tuin helpen', points: 35, description: 'Bladeren harken, onkruid wieden' },
    { name: 'Fietsen schoonmaken', points: 30, description: 'Poetsen en netjes in de schuur zetten' },
  ],
  zorg: [
    { name: 'Dieren verzorgen', points: 25, description: 'Hond uitlaten, voerbak vullen, kooi verschonen' },
    { name: 'Boodschappen helpen', points: 20, description: 'Tassen dragen, spullen uitpakken' },
  ],
};

export const topRewards: Record<string, {name: string, points: number, type: RewardType}[]> = {
  tijd: [
    { name: 'Samen een spelletje spelen', points: 200, type: 'experience' },
    { name: 'Later opblijven & film kijken', points: 300, type: 'experience' },
    { name: 'Samen bakken of koken', points: 400, type: 'experience' },
    { name: 'Samen een uitstapje doen', points: 750, type: 'experience' },
    { name: 'Kind kiest de dagplanning', points: 1000, type: 'experience' },
  ],
  goedDoel: [
    { name: '1 boom planten 🌳', points: 100, type: 'donation' },
    { name: 'Eten/drinken voor kind in armoede 🍽️', points: 200, type: 'donation' },
    { name: 'Steun voor dierenopvang 🐾', points: 300, type: 'donation' },
    { name: 'Bijdrage aan een schoolproject ✏️', points: 500, type: 'donation' },
  ],
  zakgeld: [
    { name: '€1 zakgeld', points: 100, type: 'money' },
    { name: '€5 zakgeld', points: 500, type: 'money' },
    { name: '€10 zakgeld', points: 1000, type: 'money' },
  ],
  privileges: [
    { name: '30 min extra schermtijd', points: 150, type: 'privilege' },
    { name: 'Kiezen wat er gegeten wordt', points: 250, type: 'privilege' },
    { name: 'Vriend/vriendin mag logeren', points: 400, type: 'privilege' },
    { name: 'Een dag vrij van klusjes 😉', points: 600, type: 'privilege' },
  ],
};
