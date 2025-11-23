'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const navigation = [
    { name: 'Handleidingen', href: '/handleidingen' },
    { name: 'Blog', href: '/blog' },
    { name: 'Reviews', href: '/reviews' },
  ];

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-lg'
          : 'bg-transparent border-b border-white/20'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-8">
          {/* Logo and Brand */}
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity flex-shrink-0">
            <div className="relative">
              <Image
                src="https://weareimpact.nl/LogoKlusjeskoning3.png"
                alt="KlusjesKoning logo"
                width={36}
                height={36}
                className="h-9 w-9 rounded-lg bg-white shadow-sm"
              />
              <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span
                className={`text-lg font-bold leading-tight ${isScrolled ? 'text-slate-900' : 'text-white'}`}
                style={!isScrolled ? { textShadow: '0 2px 4px rgba(0,0,0,0.3)' } : {}}
              >
                KlusjesKoning
              </span>
              <span
                className={`text-xs leading-tight ${isScrolled ? 'text-slate-500' : 'text-white/90'}`}
                style={!isScrolled ? { textShadow: '0 1px 2px rgba(0,0,0,0.3)' } : {}}
              >
                Game on voor je huishouden
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8 flex-1 justify-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-semibold transition-all duration-300 ${
                  isScrolled
                    ? 'text-slate-700 hover:text-primary'
                    : 'text-white hover:text-white/90 drop-shadow-lg'
                }`}
                style={!isScrolled ? { textShadow: '0 2px 4px rgba(0,0,0,0.3)' } : {}}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop CTA Buttons */}
          <div className="hidden md:flex items-center space-x-3 flex-shrink-0">
            <Button
              asChild
              variant="outline"
              size="sm"
              className={`font-medium transition-all duration-300 ${
                isScrolled
                  ? 'border-primary/20 text-primary hover:bg-primary/5 bg-white'
                  : 'border-white/80 bg-white/10 text-white hover:bg-white/30 hover:border-white backdrop-blur-md shadow-xl'
              }`}
            >
              <Link href="/app">
                Inloggen
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white shadow-xl font-medium"
            >
              <Link href="/app?register=true" className="flex items-center space-x-1.5">
                <Crown className="h-3.5 w-3.5" />
                <span>Start gratis</span>
              </Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`md:hidden p-2 rounded-md ${
                  isScrolled ? 'hover:bg-slate-100' : 'hover:bg-white/10'
                }`}
                aria-label="Menu openen"
              >
                <Menu className={`h-5 w-5 ${isScrolled ? 'text-slate-900' : 'text-white'}`} />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigatiemenu</SheetTitle>
              <div className="flex flex-col h-full">
                {/* Mobile Header */}
                <div className="flex items-center justify-between pb-6 border-b border-slate-200">
                  <Link href="/" className="flex items-center space-x-3" onClick={() => setIsOpen(false)}>
                    <div className="relative">
                      <Image
                        src="https://weareimpact.nl/LogoKlusjeskoning3.png"
                        alt="KlusjesKoning logo"
                        width={36}
                        height={36}
                        className="h-9 w-9 rounded-lg bg-white shadow-sm"
                      />
                      <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-lg font-bold text-slate-900 leading-tight">
                        KlusjesKoning
                      </span>
                      <span className="text-xs text-slate-500 leading-tight">
                        Game on voor je huishouden
                      </span>
                    </div>
                  </Link>
                </div>

                {/* Mobile Navigation Links */}
                <nav className="flex flex-col space-y-4 py-6">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="text-base font-medium text-slate-700 hover:text-primary transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>

                {/* Mobile CTA */}
                <div className="space-y-3 pt-6 border-t border-slate-200 mt-auto">
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-primary/20 text-primary hover:bg-primary/5 font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href="/app">
                      Inloggen
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-primary hover:bg-primary/90 shadow-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    <Link href="/app?register=true" className="flex items-center justify-center space-x-2">
                      <Crown className="h-4 w-4" />
                      <span>Start gratis</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}