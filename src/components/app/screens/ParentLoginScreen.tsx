'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Crown, LogIn, AlertCircle, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Label } from '@/components/ui/label';

export default function ParentLoginScreen() {
  const { setScreen, startRegistration, loginParent, isLoading } = useApp();
  const { toast } = useToast();

  // Check if there's a pending checkout or register flag to default to registration mode
  const [isRegistering, setIsRegistering] = useState(() => {
    if (typeof window !== 'undefined') {
      const hasPendingCheckout = sessionStorage.getItem('pendingCheckout') === 'premium';
      const shouldShowRegister = sessionStorage.getItem('showRegister') === 'true';
      if (shouldShowRegister) {
        sessionStorage.removeItem('showRegister');
      }
      return hasPendingCheckout || shouldShowRegister;
    }
    return false;
  });

  // Form state
  const [familyName, setFamilyName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleLogin = () => {
    if (email && password) {
      loginParent(email, password);
    } else {
      toast({ variant: 'destructive', title: 'Fout', description: 'Vul e-mailadres en wachtwoord in.' });
    }
  };

  const handleRegister = async () => {
    setFormError('');

    if (familyName && city && email && password) {
      if (password.length < 6) {
        setFormError('Wachtwoord moet minimaal 6 tekens lang zijn.');
        return;
      }
      try {
        await startRegistration(familyName, city, email, password);
        sessionStorage.setItem('pendingRegistration', JSON.stringify({ email, familyName, city, password }));
        setScreen('emailVerification');
      } catch (error: any) {
        if (error.message?.includes('EMAIL_IN_USE')) {
          setFormError('Dit emailadres is al in gebruik. Probeer in te loggen of gebruik een ander emailadres.');
        } else {
          toast({ variant: 'destructive', title: 'Fout', description: error.message || 'Er ging iets mis bij het registreren.' });
        }
      }
    } else {
      setFormError('Vul alle velden in om te registreren.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    if (isRegistering) {
      handleRegister();
    } else {
      handleLogin();
    }
  };

  const toggleMode = () => {
    setIsRegistering(!isRegistering);
    setFamilyName('');
    setCity('');
    setEmail('');
    setPassword('');
    setFormError('');
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (formError) {
      setFormError('');
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 via-white to-sky-50 flex flex-col">
      {/* Header */}
      <header className="px-4 py-4 flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setScreen('landing')}
          className="text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug
        </Button>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-primary transition-colors"
        >
          Homepage
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col px-6 pb-8">
        {/* Title */}
        <div className="text-center mb-8 pt-4">
          <div className="w-14 h-14 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRegistering ? 'Account aanmaken' : 'Welkom terug'}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRegistering ? 'Start je gezinsavontuur' : 'Log in om verder te gaan'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 flex-1">
          {isRegistering && (
            <>
              <div>
                <Label htmlFor="familyName" className="text-slate-700">Familienaam</Label>
                <Input
                  id="familyName"
                  value={familyName}
                  onChange={(e) => setFamilyName(e.target.value)}
                  placeholder="Familie De Vries"
                  className="mt-1 bg-white border-slate-200 focus:border-primary"
                  required
                />
              </div>
              <div>
                <Label htmlFor="city" className="text-slate-700">Woonplaats</Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Amsterdam"
                  className="mt-1 bg-white border-slate-200 focus:border-primary"
                  required
                />
              </div>
            </>
          )}

          <div>
            <Label htmlFor="email" className="text-slate-700">E-mailadres</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              placeholder="jouw@email.nl"
              className="mt-1 bg-white border-slate-200 focus:border-primary"
              autoComplete="email"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-700">Wachtwoord</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimaal 6 tekens"
              className="mt-1 bg-white border-slate-200 focus:border-primary"
              autoComplete="current-password"
              required
            />
          </div>

          {formError && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full py-6 text-base font-medium shadow-lg shadow-primary/20"
            disabled={isLoading}
          >
            {isRegistering ? (
              <>
                <UserPlus className="mr-2 h-5 w-5" />
                Account aanmaken
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Inloggen
              </>
            )}
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400">of</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Toggle Mode */}
        <Button
          variant="outline"
          onClick={toggleMode}
          className="w-full border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          disabled={isLoading}
        >
          {isRegistering ? 'Al een account? Log hier in' : 'Nog geen account? Registreer hier'}
        </Button>

        {/* Forgot Password */}
        {!isRegistering && (
          <Button
            variant="ghost"
            onClick={() => setScreen('recoverCode')}
            className="w-full mt-2 text-slate-500 hover:text-primary"
            disabled={isLoading}
          >
            Wachtwoord vergeten?
          </Button>
        )}

        {/* Child Login Link */}
        <div className="mt-6 pt-6 border-t border-slate-200">
          <p className="text-center text-sm text-slate-500 mb-3">Ben je een kind?</p>
          <Button
            variant="outline"
            onClick={() => setScreen('childLogin')}
            className="w-full border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
            disabled={isLoading}
          >
            Login als kind met gezinscode
          </Button>
        </div>
      </div>
    </div>
  );
}
