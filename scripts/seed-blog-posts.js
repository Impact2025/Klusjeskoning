const { db } = require('../src/server/db/client');
const { blogPosts } = require('../src/server/db/schema');

const sampleBlogPosts = [
  {
    title: 'Hoe maak je klusjes leuk voor kinderen?',
    slug: 'hoe-maak-je-klusjes-leuk',
    excerpt: 'Ontdek praktische tips om huishoudelijke taken in een spannend avontuur om te zetten.',
    content: `<h2>Inleiding</h2>
<p>Klusjes hoeven niet saai te zijn! Met de juiste aanpak kunnen huishoudelijke taken een leuke en leerrijke ervaring worden voor kinderen.</p>

<h2>Tip 1: Maak het een spel</h2>
<p>Voeg gamification toe door punten, levels en beloningen in te voeren. Dit geeft kinderen een doel om naar toe te werken.</p>

<h2>Tip 2: Kies taken op maat</h2>
<p>Zorg ervoor dat klusjes geschikt zijn voor de leeftijd en capaciteiten van je kind. Dit verhoogt het succes en het zelfvertrouwen.</p>

<h2>Tip 3: Vier kleine overwinningen</h2>
<p>Erken en beloon inspanningen, niet alleen resultaten. Dit moedigt kinderen aan om door te gaan.</p>

<h2>Conclusie</h2>
<p>Met geduld en creativiteit kunnen klusjes een positieve gewoonte worden die kinderen helpt groeien.</p>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=400&fit=crop',
    tags: ['tips', 'opvoeding', 'klusjes'],
    status: 'published',
    seoTitle: 'Hoe maak je klusjes leuk voor kinderen - KlusjesKoning',
    seoDescription: 'Praktische tips om huishoudelijke taken in een spannend avontuur om te zetten.',
    publishedAt: new Date('2025-01-15'),
  },
  {
    title: 'De voordelen van verantwoordelijkheid leren op jonge leeftijd',
    slug: 'voordelen-verantwoordelijkheid',
    excerpt: 'Waarom het belangrijk is dat kinderen vroeg leren wat verantwoordelijkheid betekent.',
    content: `<h2>Waarom verantwoordelijkheid?</h2>
<p>Verantwoordelijkheid is een essentiële vaardigheid die kinderen helpt groeien tot zelfstandige volwassenen.</p>

<h2>Voordeel 1: Zelfvertrouwen</h2>
<p>Wanneer kinderen taken voltooien, voelen ze zich trots en competent. Dit bouwt hun zelfvertrouwen op.</p>

<h2>Voordeel 2: Leren van gevolgen</h2>
<p>Door verantwoordelijkheid te nemen, leren kinderen dat hun acties gevolgen hebben - zowel positief als negatief.</p>

<h2>Voordeel 3: Gezinssamenhang</h2>
<p>Wanneer iedereen bijdraagt, voelt het gezin als een team. Dit versterkt de band tussen gezinsleden.</p>

<h2>Voordeel 4: Voorbereiding op volwassenheid</h2>
<p>Kinderen die vroeg leren verantwoordelijkheid te nemen, zijn beter voorbereid op de uitdagingen van het volwassen leven.</p>

<h2>Conclusie</h2>
<p>Investeer in het leren van verantwoordelijkheid - het is een geschenk dat je kind voor het leven meeneemt.</p>`,
    coverImageUrl: 'https://images.unsplash.com/photo-1503454537688-e6c8ff1d9c89?w=800&h=400&fit=crop',
    tags: ['opvoeding', 'verantwoordelijkheid', 'groei'],
    status: 'published',
    seoTitle: 'Voordelen van verantwoordelijkheid leren - KlusjesKoning',
    seoDescription: 'Ontdek waarom het belangrijk is dat kinderen vroeg verantwoordelijkheid leren.',
    publishedAt: new Date('2025-01-10'),
  },
];

async function seedBlogPosts() {
  try {
    console.log('🌱 Seeding blog posts...');
    
    for (const post of sampleBlogPosts) {
      await db.insert(blogPosts).values({
        ...post,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`✅ Created blog post: ${post.title}`);
    }
    
    console.log('✨ Blog posts seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding blog posts:', error);
    process.exit(1);
  }
}

seedBlogPosts();
