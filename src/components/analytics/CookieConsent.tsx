'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('analytics-consent');
    if (consent === null) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('analytics-consent', 'true');
    setShowBanner(false);
    // Reload to activate analytics
    window.location.reload();
  };

  const handleReject = () => {
    localStorage.setItem('analytics-consent', 'false');
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-4 sm:p-6">
      <Card className="mx-auto max-w-3xl border-primary/20 bg-white/95 shadow-2xl backdrop-blur">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🍪</span>
            <CardTitle className="text-xl text-slate-900">We gebruiken cookies</CardTitle>
            <Badge variant="outline" className="ml-auto border-amber-300 bg-amber-50 text-amber-700">
              Privacy-vriendelijk
            </Badge>
          </div>
          <CardDescription className="text-base text-slate-600">
            Om onze website te verbeteren, gebruiken we analytische cookies. Deze helpen ons begrijpen hoe bezoekers de site gebruiken.
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2 text-sm text-slate-600">
            <p>
              <strong className="font-semibold text-slate-700">Wat we verzamelen:</strong> Anonieme bezoekersstatistieken, pagina weergaven, en gebruikersinteracties.
            </p>
            <p>
              <strong className="font-semibold text-slate-700">Wat we NIET verzamelen:</strong> Persoonlijke informatie of gevoelige data.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={handleAccept}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Accepteren
            </Button>
            <Button
              onClick={handleReject}
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Alleen noodzakelijk
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Door te accepteren ga je akkoord met ons{' '}
            <a href="/privacy" className="underline hover:text-slate-700">
              privacybeleid
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
