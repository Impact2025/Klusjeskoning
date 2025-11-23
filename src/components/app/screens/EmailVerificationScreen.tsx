'use client';
import { useState, useEffect } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, ArrowLeft } from 'lucide-react';

export default function EmailVerificationScreen() {
  const { setScreen, verifyRegistration, isLoading } = useApp();
  const { toast } = useToast();
  const [code, setCode] = useState('');

  // Get registration data from sessionStorage
  const [registrationData, setRegistrationData] = useState<{
    email: string;
    familyName: string;
    city: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const data = sessionStorage.getItem('pendingRegistration');
    if (data) {
      try {
        setRegistrationData(JSON.parse(data));
      } catch (error) {
        console.error('Failed to parse registration data:', error);
        setScreen('parentLogin');
      }
    } else {
      setScreen('parentLogin');
    }
  }, [setScreen]);

  const handleBack = () => {
    sessionStorage.removeItem('pendingRegistration');
    setScreen('parentLogin');
  };

  const handleVerify = async () => {
    if (!registrationData) {
      toast({ variant: 'destructive', title: 'Fout', description: 'Registratiegegevens niet gevonden.' });
      setScreen('parentLogin');
      return;
    }

    if (!code || code.length !== 6) {
      toast({
        variant: 'destructive',
        title: 'Ongeldige code',
        description: 'Voer een geldige 6-cijferige verificatiecode in.',
      });
      return;
    }

    try {
      await verifyRegistration(registrationData.email, code, registrationData.familyName, registrationData.city, registrationData.password);
      sessionStorage.removeItem('pendingRegistration');
      toast({
        title: 'Welkom!',
        description: 'Je account is succesvol aangemaakt.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verificatie mislukt',
        description: 'De verificatiecode is ongeldig of verlopen.',
      });
    }
  };

  const handleResendCode = async () => {
    try {
      // This would need to be implemented in the AppProvider
      toast({
        title: 'Code verzonden',
        description: 'Een nieuwe verificatiecode is verzonden naar je email.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Fout',
        description: 'Kon geen nieuwe code verzenden.',
      });
    }
  };

  if (!registrationData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Controleer je email
          </CardTitle>
          <CardDescription className="text-gray-600">
            We hebben een verificatiecode gestuurd naar{' '}
            <span className="font-medium text-gray-900">{registrationData.email}</span>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium text-gray-700">
              Verificatiecode
            </label>
            <Input
              id="code"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl font-mono tracking-widest"
              maxLength={6}
            />
            <p className="text-xs text-gray-500 text-center">
              Voer de 6-cijferige code in die je per email hebt ontvangen
            </p>
          </div>

          <Button
            onClick={handleVerify}
            disabled={isLoading || code.length !== 6}
            className="w-full"
          >
            {isLoading ? 'Bezig met verifiëren...' : 'Account Aanmaken'}
          </Button>

          <div className="text-center space-y-2">
            <button
              onClick={handleResendCode}
              disabled={isLoading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              Geen code ontvangen? Verstuur opnieuw
            </button>

            <div className="space-y-1">
              <button
                onClick={handleBack}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-4 h-4" />
                Terug naar registratie
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1 mx-auto"
              >
                🏠 Terug naar home
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}