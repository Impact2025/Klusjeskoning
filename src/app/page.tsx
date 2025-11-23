import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { ShieldCheck, Gift, Rocket, Wand2, Users, Trophy, Heart, ArrowRight, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PLAN_DEFINITIONS, formatPrice } from '@/lib/plans';
import { fetchPublishedBlogPosts } from '@/lib/content';
import { OrganizationSchema, WebApplicationSchema, ProductSchema, FAQSchema } from '@/components/seo/StructuredData';
import { HowItWorksCarousel, FounderStoryCarousel } from '@/components/home/HomePageClient';
import { Header } from '@/components/header/Header';

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const highlights = [
  {
    icon: Gift,
    title: 'Speels en modern',
    description: 'Heldere kleurpaletten, zachte animaties en een UX op maat voor gezinnen.',
  },
  {
    icon: ShieldCheck,
    title: 'Veilig & vertrouwd',
    description: 'Parent-first authenticatie, kindvriendelijke login en herstelcodes per gezin.',
  },
  {
    icon: Gift,
    title: 'Belonen waar het telt',
    description: 'Van privileges tot donaties: stel beloningen samen die bij jullie gezin passen.',
  },
];

const featureCards = [
  {
    title: 'Slimme Gemini ondersteuning',
    description: 'Vraag met één klik verse klus-ideeën afgestemd op jullie gezin en seizoen.',
    icon: Wand2,
  },
  {
    title: 'Overzicht voor ouders',
    description: 'Keur ingediende klusjes goed, beheer kinderen en houd pending beloningen bij.',
    icon: Users,
  },
  {
    title: 'Gamified child experience',
    description: 'Levels, punten en een shop vol motivators geven kinderen eigenaarschap.',
    icon: Trophy,
  },
  {
    title: 'Impactvolle donaties',
    description: 'Activeer maandelijkse goede doelen zodat sparen ook iets oplevert voor de wereld.',
    icon: Heart,
  },
];

const testimonials = [
  {
    quote: 'Sinds KlusjesKoning vragen de kinderen zélf om nieuwe klusjes. Het dashboard geeft mij rust en overzicht.',
    author: 'Sanne, ouder van twee',
  },
  {
    quote: 'Het voelt als een game: punten sparen, levels stijgen en dan samen een filmavond verdienen. Super leuk!',
    author: 'Mila (10)',
  },
  {
    quote: 'De AI-ideeën helpen ons om de routine fris te houden. Geen gekibbel meer over wie wat doet.',
    author: 'Robin, ouder van drie',
  },
];

const stats = [
  { value: '72K+', label: 'Totaal punten ooit' },
  { value: '4.9★', label: 'Gemiddelde ouder-rating' },
  { value: '86%', label: 'Kinderen sparen langer door' },
];

const pricingPlans = [
  {
    id: 'starter',
    title: 'Gratis (Starter)',
    badge: 'Meest gekozen om te starten',
    price: formatPrice(PLAN_DEFINITIONS.starter.priceMonthlyCents),
    priceNote: 'Altijd gratis',
    yearly: null,
    cta: { label: 'Start gratis', href: '/app?register=true' },
    accent: 'border-slate-200',
    features: [
      'Max. 2 kinderen',
      '10 klusjes per maand',
      'Basis dashboard',
      'Punten & spaardoelen',
      'Geen AI-helper',
      'Geen virtueel huisdier & badges',
      'Geen donaties of thema\'s',
    ],
  },
  {
    id: 'premium',
    title: 'Premium (Gezin+)',
    badge: 'Alle functies ontgrendeld',
    price: `${formatPrice(PLAN_DEFINITIONS.premium.priceMonthlyCents)} / maand`,
    priceNote: `${formatPrice(PLAN_DEFINITIONS.premium.priceYearlyCents)} / jaar`,
    yearly: formatPrice(PLAN_DEFINITIONS.premium.priceYearlyCents),
    cta: { label: 'Word Gezin+', href: '/app?checkout=premium' },
    accent: 'border-amber-300 shadow-lg',
    features: [
      'Onbeperkte kinderen & klusjes',
      'AI-klusassistent (Gemini)',
      'Virtueel huisdier & badges',
      'Gezinsdoelen & donaties',
      'Aanpasbare thema’s & huisstijl',
      'Ouders beheren spaardoelen',
      'Klantondersteuning via e-mail',
    ],
  },
];

