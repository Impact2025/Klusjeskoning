'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '../AppProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ArrowRight, QrCode, Sparkles } from 'lucide-react';

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

  useEffect(() => {
    setMessage(encouragingMessages[Math.floor(Math.random() * encouragingMessages.length)]);
  }, []);

  const handleLogin = () => {
    if (familyCode) {
      loginChildStep1(familyCode);
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 via-white to-orange-50 flex flex-col">
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Icon & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-orange-500/25">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Hallo Klusser!
          </h1>
          <p className="text-amber-700 font-medium">
            {message}
          </p>
        </div>

        {/* Family Code Input */}
        <div className="w-full max-w-sm space-y-4">
          <div className="text-center mb-4">
            <p className="text-slate-500 text-sm">
              Vraag je ouders om de gezinscode
            </p>
          </div>

          <div className="relative">
            <Input
              type="text"
              placeholder="GEZINSCODE"
              className="w-full h-14 text-center text-2xl font-bold tracking-[0.3em] uppercase bg-white border-2 border-amber-200 focus:border-amber-400 focus:ring-amber-400/20 rounded-xl"
              value={familyCode}
              onChange={(e) => setFamilyCode(e.target.value.toUpperCase())}
              onKeyUp={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>

          <Button
            onClick={handleLogin}
            size="lg"
            className="w-full py-6 text-base font-medium bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25"
            disabled={!familyCode}
          >
            Ga verder
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8 w-full max-w-sm">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400">of</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* QR Scanner */}
        <Button
          onClick={() => setScreen('qrScanner')}
          size="lg"
          variant="outline"
          className="w-full max-w-sm py-6 text-base font-medium border-2 border-slate-200 text-slate-700 hover:bg-slate-50"
        >
          <QrCode className="mr-2 h-5 w-5" />
          Scan QR Code
        </Button>

        {/* Parent Login Link */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm mb-2">Ben je een ouder?</p>
          <Button
            variant="ghost"
            onClick={() => setScreen('parentLogin')}
            className="text-primary hover:text-primary/80"
          >
            Login als ouder
          </Button>
        </div>
      </div>
    </div>
  );
}
