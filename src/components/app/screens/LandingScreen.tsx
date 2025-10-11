'use client';
import Image from "next/image";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from "../AppProvider";
import { Button } from "@/components/ui/button";
import { Shield, Baby, HelpCircle } from "lucide-react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import ScreenWrapper from "../ScreenWrapper";
import OnboardingModal from '../OnboardingModal';

type UserType = 'child' | 'parent';

export default function LandingScreen() {
  const { setScreen } = useApp();
  const [bgImage, setBgImage] = useState<any>(null);
  const searchParams = useSearchParams();

  const logoImage = PlaceHolderImages.find(img => img.id === 'app-logo');
  const [isModalOpen, setModalOpen] = useState(false);
  const [modalUserType, setModalUserType] = useState<UserType>('parent');

  useEffect(() => {
    // This will only run on the client, preventing a hydration mismatch
    const landingBg = PlaceHolderImages.find(img => img.id === 'landing-background');
    setBgImage(landingBg);

    // If user came here with checkout=premium, save it for after login
    const checkoutStatus = searchParams?.get('checkout');
    if (checkoutStatus === 'premium') {
      sessionStorage.setItem('pendingCheckout', 'premium');
      setScreen('parentLogin');
      return;
    }

    // If user came here with register=true, save it for after navigation and navigate to parent login
    const registerParam = searchParams?.get('register');
    if (registerParam === 'true') {
      sessionStorage.setItem('showRegister', 'true');
      setScreen('parentLogin');
      return;
    }
  }, [searchParams, setScreen]);

  const openModal = (userType: UserType) => {
    setModalUserType(userType);
    setModalOpen(true);
  };

  return (
    <ScreenWrapper className="items-center justify-center">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover"
          data-ai-hint={bgImage.imageHint}
          priority
        />
      )}
      <div className="relative z-10 text-center bg-card/80 p-8 rounded-2xl shadow-xl backdrop-blur-sm w-11/12 max-w-md">
        {logoImage && (
            <Image
                src={logoImage.imageUrl}
                width={250}
                height={150}
                alt={logoImage.description}
                data-ai-hint={logoImage.imageHint}
                className="mx-auto mb-4"
            />
        )}
        <p className="text-muted-foreground mt-2 mb-8">De leukste manier om klusjes te doen!</p>
        <div className="space-y-4">
          <Button
            onClick={() => setScreen('parentLogin')}
            size="lg"
            className="w-full text-lg shadow-md transition-transform transform hover:scale-105"
          >
            <Shield className="mr-2 h-6 w-6" /> Ik ben een Ouder
          </Button>
           <Button variant="link" size="sm" onClick={() => openModal('parent')}>
            <HelpCircle className="mr-2 h-4 w-4" /> Hoe werkt het voor ouders?
          </Button>
          <Button
            onClick={() => setScreen('childLogin')}
            size="lg"
            className="w-full text-lg shadow-md transition-transform transform hover:scale-105 bg-accent hover:bg-accent/90 text-accent-foreground mt-4"
          >
            <Baby className="mr-2 h-6 w-6" /> Ik ben een Kind
          </Button>
           <Button variant="link" size="sm" className="text-yellow-700" onClick={() => openModal('child')}>
             <HelpCircle className="mr-2 h-4 w-4" /> Hoe werkt het voor kinderen?
          </Button>
        </div>
      </div>
      <OnboardingModal isOpen={isModalOpen} setIsOpen={setModalOpen} userType={modalUserType} />
    </ScreenWrapper>
  );
}