const founderStorySlides = [
  {
    title: '💡 Hoe het begon',
    paragraphs: [
      'Soms komen de beste ideeën gewoon aan de keukentafel. Het idee voor KlusjesKoning ontstond toen mijn zoon Alex (toen 9) vroeg: “Papa, waarom krijg ik geen punten als ik de vaatwasser uitruim?” 😄',
      'Wat begon als een grapje, groeide uit tot een plan: een app waarin kinderen niet alleen iets verdienen, maar ook leren wat hun inzet waard is — voor zichzelf én voor anderen.',
      'Zo werd KlusjesKoning geboren: een online hulpmiddel dat spel, opvoeding en maatschappelijke betrokkenheid samenbrengt.',
    ],
  },
  {
    title: '👨‍💻 Over mij',
    paragraphs: [
      'Ik ben Vincent van Munster, oprichter van WeAreImpact: een impact innovatie studio die technologie inzet om de wereld een stukje mooier te maken.',
      'Met KlusjesKoning wil ik laten zien dat digitale tools niet alleen verslavend of oppervlakkig hoeven te zijn, maar juist kunnen helpen bij wat echt belangrijk is: groeien, leren en samen doen.',
      'Bij WeAreImpact werken we aan projecten met betekenis — van educatieve apps tot maatschappelijke platforms. Altijd met één doel: impact maken met plezier.',
    ],
  },
  {
    title: '🌍 Onze missie',
    paragraphs: [
      'KlusjesKoning is meer dan een app. Het is een kleine beweging in huis met een grote gedachte erachter.',
      'Als ieder kind leert dat inzet iets oplevert — niet alleen voor zichzelf, maar ook voor anderen — wordt de wereld vanzelf een stukje mooier.',
      'Daarom kun je met KlusjesKoning niet alleen sparen voor leuke dingen, maar ook punten doneren aan goede doelen. Zo leren kinderen dat helpen goed voelt, thuis én daarbuiten.',
    ],
  },
  {
    title: '👑 Sluit je aan',
    paragraphs: [
      'Doe mee met honderden gezinnen die samen ontdekken dat verantwoordelijkheid nemen best leuk kan zijn.',
      'Registreer je als ouder, maak een gezinsprofiel aan en geef jouw kinderen hun eigen mini-koninkrijk vol uitdagingen, beloningen en groei.',
      'Samen bouwen we aan het KlusjesKoninkrijk — jij bepaalt de spelregels.',
    ],
  },
];

