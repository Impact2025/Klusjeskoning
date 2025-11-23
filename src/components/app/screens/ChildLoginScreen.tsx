'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, QrCode } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import ScreenWrapper from '../ScreenWrapper';

const encouragingMessages = [
  "Waar spaar jij voor?",
  "Klaar om punten te scoren?",
  "Welk klusje ga jij vandaag aanpakken?",
  "Laat zien wat voor superklusser jij bent!",
  "Word jij de volgende KlusjesKoning?",
  "Nieuwe dag, nieuwe klusjes!",
  "Elk klusje brengt je dichter bij je doel!",
];

export default function ChildLoginScreen() {
  const { setScreen, loginChildStep1 } = useApp();
  const [familyCode, setFamilyCode] = useState('');
  const [message, setMessage] = useState('');
  const avatarImage = PlaceHolderImages.find(img => img.id === 'child-login-avatar');

  useEffect(() => {
    setMessage(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]);
  }, []);

  const handleLogin = () => {
    if (familyCode) {
      loginChildStep1(familyCode);
    }
  };

  return (
    <ScreenWrapper className="p-6">
      <header className="flex items-center mb-6">
        <Button variant="ghost" size="icon" onClick={() => setScreen('landing')}>
          <ArrowLeft className="h-6 w-6 text-accent" />
        </Button>
        <h2 className="font-brand text-3xl text-center flex-grow text-accent">Hallo Klusser!</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.location.href = '/'}
          className="text-accent hover:text-accent/80"
        >
          🏠 Home
        </Button>
      </header>
      <main className="flex-grow flex flex-col justify-center items-center text-center">
        {avatarImage && (
            <Image
                src={avatarImage.imageUrl}
                width={150}
                height={150}
                alt={avatarImage.description}
                data-ai-hint={avatarImage.imageHint}
                className="rounded-full mb-4"
            />
        )}
        <p className="mb-4 text-muted-foreground font-bold text-base">{message}</p>
        <p className="mb-4 text-muted-foreground text-sm">Vraag je ouders om de gezinscode en vul die hier in.</p>
        <div className="relative w-full max-w-sm">
          <Input
            type="text"
            id="child-family-code-input"
            placeholder="Gezinscode"
            className="w-full p-3 h-12 text-center text-xl tracking-widest border-2 focus:ring-accent"
            value={familyCode}
            onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
            onKeyUp={(e) => e.key === 'Enter' && handleLogin()}
          />
          <Button onClick={handleLogin} className="absolute right-2 top-1/2 -translate-y-1/2 bg-accent hover:bg-accent/90 text-accent-foreground" disabled={!familyCode}>
            <ArrowRight />
          </Button>
        </div>
        <div className="my-4 flex items-center w-full max-w-sm">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500">OF</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>
        <Button onClick={() => setScreen('qrScanner')} size="lg" className="w-full max-w-sm text-lg shadow-md bg-gray-700 hover:bg-gray-800 text-white">
          <QrCode className="mr-2 h-6 w-6" /> Scan QR Code
        </Button>
      </main>
    </ScreenWrapper>
  );
}
