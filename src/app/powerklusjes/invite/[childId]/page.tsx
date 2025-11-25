"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Euro, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ChildInfo {
  id: string;
  name: string;
  avatar: string;
}

export default function PowerKlusjesInvitePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const childId = params.childId as string;

  const [child, setChild] = useState<ChildInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Form state
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [choreTitle, setChoreTitle] = useState('');
  const [choreDescription, setChoreDescription] = useState('');
  const [offeredAmount, setOfferedAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'manual' | 'in_app'>('manual');

  useEffect(() => {
    // Fetch child info (this would be a public endpoint)
    const fetchChildInfo = async () => {
      try {
        const response = await fetch(`/api/powerklusjes/child/${childId}`);
        if (response.ok) {
          const data = await response.json();
          setChild(data.child);
        } else {
          toast({
            variant: 'destructive',
            title: 'Fout',
            description: 'Kon kind informatie niet laden.',
          });
        }
      } catch (error) {
        console.error('Error fetching child info:', error);
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: 'Er ging iets mis.',
        });
      } finally {
        setLoading(false);
      }
    };

    if (childId) {
      fetchChildInfo();
    }
  }, [childId, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!child) return;

    setSubmitting(true);

    try {
      const offeredAmountCents = Math.round(parseFloat(offeredAmount) * 100);

      const response = await fetch('/api/external-chore-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          childId: child.id,
          title: choreTitle,
          description: choreDescription,
          offeredAmountCents,
          currency: 'EUR',
          paymentMode,
          contact: {
            name: contactName,
            email: contactEmail || undefined,
            phone: contactPhone || undefined,
          },
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitted(true);
        toast({
          title: 'Verzoek verzonden!',
          description: data.request?.message || 'Het klusje verzoek is verzonden.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Fout',
          description: data.error || 'Er ging iets mis bij het verzenden.',
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Er ging iets mis.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Uitnodiging laden...</p>
        </div>
      </div>
    );
  }

  if (!child) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Uitnodiging niet gevonden
              </h2>
              <p className="text-gray-600 mb-4">
                Deze uitnodiging is mogelijk verlopen of ongeldig.
              </p>
              <Button onClick={() => router.push('/')}>
                Terug naar KlusjesKoning
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Verzoek verzonden!
              </h2>
              <p className="text-gray-600 mb-4">
                {child.name} en de ouders krijgen een melding van je aanbod.
                Je hoort snel van ze terug!
              </p>
              <Button onClick={() => router.push('/')}>
                Meer klusjes aanbieden
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            PowerKlusjes
          </h1>
          <p className="text-gray-600">
            Help {child.name} met klusjes en geef een beloning!
          </p>
        </div>

        {/* Child Info Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">{child.avatar || '👶'}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold">{child.name}</h3>
                <p className="text-gray-600">
                  Wil graag klusjes doen en daarvoor beloond worden!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Bied een klusje aan</CardTitle>
            <CardDescription>
              Beschrijf een klusje dat {child.name} kan doen en hoeveel je wilt betalen.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Contact Information */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Jouw gegevens
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactName">Naam *</Label>
                    <Input
                      id="contactName"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Jouw naam"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">E-mail</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="jouw@email.nl"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Telefoonnummer</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+31 6 12345678"
                  />
                </div>
              </div>

              {/* Chore Details */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Klusje details
                </h4>

                <div className="space-y-2">
                  <Label htmlFor="choreTitle">Titel van het klusje *</Label>
                  <Input
                    id="choreTitle"
                    value={choreTitle}
                    onChange={(e) => setChoreTitle(e.target.value)}
                    placeholder="Bijv. 'Tuinnetje wieden' of 'Kamers opruimen'"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="choreDescription">Beschrijving</Label>
                  <Textarea
                    id="choreDescription"
                    value={choreDescription}
                    onChange={(e) => setChoreDescription(e.target.value)}
                    placeholder="Beschrijf precies wat er gedaan moet worden..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  Beloning
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="offeredAmount">Bedrag (€) *</Label>
                    <Input
                      id="offeredAmount"
                      type="number"
                      step="0.01"
                      min="0.50"
                      max="50.00"
                      value={offeredAmount}
                      onChange={(e) => setOfferedAmount(e.target.value)}
                      placeholder="5.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Betaalwijze</Label>
                    <div className="space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMode"
                          value="manual"
                          checked={paymentMode === 'manual'}
                          onChange={(e) => setPaymentMode(e.target.value as 'manual')}
                        />
                        <span className="text-sm">Handmatig betalen (contant/overschrijving)</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="paymentMode"
                          value="in_app"
                          checked={paymentMode === 'in_app'}
                          onChange={(e) => setPaymentMode(e.target.value as 'in_app')}
                        />
                        <span className="text-sm">Betalen via app (premium functie)</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info Alert */}
              <Alert>
                <AlertDescription>
                  <strong>Belangrijk:</strong> De ouders moeten dit verzoek eerst goedkeuren.
                  {paymentMode === 'in_app' && ' Voor in-app betalingen moet je saldo hebben in de KlusjesKoning app.'}
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Verzenden...
                  </>
                ) : (
                  'Verzoek verzenden'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}