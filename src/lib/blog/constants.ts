export const BLOG_CATEGORIES = [
  'Klusjes & routines',
  'Motivatie & discipline',
  'Schermtijd & balans',
  'Samenwerken als gezin',
  'Communicatie & complimenten',
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const AUDIENCE_SEGMENTS = [
  'De Betrokken Gezinsbouwer',
  'De Educatieve Ouder',
  'De Drukke Planner',
  'De Leerkracht of Schoolcoördinator',
  'De Impactpartner',
  'De Maatschappelijke Sponsor',
] as const;

export type AudienceSegment = (typeof AUDIENCE_SEGMENTS)[number];

export const BLOG_CATEGORY_DETAILS: Record<BlogCategory, string> = {
  'Klusjes & routines':
    'Leg uit hoe dagelijkse klusjes, routines en spelenderwijs plannen gezinnen rust en structuur geven. Zet praktische voorbeelden in die aansluiten bij basisschoolkinderen.',
  'Motivatie & discipline':
    'Focus op intrinsieke en extrinsieke motivatie, beloningssystemen en groeimindset. Laat zien hoe KlusjesKoning kinderen helpt volhouden en trots maakt.',
  'Schermtijd & balans':
    'Benadruk balans tussen schermtijd en actieve tijd. Toon hoe punten, beloningen en taken helpen bij duidelijke afspraken en gezonde gewoonten.',
  'Samenwerken als gezin':
    'Vertel hoe gezinnen beter samenwerken, communiceren en gezamenlijke doelen halen via het platform. Laat teamgevoel en gedeelde doelen centraal staan.',
  'Communicatie & complimenten':
    'Laat zien hoe positieve feedback, complimenten en reflectiemomenten werken. Beschrijf hoe ouders en kinderen elkaars inzet waarderen.',
};

export const AUDIENCE_SEGMENT_DETAILS: Record<
  AudienceSegment,
  {
    profile: string;
    needs: string;
    motivation: string;
    channels: string;
    message: string;
  }
> = {
  'De Betrokken Gezinsbouwer': {
    profile:
      '30–45 jaar, 1–3 kinderen in de basisschoolleeftijd. Werkt, zoekt balans tussen plezier en verantwoordelijkheid. Hecht aan gezamenlijkheid en structuur.',
    needs: 'Minder strijd om klusjes en schermtijd, meer samenwerking en zichtbaarheid van goed gedrag, kinderen leren sparen en geven.',
    motivation: '“Ik wil dat mijn kinderen leren helpen én trots zijn op wat ze doen.”',
    channels: 'Instagram, Facebook, oudercommunities, schoolnieuwsbrieven, platforms zoals Ouders van Nu en Kek Mama.',
    message: 'Maak van klusjes doen iets leuks én leerzaams — met KlusjesKoning groeien je kinderen met elke taak een stapje verder!',
  },
  'De Educatieve Ouder': {
    profile:
      'Hoogopgeleid, geïnteresseerd in ontwikkeling en leren. Leest opvoedblogs, stimuleert doelen en gebruikt educatieve tools.',
    needs: 'Educatieve tools met echte leerwaarde, gamification die gedrag vormt, veilige omgeving zonder reclame.',
    motivation: '“Ik wil mijn kinderen leren plannen, sparen en bewust omgaan met geld en verantwoordelijkheid.”',
    channels: 'LinkedIn, educatieve blogs en podcasts, nieuwsbrieven met opvoed- en leertips.',
    message: 'Een speelse manier om kinderen te leren samenwerken, sparen en geven — met echte leerresultaten.',
  },
  'De Drukke Planner': {
    profile:
      '25–40 jaar, vaak twee werkende ouders. Zoekt praktische oplossingen en gebruikt digitale planners voor overzicht.',
    needs: 'Inzicht in wie wat doet, kinderen actiever betrekken, minder herhaling van reminders.',
    motivation: '“Ik wil rust, structuur en meer tijd voor het leuke.”',
    channels: 'Facebook & Instagram Ads met focus op gemak, time-management podcasts, korte video-advertenties.',
    message: 'KlusjesKoning brengt structuur én plezier in huis — geen strijd, maar samenwerking.',
  },
  'De Leerkracht of Schoolcoördinator': {
    profile:
      'Leerkrachten groep 5–8 of intern begeleiders. Zoeken projecten voor samenwerking en burgerschap. Hebben weinig tijd.',
    needs: 'Kant-en-klare leerprojecten, klasacties met teamwork, eenvoudige rapportage van groepsdoelen.',
    motivation: '“Ik wil mijn leerlingen leren samenwerken en bijdragen aan iets groters.”',
    channels: 'Onderwijsnieuwsbrieven, onderwijsbeurzen, Leraar24, LinkedIn, directe schoolmail.',
    message: 'Maak samenwerken zichtbaar — laat je klas groeien van kleine klusser tot grote koning!',
  },
  'De Impactpartner': {
    profile:
      'Non-profit of stichting met missie rond kinderen/gezinnen. Wil jong publiek betrekken en bewust maken.',
    needs: 'Structurele zichtbaarheid in gezinnen, interactieve campagnes, kinderen leren geven.',
    motivation: '“We willen kinderen betrekken bij geven, niet alleen ouders.”',
    channels: 'LinkedIn, netwerkevents, fondsenwerving- en onderwijsnetwerken, mailcampagnes.',
    message: 'Word ons Goed Doel van de Maand en laat duizenden gezinnen kennismaken met jullie missie.',
  },
  'De Maatschappelijke Sponsor': {
    profile:
      'Lokale of landelijke merken gericht op gezinnen. Zoeken CSR-projecten met zichtbare impact en positief imago.',
    needs: 'Partnerships met goed imago, acties voor klanten en medewerkers, meetbare impactcijfers.',
    motivation: '“Wij willen gezinnen helpen en maatschappelijke betrokkenheid tonen.”',
    channels: 'LinkedIn, zakelijke netwerken, lokale ondernemersverenigingen, PR en persberichten.',
    message: 'Verbind je merk aan groei, samenwerking en goed doen — samen bouwen we aan jonge koningen van de toekomst.',
  },
};
