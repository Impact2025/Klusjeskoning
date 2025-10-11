'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import {
  AUDIENCE_SEGMENT_DETAILS,
  AUDIENCE_SEGMENTS,
  BLOG_CATEGORIES,
  BLOG_CATEGORY_DETAILS,
  type AudienceSegment,
  type BlogCategory,
} from '@/lib/blog/constants';

const GenerateBlogArticleInputSchema = z.object({
  category: z.enum(BLOG_CATEGORIES).describe('The primary content pillar to write about.'),
  audienceSegment: z.enum(AUDIENCE_SEGMENTS).describe('The audience segment to tailor the article to.'),
  primaryKeyword: z.string().min(1, 'Primair keyword is verplicht.'),
  extraKeywords: z.string().optional().default(''),
  toneOfVoice: z.string().min(1, 'Toon is verplicht.'),
  targetAudience: z.string().min(1, 'Doelgroep is verplicht.'),
  writingStyle: z.string().min(1, 'Stijl is verplicht.'),
  customFocus: z
    .string()
    .optional()
    .describe('Optional notes about a specific angle, product feature or goal to highlight.'),
});
export type GenerateBlogArticleInput = z.infer<typeof GenerateBlogArticleInputSchema>;

const SEOJsonSchema = z.object({
  focus_keyphrase: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  slug: z.string(),
  tags: z.string(),
  social_blurb: z.string(),
  social_hashtags: z.string(),
  midjourney_prompt: z.string(),
});

const GenerateBlogArticleOutputSchema = z.object({
  article_html: z.string(),
  seo_json: SEOJsonSchema,
  midjourney_prompt: z.string(),
});
export type GenerateBlogArticleOutput = z.infer<typeof GenerateBlogArticleOutputSchema>;

const PromptInputSchema = GenerateBlogArticleInputSchema.extend({
  categoryBrief: z.string(),
  audienceProfile: z.string(),
  audienceNeeds: z.string(),
  audienceMotivation: z.string(),
  audienceChannels: z.string(),
  audienceMessage: z.string(),
});

