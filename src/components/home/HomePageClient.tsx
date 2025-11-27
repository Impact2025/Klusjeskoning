'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';
import { Sparkles } from 'lucide-react';

const slides = [
  {
    label: 'Stap 1 • Maak je Gezin',
    title: 'Stap 1: Maak je Gezin in 60 Seconden',
    description: 'Je vult je e-mail in, kiest je gezinsnaam ("Het Koninkrijk van de Smits"), en je ontvangt meteen een **unieke gezinscode** (bijv. "SMITS-2024").\n\nJe geeft deze code aan je kinderen. Klaar.\n\n*Tijd: 60 seconden. Aandacht nodig: Minimaal.*',
    image: '/images/guides/schermafbeelding-195004.png',
    accent: 'bg-primary/10 text-primary',
  },
  {
    label: 'Stap 2 • Kinderen Avatar',
    title: 'Stap 2: Kinderen Kiezen Hun Avatar (en Worden Boos van Opwinding)',
    description: 'Je kind logt in met je gezinscode + hun eigen 4-cijfer pincode.\n\nMeteen zien ze:\n- Hun personaliseerbare avatar (en wat ze kunnen ontgrendelen)\n- De "Quest Board" met beschikbare klusjes\n- Hun huidigetotal punten en level\n- Hoeveel ze nog nodig hebben voor hun eerste beloning\n\nSerieus: ze vergeten hun telefoon voor deze app.\n\n*Tijd: 2 minuten. Opwindheid: 100%.*',
    image: '/images/guides/schermafbeelding-195224.png',
    accent: 'bg-amber-200 text-amber-800',
  },
  {
    label: 'Stap 3 • Ze Winnen',
    title: 'Stap 3: Ze Winnen. Jij Maakt de Regel.',
    description: 'Kind verdient 500 punten → kan inwisselen voor:\n- "Filmavond met familie" (200 punten)\n- "Extra 1 uur gamen" (150 punten)\n- "Keuze van donderdag eten" (100 punten)\n- Of doneren aan een goed doel (Red Cross, dierenasiel – jij kiest)\n\nJij bepaalt welke beloningen beschikbaar zijn.\nJij bepaalt de puntwaarde.\nJij ziet real-time wanneer ze geld gaan afhalen.\n\nIedereen wint. En dat voelt goed.\n\n*Tijd: 2 minuten per week. Impact: Oneindig.*',
    image: '/images/guides/beloningswinkel.png',
    accent: 'bg-violet-100 text-violet-800',
  },
];

export function HowItWorksCarousel() {
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  return (
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
          <div className="flex justify-center gap-3 px-8 pb-8 sm:hidden">
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
  );
}

const founderStorySlides = [
  {
    title: '# Hoe Het Begon (Een Waargebeurd Verhaal)',
    paragraphs: [
      'Mijn zoon Alex (toen 9) vroeg me: **"Papa, waarom krijg ik geen punten als ik de vaatwasser uitruim?"**',
      'Ik lachte. Maar toen dacht ik: *Waarom eigenlijk niet?*',
      'Waarom is het goed genoeg dat hij punten verdient door pixels op een scherm te klikken, maar niet als hij de wasmachine aanrukt?',
      '**Dus bouwde ik KlusjesKoning** – een app waarmee kinderen leren dat inzet *echt* iets oplevert. Voor hen zelf. En voor anderen (donaties).',
      'Het is niet over geld. Het is over waardering. Over zien dat wat je doet *telt*.',
      '— **Vincent van Munster**  \nOprichter van WeAreImpact',
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

export function FounderStoryCarousel() {
  const [founderCarouselApi, setFounderCarouselApi] = useState<CarouselApi | null>(null);
  const [currentFounderSlide, setCurrentFounderSlide] = useState(0);

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

  return (
    <Card className="border-none bg-white/10 backdrop-blur">
      <CardContent className="space-y-6 p-0">
        <Carousel
          className="w-full pb-12"
          opts={{ align: 'start' }}
          setApi={setFounderCarouselApi}
        >
          <CarouselContent>
            {founderStorySlides.map((slide) => (
              <CarouselItem key={slide.title} className="px-8 pt-8">
                <div className="space-y-6 text-left max-w-none">
                  <h3 className="text-xl font-semibold text-white">{slide.title}</h3>
                  <div className="space-y-4 text-white/85">
                    {slide.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-base leading-relaxed">
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

        <div className="flex flex-col gap-3 px-8 pb-8 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
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
  );
}
