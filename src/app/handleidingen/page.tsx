'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';
import { ArrowLeft, ArrowRight, Crown, Heart, Sparkles } from 'lucide-react';

type GuideStep = {
  title: string;
  description: string;
  bullets?: string[];
  example?: string[];
  tip?: string;
  image: string;
  imageAlt: string;
};

const parentSteps: GuideStep[] = [
  {
    title: 'Inloggen en gezinscode delen',
    description: 'Na het inloggen land je op het ouderdashboard. Bovenaan staat meteen jullie unieke gezinscode.',
    bullets: [
      'Voorbeeldcode: L0QPE9, zichtbaar bovenaan het dashboard.',
      'Deel de code met je kinderen zodra ze klaar zijn om mee te doen.',
    ],
    tip: 'Kinderen loggen in met de gezinscode plus hun persoonlijke pincode.',
    image: '/images/guides/schermafbeelding-195004.png',
    imageAlt: 'Gezinscode zichtbaar op het ouderdashboard van KlusjesKoning.',
  },
  {
    title: 'Kind aanmaken',
    description: 'Open het gedeelte “Kinderen” en klik op de gele plusknop om een nieuw profiel te maken.',
    bullets: [
      'Vul de naam van je kind in, bijvoorbeeld Jeroen.',
      'Kies een pincode van 4 cijfers (bijvoorbeeld 1234).',
      'Sla op en het kind verschijnt direct in de lijst.',
    ],
    example: ['Naam: Jeroen', 'Pincode: 1234'],
    tip: 'De combinatie van gezinscode en pincode vormt het kinderslot voor hun eigen omgeving.',
    image: '/images/guides/schermafbeelding-195031.png',
    imageAlt: 'Scherm waar nieuwe kinderprofielen kunnen worden toegevoegd.',
  },
  {
    title: 'Kind in laten loggen',
    description: 'Laat je kind naar de kindomgeving gaan en inloggen met de gedeelde gegevens.',
    bullets: [
      'Ze voeren de gezinscode in of scannen de QR-code.',
      'Ze kiezen hun naam en toetsen de geheime pincode in.',
    ],
    tip: 'Hang de gezinscode zichtbaar in huis zodat iedereen hem snel kan vinden.',
    image: '/images/guides/schermafbeelding-195109.png',
    imageAlt: 'Kind login scherm met gezinscode en pincode invoervelden.',
  },
  {
    title: 'Klusjes toevoegen',
    description: 'Klik op “Klusjes toevoegen” of blader door “Top 10 Klusjes (8–12 jaar)” voor inspiratie.',
    bullets: [
      'Selecteer favoriete klusjes zoals Kamer opruimen (25 punten) of Stofzuigen (30 punten).',
      'Kies of het klusje voor iedereen geldt of voor een specifiek kind.',
      'Bevestig met “Selectie toevoegen” zodat het meteen zichtbaar is.',
    ],
    tip: 'Toegevoegde klusjes verschijnen direct in de kindomgeving met de juiste puntenwaarde.',
    image: '/images/guides/kids-zien-klusjes.png',
    imageAlt: 'Overzicht van klusjes die door ouders zijn toegevoegd voor hun kinderen.',
  },
  {
    title: 'Beloningen instellen',
    description: 'Open “Beloningen toevoegen” of bekijk de lijst “Top Beloningen” om de shop te vullen.',
    bullets: [
      'Kies uit voorbeelden zoals 200 punten voor samen een spelletje of 300 punten voor een filmavond.',
      'Geef aan of de beloning voor het hele gezin of een specifiek kind is.',
      'Klik op “Selectie toevoegen” zodat kids de beloningen kunnen zien.',
    ],
    tip: 'Koppel beloningen aan jullie gezinsrituelen om de motivatie hoog te houden.',
    image: '/images/guides/beloningswinkel.png',
    imageAlt: 'Beloningswinkel waar kinderen hun punten kunnen inwisselen.',
  },
  {
    title: 'Goedkeuren van klusjes',
    description: 'Afgeronde klusjes verschijnen onder “Goedkeuren” zodat jij het laatste woord hebt.',
    bullets: [
      'Bekijk de foto of smiley die je kind meestuurt als bewijs.',
      'Gebruik ✅ om punten toe te kennen of ❌ om het klusje terug te sturen.',
    ],
    tip: 'Snelle feedback houdt het spel levendig en duidelijk voor iedereen.',
    image: '/images/guides/klusje-klaar.png',
    imageAlt: 'Lijst met klusjes die wachten op goedkeuring door ouders.',
  },
  {
    title: 'Beloningen afhandelen',
    description: 'Zodra een kind genoeg punten heeft en een beloning kiest, verschijnt deze in “Beloningen afhandelen”.',
    bullets: [
      'Plan samen wanneer de beloning wordt verzilverd.',
      'Markeer de beloning als uitgevoerd zodat de shop netjes blijft.',
    ],
    tip: 'Koppel een foto of korte notitie aan het moment voor een herinnering in jullie gezin.',
    image: '/images/guides/kids-worden-beloond.png',
    imageAlt: 'Voorbeeld van een kind dat een beloning ontvangt binnen KlusjesKoning.',
  },
  {
    title: 'Goed doel van de maand (optioneel)',
    description: 'Activeer het Goede Doel van de maand op het dashboard en moedig kinderen aan om te doneren.',
    bullets: [
      'Voorbeeld: Antoniusschool Nieuw-Vennep — spaar mee voor een nieuw speeltoestel.',
      'Kids kunnen vanuit de beloningswinkel punten doneren in plaats van te sparen voor zichzelf.',
    ],
    tip: 'Bespreek samen welke impact jullie willen maken om betrokkenheid te vergroten.',
    image: '/images/guides/schermafbeelding-195548.png',
    imageAlt: 'Goede doel van de maand zichtbaar in het ouderdashboard.',
  },
];