const prompt = ai.definePrompt({
  name: 'generateBlogArticlePrompt',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateBlogArticleOutputSchema },
  prompt: `Je bent hoofdredacteur van KlusjesKoning.nl — een vrolijk, educatief platform voor gezinnen (kinderen 6–13).
Gebruik onderstaande input en schrijf een volledige blogpost.

Belangrijke productcontext:
- KlusjesKoning laat gezinnen verantwoordelijkheid, sparen en doneren spelenderwijs ervaren.
- Kinderen verdienen punten door klusjes te doen en kunnen die besteden aan beloningen of goede doelen.
- Ouders zoeken warmte, structuur en praktische tips.

Invoer (vervang de accolades door waarden):

PrimairKeyword: {{{primaryKeyword}}}
ExtraKeywords: {{{extraKeywords}}}
ToneOfVoice: {{{toneOfVoice}}}        # bijv. warm, praktisch, educatief, speels, betrouwbaar
Doelgroep: {{{targetAudience}}}        # bijv. ouders 6–13, leerkrachten, opvoeders
Lengte: 700–900 woorden
Stijl: {{{writingStyle}}}              # bijv. blogartikel, gids, nieuwsartikel, verhaal

Contentcontext ter inspiratie:
- Contentpijler: {{{category}}}
- Context: {{{categoryBrief}}}
- Doelgroepprofiel: {{{audienceProfile}}}
- Behoeften: {{{audienceNeeds}}}
- Motivatie: {{{audienceMotivation}}}
- Communicatiekanalen: {{{audienceChannels}}}
- Merkboodschap: {{{audienceMessage}}}
{{#customFocus}}- Extra focus: {{{customFocus}}}
{{/customFocus}}

Schrijfregels (strikt naleven):
- Taal: Nederlands.
- Zinnen: maximaal 20 woorden per zin.
- Lengte: 700–900 woorden.
- Toon: warm, praktisch, positief, betrouwbaar.
- Geen emoji’s, geen verwijzing naar AI.
- Geen inline CSS of styles in de HTML.
- Gebruik het PrimairKeyword in titel, eerste alinea en minstens één H2.
- Verwerk ExtraKeywords natuurlijk en beperkt.
- Structuur exact volgens het artikel-format.
- Optimaliseer voor SEO met duidelijke koppen en scanbare alinea’s.

Artikelstructuur (exact aanhouden, zonder extra koppen):

H1: Pakkende titel met PrimairKeyword

Intro: 2–3 zinnen – waarom dit onderwerp relevant is voor de doelgroep

H2: Wat is er aan de hand?
Uitleg van context/aanleiding (onderzoek, trend, praktijk) in eenvoudige taal

H2: Wat betekent dit voor gezinnen?
3–5 korte, praktische tips in bullets

H2: Onze visie (KlusjesKoning)
Koppel aan verantwoordelijkheid, samenwerking, geldwaarde of maatschappelijke betrokkenheid

H2: Wat kun jij vandaag doen?
Concreet stappenlijstje of voorbeeldklusjes

Slot
Positieve afsluiting met uitnodiging om KlusjesKoning te proberen of meer tips te lezen

Bron
Onder het artikel: Bron: [{{Link}}] (laat {{Link}} als placeholder staan)

Outputvereisten:
- Retourneer een JSON-object met velden: article_html (string), seo_json (object), midjourney_prompt (string).
- article_html bevat het volledige artikel in HTML conform structuur.
- Gebruik <p> tags voor alinea's met voldoende witruimte ertussen.
- Gebruik <h1> voor de hoofdtitel, <h2> voor subkoppen.
- Gebruik <ul> en <li> voor bullet lists.
- Elke sectie moet gescheiden zijn met witruimte voor leesbaarheid.
- seo_json bevat de meta-informatie:
  {
    "focus_keyphrase": "{{PRIMARY_KEYWORD}}",
    "meta_title": "Titel ≤ 60 tekens met keyword",
    "meta_description": "Samenvatting ≤ 155 tekens met keyword",
    "slug": "korte-slug-met-koppelteken",
    "tags": "{{EXTRA_KEYWORDS_COMMA_SEPARATED}}",
    "social_blurb": "1–2 zinnen warme praktische toon",
    "social_hashtags": "klusjeskoning,opvoeding,gezinnen,leren,motivatie",
    "midjourney_prompt": "realistische 1:1 foto van een gezin dat samen een eenvoudige huishoudklus doet in natuurlijk licht, warme huiselijke sfeer, geen merken of logo's, scherpe focus"
  }
- midjourney_prompt: "realistische 1:1 foto van een ouder en kind die samen de woonkamer opruimen in warm natuurlijk licht, ontspannen en vrolijke sfeer, geen merken of logo's, scherpe focus"

Focus op praktische toepasbaarheid voor ouders met kinderen 6–13. Gebruik herkenbare voorbeelden en stimuleer samenwerking, sparen of doneren.`,
});

const generateBlogArticleFlow = ai.defineFlow(
  {
    name: 'generateBlogArticleFlow',
    inputSchema: GenerateBlogArticleInputSchema,
    outputSchema: GenerateBlogArticleOutputSchema,
  },
  async input => {
    const audience = AUDIENCE_SEGMENT_DETAILS[input.audienceSegment as AudienceSegment];
    const promptInput = {
      ...input,
      categoryBrief: BLOG_CATEGORY_DETAILS[input.category as BlogCategory],
      audienceProfile: audience.profile,
      audienceNeeds: audience.needs,
      audienceMotivation: audience.motivation,
      audienceChannels: audience.channels,
      audienceMessage: audience.message,
    };

    const { output } = await prompt(promptInput);
    return output!;
  }
);

export async function generateBlogArticle(
  input: GenerateBlogArticleInput
): Promise<GenerateBlogArticleOutput> {
  return generateBlogArticleFlow(input);
}
