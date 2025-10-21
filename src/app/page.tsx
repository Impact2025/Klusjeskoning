'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Sparkles, ShieldCheck, Gift, Rocket, Wand2, Users, Trophy, Heart, ArrowRight, Star, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { PLAN_DEFINITIONS, formatPrice } from '@/lib/plans';
import { fetchPublishedBlogPosts } from '@/lib/content';
import type { BlogPost } from '@/lib/types';
import { OrganizationSchema, WebApplicationSchema } from '@/components/seo/StructuredData';

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const slides = [
  {
    label: 'Stap 1 • Ouders',
    title: 'Deel jullie gezinscode meteen',
    description: 'Log in op het ouderdashboard en geef de unieke code door – klaar om samen te starten.',
    image: '/images/guides/schermafbeelding-195004.png',
    accent: 'bg-primary/10 text-primary',
  },
  {
    label: 'Stap 2 • Kids',
    title: 'Kinderen loggen speels in',
    description: 'Ze kiezen hun naam, tikken hun pincode en zien meteen welke ⭐ ze kunnen scoren.',
    image: '/images/guides/schermafbeelding-195224.png',
    accent: 'bg-amber-200 text-amber-800',
  },
  {
    label: 'Stap 3 • Vier de beloningen',
    title: 'Shop vol motivators & donaties',
    description: 'Van filmavonden tot goede doelen: punten omzetten in momenten waar iedereen blij van wordt.',
    image: '/images/guides/beloningswinkel.png',
    accent: 'bg-violet-100 text-violet-800',
  },
];

