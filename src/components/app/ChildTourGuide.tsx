'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
}

const CHILD_TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welkom bij KlusjesKoning! 👑',
    description: 'Hoi! Ben je klaar voor een superleuke rondleiding? Klik op "Volgende" om te beginnen met ontdekken!',
    target: 'body',
    position: 'top'
  },
  {
    id: 'points',
    title: 'Jouw Punten! ⭐',
    description: 'Hier zie je hoeveel punten je hebt verdiend. Doe klusjes om meer punten te krijgen!',
    target: '[data-tour="points"]',
    position: 'bottom'
  },
  {
    id: 'chores',
    title: 'Nieuwe Uitdagingen 🎯',
    description: 'Dit zijn je klusjes! Klik erop om ze te doen en punten te verdienen.',
    target: '[data-tour="chores"]',
    position: 'bottom'
  },
  {
    id: 'games',
    title: 'Spelletjes & Fun 🎮',
    description: 'Hier vind je leuke spelletjes, stickers en nog meer manieren om punten te verdienen!',
    target: '[data-tour="games"]',
    position: 'left'
  },
  {
    id: 'rewards',
    title: 'Winkel 🛒',
    description: 'Ga naar de winkel om je punten in te wisselen voor coole beloningen!',
    target: '[data-tour="rewards"]',
    position: 'left'
  },
  {
    id: 'finished',
    title: 'Klaar voor avontuur! 🚀',
    description: 'Nu weet je hoe alles werkt! Ga klusjes doen, punten verdienen en heb super veel plezier!',
    target: 'body',
    position: 'top'
  }
];

interface ChildTourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChildTourGuide({ isOpen, onClose }: ChildTourGuideProps) {
   const [currentStep, setCurrentStep] = useState(0);
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
     if (isOpen) {
       setCurrentStep(0);
       setIsVisible(true);
       // Prevent body scrolling when tour is active
       document.body.style.overflow = 'hidden';
     } else {
       setIsVisible(false);
       document.body.style.overflow = 'unset';
     }

     // Cleanup on unmount
     return () => {
       document.body.style.overflow = 'unset';
     };
   }, [isOpen]);

   useEffect(() => {
     if (!isVisible) return;

     const step = CHILD_TOUR_STEPS[currentStep];
     if (!step || step.target === 'body') return;

     // Gentle scroll to target element without jumping
     const targetElement = document.querySelector(step.target);
     if (targetElement) {
       const elementTop = targetElement.getBoundingClientRect().top;
       const windowHeight = window.innerHeight;

       // Only scroll if element is not already reasonably visible
       if (elementTop < 100 || elementTop > windowHeight - 200) {
         targetElement.scrollIntoView({
           behavior: 'smooth',
           block: 'center',
           inline: 'nearest'
         });
       }
     }
   }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = CHILD_TOUR_STEPS[currentStep];
  if (!step) return null;

  const handleNext = () => {
    if (currentStep < CHILD_TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[10000] pointer-events-none">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
        onClick={handleSkip}
        aria-label="Sluit rondleiding"
      />

      {/* Tour Card - Centered and stable */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
        <Card className="w-full max-w-md shadow-2xl border-2 border-primary pointer-events-auto animate-in fade-in-0 zoom-in-95 duration-300">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  Stap {currentStep + 1} van {CHILD_TOUR_STEPS.length}
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkip}
                className="h-8 w-8 p-0 rounded-md hover:bg-red-50 hover:text-red-600 flex-shrink-0 flex items-center justify-center text-gray-500"
                aria-label="Sluit rondleiding"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold mb-2 pr-8">{step.title}</h3>
            <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>

            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorige
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="px-4 py-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  Overslaan
                </button>
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white hover:bg-primary/90"
                >
                  {currentStep === CHILD_TOUR_STEPS.length - 1 ? 'Starten!' : 'Volgende'}
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}