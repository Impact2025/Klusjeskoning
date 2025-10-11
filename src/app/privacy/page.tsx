import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Cookie, Eye, Mail, FileText, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Privacybeleid',
  description: 'Privacybeleid van KlusjesKoning. Lees hoe wij omgaan met jouw gegevens, welke cookies we gebruiken en wat jouw rechten zijn.',
  openGraph: {
    title: 'Privacybeleid | KlusjesKoning',
    description: 'Transparant over hoe wij omgaan met jouw gegevens',
  },
};

export default function PrivacyPage() {
  const lastUpdated = '11 oktober 2025';

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-primary/5">
      <div className="mx-auto flex max-w-4xl flex-col gap-12 px-6 py-16 sm:px-10">
        <header className="space-y-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Terug naar home
              </Button>
            </Link>
          </div>

          <div className="space-y-4">
            <Badge className="bg-primary/10 text-primary">
              <Shield className="mr-2 h-3 w-3" />
              Privacybeleid
            </Badge>
            <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl">
              Jouw privacy is belangrijk voor ons
            </h1>
            <p className="text-lg text-slate-600">
              Bij KlusjesKoning vinden we privacy belangrijk. Op deze pagina leggen we helder uit welke gegevens we verzamelen,
              waarom we dat doen en wat jouw rechten zijn.
            </p>
            <p className="text-sm text-slate-500">
              Laatst bijgewerkt: {lastUpdated}
            </p>
          </div>
        </header>

        <div className="grid gap-6">
          {/* Wie zijn wij */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">1. Wie zijn wij?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p>
                KlusjesKoning is een initiatief van <strong>WeAreImpact</strong>, opgericht door Vincent van Munster.
              </p>
              <div className="rounded-lg bg-slate-50 p-4 text-sm">
                <p><strong>WeAreImpact</strong></p>
                <p>KVK-nummer: 70285888</p>
                <p>Adres: Heintje Hoeksteeg 11A</p>
                <p>E-mail: info@klusjeskoningapp.nl</p>
                <p>Website: https://weareimpact.nl</p>
              </div>
            </CardContent>
          </Card>

          {/* Welke gegevens verzamelen we */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <Eye className="h-5 w-5 text-amber-700" />
                </div>
                <CardTitle className="text-xl">2. Welke gegevens verzamelen we?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <h3 className="font-semibold text-slate-900">Bij registratie (ouders):</h3>
                <ul className="list-disc space-y-2 pl-6 text-slate-700">
                  <li>E-mailadres (voor login en communicatie)</li>
                  <li>Wachtwoord (versleuteld opgeslagen)</li>
                  <li>Namen van kinderen (door jou ingevuld)</li>
                  <li>Gekozen pincodes (versleuteld opgeslagen)</li>
                  <li>Klusjes en beloningen die je aanmaakt</li>
                </ul>

                <h3 className="font-semibold text-slate-900 pt-4">Automatisch verzameld:</h3>
                <ul className="list-disc space-y-2 pl-6 text-slate-700">
                  <li>IP-adres (geanonimiseerd voor analytics)</li>
                  <li>Browsertype en apparaatinformatie</li>
                  <li>Pagina's die je bezoekt op onze site</li>
                  <li>Gebruik van de app (welke features je gebruikt)</li>
                </ul>

                <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4 text-sm text-slate-700">
                  <strong>Let op:</strong> We verzamelen <strong>geen</strong> BSN-nummers, financiële gegevens,
                  of andere gevoelige persoonlijke informatie. Voor kinderen verzamelen we alleen een naam en pincode.
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-violet-100 p-2">
                  <Cookie className="h-5 w-5 text-violet-700" />
                </div>
                <CardTitle className="text-xl">3. Cookies en tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                We gebruiken cookies om onze website te verbeteren en te begrijpen hoe bezoekers de site gebruiken.
              </p>

              <div className="space-y-4">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h4 className="font-semibold text-slate-900">Noodzakelijke cookies</h4>
                  <p className="text-sm">Deze cookies zijn nodig om de website te laten werken (login, sessies, etc.).
                  Deze kun je niet weigeren.</p>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h4 className="font-semibold text-slate-900">Analytische cookies (optioneel)</h4>
                  <p className="text-sm mb-2">We gebruiken:</p>
                  <ul className="list-disc space-y-1 pl-6 text-sm">
                    <li><strong>Google Analytics 4</strong> - Voor bezoekersstatistieken (IP-adressen worden geanonimiseerd)</li>
                    <li><strong>Microsoft Clarity</strong> - Voor heatmaps en session recordings (privacy-vriendelijk)</li>
                  </ul>
                  <p className="text-sm mt-2">
                    Je kunt deze cookies accepteren of weigeren via de cookie banner.
                  </p>
                </div>
              </div>

              <div className="rounded-lg bg-amber-50 p-4 text-sm">
                <strong>Jouw keuze:</strong> Je kunt je cookie-voorkeuren altijd aanpassen door je browser te resetten
                of de localStorage te wissen.
              </div>
            </CardContent>
          </Card>

          {/* Waarvoor gebruiken we je gegevens */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-sky-100 p-2">
                  <Lock className="h-5 w-5 text-sky-700" />
                </div>
                <CardTitle className="text-xl">4. Waarvoor gebruiken we je gegevens?</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc space-y-2 pl-6 text-slate-700">
                <li>Om je een account te geven en de app te laten werken</li>
                <li>Om je op de hoogte te houden van updates (alleen als je hiervoor toestemming geeft)</li>
                <li>Om de website en app te verbeteren op basis van gebruik</li>
                <li>Om technische problemen op te lossen</li>
                <li>Om misbruik te voorkomen</li>
              </ul>
              <p className="mt-4 text-sm text-slate-600">
                <strong>Wettelijke grondslag:</strong> We verwerken je gegevens op basis van:
              </p>
              <ul className="list-disc space-y-1 pl-6 text-sm text-slate-600">
                <li>Uitvoering van de overeenkomst (je gebruikt onze app)</li>
                <li>Toestemming (voor analytische cookies)</li>
                <li>Gerechtvaardigd belang (voor beveiliging en verbetering van de dienst)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Beveiliging */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <Shield className="h-5 w-5 text-green-700" />
                </div>
                <CardTitle className="text-xl">5. Hoe beveiligen we je gegevens?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <ul className="list-disc space-y-2 pl-6">
                <li>Alle wachtwoorden worden versleuteld opgeslagen</li>
                <li>We gebruiken HTTPS voor veilige verbindingen</li>
                <li>Onze database is beveiligd en alleen toegankelijk voor bevoegde personen</li>
                <li>We delen je gegevens <strong>nooit</strong> met derden zonder jouw toestemming</li>
              </ul>
            </CardContent>
          </Card>

          {/* Bewaartermijn */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-rose-100 p-2">
                  <FileText className="h-5 w-5 text-rose-700" />
                </div>
                <CardTitle className="text-xl">6. Hoe lang bewaren we je gegevens?</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <p>
                We bewaren je gegevens zolang je een actief account hebt. Als je je account verwijdert,
                worden alle persoonlijke gegevens binnen 30 dagen permanent verwijderd.
              </p>
              <p className="text-sm">
                Analytische gegevens (volledig geanonimiseerd) kunnen langer worden bewaard voor statistische doeleinden.
              </p>
            </CardContent>
          </Card>

          {/* Jouw rechten */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-100 p-2">
                  <Mail className="h-5 w-5 text-indigo-700" />
                </div>
                <CardTitle className="text-xl">7. Jouw rechten (AVG)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>Volgens de AVG (Algemene Verordening Gegevensbescherming) heb je de volgende rechten:</p>
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>Inzage:</strong> Je mag opvragen welke gegevens we van je hebben</li>
                <li><strong>Correctie:</strong> Je kunt foutieve gegevens laten corrigeren</li>
                <li><strong>Verwijdering:</strong> Je kunt je account en gegevens laten verwijderen</li>
                <li><strong>Bezwaar:</strong> Je kunt bezwaar maken tegen bepaalde verwerkingen</li>
                <li><strong>Dataportabiliteit:</strong> Je kunt een kopie van je gegevens opvragen</li>
                <li><strong>Intrekking toestemming:</strong> Je kunt je toestemming voor cookies altijd intrekken</li>
              </ul>
              <div className="rounded-lg border-2 border-primary bg-primary/5 p-4">
                <p className="font-semibold">Contact opnemen?</p>
                <p className="text-sm mt-2">
                  Stuur een e-mail naar <a href="mailto:info@klusjeskoningapp.nl" className="font-semibold text-primary underline">
                    info@klusjeskoningapp.nl
                  </a> met je verzoek. We reageren binnen 30 dagen.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Wijzigingen */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">8. Wijzigingen in dit privacybeleid</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>
                We kunnen dit privacybeleid af en toe aanpassen. Als we grote wijzigingen doorvoeren,
                laten we je dat weten via e-mail of een melding in de app.
              </p>
              <p className="mt-3 text-sm text-slate-600">
                We raden je aan deze pagina regelmatig te bekijken voor updates.
              </p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <CardTitle className="text-xl">9. Vragen of klachten?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <p>
                Heb je vragen over dit privacybeleid of over hoe we met je gegevens omgaan?
                Neem gerust contact met ons op:
              </p>
              <div className="rounded-lg bg-slate-50 p-4 text-sm space-y-1">
                <p><strong>E-mail:</strong> info@klusjeskoningapp.nl</p>
                <p><strong>Website:</strong> https://klusjeskoningapp.nl</p>
              </div>
              <p className="text-sm">
                Ben je niet tevreden met hoe we je klacht hebben afgehandeld?
                Dan heb je het recht om een klacht in te dienen bij de{' '}
                <a
                  href="https://autoriteitpersoonsgegevens.nl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-primary underline"
                >
                  Autoriteit Persoonsgegevens
                </a>.
              </p>
            </CardContent>
          </Card>
        </div>

        <footer className="border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} KlusjesKoning door WeAreImpact. Samen plezier in klusjes.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/" className="text-sm text-primary hover:underline">
              Terug naar homepage
            </Link>
            <Link href="/blog" className="text-sm text-primary hover:underline">
              Blog
            </Link>
            <Link href="/handleidingen" className="text-sm text-primary hover:underline">
              Handleidingen
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}
