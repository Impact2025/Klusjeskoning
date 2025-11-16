import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics';
import { MicrosoftClarity } from '@/components/analytics/MicrosoftClarity';
import { CookieConsent } from '@/components/analytics/CookieConsent';
import { GoogleReCaptcha } from '@/components/analytics/GoogleReCaptcha';

export const metadata: Metadata = {
  metadataBase: new URL('https://klusjeskoningapp.nl'),
  title: {
    default: 'KlusjesKoning - Gamified klusjes app voor gezinnen',
    template: '%s | KlusjesKoning',
  },
  description: 'De leukste manier om klusjes te doen! Een mobiele app voor gezinnen die samenwerken, sparen voor beloningen en zelfs goede doelen ondersteunen.',
  keywords: ['klusjes app', 'gezins app', 'kinderen beloningen', 'huishouden organiseren', 'gamification', 'opvoeding', 'klusjes voor kinderen', 'takenlijst gezin'],
  authors: [{ name: 'Vincent van Munster', url: 'https://weareimpact.nl' }],
  creator: 'WeAreImpact',
  publisher: 'KlusjesKoning',
  openGraph: {
    type: 'website',
    locale: 'nl_NL',
    url: 'https://klusjeskoningapp.nl',
    siteName: 'KlusjesKoning',
    title: 'KlusjesKoning - Gamified klusjes app voor gezinnen',
    description: 'De leukste manier om klusjes te doen! Een mobiele app voor gezinnen die samenwerken, sparen voor beloningen en zelfs goede doelen ondersteunen.',
    images: [
      {
        url: 'https://weareimpact.nl/LogoKlusjeskoning3.png',
        width: 1200,
        height: 630,
        alt: 'KlusjesKoning Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KlusjesKoning - Gamified klusjes app voor gezinnen',
    description: 'De leukste manier om klusjes te doen! Een mobiele app voor gezinnen.',
    images: ['https://weareimpact.nl/LogoKlusjeskoning3.png'],
    creator: '@weareimpact',
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
  verification: {
    google: 'your-google-verification-code-here',
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
        {children}
        <Toaster />
        <CookieConsent />
        {gaId && <GoogleAnalytics measurementId={gaId} />}
        {clarityId && <MicrosoftClarity projectId={clarityId} />}
        {recaptchaSiteKey && <GoogleReCaptcha siteKey={recaptchaSiteKey} />}
      </body>
    </html>
  );
}
