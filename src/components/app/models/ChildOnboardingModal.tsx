"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Star, ListTodo, Store, Trophy, CheckCircle, ArrowRight, Sparkles, Heart } from 'lucide-react';
import { useApp } from '../AppProvider';

interface ChildOnboardingModalProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welkom bij KlusjesKoning! 👋',
    content: 'Hoi! Welkom in jullie gezinsapp. Hier verdien je punten door klusjes te doen en kun je die uitgeven in de winkel. Laten we je rondleiden!',
    icon: Sparkles,
    color: 'text-yellow-500',
  },
  {
    id: 'points',
    title: 'Verdien Punten ⭐',
    content: 'Zie je die sterretjes hierboven? Dat zijn je punten! Doe klusjes en verdien punten. Hoe meer punten, hoe hoger je level wordt!',
    icon: Star,
    color: 'text-yellow-500',
  },
  {
    id: 'chores',
    title: 'Klusjes Doen 📝',
    content: 'Klik op "Klaar!" bij een klusje als je het hebt gedaan. Maak een foto als bewijs en wacht tot papa/mama het goedkeurt. Dan krijg je je punten!',
    icon: ListTodo,
    color: 'text-blue-500',
  },
  {
    id: 'shop',
    title: 'Winkel Bezoeken 🛒',
    content: 'In de winkel kun je je punten uitgeven aan leuke beloningen. Van speelgoed tot een goed doel steunen - alles kan!',
    icon: Store,
    color: 'text-green-500',
  },
  {
    id: 'levels',
    title: 'Levels Bekijken 🏆',
    content: 'Kijk bij "Levels" hoe je vordert. Van een ei naar een KlusjesKoning - dat wordt jouw verhaal!',
    icon: Trophy,
    color: 'text-purple-500',
  },
  {
    id: 'ready',
    title: 'Klaar om te beginnen! 🚀',
    content: 'Dat was alles! Nu weet je hoe het werkt. Ga klusjes doen, punten verdienen en heb plezier. Succes, kampioen! 💪',
    icon: Heart,
    color: 'text-red-500',
  },
];

export default function ChildOnboardingModal({ isOpen, setIsOpen }: ChildOnboardingModalProps) {
  const { user } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const currentStepData = onboardingSteps[currentStep];
  const IconComponent = currentStepData.icon;

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setCompletedSteps(new Set());
    }
  }, [isOpen]);

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));

    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as complete
      if (typeof window !== 'undefined' && user) {
        localStorage.setItem(`child_onboarding_${user.id}`, 'completed');
      }
      setIsOpen(false);
    }
  };

  const handleSkip = () => {
    // Mark onboarding as complete
    if (typeof window !== 'undefined' && user) {
      localStorage.setItem(`child_onboarding_${user.id}`, 'completed');
    }
    setIsOpen(false);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md mx-auto p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="text-center text-xl font-bold text-primary">
            {user?.name ? `${user.name}'s Rondleiding` : 'Rondleiding'}
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Progress indicator */}
          <div className="flex justify-center mb-6">
            <div className="flex space-x-2">
              {onboardingSteps.map((_, index) => (
                <div
                  key={index}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index <= currentStep
                      ? completedSteps.has(index)
                        ? 'bg-green-500'
                        : 'bg-primary'
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Step content */}
          <Card className="border-2 border-primary/20 mb-6">
            <CardContent className="p-6 text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4`}>
                <IconComponent className={`w-8 h-8 ${currentStepData.color}`} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-3">
                {currentStepData.title}
              </h3>

              <p className="text-gray-600 leading-relaxed">
                {currentStepData.content}
              </p>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <div className="flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="text-gray-500 hover:text-gray-700"
            >
              Overslaan
            </Button>

            <div className="flex space-x-2">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="px-4"
                >
                  Vorige
                </Button>
              )}

              <Button
                onClick={handleNext}
                className="px-6 bg-primary hover:bg-primary/90"
              >
                {currentStep === onboardingSteps.length - 1 ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Klaar!
                  </>
                ) : (
                  <>
                    Volgende
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Step counter */}
          <div className="text-center mt-4 text-sm text-gray-500">
            Stap {currentStep + 1} van {onboardingSteps.length}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}