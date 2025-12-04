import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { MicrosoftClarity } from '@/components/analytics/MicrosoftClarity';
import { CookieConsent } from '@/components/analytics/CookieConsent';
import { GoogleReCaptcha } from '@/components/analytics/GoogleReCaptcha';
import ErrorBoundary from '@/components/ErrorBoundary';

export const metadata: Metadata = {
  metadataBase: new URL('https://klusjeskoningapp.nl'),
  title: {
    default: 'KlusjesKoning - Gamified klusjes app voor gezinnen | Gratis starten',
    template: '%s | KlusjesKoning',
  },
  description: 'Transformeer dagelijkse klusjes in waardevolle leermomenten! KlusjesKoning maakt verantwoordelijkheden leuk met punten, beloningen en gamification. Gratis starter plan beschikbaar.',
  keywords: [
    'klusjes app gratis',
    'gezins app gamification',
    'kinderen belonen klusjes',
    'huishouden organiseren app',
    'takenlijst gezin digitaal',
    'opvoeding gamified',
    'kinderen motiveren klusjes',
    'gezinssamenwerking app',
    'beloningen voor kinderen',
    'huishoudelijke taken app'
  ],
  authors: [{ name: 'Vincent van Munster', url: 'https://weareimpact.nl' }],
  creator: 'WeAreImpact',
  publisher: 'KlusjesKoning',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: 'productivity',
  classification: 'Gezinsapp voor klusjes en beloningen',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://klusjeskoningapp.nl',
    siteName: 'KlusjesKoning',
    title: 'KlusjesKoning - Gamified klusjes app voor gezinnen | Gratis starten',
    description: 'Transformeer dagelijkse klusjes in waardevolle leermomenten! KlusjesKoning maakt verantwoordelijkheden leuk met punten, beloningen en gamification.',
    images: [
      {
        url: 'https://weareimpact.nl/LogoKlusjeskoning3.png',
        width: 1200,
        height: 630,
        alt: 'KlusjesKoning - Gamified klusjes app voor gezinnen',
        type: 'image/png',
      },
      {
        url: '/images/app voor klusjes, zakgeld en gezinsdoelen.png',
        width: 1200,
        height: 800,
        alt: 'KlusjesKoning app interface - klusjes, beloningen en gezinsdoelen',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KlusjesKoning - Gamified klusjes app voor gezinnen',
    description: 'Transformeer dagelijkse klusjes in waardevolle leermomenten met gamification!',
    images: ['https://weareimpact.nl/LogoKlusjeskoning3.png'],
    creator: '@weareimpact',
    site: '@klusjeskoning',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://klusjeskoningapp.nl',
  },
  verification: {
    google: 'your-google-verification-code-here',
  },
  other: {
    'application-name': 'KlusjesKoning',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'KlusjesKoning',
    'format-detection': 'telephone=no',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0ea5e9',
    'msapplication-tap-highlight': 'no',
    'theme-color': '#0ea5e9',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID;
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  return (
    <html lang="nl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Lilita+One&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-blue-50 text-gray-800">
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster />
        <CookieConsent />
        {gaId && <GoogleAnalytics measurementId={gaId} />}
        {clarityId && <MicrosoftClarity projectId={clarityId} />}
        {recaptchaSiteKey && <GoogleReCaptcha siteKey={recaptchaSiteKey} />}
      </body>
    </html>
  );
}
