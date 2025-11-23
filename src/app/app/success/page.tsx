"use client";

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Crown, Star, Users, Zap, Heart, ArrowRight, Sparkles } from 'lucide-react';
import { useAppContext } from '@/components/app/AppProvider';
import confetti from 'canvas-confetti';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { family } = useAppContext();
  const [showConfetti, setShowConfetti] = useState(false);

  const orderId = searchParams.get('order_id');
  const interval = searchParams.get('interval');
  const isFree = searchParams.get('free') === 'true';

  useEffect(() => {
    // Trigger confetti animation
    setShowConfetti(true);
    const duration = 3000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#0ea5e9', '#fbbf24', '#10b981']
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#0ea5e9', '#fbbf24', '#10b981']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();

    // Clean up after animation
    const timer = setTimeout(() => setShowConfetti(false), duration);
    return () => clearTimeout(timer);
  }, []);

  const handleGetStarted = () => {
    router.push('/app');
  };

  const planName = interval === 'yearly' ? 'Jaarabonnement' : 'Maandabonnement';
  const planEmoji = interval === 'yearly' ? '👑' : '⭐';

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-4">
              <Crown className="w-10 h-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-yellow-400 animate-pulse" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welkom bij Gezin+! 🎉
          </h1>

          <p className="text-xl text-gray-600 mb-4">
            Gefeliciteerd! Je gezin heeft nu toegang tot alle premium functies.
          </p>

          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
            <CheckCircle className="w-4 h-4" />
            {isFree ? 'Gratis upgrade voltooid' : `${planName} ${planEmoji} succesvol geactiveerd`}
          </div>
        </div>

        {/* Success Card */}
        <Card className="border-primary/20 shadow-xl">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-primary flex items-center justify-center gap-2">
              <Star className="w-6 h-6" />
              Jouw Gezin+ Avontuur Begint!
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* What they get */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <Users className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Onbeperkt aantal kinderen</h3>
                  <p className="text-sm text-gray-600">Voeg zoveel kinderen toe als je wilt</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <Zap className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">AI Klusjes Generator</h3>
                  <p className="text-sm text-gray-600">Persoonlijke ideeën voor jullie gezin</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <Heart className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Donatie Doelen</h3>
                  <p className="text-sm text-gray-600">Leer kinderen over geven</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg">
                <Star className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900">Premium Beloningen</h3>
                  <p className="text-sm text-gray-600">Meer manieren om te motiveren</p>
                </div>
              </div>
            </div>

            {/* Motivational message */}
            <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-6 rounded-lg text-center">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Samen maken jullie van klusjes doen een feestje! 🎈
              </h3>
              <p className="text-gray-600">
                Stel je voor: kinderen die enthousiast hun taken doen, punten verdienen,
                en trots zijn op hun bijdragen. Jij als ouder die geniet van meer quality time
                en minder gedoe. Dat is jullie nieuwe realiteit!
              </p>
            </div>

            {/* Next steps */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 text-center">
                🚀 Jouw volgende stappen:
              </h3>

              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    1
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Voeg je kinderen toe</p>
                    <p className="text-sm text-gray-600">Maak profielen aan met namen en pincodes</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    2
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Genereer eerste klusjes</p>
                    <p className="text-sm text-gray-600">Laat onze AI helpen met persoonlijke ideeën</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold">
                    3
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Stel beloningen in</p>
                    <p className="text-sm text-gray-600">Maak jullie gezinsshop extra aantrekkelijk</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 text-lg font-semibold shadow-lg"
              >
                Start jullie KlusjesKoning avontuur!
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Encouraging footer */}
            <div className="text-center pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500 mb-2">
                💪 <strong>Jullie gaan dit rocken!</strong>
              </p>
              <p className="text-xs text-gray-400">
                Heb je vragen? We helpen je graag op weg via support@klusjeskoning.nl
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SuccessContent />
    </Suspense>
  );
}