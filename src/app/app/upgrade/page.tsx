'use client';

import { useEffect, useCallback, Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useApp } from '@/components/app/AppProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice, PLAN_DEFINITIONS } from '@/lib/plans';
import {
  CreditCard,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Star,
  Users,
  Sparkles,
  Trophy,
  Heart,
  Zap,
  Shield,
  Crown,
  Gift,
  Clock,
  TrendingUp,
  Quote
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Mock testimonials data
const testimonials = [
  {
    name: "Sarah van der Berg",
    role: "Moeder van 3",
    content: "KlusjesKoning heeft ons gezin compleet veranderd! De kinderen zijn veel gemotiveerder en ik heb eindelijk overzicht over alle taken.",
    rating: 5,
    avatar: "S"
  },
  {
    name: "Mark Jansen",
    role: "Vader van 2",
    content: "De gamification elementen maken klusjes doen leuk. Ons jongste kind vraagt nu zelf om taken! Top systeem.",
    rating: 5,
    avatar: "M"
  },
  {
    name: "Lisa de Vries",
    role: "Moeder van 4",
    content: "Eindelijk een systeem dat werkt voor ons grote gezin. De AI-assistent helpt enorm bij het bedenken van geschikte taken.",
    rating: 5,
    avatar: "L"
  }
];

function UpgradePageContent() {
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
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponCode.trim()) {
      setCouponError('Voer een couponcode in');
      return;
    }

    setIsValidatingCoupon(true);
    setCouponError('');

    try {
      const response = await fetch('/api/billing/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          familyId: family?.id || 'test',
          email: family?.email || 'test@test.com',
          familyName: family?.familyName || 'Test',
          interval: 'monthly',
          plan: 'premium',
          couponCode: couponCode.trim(),
        }),
      });

      if (response.ok) {
        setAppliedCoupon({ code: couponCode.trim(), validated: true });
        setCouponError('');
        toast({ title: 'Coupon toegepast!', description: 'De korting is toegepast op je abonnement.' });
      } else {
        const error = await response.json();
        setCouponError(error.error || 'Ongeldige couponcode');
        setAppliedCoupon(null);
      }
    } catch (error) {
      setCouponError('Kon coupon niet valideren');
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  }, [couponCode, family, toast]);

  const handleUpgrade = useCallback(async (interval: 'monthly' | 'yearly') => {
    const paymentUrl = await startPremiumCheckout(interval, appliedCoupon?.code || couponCode || undefined);
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  }, [startPremiumCheckout, appliedCoupon, couponCode]);

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
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
        <Card className="max-w-md w-full shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Inloggen vereist</CardTitle>
            <CardDescription className="text-lg">
              Om te upgraden naar Gezin+ moet je eerst ingelogd zijn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              className="w-full h-12 text-lg"
              onClick={() => router.push('/app')}
            >
              <Shield className="mr-2 h-5 w-5" />
              Inloggen
            </Button>
            <Button
              variant="outline"
              className="w-full h-12 text-lg"
              onClick={() => router.push('/')}
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Terug naar homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.push('/app')}
            className="mb-6 h-12"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Terug naar Dashboard
          </Button>

          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-6 w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <Crown className="h-10 w-10 text-green-600" />
              </div>
              <CardTitle className="text-4xl text-green-800 mb-4">Welkom bij Gezin+! 🎉</CardTitle>
              <CardDescription className="text-xl text-green-700 mb-8">
                Je gezin heeft nu toegang tot alle premium functies en oneindige mogelijkheden.
              </CardDescription>
              <Button
                onClick={() => router.push('/app')}
                className="h-14 px-8 text-lg bg-green-600 hover:bg-green-700"
              >
                <Sparkles className="mr-2 h-6 w-6" />
                Start met Gezin+
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto p-4">

        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <Button
            variant="outline"
            onClick={() => router.push('/app')}
            className="mb-8 h-12"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Terug naar Dashboard
          </Button>

          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-medium mb-6">
            <Crown className="h-4 w-4" />
            BEPERKT AANBOD: 30% KORTING
          </div>

          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Upgrade naar Gezin+
          </h1>
          <p className="text-2xl text-slate-600 max-w-3xl mx-auto">
            Transformeer je gezin met professionele tools voor taakbeheer, gamification en familie bonding
          </p>
        </div>

        {/* Social Proof */}
        <div className="mb-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">Wat ouders zeggen</h2>
            <div className="flex items-center justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              ))}
              <span className="ml-2 text-slate-600 font-medium">4.9/5 gebaseerd op 500+ reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-blue-200 mb-4" />
                  <p className="text-slate-700 mb-4 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{testimonial.name}</p>
                      <p className="text-sm text-slate-600">{testimonial.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Features Showcase */}
          <div className="lg:col-span-2 space-y-8">

            {/* Hero Feature */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Complete Gezin Toolkit</h3>
                    <p className="text-blue-100">Alles wat je nodig hebt voor gelukkig gezin</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Onbeperkt Kinderen</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Trophy className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Gamification</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Zap className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">AI Assistent</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Heart className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium">Familie Bonding</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Feature Comparison */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl">Waarom kiezen voor Gezin+?</CardTitle>
                <CardDescription className="text-lg">
                  Vergelijk de gratis en premium versie
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-red-800">Maximaal 3 kinderen</p>
                        <p className="text-sm text-red-600">Beperking in gratis versie</p>
                      </div>
                    </div>
                    <Badge variant="destructive">Gratis limiet</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-medium text-orange-800">Maximaal 50 klusjes per maand</p>
                        <p className="text-sm text-orange-600">Beperking in gratis versie</p>
                      </div>
                    </div>
                    <Badge className="bg-orange-500">Gratis limiet</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-green-800">AI Klusassistent</p>
                        <p className="text-sm text-green-600">Genereer automatisch taken op maat</p>
                      </div>
                    </div>
                    <Badge className="bg-green-500">Premium</Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Trophy className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-blue-800">Virtuele huisdieren & badges</p>
                        <p className="text-sm text-blue-600">Extra motivatie voor kinderen</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500">Premium</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pricing Sidebar */}
          <div className="space-y-6">

            {/* Coupon Section */}
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-purple-600" />
                  Korting Code
                </CardTitle>
                <CardDescription>
                  Heb je een kortingscode? Gebruik deze voor extra voordeel!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon">Coupon code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="coupon"
                      placeholder="VRIEND25"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponError('');
                        setAppliedCoupon(null);
                      }}
                      className={couponError ? 'border-red-500' : ''}
                      disabled={isValidatingCoupon}
                    />
                    <Button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode.trim() || isValidatingCoupon || !!appliedCoupon}
                      variant="outline"
                    >
                      {isValidatingCoupon ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : appliedCoupon ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        '✓'
                      )}
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-600">{couponError}</p>
                  )}
                  {appliedCoupon && (
                    <p className="text-sm text-green-600 flex items-center">
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Coupon toegepast!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Pricing Cards */}
            <div className="space-y-4">

              {/* Monthly Plan */}
              <Card className="relative shadow-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">Populairst</Badge>
                </div>
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Maandelijks</CardTitle>
                  <div className="mt-4">
                    {appliedCoupon ? (
                      <div className="space-y-1">
                        <span className="text-lg text-gray-500 line-through">{formatPrice(premiumPlan.priceMonthlyCents)}</span>
                        <div className="text-4xl font-bold text-green-600">
                          {formatPrice(Math.max(0, premiumPlan.priceMonthlyCents - Math.round((premiumPlan.priceMonthlyCents * (appliedCoupon.code === 'VRIEND25' ? 25 : 20)) / 100)))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-blue-600">{formatPrice(premiumPlan.priceMonthlyCents)}</div>
                    )}
                    <p className="text-gray-500">per maand</p>
                  </div>
                  {appliedCoupon && (
                    <p className="text-sm text-green-600 font-medium">
                      {appliedCoupon.code === 'VRIEND25' ? '25%' : '20%'} korting toegepast!
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Onbeperkt aantal kinderen</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Onbeperkt aantal klusjes</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>AI Klusassistent</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Gamification features</span>
                    </li>
                  </ul>
                  <Button
                    className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700"
                    size="lg"
                    onClick={() => handleUpgrade('monthly')}
                    disabled={isLoading}
                  >
                    <CreditCard className="mr-2 h-5 w-5" />
                    {isLoading ? 'Bezig...' : 'Kies Maandelijks'}
                  </Button>
                </CardContent>
              </Card>

              {/* Yearly Plan */}
              <Card className="shadow-xl bg-gradient-to-br from-purple-50 to-white">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-2xl">Jaarlijks</CardTitle>
                  <div className="mt-4">
                    {appliedCoupon ? (
                      <div className="space-y-1">
                        <span className="text-lg text-gray-500 line-through">{formatPrice(premiumPlan.priceYearlyCents)}</span>
                        <div className="text-4xl font-bold text-green-600">
                          {formatPrice(Math.max(0, premiumPlan.priceYearlyCents - Math.round((premiumPlan.priceYearlyCents * (appliedCoupon.code === 'VRIEND25' ? 25 : 20)) / 100)))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-4xl font-bold text-purple-600">{formatPrice(premiumPlan.priceYearlyCents)}</div>
                    )}
                    <p className="text-gray-500">per jaar</p>
                  </div>
                  <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium inline-block mt-2">
                    Bespaar €{((premiumPlan.priceMonthlyCents * 12 - premiumPlan.priceYearlyCents) / 100).toFixed(0)} per jaar
                  </div>
                  {appliedCoupon && (
                    <p className="text-sm text-green-600 font-medium mt-1">
                      {appliedCoupon.code === 'VRIEND25' ? '25%' : '20%'} korting toegepast!
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Alles van maandelijks</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>2 maanden gratis</span>
                    </li>
                    <li className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>Prioriteit ondersteuning</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg border-purple-300 text-purple-700 hover:bg-purple-50"
                    size="lg"
                    onClick={() => handleUpgrade('yearly')}
                    disabled={isLoading}
                  >
                    <TrendingUp className="mr-2 h-5 w-5" />
                    {isLoading ? 'Bezig...' : 'Kies Jaarlijks'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Trust Signals */}
            <Card className="bg-gray-50 border-0">
              <CardContent className="p-6 text-center">
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Shield className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Veilige SSL encryptie</span>
                </div>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium text-gray-700">Opzeggen wanneer je wilt</span>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Heart className="h-6 w-6 text-red-600" />
                  <span className="text-sm font-medium text-gray-700">30 dagen geld terug garantie</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16 mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Start vandaag met Gezin+</h2>
            <p className="text-xl mb-6 text-blue-100">
              Transformeer je gezin in een goed geoliede machine met professionele tools
            </p>
            <Button
              onClick={() => handleUpgrade('monthly')}
              className="h-14 px-8 text-lg bg-white text-blue-600 hover:bg-gray-100"
              disabled={isLoading}
            >
              <Crown className="mr-2 h-6 w-6" />
              {isLoading ? 'Bezig met upgraden...' : 'Upgrade naar Gezin+'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 flex items-center justify-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
        </div>
      }
    >
      <UpgradePageContent />
    </Suspense>
  );
}