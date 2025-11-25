import { db } from '../src/server/db/client';
import { rewardTemplates } from '../src/server/db/schema';

const rewardTemplatesData = [
  // Privileges & Autonomie
  {
    name: 'Pizzadag Kiezer 🍕',
    description: 'Kiest wat er op een bepaalde avond gegeten wordt (uit 3 ouder-goedgekeurde opties).',
    category: 'privileges' as const,
    defaultPoints: 5,
    minAge: 6,
    emoji: '🍕',
  },
  {
    name: 'Uitzendtijd Manager',
    description: 'Bepaalt de film of het TV-programma dat de familie samen kijkt.',
    category: 'privileges' as const,
    defaultPoints: 8,
    minAge: 8,
    emoji: '📺',
  },
  {
    name: 'Slaaptijd Uisteller',
    description: 'Mag 15 minuten later naar bed op een doordeweekse avond.',
    category: 'privileges' as const,
    defaultPoints: 10,
    minAge: 8,
    emoji: '🕐',
  },
  {
    name: 'Geen Groenten Vrijstelling',
    description: 'Krijgt vrijstelling van het eten van één soort groente bij één maaltijd.',
    category: 'privileges' as const,
    defaultPoints: 3,
    minAge: 6,
    emoji: '🥦',
  },
  {
    name: '1-op-1 Tijd Kaart',
    description: 'Een half uur ononderbroken speeltijd/leestijd met de ouder.',
    category: 'privileges' as const,
    defaultPoints: 12,
    minAge: 4,
    emoji: '👨‍👩‍👧',
  },
  {
    name: 'Joker Klus Pas',
    description: 'Mag één keer een toegewezen klusje overslaan of ruilen met een gezinslid.',
    category: 'privileges' as const,
    defaultPoints: 25,
    minAge: 10,
    emoji: '🃏',
  },

  // Tijd & Ervaring
  {
    name: 'Vriendjeslogeerpartij',
    description: 'Een overnachting van een vriend(in) plannen in het weekend.',
    category: 'experience' as const,
    defaultPoints: 50,
    minAge: 8,
    emoji: '🏠',
  },
  {
    name: 'Activiteit naar Keuze',
    description: 'Een bezoek aan de bioscoop, binnenspeeltuin of zwembad.',
    category: 'experience' as const,
    defaultPoints: 40,
    minAge: 6,
    emoji: '🎢',
  },
  {
    name: 'Gezins Date Night',
    description: 'Kiest een gezinsuitje (bijvoorbeeld een picknick of fietstocht) die de ouders organiseren.',
    category: 'experience' as const,
    defaultPoints: 35,
    minAge: 4,
    emoji: '👨‍👩‍👧‍👦',
  },
  {
    name: 'Bak- of Kooksessie',
    description: 'Samen met een ouder een specifiek recept bakken of koken (met ingrediënten betaald door ouder).',
    category: 'experience' as const,
    defaultPoints: 15,
    minAge: 6,
    emoji: '👩‍🍳',
  },
  {
    name: 'Mini-Kamer Herinrichting',
    description: 'Krijgt hulp van een ouder om de slaapkamer op een kleine manier te veranderen (bijv. meubels verplaatsen, nieuwe poster).',
    category: 'experience' as const,
    defaultPoints: 30,
    minAge: 10,
    emoji: '🛋️',
  },

  // Fysiek & Financieel
  {
    name: 'Cash-out Zakgeld 💰',
    description: 'Inwisselen van gespaarde punten voor een afgesproken geldbedrag.',
    category: 'financial' as const,
    defaultPoints: 100,
    minAge: 10,
    emoji: '💰',
  },
  {
    name: 'Nieuw Speelgoed Fonds',
    description: 'Een bijdrage in het spaarpotje voor een groot, specifiek item (bijv. videogame, fiets).',
    category: 'financial' as const,
    defaultPoints: 200,
    minAge: 8,
    emoji: '🎮',
  },
  {
    name: 'Boek/Tijdschrift naar Keuze',
    description: 'De aankoop van een nieuw boek of tijdschrift.',
    category: 'financial' as const,
    defaultPoints: 20,
    minAge: 4,
    emoji: '📚',
  },
  {
    name: 'Goede Doelen Donatie 🌍',
    description: 'De gespaarde punten doneren aan een vooraf geselecteerd goed doel (ouder matcht het bedrag).',
    category: 'financial' as const,
    defaultPoints: 50,
    minAge: 8,
    emoji: '🌍',
  },
  {
    name: 'Kleine Verrassing',
    description: 'Een kleinigheidje uit de winkel (tot €5) uitkiezen bij de volgende boodschappen.',
    category: 'financial' as const,
    defaultPoints: 15,
    minAge: 4,
    emoji: '🎁',
  },
];

async function seedRewardTemplates() {
  try {
    console.log('🌱 Seeding reward templates...');

    // Clear existing templates
    await db.delete(rewardTemplates);

    // Insert new templates
    await db.insert(rewardTemplates).values(rewardTemplatesData);

    console.log(`✅ Successfully seeded ${rewardTemplatesData.length} reward templates`);
  } catch (error) {
    console.error('❌ Error seeding reward templates:', error);
    throw error;
  }
}

// Run the seeder if this script is executed directly
if (require.main === module) {
  seedRewardTemplates()
    .then(() => {
      console.log('🎉 Reward templates seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Reward templates seeding failed:', error);
      process.exit(1);
    });
}

export { seedRewardTemplates };