'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-react';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right';
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welkom bij KlusjesKoning! 👑',
    description: 'Laten we je een rondleiding geven door de app. Klik op "Volgende" om te beginnen.',
    target: 'body',
    position: 'top'
  },
  {
    id: 'overview',
    title: 'Overzicht Dashboard',
    description: 'Hier zie je een overzicht van jullie gezin: aantal kinderen, voltooide klusjes en totaal verdiende punten.',
    target: '[data-tour="overview"]',
    position: 'bottom'
  },
  {
    id: 'children',
    title: 'Kinderen Beheren',
    description: 'Voeg kinderen toe, stel PIN-codes in en bekijk hun voortgang.',
    target: '[data-tour="children"]',
    position: 'bottom'
  },
  {
    id: 'chores',
    title: 'Klusjes Aanmaken',
    description: 'Maak klusjes aan, stel punten in en wijs ze toe aan kinderen.',
    target: '[data-tour="chores"]',
    position: 'bottom'
  },
  {
    id: 'rewards',
    title: 'Beloningen Instellen',
    description: 'Stel beloningen in voor verschillende categorieën: privileges, ervaringen of geld.',
    target: '[data-tour="rewards"]',
    position: 'bottom'
  },
  {
    id: 'actions',
    title: 'Goedkeuringen',
    description: 'Keur ingediende klusjes goed en beheer beloningen die wachten op uitbetaling.',
    target: '[data-tour="actions"]',
    position: 'left'
  }
];

interface TourGuideProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TourGuide({ isOpen, onClose }: TourGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isVisible) return;

    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    // Scroll target into view
    const targetElement = document.querySelector(step.target);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [currentStep, isVisible]);

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];
  if (!step) return null;

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
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
    <div className="fixed inset-0 z-50 pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleSkip} />

      {/* Highlight overlay */}
      {step.target !== 'body' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="relative w-full h-full">
            {/* We'll add spotlight effect here if needed */}
          </div>
        </div>
      )}

      {/* Tour Card */}
      <div className="absolute z-10 pointer-events-auto">
        <Card className="w-80 shadow-2xl border-2 border-primary">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  Stap {currentStep + 1} van {TOUR_STEPS.length}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <h3 className="text-lg font-bold mb-2">{step.title}</h3>
            <p className="text-gray-600 mb-6">{step.description}</p>

            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Vorige
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip}>
                  Overslaan
                </Button>
                <Button onClick={handleNext} className="flex items-center gap-2">
                  {currentStep === TOUR_STEPS.length - 1 ? 'Voltooien' : 'Volgende'}
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}