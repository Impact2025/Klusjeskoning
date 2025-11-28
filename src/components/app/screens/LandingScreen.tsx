'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from "../AppProvider";
import { Button } from "@/components/ui/button";
import { Crown, Users, ArrowLeft, Sparkles } from "lucide-react";

export default function LandingScreen() {
  const { setScreen } = useApp();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If user came here with checkout=premium, save it for after login
    const checkoutStatus = searchParams?.get('checkout');
    if (checkoutStatus === 'premium') {
      sessionStorage.setItem('pendingCheckout', 'premium');
      setScreen('parentLogin');
      return;
    }

    // If user came here with register=true, navigate to parent login
    const registerParam = searchParams?.get('register');
    if (registerParam === 'true') {
      sessionStorage.setItem('showRegister', 'true');
      setScreen('parentLogin');
      return;
    }
  }, [searchParams, setScreen]);

  return (
    <div className="min-h-full bg-gradient-to-br from-amber-50 via-white to-sky-50 flex flex-col">
      {/* Mini Header */}
      <header className="px-6 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Terug naar homepage</span>
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        {/* Logo & Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
            <Crown className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            KlusjesKoning
          </h1>
          <p className="text-slate-500">
            Klusjes worden een game
          </p>
        </div>

        {/* Login Options */}
        <div className="w-full max-w-sm space-y-4">
          <Button
            onClick={() => setScreen('parentLogin')}
            size="lg"
            className="w-full py-6 text-base font-medium shadow-lg shadow-primary/20"
          >
            <Users className="mr-2 h-5 w-5" />
            Inloggen als ouder
          </Button>

          <Button
            onClick={() => setScreen('childLogin')}
            size="lg"
            variant="outline"
            className="w-full py-6 text-base font-medium border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Inloggen als kind
          </Button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 my-8 w-full max-w-sm">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="text-sm text-slate-400">of</span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* Register CTA */}
        <div className="text-center">
          <p className="text-slate-600 mb-3">Nog geen account?</p>
          <Button
            onClick={() => {
              sessionStorage.setItem('showRegister', 'true');
              setScreen('parentLogin');
            }}
            variant="ghost"
            className="text-primary hover:text-primary/80 font-medium"
          >
            Gratis registreren
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center">
        <p className="text-xs text-slate-400">
          © {new Date().getFullYear()} KlusjesKoning
        </p>
      </footer>
    </div>
  );
}
