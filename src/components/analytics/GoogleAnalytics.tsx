'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    // Check if user has given consent
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    setConsent(hasConsent);
  }, []);

  if (!measurementId || !consent) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}', {
            page_path: window.location.pathname,
            anonymize_ip: true,
            cookie_flags: 'SameSite=None;Secure'
          });
        `}
      </Script>
    </>
  );
}

// Helper function to track custom events
export function trackEvent(eventName: string, eventParams?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && (window as unknown as { gtag?: Function }).gtag) {
    (window as unknown as { gtag: Function }).gtag('event', eventName, eventParams);
  }
}
