'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';

export function MicrosoftClarity({ projectId }: { projectId: string }) {
  const [consent, setConsent] = useState(false);

  useEffect(() => {
    // Check if user has given consent
    const hasConsent = localStorage.getItem('analytics-consent') === 'true';
    setConsent(hasConsent);
  }, []);

  if (!projectId || !consent) {
    return null;
  }

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`
        (function(c,l,a,r,i,t,y){
          c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
          t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
          y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
        })(window, document, "clarity", "script", "${projectId}");
      `}
    </Script>
  );
}