const kidSteps: GuideStep[] = [
  {
    title: 'Inloggen met je gezinscode en pincode 🔐',
    description: 'Vraag je ouders naar de gezinscode, typ hem in of scan de QR-code, kies je naam en vul je geheime pincode in.',
    bullets: [
      'Je hebt altijd de gezinscode én jouw pincode nodig.',
      'Twijfel je? Vraag het aan je ouders of kijk naar de code op de koelkast.',
    ],
    tip: 'Onthoud je pincode goed, je hebt hem elke keer nodig om binnen te komen.',
    image: '/images/guides/schermafbeelding-195224.png',
    imageAlt: 'Kind logt in met gezinscode en eigen pincode.',
  },
  {
    title: 'Je eigen klusjes bekijken 🧹',
    description: 'Na het inloggen zie je jouw persoonlijke klusjeslijst met de punten die je kunt verdienen.',
    bullets: [
      'Kamer opruimen → 25 ⭐',
      'Stofzuigen of vegen → 30 ⭐',
      'Afwassen → 20 ⭐',
    ],
    tip: 'Kies een klus die bij je past en begin meteen, hoe sneller klaar hoe sneller punten.',
    image: '/images/guides/kids-zien-klusjes.png',
    imageAlt: 'Kind bekijkt de lijst met klusjes en bijbehorende punten.',
  },
  {
    title: 'Klaar met een klus? Druk op “Klaar!” ✅',
    description: 'Heb je een klus afgerond, tik dan op de Klaar!-knop zodat je ouders het kunnen zien.',
    bullets: [
      'Upload een foto als bewijs, bijvoorbeeld van je opgeruimde kamer.',
      'Kies hoe je je voelde met smileys van 😎 tot 😖.',
      'Klik op Indienen om het klusje naar je ouders te sturen.',
    ],
    tip: 'Hoe duidelijker je bewijs, hoe sneller je punten krijgt.',
    image: '/images/guides/klus-indienen.png',
    imageAlt: 'Kind dient een klusje in met foto en emoji-feedback.',
  },
  {
    title: 'Wachten op goedkeuring ⏳',
    description: 'Je ouders checken je ingediende klusjes onder “Goedkeuren”. Zodra zij op ✅ drukken ontvang jij de ⭐ punten.',
    tip: 'Geduld is een superkracht; ondertussen kun je alvast een volgend klusje starten.',
    image: '/images/guides/wachten-op-goedkeuring.png',
    imageAlt: 'Kind ziet dat een klusje wacht op goedkeuring door ouders.',
  },
  {
    title: 'Je punten gebruiken 💰',
    description: 'Met je verdiende punten kun je shoppen in de Beloningswinkel.',
    bullets: [
      '🎲 200 ⭐: Samen een spelletje spelen',
      '🍿 300 ⭐: Later opblijven & film kijken',
      '🍳 400 ⭐: Samen bakken of koken',
      '💶 100 ⭐: €1 zakgeld',
      '❤️ 500 ⭐: €5 doneren aan een schoolproject',
    ],
    tip: 'Spaar door voor grotere beloningen of geef jezelf af en toe iets kleins cadeau.',
    image: '/images/guides/beloningswinkel.png',
    imageAlt: 'Overzicht van de beloningen die beschikbaar zijn in de winkel.',
  },
  {
    title: 'Groei naar KlusjesKoning! 👑',
    description: 'Elke klus levert punten én levels op. Hoe meer je doet, hoe hoger je rank.',
    bullets: [
      'Ei → Begin van je avontuur',
      'Kuiken → Eerste klusjes afgerond',
      'Kleine Dino → Je groeit door',
      'Grote Dino → Je bent bijna pro',
      'Gouden Draak → Bijna de top',
      'KlusjesKoning → De hoogste titel',
    ],
    tip: 'Blijf klusjes doen om steeds sterker te worden en nieuwe badges te ontgrendelen.',
    image: '/images/guides/kids-worden-beloond.png',
    imageAlt: 'Animatie van levels en beloningen voor kinderen.',
  },
  {
    title: 'Doneren aan een goed doel ❤️',
    description: 'Elke maand staat er een Goed Doel klaar. Je kunt ervoor kiezen om punten te doneren.',
    bullets: [
      'Voorbeeld: Antoniusschool Nieuw-Vennep – spaar mee voor een nieuw speeltoestel.',
      'Samen maak je impact, niet alleen thuis maar ook voor anderen.',
    ],
    tip: 'Vraag je ouders welk doel deze maand centraal staat en beslis samen.',
    image: '/images/guides/schermafbeelding-195612.png',
    imageAlt: 'Kind bekijkt het goede doel van de maand in de app.',
  },
  {
    title: 'Samenvatting 🎯',
    description: 'Zo word je stap voor stap een echte KlusjesKoning.',
    bullets: [
      'Log in met de gezinscode en jouw pincode.',
      'Doe klusjes uit je lijst en druk op Klaar!.',
      'Wacht op goedkeuring van je ouders.',
      'Koop iets leuks of doneer punten aan een goed doel.',
      'Blijf groeien door alle levels heen naar de kroon 👑.',
    ],
    tip: 'Kies elke dag één klusje dat je meteen kunt afvinken voor een vliegende start.',
    image: '/images/guides/schermafbeelding-195031.png',
    imageAlt: 'Overzichtsscherm dat laat zien welke stappen kids hebben voltooid.',
  },
];

