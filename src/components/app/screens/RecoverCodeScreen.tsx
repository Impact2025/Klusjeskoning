'use client';
import { useState } from 'react';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft } from 'lucide-react';
import ScreenWrapper from '../ScreenWrapper';

export default function RecoverCodeScreen() {
  const { setScreen, recoverFamilyCode } = useApp();
  const [email, setEmail] = useState('');

  const handleRecover = () => {
    if (email) {
      recoverFamilyCode(email);
    }
  };

  return (
    <ScreenWrapper className="p-6">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => setScreen('parentLogin')}>
          <ArrowLeft className="h-6 w-6 text-primary" />
        </Button>
        <h2 className="font-brand text-3xl text-center flex-grow text-blue-600">Wachtwoord Herstellen</h2>
        <div className="w-10"></div>
      </header>
      <main className="flex-grow flex flex-col justify-center">
        <p className="text-center mb-4 text-muted-foreground">
          Voer je e-mailadres in om je wachtwoord te herstellen.
        </p>
        <Input
          type="email"
          id="recover-email-input"
          placeholder="jouw@email.com"
          className="w-full p-3 h-12 text-lg border-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button onClick={handleRecover} size="lg" className="w-full text-lg shadow-md" disabled={!email}>
          Verstuur Herstel-mail
        </Button>
      </main>
    </ScreenWrapper>
  );
}
