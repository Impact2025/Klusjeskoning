'use client';

import { useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/app/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatPrice, PLAN_DEFINITIONS } from '@/lib/plans';
import { CreditCard, CheckCircle, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UpgradePage() {
  const { 
    family, 
    startPremiumCheckout, 
    confirmPremiumCheckout, 
    isPremium,
    isLoading 
  } = useApp();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const premiumPlan = PLAN_DEFINITIONS.premium;

  const handleUpgrade = useCallback(async (interval: 'monthly' | 'yearly') => {
    const paymentUrl = await startPremiumCheckout(interval);
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }, [startPremiumCheckout]);

  useEffect(() => {
    const checkoutStatus = searchParams?.get('checkout');
    const orderId = searchParams?.get('order_id');
    const intervalParam = (searchParams?.get('interval') as 'monthly' | 'yearly' | null) ?? 'monthly';

    if (checkoutStatus === 'success' && orderId) {
      (async () => {
        await confirmPremiumCheckout(orderId, intervalParam);
        router.replace('/app/upgrade?checkout=completed');
      })();
    } else if (checkoutStatus === 'completed') {
      toast({ title: 'Upgrade succesvol!', description: 'Je hebt nu toegang tot alle premium functies.' });
      router.replace('/app/upgrade');
    } else if (checkoutStatus === 'cancel') {
      toast({ title: 'Upgrade geannuleerd', description: 'Je blijft op het gratis plan.' });
      router.replace('/app/upgrade');
    }
  }, [searchParams, confirmPremiumCheckout, router, toast]);

  if (!family) {
    return null;
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="outline" 
            onClick={() => router.push('/app')} 
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Terug naar Dashboard
          </Button>
          
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-8 text-center">
              <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <CardTitle className="text-2xl text-green-800 mb-2">Je hebt Gezin+!</CardTitle>
              <CardDescription className="text-green-700 mb-6">
                Je gezin heeft toegang tot alle premium functies.
              </CardDescription>
              <Button onClick={() => router.push('/app')}>
                Terug naar Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="outline" 
          onClick={() => router.push('/app')} 
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Terug naar Dashboard
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Upgrade naar Gezin+</h1>
          <p className="text-slate-600">
            Ontgrendel alle premium functies voor jouw gezin
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Premium Plan Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Gezin+ Abonnement</CardTitle>
              <CardDescription>
                Alles wat je nodig hebt voor een succesvolle klusjes ervaring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Alle Premium Functies:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Onbeperkt aantal kinderen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Onbeperkt aantal klusjes</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>AI-klusassistent (Gemini)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Virtueel huisdier & badges</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Gezinsdoelen & donaties</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Aanpasbare thema's & huisstijl</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Ouders beheren spaardoelen</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Klantondersteuning via e-mail</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Kies je abonnement</CardTitle>
              <CardDescription>
                Selecteer het plan dat het beste bij jouw gezin past
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Monthly Plan */}
              <div className="border rounded-lg p-6 relative">
                <Badge className="absolute top-4 right-4" variant="secondary">Populairst</Badge>
                <div className="mb-4">
                  <h3 className="text-xl font-bold">Maandabonnement</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{formatPrice(premiumPlan.priceMonthlyCents)}</span>
                    <span className="text-gray-500">/maand</span>
                  </div>
                </div>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleUpgrade('monthly')}
                  disabled={isLoading}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Kies Maandabonnement
                </Button>
              </div>

              {/* Yearly Plan */}
              <div className="border rounded-lg p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold">Jaarabonnement</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold">{formatPrice(premiumPlan.priceYearlyCents)}</span>
                    <span className="text-gray-500">/jaar</span>
                  </div>
                  <p className="text-sm text-green-600 mt-1">
                    Bespaar €{((premiumPlan.priceMonthlyCents * 12 - premiumPlan.priceYearlyCents) / 100).toFixed(2)} per jaar
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full" 
                  size="lg"
                  onClick={() => handleUpgrade('yearly')}
                  disabled={isLoading}
                >
                  <CreditCard className="mr-2 h-5 w-5" />
                  Kies Jaarabonnement
                </Button>
              </div>

              <div className="text-sm text-gray-500 text-center">
                <p>Veilige betaling via MultiSafepay</p>
                <p className="mt-1">Je kunt op elk moment opzeggen</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}