import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { Check, ArrowRight, Star, Crown, Sparkles, Shield, Target, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchPublishedBlogPosts } from '@/lib/content';
import { OrganizationSchema, WebApplicationSchema } from '@/components/seo/StructuredData';
import { Header } from '@/components/header/Header';

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

export default async function HomePage() {
  const allPosts = await fetchPublishedBlogPosts();
  const latestPosts = allPosts.slice(0, 2);

  return (
    <div className="bg-white">
      <OrganizationSchema />
      <WebApplicationSchema />
      <Header />

      {/* Hero - Clean & Bold */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-16 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-50 via-white to-sky-50" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left - Copy */}
            <div className="space-y-8 text-center lg:text-left">
              <Badge className="bg-amber-100 text-amber-800 border-amber-200 font-medium">
                100+ gezinnen gebruiken KlusjesKoning
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-[1.1] tracking-tight">
                Klusjes worden
                <span className="text-primary block">een game.</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Kinderen verdienen punten, levelen up en wisselen in voor beloningen.
                Geen gezeur meer — ze vragen er zélf om.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button asChild size="lg" className="text-base px-8 py-6 shadow-lg shadow-primary/25">
                  <Link href="/app?register=true">
                    Gratis starten
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="text-base px-8 py-6">
                  <Link href="#hoe-het-werkt">
                    Bekijk hoe het werkt
                  </Link>
                </Button>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-6 text-sm text-slate-500">
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  7 dagen gratis
                </span>
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  Geen creditcard
                </span>
              </div>
            </div>

            {/* Right - App Preview */}
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-200">
                <Image
                  src="/images/app voor klusjes, zakgeld en gezinsdoelen.png"
                  alt="KlusjesKoning app dashboard"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  priority
                />
              </div>
              {/* Floating stats */}
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900">4.9</p>
                    <p className="text-xs text-slate-500">Gebruikersrating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 bg-slate-50 border-y border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-wrap justify-center gap-8 lg:gap-16 text-center">
            <div>
              <p className="text-3xl font-bold text-slate-900">100+</p>
              <p className="text-sm text-slate-500">Actieve gezinnen</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">72K+</p>
              <p className="text-sm text-slate-500">Punten verdiend</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-slate-900">86%</p>
              <p className="text-sm text-slate-500">Kinderen blijven sparen</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Works - 3 Simple Points */}
      <section className="py-20 lg:py-28" id="hoe-het-werkt">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Waarom het werkt
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Geen ingewikkelde systemen. Gewoon slim ontworpen voor kinderen.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Gamification die motiveert
              </h3>
              <p className="text-slate-600">
                Levels, badges en een eigen avatar. Klusjes voelen als een quest, niet als een taak.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Echte beloningen
              </h3>
              <p className="text-slate-600">
                Kinderen sparen voor wat zij willen. Filmavond, speelgoed of extra gamen.
              </p>
            </div>

            <div className="text-center p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                Ouders hebben controle
              </h3>
              <p className="text-slate-600">
                Jij bepaalt de klusjes, de punten en wanneer beloningen vrijkomen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Visual Steps */}
      <section className="py-20 lg:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              In 3 minuten klaar
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold mb-6">
                1
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Maak je gezin aan
              </h3>
              <p className="text-slate-600 text-sm">
                Registreer als ouder en voeg je kinderen toe met een simpele pincode.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold mb-6">
                2
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Stel klusjes in
              </h3>
              <p className="text-slate-600 text-sm">
                Kies uit templates of maak eigen klusjes. AI helpt met ideeën.
              </p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold mb-6">
                3
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Kinderen gaan los
              </h3>
              <p className="text-slate-600 text-sm">
                Ze zien hun quests, verdienen punten en wisselen in voor beloningen.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Clean Cards */}
      <section className="py-20 lg:py-28">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Wat gezinnen zeggen
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">
                  "Mijn kinderen vragen nu zélf om klusjes. Het gezeur is gestopt."
                </p>
                <p className="text-sm font-medium text-slate-900">Sanne</p>
                <p className="text-xs text-slate-500">Moeder van 2, Rotterdam</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">
                  "Het voelt als een echte game. Ik wil steeds meer punten!"
                </p>
                <p className="text-sm font-medium text-slate-900">Mila, 10 jaar</p>
                <p className="text-xs text-slate-500">Amsterdam</p>
              </CardContent>
            </Card>

            <Card className="border-slate-200">
              <CardContent className="p-6">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4">
                  "Eindelijk duidelijkheid. Iedereen weet wat er verwacht wordt."
                </p>
                <p className="text-sm font-medium text-slate-900">Robin</p>
                <p className="text-xs text-slate-500">Vader van 3, Utrecht</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing - Simple & Clear */}
      <section className="py-20 lg:py-28 bg-slate-50" id="prijzen">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Simpele prijzen
            </h2>
            <p className="text-lg text-slate-600">
              Start gratis. Upgrade wanneer je wilt.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Free */}
            <Card className="border-slate-200 bg-white">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Starter</h3>
                <p className="text-4xl font-bold text-slate-900 mb-6">
                  Gratis
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    Tot 2 kinderen
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    10 klusjes per maand
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    Basis beloningssysteem
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full py-6">
                  <Link href="/app?register=true">Gratis starten</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Premium */}
            <Card className="border-primary bg-white relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                Populair
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Premium</h3>
                <p className="text-4xl font-bold text-slate-900 mb-1">
                  €3,99<span className="text-lg font-normal text-slate-500">/maand</span>
                </p>
                <p className="text-sm text-slate-500 mb-6">of €39/jaar (2 maanden gratis)</p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    Onbeperkt kinderen
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    Onbeperkt klusjes
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    AI klusjes-assistent
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    Virtuele huisdieren & badges
                  </li>
                  <li className="flex items-center gap-3 text-slate-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    Doneren aan goede doelen
                  </li>
                </ul>
                <Button asChild className="w-full py-6">
                  <Link href="/app?checkout=premium">
                    7 dagen gratis proberen
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA - Simple */}
      <section className="py-20 lg:py-28 bg-primary">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
            Klaar om te starten?
          </h2>
          <p className="text-lg text-white/80 mb-8">
            In 3 minuten heb je je gezin aangemaakt. 7 dagen Premium gratis.
          </p>
          <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90 px-8 py-6 text-base">
            <Link href="/app?register=true">
              Gratis beginnen
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Blog Preview - If posts exist */}
      {latestPosts.length > 0 && (
        <section className="py-20 lg:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center justify-between mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
                Van de blog
              </h2>
              <Button asChild variant="ghost" className="text-primary">
                <Link href="/blog">
                  Alle artikelen
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {latestPosts.map((post) => {
                const publishedDate = (post.publishedAt ?? post.createdAt).toDate();
                const hasValidCover = Boolean(post.coverImageUrl && isValidUrl(post.coverImageUrl));
                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group block"
                  >
                    <div className="relative h-48 rounded-2xl overflow-hidden bg-slate-100 mb-4">
                      {hasValidCover ? (
                        <Image
                          src={post.coverImageUrl as string}
                          alt={post.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-4xl">
                          ✍️
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-500 mb-2">
                      {format(publishedDate, 'd MMM yyyy', { locale: nl })}
                    </p>
                    <h3 className="text-lg font-semibold text-slate-900 group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer - Minimal */}
      <footer className="py-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <Crown className="h-6 w-6 text-primary" />
              <span className="font-semibold text-slate-900">KlusjesKoning</span>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-500">
              <Link href="/algemene-voorwaarden" className="hover:text-primary transition-colors">
                Voorwaarden
              </Link>
              <Link href="/privacy" className="hover:text-primary transition-colors">
                Privacy
              </Link>
              <Link href="/handleidingen" className="hover:text-primary transition-colors">
                Handleidingen
              </Link>
              <Link href="/blog" className="hover:text-primary transition-colors">
                Blog
              </Link>
            </div>

            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} KlusjesKoning
            </p>
          </div>

          <p className="text-center text-xs text-slate-400 mt-8">
            Een concept van{' '}
            <a href="https://weareimpact.nl" target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              WeAreImpact
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
