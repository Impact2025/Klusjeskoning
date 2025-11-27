import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Shield, AlertTriangle, CreditCard, Users, Eye, Lock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden',
  description: 'Algemene Voorwaarden van KlusjesKoning. Lees de gebruiksvoorwaarden, verantwoordelijkheden en regels voor het gebruik van onze app.',
  openGraph: {
    title: 'Algemene Voorwaarden | KlusjesKoning',
    description: 'De gebruiksvoorwaarden voor KlusjesKoning',
  },
};

export default function TermsPage() {
  const version = '1.0';
  const validFrom = '1 januari 2025';

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
              <FileText className="mr-2 h-3 w-3" />
              Algemene Voorwaarden
            </Badge>
            <h1 className="font-brand text-4xl leading-tight text-slate-900 sm:text-5xl">
              Algemene Voorwaarden
            </h1>
            <h2 className="text-xl font-semibold text-primary">KlusjesKoning</h2>
            <p className="text-lg text-slate-600">
              Deze Algemene Voorwaarden (hierna: 'AV') regelen de gebruiksvoorwaarden van de KlusjesKoning applicatie (hierna: 'App').
              Door het openen van een account, gaat u akkoord met deze voorwaarden.
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-500">
              <p>Versie {version} | Geldig vanaf {validFrom}</p>
            </div>
          </div>
        </header>

        <div className="grid gap-6">
          {/* Definities */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-2">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">1. Definities</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-slate-700">
              <ul className="list-disc space-y-2 pl-6">
                <li><strong>'Gebruiker'</strong> = De ouder/verzorger die het account opent</li>
                <li><strong>'Kind'</strong> = Een minderjarig familielid dat de App onder toezicht van de Gebruiker gebruikt</li>
                <li><strong>'KlusjesKoning'</strong> = De organisatie achter deze App</li>
                <li><strong>'Klusje'</strong> = Een huishoudelijke taak of externe activiteit</li>
              </ul>
            </CardContent>
          </Card>

          {/* Accountaanmaking en Verantwoordelijkheid */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Users className="h-5 w-5 text-blue-700" />
                </div>
                <CardTitle className="text-xl">2. Accountaanmaking en Verantwoordelijkheid</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">2.1 Account Openen</h3>
                <p>Alleen personen van 18 jaar of ouder mogen een account openen. De Gebruiker is volledig verantwoordelijk voor alle activiteiten op dit account, inclusief het gebruik door kinderen.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">2.2 Toestemming Kinderen</h3>
                <p>Door het account op te openen, geeft de Gebruiker uitdrukkelijk toestemming dat KlusjesKoning gegevens van kinderen verwerkt conform deze voorwaarden en de Privacy Verklaring.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">2.3 Oudertoezicht</h3>
                <p>De Gebruiker is volledig verantwoordelijk voor het toezicht op welke klusjes hun kind accepteert, hoe lang zij werken, en of activiteiten veilig zijn. KlusjesKoning biedt geen toezicht of advies over veiligheid.</p>
              </div>
            </CardContent>
          </Card>

          {/* Klusjes en Veiligheid */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-amber-100 p-2">
                  <Shield className="h-5 w-5 text-amber-700" />
                </div>
                <CardTitle className="text-xl">3. Klusjes en Veiligheid</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">3.1 Verantwoordelijkheid Klusjes</h3>
                <p>De Gebruiker is volledig verantwoordelijk voor het bepalen welke klusjes voor hun kind geschikt zijn. KlusjesKoning beoordeelt niet of klusjes veilig, legaal of leeftijdsgeschikte zijn.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">3.2 Externe Klusjes</h3>
                <p>Voor externe klusjes (werk via derden) moet de Gebruiker:</p>
                <ul className="list-disc space-y-1 pl-6 mt-2">
                  <li>De persoon volledig vertrouwen en kennen</li>
                  <li>Uitdrukkelijk goedkeuren voordat het kind de taak accepteert</li>
                  <li>Toezien terwijl het kind werkt</li>
                  <li>Een eigen veiligheidsverklaring en verzekering arrangeren</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">3.3 Niet Toegestane Klusjes</h3>
                <p>KlusjesKoning verbiedt klusjes waarin het kind:</p>
                <ul className="list-disc space-y-1 pl-6 mt-2">
                  <li>Alleen met een volwassene is (geen externe contacten)</li>
                  <li>Op ladders of daken werkt</li>
                  <li>Zware lasten ({'>'}10kg) tilt</li>
                  <li>Elektrische apparaten of gereedschap gebruikt</li>
                  <li>Chemicaliën aanraakt</li>
                  <li>In water of natte omgevingen werkt</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Betalingen en Punten */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 p-2">
                  <CreditCard className="h-5 w-5 text-green-700" />
                </div>
                <CardTitle className="text-xl">4. Betalingen en Punten</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">4.1 Punten</h3>
                <p>Punten verdiend in KlusjesKoning hebben geen geldwaarde. Ze kunnen worden ingewisseld voor beloningen, maar niet in contant geld omgezet.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">4.2 Beloningen</h3>
                <p>Beloningen zijn aanbiedingen die de Gebruiker bepaalt. KlusjesKoning heeft geen enkele verplichting om beloningen in te wisselen.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">4.3 Betaalde Klusjes (Powerklusjes)</h3>
                <p>Als KlusjesKoning betaalde externe klusjes aanbiedt, gelden extra regels:</p>
                <ul className="list-disc space-y-1 pl-6 mt-2">
                  <li>Kind {'<'} 13 jaar: Niet toegestaan</li>
                  <li>Kind 13-16 jaar: Max €5 per week, oudergoedkeuring vereist</li>
                  <li>Kind {'>'} 16 jaar: Reguliere regels</li>
                  <li>Alle betalingen gaan naar de ouder (niet direct naar het kind)</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Abonnement en Betaling */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-purple-100 p-2">
                  <CreditCard className="h-5 w-5 text-purple-700" />
                </div>
                <CardTitle className="text-xl">5. Abonnement en Betaling</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div>
                <h3 className="font-semibold text-slate-900 mb-2">5.1 Gratis en Premium</h3>
                <p>KlusjesKoning biedt een gratis versie en een betaald abonnement. Betalingen worden verwerkt via Stripe.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">5.2 Abonnement Verlenging</h3>
                <p>Abonnementen verlengen automatisch. U kunt dit op elk moment stopzetten via uw account.</p>
              </div>
            </CardContent>
          </Card>

          {/* Aansprakelijkheid en Aansprakelijkheidsbeperkingen */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-red-700" />
                </div>
                <CardTitle className="text-xl">6. Aansprakelijkheid en Aansprakelijkheidsbeperkingen</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-slate-700">
              <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
                <h3 className="font-bold text-red-800 mb-2">⚠️ BELANGRIJKE WAARSCHUWING</h3>
                <p className="text-red-700">KlusjesKoning is NIET aansprakelijk voor schade die ontstaat doordat uw kind klusjes doet. Dit omvat:</p>
                <ul className="list-disc space-y-1 pl-6 mt-2 text-red-700">
                  <li>Letstel of verwondingen (groot of klein)</li>
                  <li>Medische kosten</li>
                  <li>Schade aan spullen</li>
                  <li>Conflicten met derden</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">6.2 Verzekering</h3>
                <p>U bent verantwoordelijk voor het regelen van eigen verzekering (bijv. aansprakelijkheidsverzekering) als uw kind voor derden werkt.</p>
              </div>

              <div>
                <h3 className="font-semibold text-slate-900 mb-2">6.3 Geen Background Checks</h3>
                <p>KlusjesKoning voert geen achtergrondcontroles uit op externe contacten. U bent volledig verantwoordelijk voor het bepalen van wie u vertrouwt.</p>
              </div>
            </CardContent>
          </Card>

          {/* Gegevensverwerking en Privacy */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-indigo-100 p-2">
                  <Lock className="h-5 w-5 text-indigo-700" />
                </div>
                <CardTitle className="text-xl">7. Gegevensverwerking en Privacy</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>KlusjesKoning verwerkt persoonsgegevens conform de Privacy Verklaring en de Algemene Verordening Gegevensbescherming (AVG).</p>
              <p className="mt-3">U kunt op elk moment om verwijdering van alle gegevens verzoeken via uw accountinstellingen.</p>
            </CardContent>
          </Card>

          {/* Verboden Activiteiten */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-red-100 p-2">
                  <Eye className="h-5 w-5 text-red-700" />
                </div>
                <CardTitle className="text-xl">8. Verboden Activiteiten</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>Het is VERBODEN om KlusjesKoning te gebruiken voor:</p>
              <ul className="list-disc space-y-2 pl-6 mt-3">
                <li>Grooming, seksueel misbruik, of andere vormen van kindermishandeling</li>
                <li>Illegale activiteiten of misdrijven</li>
                <li>Haat, discriminatie, of geweld</li>
                <li>Spam, phishing, of virussen</li>
              </ul>
            </CardContent>
          </Card>

          {/* Rapportage Incidenten */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-orange-100 p-2">
                  <AlertTriangle className="h-5 w-5 text-orange-700" />
                </div>
                <CardTitle className="text-xl">9. Rapportage Incidenten</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>Als u vermoedt dat iemand KlusjesKoning misbruikt voor kindermishandeling of andere illegale activiteiten, rapport dit onmiddellijk via de 'Report' knop in de app of neem contact op met de politie.</p>
            </CardContent>
          </Card>

          {/* Wijzigingen van deze Voorwaarden */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-cyan-100 p-2">
                  <FileText className="h-5 w-5 text-cyan-700" />
                </div>
                <CardTitle className="text-xl">10. Wijzigingen van deze Voorwaarden</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>KlusjesKoning kan deze voorwaarden op elk moment wijzigen. Wijzigingen worden via email aangekondigd. Verdere gebruik betekent akkoord met de wijzigingen.</p>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-teal-100 p-2">
                  <FileText className="h-5 w-5 text-teal-700" />
                </div>
                <CardTitle className="text-xl">11. Contact</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>Voor vragen over deze voorwaarden:</p>
              <div className="rounded-lg bg-slate-50 p-4 mt-3">
                <p><strong>Email:</strong> legal@klusjesking.nl</p>
              </div>
            </CardContent>
          </Card>

          {/* Nederlands Recht */}
          <Card className="border-slate-200 bg-white/90 shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-slate-100 p-2">
                  <Shield className="h-5 w-5 text-slate-700" />
                </div>
                <CardTitle className="text-xl">12. Nederlands Recht</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-slate-700">
              <p>Deze voorwaarden worden geregeld door Nederlands recht. Geschillen worden behandeld door de bevoegde rechter in Nederland.</p>
            </CardContent>
          </Card>
        </div>

        <div className="rounded-lg border-2 border-primary bg-primary/5 p-6 text-center">
          <p className="font-bold text-primary text-lg mb-2">Document versie {version} | Deze voorwaarden zijn bindend en moeten volledig gelezen worden</p>
        </div>

        <footer className="border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} KlusjesKoning door WeAreImpact. Samen plezier in klusjes.
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/" className="text-sm text-primary hover:underline">
              Terug naar homepage
            </Link>
            <Link href="/privacy" className="text-sm text-primary hover:underline">
              Privacybeleid
            </Link>
            <Link href="/blog" className="text-sm text-primary hover:underline">
              Blog
            </Link>
          </div>
        </footer>
      </div>
    </div>
  );
}