export default async function HomePage() {
  const allPosts = await fetchPublishedBlogPosts();
  const latestPosts = allPosts.slice(0, 2);

  return (
    <div className="relative overflow-hidden">
      <OrganizationSchema />
      <WebApplicationSchema />

      {/* Header */}
      <Header />

      {/* Professional Hero Header with Background Image */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16" role="banner" aria-label="Hoofdsectie met introductie">
        {/* Background Image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/images/app voor klusjes, zakgeld en gezinsdoelen.png"
            alt="KlusjesKoning app voor klusjes, zakgeld en gezinsdoelen - Dashboard met klusjes, punten en beloningen"
            fill
            className="object-cover object-center transition-transform duration-700 ease-out hover:scale-105"
            priority
            quality={85}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R+IRjWjBqO6O2mhP//Z"
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Column - Main Content */}
            <div className="space-y-6 text-center lg:text-left">
              {/* Badge */}
              <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm px-4 py-2 text-sm font-medium mx-auto lg:mx-0 w-fit">
                🚀 Professionele gezinsapp voor moderne ouders
              </Badge>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight animate-fade-in-up">
                KlusjesKoning
                <span className="block text-2xl sm:text-3xl lg:text-4xl font-light text-white/90 mt-2 animate-fade-in-up animation-delay-200">
                  Waar verantwoordelijkheid beloond wordt
                </span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg lg:text-xl text-white/90 leading-relaxed font-light animate-fade-in-up animation-delay-400">
                Transformeer dagelijkse klusjes in waardevolle leermomenten. Laat je kinderen ervaren hoe hun inzet wordt beloond - thuis én in de samenleving.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start items-center pt-4 animate-fade-in-up animation-delay-200">
                <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-white px-6 py-3 text-base font-semibold shadow-2xl">
                  <Link href="/app?register=true" className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Start jullie koninkrijk
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button asChild size="lg" variant="outline" className="border-white/80 bg-white/10 text-white hover:bg-white/30 hover:border-white backdrop-blur-md px-6 py-3 text-base font-medium shadow-xl">
                  <Link href="#hoe-het-werkt" className="flex items-center gap-2">
                    <Rocket className="h-4 w-4" />
                    Ontdek de magie
                  </Link>
                </Button>
              </div>
            </div>

            {/* Right Column - Trust Indicators */}
            <div className="space-y-6">
              <div className="grid grid-cols-3 lg:grid-cols-1 gap-6 text-white/80">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center lg:text-left lg:flex lg:items-center lg:gap-4 p-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20">
                    <p className="text-3xl lg:text-4xl font-bold text-white">{stat.value}</p>
                    <p className="text-sm font-medium mt-1 lg:mt-0">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/70 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      <main className="mx-auto flex max-w-6xl flex-col gap-12 sm:gap-16 px-3 sm:px-4 md:px-6 lg:px-10 pb-16 sm:pb-24">

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="hoe-werkt-het">
          {highlights.map(({ icon: Icon, title, description }, index) => (
            <Card key={title} className={`border-none bg-white/85 text-center shadow-lg backdrop-blur hover-lift transition-all duration-300 animate-fade-in-up`} style={{ animationDelay: `${index * 0.1}s` }}>
              <CardHeader className="space-y-2">
                <div className="mx-auto inline-flex items-center rounded-full bg-primary/10 p-3 text-primary transition-transform duration-300 hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 break-words hyphens-auto">{description}</CardDescription>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {featureCards.map(({ title, description, icon: Icon }) => (
            <Card key={title} className="border border-slate-100 bg-white/75 shadow-md backdrop-blur">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="mx-auto rounded-2xl bg-primary/15 p-3 text-primary sm:mx-0">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="text-center sm:text-left">
                  <CardTitle className="text-lg text-slate-900">{title}</CardTitle>
                  <CardDescription className="text-slate-600">{description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="space-y-6 sm:space-y-8" id="prijzen">
          <div className="text-center space-y-3 px-4 sm:px-0">
            <Badge className="bg-amber-200 text-amber-800 mx-auto">👑 2️⃣ Aanbevolen prijsstructuur (2025–2026)</Badge>
            <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900">Kies het plan dat bij jullie gezin past</h2>
            <p className="text-base sm:text-lg text-slate-600 break-words hyphens-auto">Start gratis en groei door naar Premium wanneer jullie klaar zijn voor onbeperkte fun en AI-power.</p>
          </div>
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 px-4 sm:px-0">
            {pricingPlans.map((plan) => (
              <Card key={plan.id} className={`relative border-2 bg-white/80 backdrop-blur ${plan.accent}`}>
                {plan.id === 'premium' && (
                  <div className="absolute -top-4 right-6 flex items-center gap-2 rounded-full bg-amber-400 px-4 py-1 text-xs font-bold text-amber-900 shadow-md">
                    <Crown className="h-4 w-4" /> Best value
                  </div>
                )}
                <CardHeader className="space-y-2">
                  <Badge variant="outline" className="w-fit border-dashed border-amber-300 bg-amber-50 text-amber-700">{plan.badge}</Badge>
                  <CardTitle className="text-2xl text-slate-900">{plan.title}</CardTitle>
                  <CardDescription className="text-base text-slate-600">{plan.price}</CardDescription>
                  {plan.priceNote && <p className="text-sm font-medium text-amber-600">{plan.priceNote}</p>}
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="space-y-2 text-sm text-slate-600">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button asChild size="lg" className={plan.id === 'premium' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-slate-900 text-white hover:bg-slate-800'}>
                    <Link href={plan.cta.href}>{plan.cta.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Snelle Blik Section - Moved from hero */}
        <section className="space-y-8" id="hoe-het-werkt">
          <div className="text-center space-y-4">
            <Badge className="bg-primary/10 text-primary mx-auto">👀 Snelle blik</Badge>
            <h2 className="text-3xl sm:text-4xl font-semibold text-slate-900">Zo werkt KlusjesKoning in 3 stappen</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Van registratie tot eerste beloning - ontdek hoe eenvoudig het is om jullie gezin te motiveren.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <HowItWorksCarousel />
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.author} className="border-none bg-white shadow-lg">
              <CardContent className="space-y-4 p-6 text-center">
                <Star className="h-6 w-6 text-amber-400" />
                <p className="text-base text-slate-600 break-words hyphens-auto">"{testimonial.quote}"</p>
                <p className="text-sm font-semibold text-slate-900">{testimonial.author}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-sky-700 p-6 sm:p-8 lg:p-10 text-primary-foreground shadow-2xl mx-3 sm:mx-0">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4 text-center lg:text-left">
              <Badge className="bg-white/20 text-white mx-auto lg:mx-0 w-fit">Klaar om te starten?</Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold break-words hyphens-auto">Bouw vandaag nog jullie eigen KlusjesKoninkrijk</h2>
              <p className="text-base sm:text-lg text-white/80 break-words hyphens-auto">Maak een gezin aan, nodig je kids uit en laat ze punten sparen voor toffe beloningen of donaties.</p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-2">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/app?register=true" className="flex items-center gap-2">
                    Start gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative mt-6 lg:mt-0">
              <div className="absolute -left-4 sm:-left-8 -top-4 sm:-top-8 h-24 w-24 sm:h-32 sm:w-32 rounded-full bg-white/20 blur-3xl" />
              <FounderStoryCarousel />
            </div>
          </div>
        </section>

        {latestPosts.length > 0 && (
          <section className="space-y-8">
            <div className="space-y-3 text-center">
              <Badge className="mx-auto bg-primary/10 text-primary">Nieuw op de blog</Badge>
              <h2 className="text-3xl font-semibold text-slate-900">De laatste verhalen van KlusjesKoning</h2>
              <p className="mx-auto max-w-2xl text-base text-slate-600">
                Lees hoe andere gezinnen verantwoordelijkheid leuk maken en ontdek tips die je direct kunt toepassen.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {latestPosts.map((post) => {
                const publishedDate = (post.publishedAt ?? post.createdAt).toDate();
                const hasValidCover = Boolean(post.coverImageUrl && isValidUrl(post.coverImageUrl));
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-primary/10 via-slate-100 to-amber-100">
                      {hasValidCover ? (
                        <Image
                          src={post.coverImageUrl as string}
                          alt={`Cover afbeelding voor: ${post.title}`}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(min-width: 1024px) 50vw, 100vw"
                          loading="lazy"
                          quality={80}
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-primary/60" role="img" aria-label="Blog post zonder afbeelding">✍️</div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-3 p-6">
                      <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-slate-500">
                        <span>{format(publishedDate, 'd MMM yyyy', { locale: nl })}</span>
                        {post.tags.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{post.tags.slice(0, 2).join(', ')}</span>
                          </>
                        )}
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary">{post.title}</h3>
                      <p className="text-sm text-slate-600 line-clamp-3">{post.excerpt}</p>
                      <span className="mt-auto text-sm font-semibold text-primary">Lees verder →</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="text-center">
              <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/10">
                <Link href="/blog">Bekijk alle artikelen</Link>
              </Button>
            </div>
          </section>
        )}
      </main>

      <footer className="px-4 sm:px-6 py-8 sm:py-10 text-center text-xs sm:text-sm text-slate-500">
        <p>© {new Date().getFullYear()} KlusjesKoning. Samen plezier in klusjes.</p>
        <p className="mt-2 px-4 sm:px-0">
          KlusjesKoning.app is een concept van{' '}
          <a
            href="https://weareimpact.nl/ai-advies-tools-met-impact/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline break-words"
          >
            WeAreImpact
          </a>
        </p>
      </footer>
    </div>
  );
}