type GuideAudience = 'parents' | 'kids';

const audienceLabels = {
  parents: 'Ouderhandleiding',
  kids: 'Kids handleiding',
} as const;

const accentStyles = {
  parents: {
    stepBadgeClass: 'bg-primary/10 text-primary',
    trackerBadgeClass: 'bg-primary/10 text-primary',
    tipClass: 'border-sky-200 bg-sky-50/80 text-sky-800',
    glowClass: 'bg-primary/20',
    dotActive: 'bg-primary',
  },
  kids: {
    stepBadgeClass: 'bg-amber-200 text-amber-800',
    trackerBadgeClass: 'bg-amber-200 text-amber-800',
    tipClass: 'border-violet-200 bg-violet-50/80 text-violet-800',
    glowClass: 'bg-amber-200/40',
    dotActive: 'bg-amber-400',
  },
} as const;

type GuideCarouselProps = {
  steps: GuideStep[];
  accent: GuideAudience;
};

function GuideCarousel({ steps, accent }: GuideCarouselProps) {
  const [api, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  useEffect(() => {
    if (!api) {
      return;
    }

    const syncState = () => {
      setCurrentIndex(api.selectedScrollSnap());
      setCanScrollPrev(api.canScrollPrev());
      setCanScrollNext(api.canScrollNext());
    };

    syncState();
    api.on('select', syncState);
    api.on('reInit', syncState);

    return () => {
      api.off('select', syncState);
      api.off('reInit', syncState);
    };
  }, [api]);

  const safeIndex = Math.min(currentIndex, steps.length - 1);
  const activeStep = steps[safeIndex];
  const styles = accentStyles[accent];
  const audienceLabel = audienceLabels[accent];

  return (
    <div className="space-y-6">
      <Carousel
        opts={{ align: 'start', loop: false }}
        setApi={(carouselApi) => setCarouselApi(carouselApi)}
        className="w-full pb-12"
      >
        <CarouselContent>
          {steps.map((step, index) => (
            <CarouselItem key={step.title}>
              <Card className="h-full border-none bg-white/90 shadow-xl backdrop-blur">
                <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                  <div className="space-y-4 text-left">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-500">
                      <Badge className={styles.stepBadgeClass}>Stap {index + 1}</Badge>
                      {audienceLabel}
                    </div>
                    <h3 className="text-2xl font-semibold text-slate-900">{step.title}</h3>
                    <p className="text-slate-600">{step.description}</p>
                    {step.bullets && (
                      <ul className="space-y-2 text-slate-600">
                        {step.bullets.map((bullet) => (
                          <li key={bullet} className="flex gap-2">
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {step.example && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm text-amber-800 shadow-sm">
                        <p className="font-semibold">Voorbeeld</p>
                        <ul className="mt-2 space-y-1 text-amber-700">
                          {step.example.map((item) => (
                            <li key={item}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {step.tip && (
                      <div className={cn('rounded-2xl border p-4 text-sm shadow-sm', styles.tipClass)}>
                        <span className="font-semibold">Tip:</span> {step.tip}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <div className={cn('absolute -left-6 -top-6 h-24 w-24 rounded-full blur-3xl', styles.glowClass)} />
                    <div className="relative overflow-hidden rounded-3xl border border-white/60 shadow-lg">
                      <Image src={step.image} alt={step.imageAlt} width={1200} height={900} className="h-full w-full object-cover" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between" aria-live="polite">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Badge className={cn('w-fit px-3 py-1 text-xs font-semibold uppercase tracking-wide', styles.trackerBadgeClass)}>
            Stap {safeIndex + 1} / {steps.length}
          </Badge>
          <span className="text-sm font-semibold text-slate-700">{activeStep?.title}</span>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {steps.map((step, index) => (
            <button
              key={step.title}
              type="button"
              onClick={() => api?.scrollTo(index)}
              className={cn(
                'h-2 rounded-full transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                index === safeIndex
                  ? `w-8 shadow-sm ${styles.dotActive}`
                  : 'w-3 bg-slate-300/80 hover:bg-slate-400'
              )}
              aria-label={`Ga naar stap ${index + 1}: ${step.title}`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-3 sm:hidden">
        <Button variant="outline" size="sm" onClick={() => api?.scrollPrev()} disabled={!canScrollPrev}>
          Vorige
        </Button>
        <Button size="sm" onClick={() => api?.scrollNext()} disabled={!canScrollNext}>
          Volgende
        </Button>
      </div>
    </div>
  );
}

export default function GuidesPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-sky-100 via-white to-amber-100" />
      <main className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-12 md:gap-16 px-3 py-6 sm:px-6 md:px-10 sm:py-12 md:py-16">
        <div className="flex justify-start">
          <Button asChild variant="outline" size="sm">
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Terug naar home</span>
              <span className="sm:hidden">Terug</span>
            </Link>
          </Button>
        </div>
        <header className="space-y-3 sm:space-y-5 text-center">
          <div className="mx-auto inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-white/70 px-2.5 sm:px-4 py-1 sm:py-2 text-[11px] sm:text-sm font-semibold text-primary shadow">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">Super vette handleiding</span>
            <span className="xs:hidden">Handleiding</span>
          </div>
          <h1 className="font-brand text-xl sm:text-3xl md:text-4xl leading-tight text-slate-900 lg:text-5xl px-2">
            👨‍👩‍👧 Handleiding voor Ouders & Kids
          </h1>
          <p className="mx-auto max-w-3xl text-sm sm:text-lg text-slate-600 md:text-xl px-4">
            Alles wat je nodig hebt om samen te starten, klusjes te rocken en beloningen te vieren. Kies jouw route hieronder en ontdek stap voor stap hoe het werkt.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Link href="#ouders" className="flex items-center gap-2">
                Naar ouderhandleiding
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary/10">
              <Link href="#kids" className="flex items-center gap-2">
                Naar kids handleiding
                <Crown className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </header>

        <section id="ouders" className="space-y-8">
          <div className="space-y-3 text-center">
            <Badge className="bg-amber-200 text-amber-800">Voor ouders</Badge>
            <h2 className="text-3xl font-semibold text-slate-900">Handleiding voor Ouders</h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Houd grip op het huishouden, motiveer je kinderen en maak van klusjes doen een feestje. Zo stel je alles in voor jouw gezin.
            </p>
          </div>
          <GuideCarousel steps={parentSteps} accent="parents" />
        </section>

        <section id="kids" className="space-y-8">
          <div className="space-y-3 text-center">
            <Badge className="bg-sky-200 text-sky-800">Voor kids</Badge>
            <h2 className="text-3xl font-semibold text-slate-900">Handleiding voor Kids — Word een echte KlusjesKoning!</h2>
            <p className="mx-auto max-w-2xl text-slate-600">
              Doe klusjes, verdien ⭐ punten en wissel ze in voor beloningen of donaties. Zo groei je van Ei naar KlusjesKoning.
            </p>
          </div>
          <GuideCarousel steps={kidSteps} accent="kids" />
        </section>

        <section className="overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-sky-700 p-10 text-primary-foreground shadow-2xl">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-4">
              <Badge className="bg-white/20 text-white">Klaar voor jullie eerste missie?</Badge>
              <h2 className="text-3xl font-semibold sm:text-4xl">Start vandaag nog met punten sparen en doneren</h2>
              <p className="text-lg text-white/80">Log in via het dashboard, activeer klusjes voor het gezin en laat de kids hun eerste ⭐ verdienen. Voor je het weet vieren jullie de eerste beloning samen.</p>
              <div className="flex flex-wrap gap-4">
                <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                  <Link href="/app" className="flex items-center gap-2">
                    Naar de app
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Link href="/">Terug naar homepage</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -left-6 -top-6 h-32 w-32 rounded-full bg-white/20 blur-3xl" />
              <Card className="border-none bg-white/10 text-white backdrop-blur">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <Sparkles className="h-6 w-6" />
                    <p className="font-semibold">Compleet stappenplan voor ouders en kids</p>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Heart className="h-6 w-6" />
                    <p>Spaar samen voor beloningen of steun het goede doel van de maand.</p>
                  </div>
                  <div className="flex items-center gap-3 text-white/90">
                    <Crown className="h-6 w-6" />
                    <p>Level op van Ei naar KlusjesKoning en vier elke mijlpaal.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