const highlights = [
  {
    icon: Sparkles,
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

export default function HomePage() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [founderCarouselApi, setFounderCarouselApi] = useState<CarouselApi | null>(null);
  const [currentFounderSlide, setCurrentFounderSlide] = useState(0);
  const [latestPosts, setLatestPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    if (!carouselApi) return;

    const updateSlide = () => setCurrentSlide(carouselApi.selectedScrollSnap());
    updateSlide();
    carouselApi.on('select', updateSlide);
    carouselApi.on('reInit', updateSlide);

    return () => {
      carouselApi.off('select', updateSlide);
      carouselApi.off('reInit', updateSlide);
    };
  }, [carouselApi]);

  const totalSlides = slides.length;
  const totalFounderSlides = founderStorySlides.length;

  useEffect(() => {
    if (!founderCarouselApi) return;

    const updateFounderSlide = () => setCurrentFounderSlide(founderCarouselApi.selectedScrollSnap());
    updateFounderSlide();
    founderCarouselApi.on('select', updateFounderSlide);
    founderCarouselApi.on('reInit', updateFounderSlide);

    return () => {
      founderCarouselApi.off('select', updateFounderSlide);
      founderCarouselApi.off('reInit', updateFounderSlide);
    };
  }, [founderCarouselApi]);

  useEffect(() => {
    let isMounted = true;
    fetchPublishedBlogPosts()
      .then((posts) => {
        if (!isMounted) return;
        setLatestPosts(posts.slice(0, 2));
      })
      .catch((error) => {
        console.error('Failed to load blog posts', error);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="relative overflow-hidden">
      <OrganizationSchema />
      <WebApplicationSchema />
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-sky-100 via-white to-amber-50" />
      <header className="px-4 sm:px-10 py-8 sm:py-12">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <Image src="https://weareimpact.nl/LogoKlusjeskoning3.png" alt="KlusjesKoning logo" width={56} height={56} className="h-14 w-14 rounded-full bg-white shadow-lg" />
            <div>
              <p className="font-brand text-2xl text-slate-800">KlusjesKoning</p>
              <p className="text-xs text-slate-500">Game on voor je huishouden</p>
            </div>
          </div>
          <div className="hidden items-center space-x-4 md:flex">
            <Link href="/app" className="text-sm font-semibold text-slate-700 hover:text-slate-900">App omgeving</Link>
            <Button asChild className="bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
              <Link href="/app?register=true">Start gratis</Link>
            </Button>
          </div>
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-4 pb-24 sm:px-10">
        <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-6 text-center lg:text-left">
            <Badge className="bg-amber-200 text-amber-800 shadow-sm">Nieuw: marketing homepage</Badge>
            <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl">
              De leukste manier om klusjes te doen, verdienen én vieren
            </h1>
            <p className="text-lg text-slate-600 sm:text-xl">
              Een mobiele ervaring voor gezinnen die samenwerken, sparen voor beloningen en zelfs goede doelen ondersteunen. Alles in een kleurrijke, intuïtieve app.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
              <Button asChild size="lg" className="w-full max-w-xs bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto">
                <Link href="/app?register=true" className="flex items-center gap-2">
                  Start gratis
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="w-full max-w-xs border-primary text-primary hover:bg-primary/10 sm:w-auto">
                <Link href="/handleidingen" className="flex items-center gap-2">
                  Bekijk hoe het werkt
                  <Rocket className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-6 pt-4 lg:justify-start">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-[120px]">
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-10 -top-8 h-24 w-24 rounded-full bg-primary/30 blur-3xl" />
            <Card className="overflow-hidden border-none bg-white/80 shadow-xl backdrop-blur">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-gradient-to-r from-sky-100 via-white to-amber-100">
                <CardTitle className="text-lg text-slate-800">Snelle blik</CardTitle>
                <Sparkles className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="space-y-6 p-0">
                <Carousel className="relative pb-12" setApi={setCarouselApi} opts={{ align: 'start' }}>
                  <CarouselContent>
                    {slides.map((slide, index) => (
                      <CarouselItem key={slide.label} className="px-6 pt-6">
                        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
                          <div className="space-y-4 text-left">
                            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                              <Badge className={slide.accent}>Stap {index + 1}</Badge>
                              Snelle rondleiding
                            </div>
                            <h3 className="text-2xl font-semibold text-slate-900">{slide.title}</h3>
                            <p className="text-slate-600">{slide.description}</p>
                          </div>
                          <div className="relative">
                            <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-primary/20 blur-3xl" />
                            <div className="relative overflow-hidden rounded-3xl border border-white/60 shadow-lg">
                              <Image src={slide.image} alt={slide.title} width={960} height={640} className="h-full w-full object-cover" />
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="-left-4 top-1/2" />
                  <CarouselNext className="-right-4 top-1/2" />
                </Carousel>

                <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                    <Badge className="w-fit bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      Stap {currentSlide + 1} / {totalSlides}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-700">{slides[currentSlide]?.title}</span>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {slides.map((slide, index) => (
                      <button
                        key={slide.label}
                        type="button"
                        onClick={() => carouselApi?.scrollTo(index)}
                        className={`h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          index === currentSlide ? 'w-8 bg-primary shadow-sm' : 'w-3 bg-slate-300/80 hover:bg-slate-400'
                        }`}
                        aria-label={`Ga naar stap ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex justify-center gap-3 px-6 pb-6 sm:hidden">
                  <Button variant="outline" size="sm" onClick={() => carouselApi?.scrollPrev()} disabled={currentSlide === 0}>
                    Vorige
                  </Button>
                  <Button size="sm" onClick={() => carouselApi?.scrollNext()} disabled={currentSlide === totalSlides - 1}>
                    Volgende
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" id="hoe-werkt-het">
          {highlights.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-none bg-white/85 text-center shadow-lg backdrop-blur">
              <CardHeader className="space-y-2">
                <div className="mx-auto inline-flex items-center rounded-full bg-primary/10 p-2 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl text-slate-900">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600">{description}</CardDescription>
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

        <section className="space-y-8" id="prijzen">
          <div className="text-center space-y-3">
            <Badge className="bg-amber-200 text-amber-800">👑 2️⃣ Aanbevolen prijsstructuur (2025–2026)</Badge>
            <h2 className="text-3xl font-semibold text-slate-900">Kies het plan dat bij jullie gezin past</h2>
            <p className="text-lg text-slate-600">Start gratis en groei door naar Premium wanneer jullie klaar zijn voor onbeperkte fun en AI-power.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
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

        <section className="grid gap-4 md:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.author} className="border-none bg-white shadow-lg">
              <CardContent className="space-y-4 p-6 text-center">
                <Star className="h-6 w-6 text-amber-400" />
                <p className="text-base text-slate-600">“{testimonial.quote}”</p>
                <p className="text-sm font-semibold text-slate-900">{testimonial.author}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-sky-700 p-10 text-primary-foreground shadow-2xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white">Klaar om te starten?</Badge>
              <h2 className="text-3xl font-semibold sm:text-4xl">Bouw vandaag nog jullie eigen KlusjesKoninkrijk</h2>
              <p className="text-lg text-white/80">Maak een gezin aan, nodig je kids uit en laat ze punten sparen voor toffe beloningen of donaties.</p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/app?register=true" className="flex items-center gap-2">
                    Start gratis
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative mt-6 lg:mt-0">
              <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
              <Card className="border-none bg-white/10 backdrop-blur">
                <CardContent className="space-y-6 p-0">
                  <Carousel
                    className="w-full pb-12"
                    opts={{ align: 'start' }}
                    setApi={setFounderCarouselApi}
                  >
                    <CarouselContent>
                      {founderStorySlides.map((slide) => (
                        <CarouselItem key={slide.title} className="px-6 pt-6">
                          <div className="space-y-4 text-left">
                            <h3 className="text-xl font-semibold text-white">{slide.title}</h3>
                            <div className="space-y-3 text-white/85">
                              {slide.paragraphs.map((paragraph) => (
                                <p key={paragraph} className="text-sm leading-relaxed">
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-3 top-1/2 hidden sm:flex border-white/30 text-white hover:bg-white/10" />
                    <CarouselNext className="-right-3 top-1/2 hidden sm:flex border-white/30 text-white hover:bg-white/10" />
                  </Carousel>

                  <div className="flex flex-col gap-3 px-6 pb-6 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                      <Badge className="w-fit bg-white/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                        Slide {currentFounderSlide + 1} / {totalFounderSlides}
                      </Badge>
                      <span className="text-xs font-semibold text-white/80">{founderStorySlides[currentFounderSlide]?.title}</span>
                    </div>
                    <div className="flex flex-wrap justify-center gap-1">
                      {founderStorySlides.map((slide, index) => (
                        <button
                          key={slide.title}
                          type="button"
                          onClick={() => founderCarouselApi?.scrollTo(index)}
                          className={`h-1.5 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
                            index === currentFounderSlide ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70'
                          }`}
                          aria-label={`Ga naar ${slide.title}`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center gap-3 px-6 pb-6 sm:hidden">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => founderCarouselApi?.scrollPrev()}
                      disabled={currentFounderSlide === 0}
                      className="border-white text-white hover:bg-white/10"
                    >
                      Vorige
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => founderCarouselApi?.scrollNext()}
                      disabled={currentFounderSlide === totalFounderSlides - 1}
                      className="bg-white text-primary hover:bg-white/90"
                    >
                      Volgende
                    </Button>
                  </div>
                </CardContent>
              </Card>
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
                          alt={post.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                          sizes="(min-width: 1024px) 50vw, 100vw"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl text-primary/60">✍️</div>
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

      <footer className="px-6 py-10 text-center text-sm text-slate-500">
        <p>© {new Date().getFullYear()} KlusjesKoning. Samen plezier in klusjes.</p>
        <p className="mt-2">
          KlusjesKoning.app is een concept van{' '}
          <a
            href="https://weareimpact.nl/ai-advies-tools-met-impact/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            WeAreImpact
          </a>
        </p>
      </footer>
    </div>
  );
}
